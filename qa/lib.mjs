/**
 * Utilidades compartidas por las pruebas.
 *
 * Usa playwright-core con el Chrome ya instalado en el sistema, para no
 * descargar un navegador de 150 MB solo para verificar la página.
 */
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const CANDIDATOS = [
  process.env.QA_CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

export const URL_BASE = (process.env.QA_URL || 'http://localhost:4180').replace(/\/+$/, '')

export function rutaChrome() {
  const encontrado = CANDIDATOS.find((p) => existsSync(p))
  if (!encontrado) {
    throw new Error(
      'No se encontró Chrome. Indícalo con la variable QA_CHROME=/ruta/a/chrome.exe'
    )
  }
  return encontrado
}

export async function abrirNavegador() {
  return chromium.launch({ executablePath: rutaChrome() })
}

/**
 * Recorre la página para que se disparen las animaciones de entrada.
 *
 * Repite el recorrido hasta que no quede ningún `.reveal` oculto en lugar de
 * confiar en una espera fija: con una espera fija la prueba fallaba de vez en
 * cuando sin que hubiera ningún defecto real.
 */
export async function asentar(page, intentos = 4) {
  for (let i = 0; i < intentos; i++) {
    const pendientes = await page.evaluate(async () => {
      const alto = document.documentElement.scrollHeight
      for (let y = 0; y < alto; y += 300) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 30))
      }
      window.scrollTo(0, alto)
      await new Promise((r) => setTimeout(r, 150))
      window.scrollTo(0, 0)
      await new Promise((r) => setTimeout(r, 350))
      return [...document.querySelectorAll('.reveal')].filter(
        (el) => !el.classList.contains('is-visible')
      ).length
    })
    if (pendientes === 0) return
  }
}

/** Acumulador de comprobaciones con salida legible. */
export function crearInforme(titulo) {
  const resultados = []
  console.log(`\n=== ${titulo} ===`)
  return {
    check(nombre, ok, detalle = '') {
      resultados.push({ nombre, ok, detalle })
      console.log(`${ok ? '  OK  ' : ' FALLA'} ${nombre}${detalle ? ' — ' + detalle : ''}`)
      return ok
    },
    get fallos() {
      return resultados.filter((r) => !r.ok)
    },
    total: () => resultados.length,
    resumen() {
      const fallos = resultados.filter((r) => !r.ok)
      console.log(`\n===== ${resultados.length - fallos.length}/${resultados.length} comprobaciones OK =====`)
      if (fallos.length) {
        console.log('FALLOS:')
        fallos.forEach((f) => console.log(`  - ${f.nombre} ${f.detalle}`))
      }
      return fallos.length === 0
    },
  }
}
