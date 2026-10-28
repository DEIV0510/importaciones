/**
 * Fachada del almacén: GitHub en producción, disco local en desarrollo.
 *
 * El panel llama siempre a estas funciones, así que el mismo código se prueba
 * en local sin tocar el repositorio real y sin necesitar un token.
 */
import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { ErrorHttp } from './auth.js'
import * as git from './store.js'

const ejecutar = promisify(execFile)
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const enGitHub = () => git.usaGitHub()

/** ¿Estamos en el servidor de Vercel y no en una máquina de desarrollo? */
const enServidor = () => Boolean(process.env.VERCEL)

/**
 * El modo local escribe en el disco, y eso solo tiene sentido desarrollando.
 * El sistema de archivos de Vercel es de solo lectura y además efímero: sin
 * GITHUB_TOKEN no hay dónde guardar, así que conviene decirlo con claridad en
 * lugar de dejar que falle al escribir con un error que no explica nada.
 */
function exigirAlmacen() {
  if (!enGitHub() && enServidor()) {
    throw new ErrorHttp(
      503,
      'Falta GITHUB_TOKEN en el servidor. El contenido vive en el repositorio, ' +
        'así que sin ese token el panel no puede ni leerlo ni publicar. ' +
        'Añádelo en Vercel → Settings → Environment Variables.'
    )
  }
}

/** Evita que una ruta manipulada escriba fuera del proyecto. */
function rutaSegura(ruta) {
  if (typeof ruta !== 'string' || !ruta) throw new ErrorHttp(400, 'Ruta vacía.')
  if (ruta.includes('..') || ruta.startsWith('/') || /^[a-z]:/i.test(ruta)) {
    throw new ErrorHttp(400, `Ruta no permitida: ${ruta}`)
  }
  if (!/^(src\/content\/|public\/img\/)/.test(ruta)) {
    throw new ErrorHttp(400, `Solo se puede escribir en src/content/ y public/img/: ${ruta}`)
  }
  const absoluta = resolve(RAIZ, ruta)
  if (!absoluta.startsWith(RAIZ)) throw new ErrorHttp(400, 'Ruta fuera del proyecto.')
  return absoluta
}

export async function leer(ruta, ref) {
  exigirAlmacen()
  if (enGitHub()) return git.leerArchivo(ruta, ref)
  return fs.readFile(rutaSegura(ruta), 'utf8')
}

export async function escribir(archivos, mensaje, autor, shaEsperado) {
  exigirAlmacen()
  archivos.forEach((a) => rutaSegura(a.ruta))

  if (enGitHub()) return git.escribirArchivos(archivos, mensaje, autor, shaEsperado)

  // El mismo control de concurrencia en local, para que el comportamiento
  // sea idéntico en los dos modos y se pueda probar sin tocar el repositorio.
  if (shaEsperado) {
    const actual = await sha()
    if (actual !== 'local' && shaEsperado !== actual) {
      throw new ErrorHttp(
        409,
        'El contenido cambió desde que abriste el panel. Recarga para no perder lo que publicó la otra persona.'
      )
    }
  }

  for (const a of archivos) {
    const destino = rutaSegura(a.ruta)
    await fs.mkdir(dirname(destino), { recursive: true })
    await fs.writeFile(destino, a.binario ? Buffer.from(a.contenido, 'base64') : a.contenido)
  }
  return { sha: 'local', archivos: archivos.map((a) => a.ruta), local: true }
}

export async function borrar(rutas, mensaje, autor) {
  exigirAlmacen()
  rutas.forEach(rutaSegura)
  if (enGitHub()) return git.borrarArchivos(rutas, mensaje, autor)
  for (const ruta of rutas) await fs.rm(rutaSegura(ruta), { force: true })
  return { sha: 'local', local: true }
}

export async function sha() {
  if (enGitHub()) return git.shaActual()
  try {
    const { stdout } = await ejecutar('git', ['rev-parse', 'HEAD'], { cwd: RAIZ })
    return stdout.trim()
  } catch {
    return 'local'
  }
}

export async function historial(ruta, limite = 30) {
  exigirAlmacen()
  if (enGitHub()) return git.historial(ruta, limite)
  try {
    const { stdout } = await ejecutar(
      'git',
      ['log', `-${limite}`, '--format=%H%x1f%aI%x1f%an%x1f%s', '--', ruta],
      { cwd: RAIZ }
    )
    return stdout
      .split('\n')
      .filter(Boolean)
      .map((linea) => {
        const [sha, fecha, autor, mensaje] = linea.split('\x1f')
        return { sha, fecha, autor, mensaje }
      })
  } catch {
    return []
  }
}

/** Lee un archivo tal y como estaba en un commit concreto. */
export async function leerEnCommit(ruta, ref) {
  if (enGitHub()) return git.leerArchivo(ruta, ref)
  const { stdout } = await ejecutar('git', ['show', `${ref}:${ruta}`], {
    cwd: RAIZ,
    maxBuffer: 10 * 1024 * 1024,
  })
  return stdout
}

export const RUTA_RAIZ = RAIZ
export const rutaDeContenido = (archivo) => join('src', 'content', archivo).replace(/\\/g, '/')
