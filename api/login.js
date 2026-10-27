/**
 * POST /api/login — abre sesión de administrador.
 *
 * Frena la fuerza bruta de dos formas: un contador por IP y un retardo fijo en
 * cada intento fallido. El contador vive en memoria, así que en serverless se
 * reinicia cuando la instancia se recicla; es una traba, no una garantía. La
 * garantía real es que la contraseña está guardada como hash scrypt.
 */
import {
  cookieSesion, crearToken, ErrorHttp, verificarContrasena,
} from './_lib/auth.js'
import { esProduccion, json, leerCuerpo, manejar, soloMetodos } from './_lib/http.js'

const MAX_INTENTOS = 8
const VENTANA_MS = 15 * 60 * 1000
const RETARDO_FALLO_MS = 700

const intentos = new Map()

function ipDe(req) {
  const reenviada = req.headers['x-forwarded-for']
  if (typeof reenviada === 'string') return reenviada.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'desconocida'
}

function registrarFallo(ip) {
  const ahora = Date.now()
  const actual = intentos.get(ip)
  if (!actual || ahora - actual.desde > VENTANA_MS) {
    intentos.set(ip, { n: 1, desde: ahora })
  } else {
    actual.n += 1
  }
}

function comprobarBloqueo(ip) {
  const actual = intentos.get(ip)
  if (!actual) return
  if (Date.now() - actual.desde > VENTANA_MS) {
    intentos.delete(ip)
    return
  }
  if (actual.n >= MAX_INTENTOS) {
    const minutos = Math.ceil((VENTANA_MS - (Date.now() - actual.desde)) / 60000)
    throw new ErrorHttp(429, `Demasiados intentos. Vuelve a probar en ${minutos} minuto(s).`)
  }
}

export default manejar(async (req, res) => {
  soloMetodos(req, ['POST'])

  const hash = process.env.ADMIN_PASSWORD_HASH
  const secreto = process.env.AUTH_SECRET
  if (!hash || !secreto || secreto.length < 32) {
    throw new ErrorHttp(
      503,
      'El panel no está configurado. Faltan ADMIN_PASSWORD_HASH o AUTH_SECRET en el servidor.'
    )
  }

  const ip = ipDe(req)
  comprobarBloqueo(ip)

  const { usuario, contrasena } = await leerCuerpo(req)

  const nombre = String(usuario ?? '').trim().slice(0, 60) || 'admin'
  const esperado = (process.env.ADMIN_USER || 'admin').trim()

  const correcto =
    nombre.toLowerCase() === esperado.toLowerCase() &&
    verificarContrasena(String(contrasena ?? ''), hash)

  if (!correcto) {
    registrarFallo(ip)
    await new Promise((r) => setTimeout(r, RETARDO_FALLO_MS))
    // Mismo mensaje para usuario y contraseña: no revela cuál falló.
    throw new ErrorHttp(401, 'Usuario o contraseña incorrectos.')
  }

  intentos.delete(ip)

  res.setHeader('Set-Cookie', cookieSesion(crearToken(nombre, secreto), { seguro: esProduccion() }))
  json(res, 200, { ok: true, usuario: nombre })
})
