/**
 * Utilidades comunes de las funciones del servidor.
 *
 * El objetivo es que ningún endpoint filtre detalles internos en un error:
 * al cliente le llega un mensaje entendible y el detalle técnico queda en los
 * registros del servidor.
 */
import { ErrorHttp } from './auth.js'

const LIMITE_CUERPO = 12 * 1024 * 1024 // 12 MB: suficiente para una foto

export function json(res, estado, cuerpo) {
  res.statusCode = estado
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(cuerpo))
}

/** Lee el cuerpo tanto si el entorno ya lo analizó (Vercel) como si no (Vite). */
export async function leerCuerpo(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body) } catch { throw new ErrorHttp(400, 'JSON mal formado.') }
    }
    return req.body
  }

  const trozos = []
  let total = 0
  for await (const trozo of req) {
    total += trozo.length
    if (total > LIMITE_CUERPO) throw new ErrorHttp(413, 'El archivo es demasiado grande.')
    trozos.push(trozo)
  }
  if (!trozos.length) return {}
  try {
    return JSON.parse(Buffer.concat(trozos).toString('utf8'))
  } catch {
    throw new ErrorHttp(400, 'JSON mal formado.')
  }
}

export function soloMetodos(req, metodos) {
  if (!metodos.includes(req.method)) {
    throw new ErrorHttp(405, `Método ${req.method} no permitido.`)
  }
}

/** Envuelve un handler para que ningún fallo se escape sin controlar. */
export function manejar(fn) {
  return async (req, res) => {
    try {
      await fn(req, res)
    } catch (err) {
      const estado = err?.estado ?? 500
      // El 503 (panel sin configurar) es un estado conocido y su mensaje ayuda a
      // resolverlo. Los demás 5xx sí se ocultan: pueden delatar algo interno.
      const oculto = estado >= 500 && estado !== 503
      if (oculto) {
        // Solo al registro del servidor; nunca al navegador.
        console.error('[api]', req.url, err)
      }
      if (!res.headersSent) {
        json(res, estado, {
          error: oculto ? 'Error interno del servidor.' : err.message,
          campo: err?.campo ?? null,
        })
      }
    }
  }
}

export const esProduccion = () =>
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
