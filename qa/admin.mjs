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
import { readFileSync, writeFileSync } from 'node:fs'
import { abrirNavegador, crearInforme } from './lib.mjs'

const BASE = (process.env.QA_ADMIN_URL || 'http://localhost:5254').replace(/\/+$/, '')
const CONTRASENA = process.env.QA_PASSWORD || 'panel-local-12345'
const RUTA_SITE = 'src/content/site.json'

const inf = crearInforme('PANEL DE ADMINISTRACIÓN')

// Copia de seguridad para restaurar al final pase lo que pase
const respaldo = readFileSync(RUTA_SITE, 'utf8')

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

/** Petición desde el contexto del navegador (lleva las cookies). */
const pedir = (ruta, opciones = {}) =>
  page.evaluate(
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
  writeFileSync(RUTA_SITE, respaldo)
  await navegador.close()
}

console.log('\n(contenido de prueba restaurado)')
process.exit(inf.resumen() ? 0 : 1)
