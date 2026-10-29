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
const PREFIJO_FOTOS_QA = 'qa-foto-'

const inf = crearInforme('PANEL DE ADMINISTRACIÓN')

// Copia de seguridad para restaurar al final pase lo que pase
const respaldo = readFileSync(RUTA_SITE, 'utf8')
const respaldoProductos = readFileSync(RUTA_PRODUCTOS, 'utf8')
const respaldoMedios = readFileSync(RUTA_MEDIOS, 'utf8')

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
  for (const f of readdirSync('public/img')) {
    if (f.startsWith(PREFIJO_FOTOS_QA)) unlinkSync(`public/img/${f}`)
  }
  await navegador.close()
}

console.log('\n(contenido de prueba restaurado)')
process.exit(inf.resumen() ? 0 : 1)
