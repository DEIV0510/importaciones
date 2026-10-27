/**
 * Almacén de contenido: el propio repositorio.
 *
 * Publicar = un commit. Eso da gratis el historial, la autoría y la
 * restauración que pedía el encargo, sin montar una base de datos.
 *
 * Se escribe con la Git Data API (blob → árbol → commit → ref) y no con la
 * API de contenidos archivo por archivo: así varios archivos entran en UN
 * solo commit. Si algo falla a mitad, no queda una publicación parcial.
 *
 * En desarrollo, sin GITHUB_TOKEN, escribe en el disco local. El panel se
 * puede probar entero sin tocar el repositorio de producción.
 */
import { ErrorHttp } from './auth.js'

const API = 'https://api.github.com'

export function configGit() {
  return {
    token: process.env.GITHUB_TOKEN || '',
    repo: process.env.GITHUB_REPO || 'DEIV0510/importaciones',
    rama: process.env.GITHUB_BRANCH || 'main',
  }
}

export const usaGitHub = () => Boolean(configGit().token)

async function gh(ruta, opciones = {}) {
  const { token, repo } = configGit()
  const res = await fetch(`${API}/repos/${repo}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mundo-importaciones-panel',
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...opciones.headers,
    },
  })

  if (!res.ok) {
    const texto = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new ErrorHttp(502, 'GitHub rechazó el token. Revisa GITHUB_TOKEN y sus permisos.')
    }
    if (res.status === 409) {
      throw new ErrorHttp(409, 'Alguien publicó antes que tú. Recarga el panel y repite el cambio.')
    }
    throw new ErrorHttp(502, `GitHub respondió ${res.status}: ${texto.slice(0, 200)}`)
  }
  return res.status === 204 ? null : res.json()
}

// ------------------------------------------------------------------ lectura

/** Lee un archivo del repositorio. `ref` puede ser una rama o un commit. */
export async function leerArchivo(ruta, ref) {
  const { rama } = configGit()
  const datos = await gh(`/contents/${encodeURI(ruta)}?ref=${encodeURIComponent(ref || rama)}`)
  if (Array.isArray(datos)) throw new ErrorHttp(400, `${ruta} es una carpeta.`)
  return Buffer.from(datos.content, 'base64').toString('utf8')
}

// ----------------------------------------------------------------- escritura

/**
 * Escribe varios archivos en un único commit.
 * @param {Array<{ruta:string, contenido:string, binario?:boolean}>} archivos
 * @param {string} mensaje
 * @param {{nombre:string, email:string}} autor
 * @param {string} [shaEsperado] Commit que el panel creía vigente; si cambió,
 *   se rechaza para no pisar el trabajo de otro administrador.
 */
export async function escribirArchivos(archivos, mensaje, autor, shaEsperado) {
  const { rama } = configGit()

  const ref = await gh(`/git/ref/heads/${encodeURIComponent(rama)}`)
  const shaBase = ref.object.sha

  if (shaEsperado && shaEsperado !== shaBase) {
    throw new ErrorHttp(
      409,
      'El contenido cambió desde que abriste el panel. Recarga para no perder lo que publicó la otra persona.'
    )
  }

  const commitBase = await gh(`/git/commits/${shaBase}`)

  // Un blob por archivo
  const blobs = []
  for (const a of archivos) {
    const blob = await gh('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: a.binario ? a.contenido : Buffer.from(a.contenido, 'utf8').toString('base64'),
        encoding: 'base64',
      }),
    })
    blobs.push({ path: a.ruta, mode: '100644', type: 'blob', sha: blob.sha })
  }

  const arbol = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: commitBase.tree.sha, tree: blobs }),
  })

  const commit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: mensaje,
      tree: arbol.sha,
      parents: [shaBase],
      author: { name: autor.nombre, email: autor.email, date: new Date().toISOString() },
    }),
  })

  await gh(`/git/refs/heads/${encodeURIComponent(rama)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return { sha: commit.sha, archivos: archivos.map((a) => a.ruta) }
}

/** Borra archivos en un único commit. */
export async function borrarArchivos(rutas, mensaje, autor) {
  const { rama } = configGit()
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(rama)}`)
  const shaBase = ref.object.sha
  const commitBase = await gh(`/git/commits/${shaBase}`)

  const arbol = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: commitBase.tree.sha,
      tree: rutas.map((ruta) => ({ path: ruta, mode: '100644', type: 'blob', sha: null })),
    }),
  })

  const commit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: mensaje,
      tree: arbol.sha,
      parents: [shaBase],
      author: { name: autor.nombre, email: autor.email, date: new Date().toISOString() },
    }),
  })

  await gh(`/git/refs/heads/${encodeURIComponent(rama)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return { sha: commit.sha }
}

// ----------------------------------------------------------------- historial

export async function shaActual() {
  const { rama } = configGit()
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(rama)}`)
  return ref.object.sha
}

export async function historial(ruta, limite = 30) {
  const { rama } = configGit()
  const commits = await gh(
    `/commits?path=${encodeURIComponent(ruta)}&sha=${encodeURIComponent(rama)}&per_page=${limite}`
  )
  return commits.map((c) => ({
    sha: c.sha,
    fecha: c.commit.author?.date ?? null,
    autor: c.commit.author?.name ?? 'desconocido',
    mensaje: (c.commit.message || '').split('\n')[0],
  }))
}
