import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rutaImagen, versionesDe } from './src/content/imagenes.js'
import { ARCHIVOS_HUELLA, huellaContenido } from './api/_lib/huella.js'

// Las funciones de /api leen process.env. En producción lo rellena Vercel;
// en local, el archivo .env (que nunca se sube al repositorio).
const archivoEnv = resolve(import.meta.dirname, '.env')
if (existsSync(archivoEnv)) process.loadEnvFile(archivoEnv)

/**
 * Monta las funciones de /api dentro del servidor de desarrollo.
 *
 * En producción las ejecuta Vercel; en local no existiría nada en /api y el
 * panel no se podría probar. Con esto el mismo código corre en los dos sitios,
 * así que lo que se prueba aquí es lo que se despliega.
 */
function apiEnDesarrollo() {
  return {
    name: 'api-en-desarrollo',
    configureServer(server) {
      const dirApi = resolve(import.meta.dirname, 'api')

      const rutas = new Set(
        readdirSync(dirApi)
          .filter((f) => f.endsWith('.js'))
          .map((f) => '/api/' + f.replace(/\.js$/, ''))
      )

      server.middlewares.use(async (req, res, next) => {
        const ruta = req.url.split('?')[0].replace(/\/+$/, '')
        if (!rutas.has(ruta)) return next()

        try {
          // ssrLoadModule recarga en caliente: al tocar un endpoint no hay
          // que reiniciar el servidor.
          const mod = await server.ssrLoadModule(
            resolve(dirApi, ruta.replace('/api/', '') + '.js')
          )
          await mod.default(req, res)
        } catch (err) {
          server.config.logger.error(`[api] ${ruta}: ${err.stack || err.message}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Error interno del servidor.' }))
          }
        }
      })
    },
  }
}

/**
 * La precarga del logo en index.html debe pedir exactamente la misma dirección
 * que el componente Logo, versión incluida (?v=…); si no, el navegador lo
 * descarga dos veces y avisa de una precarga sin usar.
 */
function precargaDelLogo() {
  return {
    name: 'precarga-del-logo',
    transformIndexHtml(html) {
      const leer = (f) => JSON.parse(readFileSync(resolve(import.meta.dirname, 'src/content', f), 'utf8'))
      const logo = leer('site.json').identidad?.logo || 'logo'
      const ruta = rutaImagen(logo, 'sm.webp', versionesDe(leer('media.json'))[logo])
      return html.replace('href="/img/logo-sm.webp"', `href="${ruta}"`)
    },
  }
}

/**
 * /version.json: la huella del contenido que lleva esta compilación.
 *
 * Tras publicar, el panel la consulta hasta que coincide con la que le dio el
 * servidor. Así sabe cuándo el despliegue terminó y puede decir «ya se ve en
 * el sitio», en vez de que el dueño mire el sitio antes de tiempo y crea que
 * no se publicó.
 */
function versionDelContenido() {
  const huella = () =>
    huellaContenido(ARCHIVOS_HUELLA.map((r) => readFileSync(resolve(import.meta.dirname, r), 'utf8')))
  return {
    name: 'version-del-contenido',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ contenido: huella() }) })
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify({ contenido: huella() }))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiEnDesarrollo(), precargaDelLogo(), versionDelContenido()],
  server: {
    port: 5254,
    strictPort: false,
  },
  build: {
    target: 'es2020',
  },
})
