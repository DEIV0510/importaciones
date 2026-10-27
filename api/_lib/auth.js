/**
 * Autenticación del panel.
 *
 * Decisiones:
 * - La contraseña NUNCA se guarda, ni en el código ni en las variables de
 *   entorno: solo un hash scrypt con sal. `npm run admin:hash` lo genera.
 * - La sesión es un token firmado con HMAC-SHA256 usando AUTH_SECRET. El
 *   servidor no guarda estado, así que funciona en serverless.
 * - La cookie es HttpOnly (el JavaScript de la página no puede leerla),
 *   Secure en producción y SameSite=Strict.
 * - Todo se apoya en `node:crypto`: cero dependencias nuevas.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const COOKIE = 'mi_sesion'
const DURACION_MS = 8 * 60 * 60 * 1000 // 8 horas
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }

// ---------------------------------------------------------------- contraseña

/** Devuelve una cadena autocontenida: scrypt$N$r$p$sal$hash */
export function hashContrasena(contrasena) {
  const sal = randomBytes(16)
  const hash = scryptSync(contrasena.normalize('NFKC'), sal, SCRYPT.keylen, SCRYPT)
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, sal.toString('base64'), hash.toString('base64')].join('$')
}

/** Comparación en tiempo constante: no revela cuántos caracteres acertaste. */
export function verificarContrasena(contrasena, almacenado) {
  try {
    const [algo, N, r, p, salB64, hashB64] = String(almacenado).split('$')
    if (algo !== 'scrypt') return false
    const sal = Buffer.from(salB64, 'base64')
    const esperado = Buffer.from(hashB64, 'base64')
    const calculado = scryptSync(String(contrasena).normalize('NFKC'), sal, esperado.length, {
      N: Number(N), r: Number(r), p: Number(p),
    })
    return calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
  } catch {
    return false
  }
}

// -------------------------------------------------------------------- sesión

const b64url = (buf) => Buffer.from(buf).toString('base64url')

function firmar(datos, secreto) {
  return createHmac('sha256', secreto).update(datos).digest('base64url')
}

export function crearToken(usuario, secreto) {
  const cuerpo = b64url(JSON.stringify({ u: usuario, exp: Date.now() + DURACION_MS }))
  return `${cuerpo}.${firmar(cuerpo, secreto)}`
}

export function leerToken(token, secreto) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [cuerpo, firma] = token.split('.')
  const esperada = firmar(cuerpo, secreto)
  // timingSafeEqual exige longitudes iguales
  if (firma.length !== esperada.length) return null
  if (!timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return null
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'))
    if (!datos.exp || Date.now() > datos.exp) return null
    return datos
  } catch {
    return null
  }
}

// ------------------------------------------------------------------- cookies

export function leerCookies(req) {
  const crudo = req.headers?.cookie || ''
  const salida = {}
  for (const parte of crudo.split(';')) {
    const i = parte.indexOf('=')
    if (i < 0) continue
    salida[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim())
  }
  return salida
}

export function cookieSesion(token, { seguro }) {
  const partes = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(DURACION_MS / 1000)}`,
  ]
  if (seguro) partes.push('Secure')
  return partes.join('; ')
}

export function cookieBorrada({ seguro }) {
  const partes = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0']
  if (seguro) partes.push('Secure')
  return partes.join('; ')
}

// --------------------------------------------------------------- autorización

export class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje)
    this.estado = estado
  }
}

/**
 * Exige sesión válida. Lanza ErrorHttp si no la hay.
 *
 * Comprueba además una cabecera propia: un formulario de otro sitio puede
 * hacer que el navegador envíe la cookie, pero no puede añadir cabeceras
 * personalizadas sin pasar por CORS. Es la defensa contra CSRF, además de
 * SameSite=Strict.
 */
export function exigirAdmin(req) {
  const secreto = process.env.AUTH_SECRET
  if (!secreto || secreto.length < 32) {
    throw new ErrorHttp(503, 'El panel no está configurado: falta AUTH_SECRET en el servidor.')
  }
  if (req.headers['x-panel'] !== '1') {
    throw new ErrorHttp(403, 'Petición no autorizada.')
  }
  const sesion = leerToken(leerCookies(req)[COOKIE], secreto)
  if (!sesion) throw new ErrorHttp(401, 'Tu sesión expiró. Vuelve a entrar.')
  return sesion
}

export const NOMBRE_COOKIE = COOKIE
export const DURACION_SESION_MS = DURACION_MS
