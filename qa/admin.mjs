/**
 * Pruebas del panel de administración.
 *
 * Se ejecutan contra el servidor de desarrollo (npm run dev), que monta las
 * mismas funciones de /api que usa Vercel. Trabajan sobre el disco local, así
 * que NO tocan el repositorio publicado: al terminar, dejan el contenido tal
 * y como estaba.
 *
 *   npm run dev            (en otra terminal)
 *   npm run qa:admin
 */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'
import { abrirNavegador, crearInforme } from './lib.mjs'

const BASE = (process.env.QA_ADMIN_URL || 'http://localhost:5254').replace(/\/+$/, '')
const CONTRASENA = process.env.QA_PASSWORD || 'panel-local-12345'
const RUTA_SITE = 'src/content/site.json'
const RUTA_PRODUCTOS = 'src/content/products.json'
const RUTA_MEDIOS = 'src/content/media.json'
const RUTA_CATEGORIAS = 'src/content/categories.json'
const PREFIJO_FOTOS_QA = 'qa-foto-'

const inf = crearInforme('PANEL DE ADMINISTRACIÓN')

// Copia de seguridad para restaurar al final pase lo que pase
const respaldo = readFileSync(RUTA_SITE, 'utf8')
const respaldoProductos = readFileSync(RUTA_PRODUCTOS, 'utf8')
const respaldoMedios = readFileSync(RUTA_MEDIOS, 'utf8')
const respaldoCategorias = readFileSync(RUTA_CATEGORIAS, 'utf8')

/** PNG liso de un solo color, sin dependencias: lo justo para probar subidas. */
function crearPng(ancho, alto, [r, g, b]) {
  const fila = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: ancho }, () => [r, g, b]).flat())])
  const crudo = Buffer.concat(Array.from({ length: alto }, () => fila))
  const trozo = (tipo, datos) => {
    const t = Buffer.from(tipo)
    const largo = Buffer.alloc(4)
    largo.writeUInt32BE(datos.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([t, datos])))
    return Buffer.concat([largo, t, datos, crc])
  }
  const cabecera = Buffer.alloc(13)
  cabecera.writeUInt32BE(ancho, 0)
  cabecera.writeUInt32BE(alto, 4)
  cabecera[8] = 8 // 8 bits por canal
  cabecera[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    trozo('IHDR', cabecera),
    trozo('IDAT', deflateSync(crudo)),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

const navegador = await abrirNavegador()
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-CO' })
const page = await ctx.newPage()

const erroresConsola = []
page.on('pageerror', (e) => erroresConsola.push(e.message))
page.on('console', (m) => {
  if (m.type() !== 'error') return
  const t = m.text()
  // Las pruebas piden adrede endpoints protegidos: esos 401/403 son esperados.
  if (/status of (401|403|409|422)/.test(t)) return
  erroresConsola.push(t)
})

/** Petición desde el contexto de una página del navegador (lleva sus cookies). */
const pedirEn = (pg, ruta, opciones = {}) =>
  pg.evaluate(
    async ([r, o]) => {
      const res = await fetch(r, {
        method: o.metodo ?? 'GET',
        headers: { ...(o.sinCabecera ? {} : { 'X-Panel': '1' }), ...(o.cuerpo ? { 'Content-Type': 'application/json' } : {}) },
        body: o.cuerpo ? JSON.stringify(o.cuerpo) : undefined,
      })
      let datos = null
      try { datos = await res.json() } catch { /* sin cuerpo */ }
      return { estado: res.status, datos }
    },
    [ruta, opciones]
  )
const pedir = (ruta, opciones = {}) => pedirEn(page, ruta, opciones)

try {
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' })

  // ------------------------------------------------- sin autenticación -----
  inf.check('El panel pide contraseña al entrar',
    await page.locator('input[type="password"]').isVisible())

  inf.check('El sitio público no expone el panel',
    !(await page.evaluate(() => document.documentElement.innerHTML.includes('ADMIN_PASSWORD'))))

  let r = await pedir('/api/content')
  inf.check('Leer contenido sin sesión devuelve 401', r.estado === 401, `HTTP ${r.estado}`)

  r = await pedir('/api/content', { metodo: 'PUT', cuerpo: { site: {} } })
  inf.check('Publicar sin sesión devuelve 401', r.estado === 401, `HTTP ${r.estado}`)

  r = await pedir('/api/media', { metodo: 'DELETE', cuerpo: { id: 'bobinas' } })
  inf.check('Borrar imagen sin sesión devuelve 401', r.estado === 401, `HTTP ${r.estado}`)

  r = await pedir('/api/history')
  inf.check('Historial sin sesión devuelve 401', r.estado === 401, `HTTP ${r.estado}`)

  // ---------------------------------------------------- acceso erróneo -----
  await page.fill('#usuario', 'admin')
  await page.fill('#contrasena', 'contrasena-incorrecta')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1500)
  inf.check('Rechaza la contraseña incorrecta',
    await page.locator('[role="alert"]').isVisible())
  inf.check('No dice si falló el usuario o la contraseña',
    (await page.locator('[role="alert"]').innerText()).includes('Usuario o contraseña'))

  // ---------------------------------------------------- acceso correcto ----
  await page.fill('#contrasena', CONTRASENA)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2500)
  inf.check('Entra con la contraseña correcta',
    await page.locator('text=Panel de administración').first().isVisible())

  // La cookie no debe poder leerse desde JavaScript
  const cookies = await ctx.cookies()
  const sesion = cookies.find((c) => c.name === 'mi_sesion')
  inf.check('La cookie de sesión existe', Boolean(sesion))
  inf.check('La cookie es HttpOnly', sesion?.httpOnly === true)
  inf.check('La cookie es SameSite=Strict', sesion?.sameSite === 'Strict')
  inf.check('document.cookie no la expone',
    !(await page.evaluate(() => document.cookie.includes('mi_sesion'))))

  // ------------------------------------------------------------ CSRF -------
  r = await pedir('/api/content', { sinCabecera: true })
  inf.check('Con sesión pero sin la cabecera del panel devuelve 403', r.estado === 403, `HTTP ${r.estado}`)

  // ------------------------------------------------------- validación ------
  r = await pedir('/api/content')
  inf.check('Con sesión sí lee el contenido', r.estado === 200)
  const contenido = r.datos
  const sha = contenido.sha

  const conCambio = (fn) => {
    const copia = JSON.parse(JSON.stringify(contenido))
    fn(copia)
    return { site: copia.site, categories: copia.categories, products: copia.products, media: copia.media, sha }
  }

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.site.contacto.redes[0].url = 'javascript:alert(1)' }),
  })
  inf.check('Rechaza un enlace javascript:', r.estado === 422, `HTTP ${r.estado} — ${r.datos?.error ?? ''}`)

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.site.tema.colores['navy-800'] = 'rgb(1,2,3); background:url(x)' }),
  })
  inf.check('Rechaza un color que no sea #rrggbb', r.estado === 422, `HTTP ${r.estado}`)

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.site.identidad.nombreLegal = '' }),
  })
  inf.check('Rechaza el nombre legal vacío', r.estado === 422, `HTTP ${r.estado}`)

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.site.contacto.telefonos[0].wa = '12' }),
  })
  inf.check('Rechaza un número de WhatsApp inválido', r.estado === 422, `HTTP ${r.estado}`)

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.products[0].categorias = ['linea-que-no-existe'] }),
  })
  inf.check('Rechaza un producto con categoría inexistente', r.estado === 422, `HTTP ${r.estado}`)

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.site.hero.pilares[0].icono = 'IconoInventado' }),
  })
  inf.check('Rechaza un icono fuera de la lista', r.estado === 422, `HTTP ${r.estado}`)

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.categories[0].imagen = 'imagen-que-no-existe' }),
  })
  inf.check('Rechaza una imagen que no está en la biblioteca', r.estado === 422, `HTTP ${r.estado}`)

  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: { ...conCambio((c) => { c.site.hero.chip = 'X' }), sha: 'sha-viejo-0000000' },
  })
  inf.check('Rechaza publicar con un sha desactualizado', r.estado === 409, `HTTP ${r.estado}`)

  // -------------------------------------------------------- persistencia ---
  const MARCA = `Prueba ${Date.now()}`
  r = await pedir('/api/content', {
    metodo: 'PUT',
    cuerpo: conCambio((c) => { c.site.hero.chipTexto = MARCA }),
  })
  inf.check('Publica un cambio válido', r.estado === 200, `HTTP ${r.estado} — ${r.datos?.error ?? ''}`)

  const enDisco = JSON.parse(readFileSync(RUTA_SITE, 'utf8'))
  inf.check('El cambio queda escrito en el archivo', enDisco.hero.chipTexto === MARCA)
  inf.check('Registra quién publicó', enDisco.actualizadoPor === 'admin', enDisco.actualizadoPor)
  inf.check('Registra cuándo se publicó', Boolean(enDisco.actualizado))

  r = await pedir('/api/content')
  inf.check('El servidor devuelve el contenido ya actualizado',
    r.datos?.site?.hero?.chipTexto === MARCA)

  // El sitio público lo toma del bundle, así que en desarrollo basta recargar
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600)
  inf.check('El sitio público muestra el cambio',
    (await page.locator('#inicio').innerText()).includes(MARCA))

  // ------------------------------------------------------------ historial --
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  r = await pedir('/api/history')
  inf.check('El historial responde', r.estado === 200, `HTTP ${r.estado}`)
  const versiones = r.datos?.versiones ?? []
  inf.check('El historial devuelve una lista', Array.isArray(versiones))
  if (versiones.length) {
    inf.check('Cada versión trae fecha, autor y mensaje',
      versiones.every((v) => v.sha && v.fecha && v.autor && v.mensaje))
  } else {
    console.log('  ----  Historial vacío: src/content aún no está en git. Se comprobará tras el primer commit.')
  }

  // --------------------------------------------------------------- salir ---
  r = await pedir('/api/logout', { metodo: 'POST' })
  inf.check('Cierra sesión', r.estado === 200)
  r = await pedir('/api/content')
  inf.check('Tras salir ya no se puede leer el contenido', r.estado === 401, `HTTP ${r.estado}`)

  // ------------------------------------------------------------ guía -----
  // Contexto nuevo = primera visita: la guía debe salir sola.
  {
    const ctxNuevo = await navegador.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-CO' })
    const p2 = await ctxNuevo.newPage()
    await p2.goto(BASE + '/admin', { waitUntil: 'networkidle' })
    await p2.fill('#usuario', 'admin')
    await p2.fill('#contrasena', CONTRASENA)
    await p2.click('button[type="submit"]')
    await p2.waitForTimeout(2600)

    const guia = p2.locator('[aria-labelledby="guia-titulo"]')
    inf.check('La guía se abre sola la primera vez', await guia.isVisible())

    const pasos = await p2.locator('text=/Cómo funciona el panel · 1 de /').isVisible()
    inf.check('La guía indica en qué paso vas', pasos)

    // Recorre todos los pasos
    let avances = 0
    while (await p2.locator('button:has-text("Siguiente")').isVisible()) {
      await p2.locator('button:has-text("Siguiente")').click()
      await p2.waitForTimeout(220)
      if (++avances > 10) break
    }
    inf.check('Se puede avanzar por toda la guía', avances >= 3, `${avances + 1} pasos`)
    inf.check('El último paso cierra la guía', await p2.locator('button:has-text("Entendido")').isVisible())

    await p2.locator('button:has-text("Entendido")').click()
    await p2.waitForTimeout(400)
    inf.check('La guía se cierra', (await p2.locator('[aria-labelledby="guia-titulo"]').count()) === 0)

    // Al recargar no debe volver a salir
    await p2.reload({ waitUntil: 'networkidle' })
    await p2.waitForTimeout(2600)
    inf.check('No vuelve a salir sola tras verla',
      (await p2.locator('[aria-labelledby="guia-titulo"]').count()) === 0)

    // Pero el botón de ayuda la reabre
    await p2.locator('button[aria-label="Cómo funciona el panel"]').click()
    await p2.waitForTimeout(400)
    inf.check('El botón de ayuda la reabre',
      await p2.locator('[aria-labelledby="guia-titulo"]').isVisible())

    await p2.keyboard.press('Escape')
    await p2.waitForTimeout(350)
    inf.check('La guía cierra con Escape',
      (await p2.locator('[aria-labelledby="guia-titulo"]').count()) === 0)

    await ctxNuevo.close()
  }

  // ------------------------------------- precio y fotos desde el producto ---
  {
    // Contexto nuevo con la guía ya vista, para que no tape lo que se prueba
    const ctxP = await navegador.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-CO' })
    await ctxP.addInitScript(() => {
      try { localStorage.setItem('mi_panel_guia_vista_v1', '1') } catch { /* sin almacenamiento */ }
    })
    // Publicar escribe en src/content y el servidor de desarrollo recarga los
    // módulos en caliente en TODAS las pestañas abiertas; React protesta por
    // ello («createRoot… ya usado», «removeChild…»). Eso es ruido del modo
    // desarrollo, no del panel compilado: por eso la pestaña inactiva se
    // aparta y, tras pulsar Publicar, esta deja de contar errores.
    await page.goto('about:blank')
    let contarErrores = true
    const p3 = await ctxP.newPage()
    p3.on('pageerror', (e) => { if (contarErrores) erroresConsola.push(e.message) })
    p3.on('console', (m) => {
      if (!contarErrores || m.type() !== 'error') return
      if (/status of (401|403|409|422)/.test(m.text())) return
      erroresConsola.push(m.text())
    })

    await p3.goto(BASE + '/admin', { waitUntil: 'networkidle' })
    await p3.fill('#usuario', 'admin')
    await p3.fill('#contrasena', CONTRASENA)
    await p3.click('button[type="submit"]')
    // El título también aparece en la pantalla de acceso: se espera algo que solo existe dentro.
    await p3.waitForSelector('button[aria-label="Cómo funciona el panel"]')

    // --- el servidor valida el precio, venga de donde venga
    const fresco = (await pedirEn(p3, '/api/content')).datos
    const nombreProd = fresco.products[0].nombre
    const conPrecio = (valor) => {
      const c = JSON.parse(JSON.stringify(fresco))
      c.products[0].precio = valor
      return { site: c.site, categories: c.categories, products: c.products, media: c.media, sha: c.sha }
    }
    for (const [valor, texto] of [[-1, 'negativo'], [0, 'cero'], [12.5, 'con decimales'], ['12.000', 'con puntos'], [1e10, 'desmedido']]) {
      const res = await pedirEn(p3, '/api/content', { metodo: 'PUT', cuerpo: conPrecio(valor) })
      inf.check(`El servidor rechaza un precio ${texto}`, res.estado === 422, `HTTP ${res.estado}`)
    }

    // --- el campo de precio
    await p3.getByRole('button', { name: 'Editar' }).first().click()
    const ficha = p3.locator('main li').first()
    const campoPrecio = p3.getByLabel('Precio (pesos)')
    inf.check('El producto tiene campo de precio', await campoPrecio.isVisible())
    inf.check('Sin precio, el campo avisa que se invitará a consultar',
      await ficha.getByText('el sitio invitará a consultarlo por WhatsApp').isVisible())

    await campoPrecio.fill('abc')
    inf.check('El campo no acepta letras', (await campoPrecio.inputValue()) === '')
    await campoPrecio.fill('$12.500')
    inf.check('El precio pegado con $ y puntos queda en cifras', (await campoPrecio.inputValue()) === '12500')
    inf.check('Muestra el precio tal como se verá',
      await ficha.getByText('En el sitio se verá: $12.500', { exact: true }).isVisible())
    await p3.getByLabel('Unidad del precio (opcional)').fill('por metro')
    inf.check('La vista del precio incluye la unidad',
      await ficha.getByText('En el sitio se verá: $12.500 por metro', { exact: true }).isVisible())
    inf.check('La lista de productos muestra el precio',
      (await ficha.locator('button[aria-expanded]').innerText()).includes('$12.500'))
    inf.check('Editar el precio activa el aviso de cambios sin publicar',
      await p3.getByText('Tienes cambios sin publicar').isVisible())

    // --- previsualización: tarjeta y ficha con precio, y ficha sin precio
    await p3.getByRole('button', { name: 'Previsualizar' }).click()
    const vista = p3.locator('[role="dialog"][aria-label="Previsualización del sitio"]')
    await vista.waitFor()
    await p3.waitForTimeout(900)
    // La barra fija del propio sitio llegó a tapar el botón «Cerrar» de la previsualización
    const quienTapa = await p3.evaluate(() => {
      const b = [...document.querySelectorAll('[aria-label="Previsualización del sitio"] header button')]
        .find((x) => x.textContent.includes('Cerrar'))
      const r = b.getBoundingClientRect()
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return b === el || b.contains(el) ? null : (el?.tagName ?? 'nada')
    })
    inf.check('El botón Cerrar de la previsualización no queda tapado por el sitio',
      quienTapa === null, String(quienTapa))
    const tarjeta = vista.locator('article', { has: p3.locator(`h3:text-is("${nombreProd}")`) }).first()
    const textoTarjeta = (await tarjeta.textContent()) ?? ''
    inf.check('La tarjeta del catálogo muestra precio y unidad',
      textoTarjeta.includes('$12.500') && textoTarjeta.includes('por metro'), textoTarjeta.slice(0, 80))

    const modal = vista.locator('[role="dialog"][aria-labelledby="modal-producto-titulo"]')
    await tarjeta.getByRole('button').click()
    await modal.waitFor()
    const textoModal = (await modal.textContent()) ?? ''
    inf.check('La ficha muestra el precio con su unidad',
      textoModal.includes('$12.500') && textoModal.includes('por metro'))
    inf.check('La ficha con precio usa la nota del precio',
      textoModal.includes('Confirma disponibilidad y condiciones por WhatsApp.'))
    inf.check('La ficha con precio no dice «no publicamos precios»', !/no publicamos precios/i.test(textoModal))
    await modal.getByRole('button', { name: 'Cerrar ventana de producto' }).click()
    await modal.waitFor({ state: 'detached' })

    await vista.locator('article').nth(5).getByRole('button').click()
    await modal.waitFor()
    const sinPrecio = (await modal.textContent()) ?? ''
    inf.check('Una ficha sin precio no inventa ninguno', !sinPrecio.includes('$'))
    inf.check('Una ficha sin precio usa la nota de consulta',
      sinPrecio.includes('te confirmamos precio, disponibilidad y condiciones'))
    await modal.getByRole('button', { name: 'Cerrar ventana de producto' }).click()
    await modal.waitFor({ state: 'detached' })
    await vista.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await vista.waitFor({ state: 'detached' })

    // --- subir una foto nueva desde «Foto principal»
    await ficha.getByRole('button', { name: 'Subir nueva' }).click()
    const biblioteca = p3.locator('[role="dialog"][aria-label="Elegir imagen"]')
    inf.check('«Subir nueva» abre directamente el paso de subir',
      await biblioteca.getByRole('heading', { name: 'Subir una imagen nueva' }).isVisible())
    await biblioteca.locator('input[data-subir-imagen]').setInputFiles({
      name: `${PREFIJO_FOTOS_QA}principal.png`, mimeType: 'image/png', buffer: crearPng(120, 90, [30, 90, 200]),
    })
    const subirYUsar = biblioteca.getByRole('button', { name: 'Subir y usar' })
    await subirYUsar.waitFor()
    inf.check('Propone el nombre del archivo como identificador',
      (await biblioteca.getByLabel('Nombre del archivo').inputValue()) === `${PREFIJO_FOTOS_QA}principal`)
    inf.check('Usa el nombre del producto como texto alternativo',
      (await biblioteca.getByLabel('Texto alternativo').inputValue()) === nombreProd)
    await subirYUsar.click()
    await biblioteca.waitFor({ state: 'detached', timeout: 20000 })
    inf.check('La foto subida queda como foto principal',
      await ficha.getByText(`${PREFIJO_FOTOS_QA}principal`, { exact: true }).first().isVisible())
    inf.check('Sus archivos quedan guardados al instante',
      existsSync(`public/img/${PREFIJO_FOTOS_QA}principal-sm.webp`) &&
      existsSync(`public/img/${PREFIJO_FOTOS_QA}principal-lg.webp`))
    r = await pedirEn(p3, '/api/content')
    inf.check('La biblioteca del servidor ya la incluye',
      (r.datos?.media ?? []).some((m) => m.id === `${PREFIJO_FOTOS_QA}principal` && m.alt === nombreProd))

    // --- subir una foto nueva a la galería
    await ficha.getByRole('button', { name: 'Subir foto nueva a la galería' }).click()
    const modalGaleria = p3.locator('[role="dialog"][aria-label="Subir imagen nueva"]')
    await modalGaleria.waitFor()
    await p3.keyboard.press('Escape')
    await modalGaleria.waitFor({ state: 'detached' })
    inf.check('La ventana de subir se cierra con Escape', true)

    await ficha.getByRole('button', { name: 'Subir foto nueva a la galería' }).click()
    await modalGaleria.waitFor()
    await modalGaleria.locator('input[data-subir-imagen]').setInputFiles({
      name: `${PREFIJO_FOTOS_QA}galeria.png`, mimeType: 'image/png', buffer: crearPng(100, 100, [200, 80, 40]),
    })
    await modalGaleria.getByRole('button', { name: 'Subir y usar' }).click()
    await modalGaleria.waitFor({ state: 'detached', timeout: 20000 })
    inf.check('La foto subida desde la galería queda en la galería',
      (await ficha.locator(`button[title="${PREFIJO_FOTOS_QA}galeria"][aria-pressed="true"]`).count()) === 1)

    // --- publicar de punta a punta: lo editado llega a los archivos y al sitio
    await p3.getByRole('button', { name: 'Publicar', exact: true }).click()
    const dialogoPublicar = p3.locator('[aria-labelledby="publicar-titulo"]')
    await dialogoPublicar.getByRole('button', { name: 'Publicar' }).click()
    contarErrores = false
    await dialogoPublicar.waitFor({ state: 'detached', timeout: 20000 })

    const publicado = JSON.parse(readFileSync(RUTA_PRODUCTOS, 'utf8'))[0]
    inf.check('Publicar guarda el precio como número', publicado.precio === 12500, String(publicado.precio))
    inf.check('Publicar guarda la unidad', publicado.precioUnidad === 'por metro', String(publicado.precioUnidad))
    inf.check('Publicar guarda la foto principal nueva', publicado.imagen === `${PREFIJO_FOTOS_QA}principal`)
    inf.check('Publicar guarda la galería con la foto nueva',
      (publicado.galeria ?? []).includes(`${PREFIJO_FOTOS_QA}galeria`))
    inf.check('Los demás productos siguen sin precio',
      JSON.parse(readFileSync(RUTA_PRODUCTOS, 'utf8')).slice(1).every((p) => p.precio === null && p.precioUnidad === null))

    await p3.goto(BASE + '/', { waitUntil: 'networkidle' })
    await p3.waitForTimeout(2600)
    const enSitio = (await p3.locator('article', { has: p3.locator(`h3:text-is("${nombreProd}")`) }).first().textContent()) ?? ''
    inf.check('El sitio público muestra el precio publicado',
      enSitio.includes('$12.500') && enSitio.includes('por metro'), enSitio.slice(0, 80))

    // --- en el celular: nada se sale de la pantalla
    await p3.setViewportSize({ width: 390, height: 850 })
    await p3.goto(BASE + '/admin', { waitUntil: 'networkidle' })
    await p3.getByRole('button', { name: 'Editar' }).first().click()
    const medirFuera = () =>
      p3.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const fuera = [...document.querySelectorAll('main button, main input, [role="dialog"] button, [role="dialog"] input')]
          .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > vw + 1 || b.left < -1) })
          .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30))
        return { fuera, desborda: document.documentElement.scrollWidth > vw + 1 }
      })
    let m = await medirFuera()
    inf.check('El editor del producto cabe en 390px', !m.desborda && m.fuera.length === 0, m.fuera.join(' · '))
    await p3.locator('main li').first().getByRole('button', { name: 'Subir nueva' }).click()
    await p3.locator('[role="dialog"][aria-label="Elegir imagen"]').waitFor()
    m = await medirFuera()
    inf.check('La ventana de subir cabe en 390px', !m.desborda && m.fuera.length === 0, m.fuera.join(' · '))

    await ctxP.close()
  }

  // ------------------------- líneas: borrar una y productos que apuntan a ella ---
  // Solo trabaja con borradores del navegador: no publica, no toca archivos.
  {
    const ctxL = await navegador.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-CO' })
    await ctxL.addInitScript(() => {
      try { localStorage.setItem('mi_panel_guia_vista_v1', '1') } catch { /* sin almacenamiento */ }
    })
    const pL = await ctxL.newPage()
    pL.on('pageerror', (e) => erroresConsola.push(`[líneas] ${e.message}`))
    pL.on('console', (m) => {
      if (m.type() !== 'error') return
      if (/status of (401|403|409|422)/.test(m.text())) return
      erroresConsola.push(`[líneas] ${m.text()}`)
    })

    const entrarL = async () => {
      await pL.goto(BASE + '/admin', { waitUntil: 'networkidle' })
      if (await pL.locator('#usuario').count()) {
        await pL.fill('#usuario', 'admin')
        await pL.fill('#contrasena', CONTRASENA)
        await pL.click('button[type="submit"]')
      }
      await pL.waitForSelector('button[aria-label="Cómo funciona el panel"]')
    }
    await entrarL()

    const base = (await pedirEn(pL, '/api/content')).datos
    const conOtros = base.products.filter((p) => p.categorias.includes('otros'))
    const millare = base.products.find((p) => p.id === 'millare')

    // --- 1. Borrar la línea desde «Líneas»: sus productos se quedan sin ella, no huérfanos
    await pL.getByRole('tab', { name: 'Líneas' }).click()
    const tarjetaOtros = pL.locator('main div.bg-slate-50\\/60', { has: pL.locator('code', { hasText: /^otros$/ }) })
    await tarjetaOtros.getByRole('button', { name: /^Eliminar el elemento/ }).click()
    const confirmar = pL.locator('[aria-labelledby="confirmar-titulo"]')
    const nombreOtros = base.categories.find((c) => c.id === 'otros').nombre
    inf.check('Borrar una línea pregunta por su nombre',
      await confirmar.getByRole('heading', { name: `¿Eliminar la línea «${nombreOtros}»?` }).isVisible(), nombreOtros)
    inf.check('Avisa cuántos productos están en esa línea',
      (await confirmar.textContent()).includes(`${conOtros.length} productos están en esta línea`),
      (await confirmar.textContent()).slice(0, 80))
    await confirmar.getByRole('button', { name: 'Eliminar', exact: true }).click()

    await pL.getByRole('tab', { name: 'Productos' }).click()
    const filasTrasBorrar = await pL.locator('main ul li').allInnerTexts()
    const filaMillare = filasTrasBorrar.find((t) => t.includes('Millaré')) ?? ''
    inf.check('El producto queda en su otra línea y sin la borrada',
      filaMillare.includes('Cintas') && !filaMillare.includes('Otros'), filaMillare.replace(/\n/g, ' '))
    inf.check('No quedan productos apuntando a una línea inexistente',
      !filasTrasBorrar.some((t) => /línea(s)? eliminada/.test(t)) && (await pL.locator('[data-aviso-lineas]').count()) === 0)

    // Se descarta para empezar el siguiente caso desde lo publicado
    await pL.getByRole('button', { name: 'Descartar', exact: true }).first().click()
    await pL.locator('[aria-labelledby="confirmar-titulo"]').getByRole('button', { name: 'Descartar' }).click()
    await pL.locator('[aria-labelledby="confirmar-titulo"]').waitFor({ state: 'detached' })

    // --- 2. El estado del video: borrador con la línea borrada y productos que aún apuntan a ella
    const fresco2 = (await pedirEn(pL, '/api/content')).datos
    const borradorHuerfano = {
      site: fresco2.site,
      categories: fresco2.categories.filter((c) => c.id !== 'otros'),
      products: fresco2.products,
      media: fresco2.media,
    }
    await pL.evaluate(([clave, valor]) => localStorage.setItem(clave, valor), [
      'mi_panel_borrador_v1', JSON.stringify({ sha: fresco2.sha, contenido: borradorHuerfano }),
    ])
    await entrarL()

    const aviso = pL.locator('[data-aviso-lineas]')
    inf.check('Un borrador con líneas borradas se recupera avisando',
      // .first(): en desarrollo, StrictMode carga dos veces y el aviso sale duplicado
      await pL.getByText('Recuperamos los cambios que no habías publicado').first().isVisible())
    inf.check('Avisa cuántos productos necesitan una línea',
      (await aviso.textContent()).includes(`${conOtros.length} productos necesitan que les elijas una línea`),
      (await aviso.textContent()).slice(0, 90))
    inf.check('Avisa que mientras tanto no se puede publicar', (await aviso.textContent()).includes('no podrá publicar'))
    const filasHuerfanas = await pL.locator('main ul li').allInnerTexts()
    inf.check('El producto ya no muestra «otros» a secas: dice que la línea fue eliminada',
      (filasHuerfanas.find((t) => t.includes('Millaré')) ?? '').includes('una línea eliminada'))

    // Se abre el producto de las capturas
    await pL.getByPlaceholder('Buscar…').fill('Millaré')
    await pL.locator('main li').first().getByRole('button', { name: 'Editar' }).click()
    const fichaL = pL.locator('main li').first()
    const lineasProd = fichaL.locator('[data-lineas-producto]')
    inf.check('La línea borrada aparece como chip a quitar',
      (await lineasProd.locator('[data-linea-eliminada]').innerText()).includes('otros · ya no existe'))
    inf.check('Siguen las líneas que existen para elegir',
      (await lineasProd.locator('button[aria-pressed]').count()) === fresco2.categories.length - 1)

    // --- el celular, con el chip fantasma y el formulario de línea nueva abiertos
    await pL.setViewportSize({ width: 390, height: 850 })
    await fichaL.getByRole('button', { name: 'Nueva línea' }).click()
    await pL.waitForTimeout(300)
    const medirL = await pL.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const fuera = [...document.querySelectorAll('main button, main input')]
        .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > vw + 1 || b.left < -1) })
        .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30))
      return { fuera, desborda: document.documentElement.scrollWidth > vw + 1 }
    })
    inf.check('Las líneas del producto caben en 390px', !medirL.desborda && medirL.fuera.length === 0, medirL.fuera.join(' · '))
    await pL.setViewportSize({ width: 1280, height: 900 })
    await fichaL.getByRole('button', { name: 'Cancelar' }).click()

    // --- quitar la línea fantasma
    await lineasProd.locator('[data-linea-eliminada]').click()
    inf.check('Quitar la línea fantasma la saca del producto',
      (await lineasProd.locator('[data-linea-eliminada]').count()) === 0)
    inf.check('El aviso baja en uno',
      (await aviso.textContent()).includes(`${conOtros.length - 1} productos necesitan`))
    inf.check('Ya no queda marcado como producto con problema',
      !(await fichaL.innerText()).includes('línea eliminada'))

    // --- elegir otra línea
    const chipElasticos = lineasProd.getByRole('button', { name: 'Elásticos', exact: true })
    await chipElasticos.click()
    inf.check('Se puede cambiar la línea del producto', (await chipElasticos.getAttribute('aria-pressed')) === 'true')
    await chipElasticos.click()
    inf.check('Y volver a quitarla', (await chipElasticos.getAttribute('aria-pressed')) === 'false')
    await lineasProd.getByRole('button', { name: 'Cintas', exact: true }).click()
    inf.check('No deja a un producto sin ninguna línea existente',
      (await lineasProd.getByRole('button', { name: 'Cintas', exact: true }).getAttribute('aria-pressed')) === 'true' &&
      await pL.getByText('Un producto debe pertenecer al menos a una línea').isVisible())

    // --- crear una línea desde el producto
    await fichaL.getByRole('button', { name: 'Nueva línea' }).click()
    await fichaL.getByLabel('Nombre de la nueva línea').fill('Cintas')
    await fichaL.getByRole('button', { name: 'Crear y añadir' }).click()
    inf.check('No crea una línea con el nombre de otra que ya existe',
      await pL.getByText('Ya existe la línea').isVisible() &&
      (await lineasProd.getByRole('button', { name: 'Cintas', exact: true }).count()) === 1)
    await fichaL.getByLabel('Nombre de la nueva línea').fill('Hilos de prueba')
    await fichaL.getByLabel('Nombre de la nueva línea').press('Enter')
    const chipNuevo = lineasProd.getByRole('button', { name: 'Hilos de prueba', exact: true })
    inf.check('Crea la línea y deja el producto dentro de ella',
      (await chipNuevo.count()) === 1 && (await chipNuevo.getAttribute('aria-pressed')) === 'true')
    inf.check('El formulario se cierra al crearla', (await fichaL.getByLabel('Nombre de la nueva línea').count()) === 0)

    // --- el enlace lleva a donde se editan las líneas
    await fichaL.getByRole('button', { name: 'Cambiar el nombre, la imagen o el orden de las líneas' }).click()
    inf.check('El enlace lleva a la pestaña de líneas, con la nueva incluida',
      await pL.getByRole('heading', { name: `Líneas del catálogo (${fresco2.categories.length})` }).isVisible())

    // --- el servidor sigue negándose a publicar con una línea fantasma
    const rechazo = await pedirEn(pL, '/api/content', {
      metodo: 'PUT', cuerpo: { ...borradorHuerfano, sha: fresco2.sha },
    })
    inf.check('El servidor rechaza publicar con una línea que no existe',
      rechazo.estado === 422 && /otros/.test(rechazo.datos?.error ?? ''), `HTTP ${rechazo.estado} — ${(rechazo.datos?.error ?? '').slice(0, 70)}`)

    inf.check('El producto de la prueba estaba en dos líneas', Boolean(millare) && millare.categorias.length === 2)
    await ctxL.close()
  }

  // ----------------- versión del contenido: fotos, conflictos y borradores viejos ---
  // En modo local no hay commits, así que el servidor no puede reproducir lo que
  // pasa en producción (cada foto subida es un commit). Se simulan sus respuestas
  // en el navegador: no se toca el disco ni el repositorio.
  {
    const ctxV = await navegador.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-CO' })
    await ctxV.addInitScript(() => {
      try { localStorage.setItem('mi_panel_guia_vista_v1', '1') } catch { /* sin almacenamiento */ }
    })
    const pV = await ctxV.newPage()
    pV.on('pageerror', (e) => erroresConsola.push(`[versión] ${e.message}`))
    pV.on('console', (m) => {
      if (m.type() !== 'error') return
      if (/status of (401|403|409|422)/.test(m.text())) return
      erroresConsola.push(`[versión] ${m.text()}`)
    })

    // Lo que hay en disco antes de empezar: bloques anteriores sí publican
    const discoAntes = [RUTA_PRODUCTOS, RUTA_MEDIOS, RUTA_SITE].map((r) => readFileSync(r, 'utf8'))

    let shaServidor = 'sha-inicial-abc'
    let responder409 = false
    const publicaciones = [] // cuerpos recibidos por PUT /api/content
    let mediosServidor = null

    await ctxV.route('**/api/content', async (route) => {
      const peticion = route.request()
      if (peticion.method() === 'GET') {
        const real = await route.fetch()
        const datos = await real.json()
        datos.sha = shaServidor
        mediosServidor = datos.media
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(datos) })
      }
      if (peticion.method() === 'PUT') {
        publicaciones.push(peticion.postDataJSON())
        if (responder409) {
          responder409 = false
          shaServidor = 'sha-nuevo-xyz' // alguien publicó entretanto
          return route.fulfill({
            status: 409, contentType: 'application/json',
            body: JSON.stringify({ error: 'El contenido cambió desde que abriste el panel.' }),
          })
        }
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ ok: true, sha: `sha-publicado-${publicaciones.length}`, local: false }),
        })
      }
      return route.continue()
    })
    await ctxV.route('**/api/media', async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      const nuevo = { id: `${PREFIJO_FOTOS_QA}version`, alt: '', variantes: ['sm', 'lg', 'fallback', 'hero'], bytes: 1234, origen: 'panel' }
      return route.fulfill({
        status: 200, contentType: 'application/json',
        // sha: lo que devuelve GitHub tras el commit de la foto
        body: JSON.stringify({ ok: true, reemplazo: false, medio: nuevo, medios: [...(mediosServidor ?? []), nuevo], sha: 'sha-tras-subir-123', local: false }),
      })
    })

    await pV.goto(BASE + '/admin', { waitUntil: 'networkidle' })
    await pV.fill('#usuario', 'admin')
    await pV.fill('#contrasena', CONTRASENA)
    await pV.click('button[type="submit"]')
    await pV.waitForSelector('button[aria-label="Cómo funciona el panel"]')

    // --- 1. Subir una foto y publicar: el panel debe enviar la versión posterior a la foto
    await pV.getByRole('button', { name: 'Editar' }).first().click()
    const fichaV = pV.locator('main li').first()
    await fichaV.getByRole('button', { name: 'Subir nueva' }).click()
    const bibV = pV.locator('[role="dialog"][aria-label="Elegir imagen"]')
    await bibV.locator('input[data-subir-imagen]').setInputFiles({
      name: `${PREFIJO_FOTOS_QA}version.png`, mimeType: 'image/png', buffer: crearPng(80, 80, [20, 140, 90]),
    })
    await bibV.getByRole('button', { name: 'Subir y usar' }).click()
    await bibV.waitFor({ state: 'detached', timeout: 20000 })

    const publicarDesdeElPanel = async () => {
      const dlg = pV.locator('[aria-labelledby="publicar-titulo"]')
      // Tras un conflicto la ventana de publicar sigue abierta: basta volver a pulsar
      if (!(await dlg.count())) await pV.getByRole('button', { name: 'Publicar', exact: true }).click()
      await dlg.getByRole('button', { name: 'Publicar' }).click()
      await pV.waitForTimeout(600)
    }
    await publicarDesdeElPanel()
    inf.check('Tras subir una foto, publicar envía la versión que dejó la foto',
      publicaciones[0]?.sha === 'sha-tras-subir-123', String(publicaciones[0]?.sha))
    inf.check('Publicar con éxito deja el panel sin cambios pendientes',
      (await pV.getByText('Tienes cambios sin publicar').count()) === 0)

    // --- 2. Conflicto al publicar: el borrador se conserva y el siguiente intento pasa
    await pV.getByLabel('Precio (pesos)').fill('4500')
    responder409 = true
    await publicarDesdeElPanel()
    inf.check('Un conflicto no tira el borrador: siguen los cambios sin publicar',
      await pV.getByText('Tienes cambios sin publicar').isVisible() &&
      (await pV.getByLabel('Precio (pesos)').inputValue()) === '4500')
    inf.check('Un conflicto explica qué pasó y que el trabajo sigue ahí',
      await pV.getByText('Tus cambios siguen aquí').first().isVisible())
    await publicarDesdeElPanel()
    inf.check('Tras el conflicto, publicar de nuevo usa la versión actual del servidor',
      publicaciones.at(-1)?.sha === 'sha-nuevo-xyz', String(publicaciones.at(-1)?.sha))
    inf.check('Y ese segundo intento sí queda publicado',
      (await pV.getByText('Tienes cambios sin publicar').count()) === 0 &&
      (await pV.getByText('Publicado. El sitio se está reconstruyendo').first().isVisible()))

    // --- 3. Un borrador guardado con otra versión se recupera (antes se perdía en silencio)
    const actual = (await pedirEn(pV, '/api/content')).datos
    const productosViejos = JSON.parse(JSON.stringify(actual.products))
    productosViejos[1].precio = 7777
    await pV.evaluate(([k, v]) => localStorage.setItem(k, v), [
      'mi_panel_borrador_v1',
      JSON.stringify({
        sha: 'sha-de-hace-un-rato',
        // media vieja a propósito: la biblioteca vigente es la del servidor
        contenido: { site: actual.site, categories: actual.categories, products: productosViejos, media: [] },
      }),
    ])
    await pV.goto(BASE + '/admin', { waitUntil: 'networkidle' })
    await pV.waitForSelector('button[aria-label="Cómo funciona el panel"]')
    inf.check('Un borrador con otra versión se recupera, no se descarta',
      await pV.getByText('Tienes cambios sin publicar').isVisible())
    inf.check('Avisa que el sitio cambió desde que lo empezaste',
      await pV.getByText('el sitio se actualizó desde que los empezaste').first().isVisible())
    inf.check('El borrador recuperado conserva lo editado',
      (await pV.locator('main ul li').nth(1).innerText()).includes('$7.777'))
    await pV.getByRole('button', { name: 'Imágenes', exact: true }).click()
    inf.check('Pero la biblioteca de imágenes es siempre la del servidor, no la del borrador',
      await pV.getByRole('heading', { name: `Biblioteca (${actual.media.length})` }).isVisible(), `${actual.media.length} imágenes`)

    inf.check('Esta parte no escribió nada en el disco',
      [RUTA_PRODUCTOS, RUTA_MEDIOS, RUTA_SITE].every((r, i) => readFileSync(r, 'utf8') === discoAntes[i]))
    await ctxV.close()
  }

  // ------------------------------------------------------- responsive ----
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' })
  await page.fill('#usuario', 'admin')
  await page.fill('#contrasena', CONTRASENA)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2500)

  for (const ancho of [375, 390, 768, 1280]) {
    await page.setViewportSize({ width: ancho, height: 850 })
    await page.waitForTimeout(400)
    const m = await page.evaluate(() => ({
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
    }))
    inf.check(`El panel no desborda a ${ancho}px`, m.scrollW <= m.vw + 1, `${m.scrollW} vs ${m.vw}`)
  }

  await page.setViewportSize({ width: 390, height: 850 })
  await page.waitForTimeout(400)
  const recortados = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    return [...document.querySelectorAll('main button, main a, main input, main select')]
      .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > vw + 1 })
      .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30))
  })
  inf.check('Ningún control queda fuera de pantalla en móvil', recortados.length === 0,
    recortados.slice(0, 5).join(' · '))

  inf.check('Sin errores de JavaScript en el panel', erroresConsola.length === 0,
    erroresConsola.join(' | ').slice(0, 160))
} finally {
  // Lo publicado y subido por las pruebas no debe quedarse en el proyecto
  writeFileSync(RUTA_SITE, respaldo)
  writeFileSync(RUTA_PRODUCTOS, respaldoProductos)
  writeFileSync(RUTA_MEDIOS, respaldoMedios)
  writeFileSync(RUTA_CATEGORIAS, respaldoCategorias)
  for (const f of readdirSync('public/img')) {
    if (f.startsWith(PREFIJO_FOTOS_QA)) unlinkSync(`public/img/${f}`)
  }
  await navegador.close()
}

console.log('\n(contenido de prueba restaurado)')
process.exit(inf.resumen() ? 0 : 1)
