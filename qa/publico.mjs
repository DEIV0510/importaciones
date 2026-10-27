/**
 * Pruebas del sitio público: que siga funcionando igual tras los cambios.
 *
 *   npm run qa:publico            (contra http://localhost:4180)
 *   QA_URL=https://… npm run qa:publico
 */
import { abrirNavegador, asentar, crearInforme, URL_BASE } from './lib.mjs'

const ANCHOS = [
  { nombre: 'escritorio-1920', w: 1920, h: 1080 },
  { nombre: 'escritorio-1440', w: 1440, h: 900 },
  { nombre: 'portatil-1366', w: 1366, h: 768 },
  { nombre: 'tablet-1024', w: 1024, h: 1366 },
  { nombre: 'tablet-768', w: 768, h: 1024 },
  { nombre: 'movil-430', w: 430, h: 932 },
  { nombre: 'movil-390', w: 390, h: 844 },
  { nombre: 'movil-375', w: 375, h: 667 },
]

const navegador = await abrirNavegador()
const inf = crearInforme('SITIO PÚBLICO')

// ---------------------------------------------------- responsive -----------
for (const vp of ANCHOS) {
  const ctx = await navegador.newContext({
    viewport: { width: vp.w, height: vp.h },
    isMobile: vp.w < 768,
    hasTouch: vp.w < 768,
    locale: 'es-CO',
  })
  const page = await ctx.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))

  await page.goto(URL_BASE + '/', { waitUntil: 'networkidle' })
  await asentar(page)

  const a = await page.evaluate(() => ({
    vw: document.documentElement.clientWidth,
    scrollW: document.documentElement.scrollWidth,
    revealOcultos: [...document.querySelectorAll('.reveal')].filter(
      (el) => !el.classList.contains('is-visible')
    ).length,
    imagenesRotas: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
    imagenes: document.images.length,
  }))

  inf.check(
    `${vp.nombre}: sin scroll horizontal`,
    a.scrollW <= a.vw + 1,
    `${a.scrollW} vs ${a.vw}`
  )
  inf.check(`${vp.nombre}: sin imágenes rotas`, a.imagenesRotas === 0, `${a.imagenes} imágenes`)
  inf.check(`${vp.nombre}: reveals visibles`, a.revealOcultos === 0)
  inf.check(`${vp.nombre}: sin errores de consola`, errores.length === 0, errores.join(' | ').slice(0, 120))

  await ctx.close()
}

// ------------------------------------------- enlaces y accesibilidad -------
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-CO' })
  const page = await ctx.newPage()
  await page.goto(URL_BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await asentar(page)

  const enlaces = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
  )

  const wa = enlaces.filter((h) => h.startsWith('https://wa.me/'))
  inf.check('Hay enlaces de WhatsApp', wa.length > 0, `${wa.length}`)
  inf.check(
    'Los enlaces de WhatsApp tienen número y mensaje',
    wa.every((h) => /^https:\/\/wa\.me\/\d{10,15}\?text=.+/.test(h)),
    wa.find((h) => !/^https:\/\/wa\.me\/\d{10,15}\?text=.+/.test(h)) ?? ''
  )

  const tel = enlaces.filter((h) => h.startsWith('tel:'))
  inf.check('Los tel: tienen formato internacional', tel.every((h) => /^tel:\+\d{10,15}$/.test(h)))

  const anclas = [...new Set(enlaces.filter((h) => h.startsWith('#') && h !== '#'))]
  const rotas = await page.evaluate((hs) => hs.filter((h) => !document.querySelector(h)), anclas)
  inf.check('Ningún ancla rota', rotas.length === 0, rotas.join(' '))

  const inseguros = await page.evaluate(() =>
    [...document.querySelectorAll('a[target="_blank"]')]
      .filter((a) => !(a.rel || '').includes('noopener'))
      .map((a) => a.href)
  )
  inf.check('Los enlaces externos usan rel=noopener', inseguros.length === 0, inseguros.join(' '))

  const esquemas = enlaces.filter((h) => /^(javascript|data|vbscript):/i.test(h))
  inf.check('Ningún enlace con esquema peligroso', esquemas.length === 0, esquemas.join(' '))

  const a11y = await page.evaluate(() => {
    const niveles = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1])
    let saltos = 0
    for (let i = 1; i < niveles.length; i++) if (niveles[i] - niveles[i - 1] > 1) saltos++
    return {
      sinAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      h1: document.querySelectorAll('h1').length,
      saltos,
      botonesSinNombre: [...document.querySelectorAll('button')].filter(
        (b) => !b.textContent.trim() && !b.getAttribute('aria-label')
      ).length,
      enlacesSinNombre: [...document.querySelectorAll('a[href]')].filter(
        (a) => !a.textContent.trim() && !a.getAttribute('aria-label')
      ).length,
      lang: document.documentElement.lang,
    }
  })
  inf.check('Todas las imágenes tienen alt', a11y.sinAlt === 0, `${a11y.sinAlt}`)
  inf.check('Exactamente un H1', a11y.h1 === 1, `${a11y.h1}`)
  inf.check('Encabezados sin saltos de nivel', a11y.saltos === 0, `${a11y.saltos}`)
  inf.check('Botones con nombre accesible', a11y.botonesSinNombre === 0)
  inf.check('Enlaces con nombre accesible', a11y.enlacesSinNombre === 0)
  inf.check('Atributo lang', a11y.lang === 'es-CO', a11y.lang)

  await ctx.close()
}

// ------------------------------------------------- menú y catálogo ---------
{
  const ctx = await navegador.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'es-CO',
  })
  const page = await ctx.newPage()
  await page.goto(URL_BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const toggle = page.locator('button[aria-controls="menu-movil"]')
  await toggle.click()
  await page.waitForTimeout(400)
  inf.check('El menú móvil abre', (await toggle.getAttribute('aria-expanded')) === 'true')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(350)
  inf.check('El menú móvil cierra con Escape', (await toggle.getAttribute('aria-expanded')) === 'false')

  await page.locator('#catalogo').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  const total = await page.locator('#catalogo article').count()
  inf.check('El catálogo muestra productos', total > 0, `${total}`)

  await page.locator('#catalogo article button').first().click()
  await page.waitForTimeout(500)
  inf.check('El modal de producto abre', (await page.locator('[role="dialog"]').count()) === 1)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(350)
  inf.check('El modal cierra con Escape', (await page.locator('[role="dialog"]').count()) === 0)

  await ctx.close()
}

await navegador.close()
process.exit(inf.resumen() ? 0 : 1)
