/**
 * Prueba de humo contra el sitio publicado.
 *
 *   npm run qa:produccion
 *
 * Comprueba que el panel está realmente operativo en producción: que el
 * acceso funciona, que la autorización rechaza lo que debe y que el almacén
 * está configurado. NO publica nada ni modifica contenido.
 *
 * La contraseña sale de CREDENCIALES-PANEL.txt o de la variable
 * QA_ADMIN_PASSWORD. Nunca se imprime.
 */
import { readFileSync } from 'node:fs'
import { crearInforme } from './lib.mjs'

const BASE = (process.env.QA_PROD_URL || 'https://importaciones-olive.vercel.app').replace(/\/+$/, '')

function contrasena() {
  if (process.env.QA_ADMIN_PASSWORD) return process.env.QA_ADMIN_PASSWORD
  try {
    const txt = readFileSync('CREDENCIALES-PANEL.txt', 'utf8')
    const m = txt.match(/^Contraseña:\s*(.+)$/m)
    if (m) return m[1].trim()
  } catch {
    // sin archivo de credenciales
  }
  return null
}

const inf = crearInforme(`PRODUCCIÓN · ${BASE}`)

const pedir = async (ruta, opciones = {}) => {
  const res = await fetch(BASE + ruta, {
    method: opciones.metodo ?? 'GET',
    headers: {
      ...(opciones.sinCabecera ? {} : { 'X-Panel': '1' }),
      ...(opciones.cuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(opciones.cookie ? { Cookie: opciones.cookie } : {}),
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    redirect: 'manual',
  })
  let datos = null
  try { datos = await res.json() } catch { /* sin cuerpo */ }
  return { estado: res.status, datos, cookie: res.headers.get('set-cookie') }
}

// ------------------------------------------------------------ sitio público
let r = await fetch(BASE + '/')
inf.check('El sitio público responde', r.status === 200, `HTTP ${r.status}`)
const html = await r.text()
inf.check('El canonical apunta a este mismo dominio',
  html.includes(`rel="canonical" href="${BASE}/"`))
inf.check('El panel no se cuela en el HTML público',
  !html.includes('ADMIN_PASSWORD') && !html.includes('AUTH_SECRET'))

r = await fetch(BASE + '/admin')
inf.check('El panel responde', r.status === 200, `HTTP ${r.status}`)
inf.check('El panel pide a Google que no lo indexe',
  (r.headers.get('x-robots-tag') || '').includes('noindex'),
  r.headers.get('x-robots-tag') ?? 'sin cabecera')

// --------------------------------------------------------------- configuración
const sesion = await pedir('/api/session')
inf.check('Las credenciales están configuradas', sesion.datos?.configurado === true)
inf.check('El almacén es GitHub, no el disco', sesion.datos?.modo === 'github',
  sesion.datos?.modo === 'local' ? 'falta GITHUB_TOKEN' : sesion.datos?.modo)

// -------------------------------------------------------------- autorización
r = await pedir('/api/content')
inf.check('Sin sesión no se lee el contenido', r.estado === 401, `HTTP ${r.estado}`)

r = await pedir('/api/content', { metodo: 'PUT', cuerpo: { site: {} } })
inf.check('Sin sesión no se puede publicar', r.estado === 401, `HTTP ${r.estado}`)

r = await pedir('/api/login', { metodo: 'POST', cuerpo: { usuario: 'admin', contrasena: 'xxx' } })
inf.check('Rechaza una contraseña incorrecta', r.estado === 401, `HTTP ${r.estado}`)

// ---------------------------------------------------------------- acceso real
const clave = contrasena()
if (!clave) {
  console.log('  ----  Sin contraseña disponible: se omite la prueba de acceso.')
  console.log('        Usa QA_ADMIN_PASSWORD=... o deja CREDENCIALES-PANEL.txt en la carpeta.')
} else {
  const entrada = await pedir('/api/login', {
    metodo: 'POST',
    cuerpo: { usuario: 'admin', contrasena: clave },
  })
  inf.check('Entra con la contraseña correcta', entrada.estado === 200, `HTTP ${entrada.estado}`)

  const galleta = entrada.cookie?.split(';')[0]
  inf.check('La cookie es HttpOnly', (entrada.cookie || '').includes('HttpOnly'))
  inf.check('La cookie es Secure', (entrada.cookie || '').includes('Secure'))
  inf.check('La cookie es SameSite=Strict', (entrada.cookie || '').includes('SameSite=Strict'))

  if (galleta) {
    r = await pedir('/api/content', { cookie: galleta })
    inf.check('Con sesión lee el contenido', r.estado === 200,
      r.estado === 200 ? `${r.datos?.products?.length ?? 0} productos` : (r.datos?.error ?? `HTTP ${r.estado}`))
    inf.check('El contenido trae el identificador de versión', Boolean(r.datos?.sha))
    inf.check('Los productos traen el campo de precio (null si no hay)',
      (r.datos?.products ?? []).length > 0 &&
      r.datos.products.every((p) => 'precio' in p && 'precioUnidad' in p),
      `${(r.datos?.products ?? []).filter((p) => p.precio).length} con precio`)

    r = await pedir('/api/content', { cookie: galleta, sinCabecera: true })
    inf.check('Sin la cabecera del panel rechaza aunque haya sesión', r.estado === 403, `HTTP ${r.estado}`)

    r = await pedir('/api/history', { cookie: galleta })
    inf.check('El historial responde', r.estado === 200,
      r.estado === 200 ? `${r.datos?.versiones?.length ?? 0} versiones` : (r.datos?.error ?? `HTTP ${r.estado}`))

    await pedir('/api/logout', { metodo: 'POST', cookie: galleta })
  }
}

process.exit(inf.resumen() ? 0 : 1)
