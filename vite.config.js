import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiEnDesarrollo()],
  server: {
    port: 5254,
    strictPort: false,
  },
  build: {
    target: 'es2020',
  },
})
