/**
 * POST   /api/media  — sube una imagen (sus variantes ya optimizadas).
 * DELETE /api/media  — borra una imagen que nadie esté usando.
 *
 * El navegador redimensiona y convierte a WebP antes de subir, así que aquí
 * solo llegan archivos pequeños. Aun así el servidor NO se fía: comprueba los
 * bytes mágicos de cada archivo. Que la extensión diga .webp no significa que
 * el contenido lo sea, y una imagen es lo único que debe poder entrar.
 */
import { ErrorHttp, exigirAdmin } from './_lib/auth.js'
import { json, leerCuerpo, manejar, soloMetodos } from './_lib/http.js'
import { borrar, escribir, leer } from './_lib/repo.js'
import { ErrorValidacion, slug, texto, usosDeImagen } from '../src/content/validacion.js'

/** Variantes que el sitio sabe consumir. */
const VARIANTES = {
  sm: { ext: 'webp', maxBytes: 400 * 1024 },
  lg: { ext: 'webp', maxBytes: 900 * 1024 },
  fallback: { ext: 'png', maxBytes: 1200 * 1024 },
  hero: { ext: 'webp', maxBytes: 900 * 1024 },
}

const FIRMAS = {
  webp: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  png: (b) => b.length > 8 && b.toString('hex', 0, 8) === '89504e470d0a1a0a',
}

function decodificar(base64, variante, nombre) {
  const bruto = String(base64 ?? '').replace(/^data:[^;]+;base64,/, '')
  if (!/^[A-Za-z0-9+/]+=*$/.test(bruto)) {
    throw new ErrorHttp(422, `La variante «${variante}» no es base64 válido.`)
  }
  const buf = Buffer.from(bruto, 'base64')
  const spec = VARIANTES[variante]

  if (!buf.length) throw new ErrorHttp(422, `La variante «${variante}» llegó vacía.`)
  if (buf.length > spec.maxBytes) {
    throw new ErrorHttp(
      413,
      `«${nombre}-${variante}.${spec.ext}» pesa ${Math.round(buf.length / 1024)} KB y el máximo es ${Math.round(spec.maxBytes / 1024)} KB.`
    )
  }
  if (!FIRMAS[spec.ext](buf)) {
    throw new ErrorHttp(
      422,
      `«${variante}» no es un ${spec.ext.toUpperCase()} real. Solo se aceptan imágenes.`
    )
  }
  return { bruto, bytes: buf.length }
}

export default manejar(async (req, res) => {
  soloMetodos(req, ['POST', 'DELETE'])
  const sesion = exigirAdmin(req)
  const cuerpo = await leerCuerpo(req)
  const autor = {
    nombre: sesion.u,
    email: process.env.GIT_AUTHOR_EMAIL || 'panel@mundoimportaciones.local',
  }

  const medios = JSON.parse(await leer('src/content/media.json'))

  // ------------------------------------------------------------------ subir
  if (req.method === 'POST') {
    let id, alt
    try {
      id = slug(cuerpo.id, { campo: 'nombre de la imagen' })
      alt = texto(cuerpo.alt, { max: 160, campo: 'texto alternativo' })
    } catch (err) {
      if (err instanceof ErrorValidacion) throw new ErrorHttp(422, err.message)
      throw err
    }

    const entrantes = cuerpo.variantes ?? {}
    const nombres = Object.keys(entrantes).filter((v) => VARIANTES[v])
    if (!nombres.length) {
      throw new ErrorHttp(422, 'No llegó ninguna variante de imagen.')
    }
    if (!nombres.includes('sm') || !nombres.includes('lg')) {
      throw new ErrorHttp(422, 'Faltan las variantes obligatorias: sm y lg.')
    }

    const archivos = []
    let bytes = 0
    for (const v of nombres) {
      const { bruto, bytes: n } = decodificar(entrantes[v], v, id)
      bytes += n
      archivos.push({
        ruta: `public/img/${id}-${v}.${VARIANTES[v].ext}`,
        contenido: bruto,
        binario: true,
      })
    }

    const previo = medios.find((m) => m.id === id)
    const actualizados = previo
      ? medios.map((m) => (m.id === id ? { ...m, alt, variantes: nombres, bytes, origen: 'panel' } : m))
      : [...medios, { id, alt, variantes: nombres, bytes, origen: 'panel' }]

    actualizados.sort((a, b) => a.id.localeCompare(b.id))
    archivos.push({
      ruta: 'src/content/media.json',
      contenido: JSON.stringify(actualizados, null, 2) + '\n',
    })

    const resultado = await escribir(
      archivos,
      `Medios: ${previo ? 'reemplaza' : 'añade'} «${id}»\n\nSubido por ${sesion.u} desde el panel.`,
      autor
    )

    json(res, 200, {
      ok: true,
      reemplazo: Boolean(previo),
      medio: actualizados.find((m) => m.id === id),
      medios: actualizados,
      sha: resultado.sha,
      local: Boolean(resultado.local),
    })
    return
  }

  // ----------------------------------------------------------------- borrar
  const id = slug(cuerpo.id, { campo: 'imagen' })
  const medio = medios.find((m) => m.id === id)
  if (!medio) throw new ErrorHttp(404, `No existe la imagen «${id}».`)

  const [site, categorias, productos] = await Promise.all([
    leer('src/content/site.json').then(JSON.parse),
    leer('src/content/categories.json').then(JSON.parse),
    leer('src/content/products.json').then(JSON.parse),
  ])

  const usos = usosDeImagen(id, { site, categorias, productos })
  if (usos.length) {
    throw new ErrorHttp(
      409,
      `No se puede borrar: la usa ${usos.slice(0, 3).join(', ')}${usos.length > 3 ? ` y ${usos.length - 3} sitio(s) más` : ''}.`
    )
  }

  const restantes = medios.filter((m) => m.id !== id)
  const rutas = (medio.variantes ?? []).map(
    (v) => `public/img/${id}-${v}.${VARIANTES[v]?.ext ?? 'webp'}`
  )

  await borrar(rutas, `Medios: borra «${id}»\n\nBorrado por ${sesion.u} desde el panel.`, autor)
  const resultado = await escribir(
    [{ ruta: 'src/content/media.json', contenido: JSON.stringify(restantes, null, 2) + '\n' }],
    `Medios: actualiza la biblioteca tras borrar «${id}»`,
    autor
  )

  json(res, 200, { ok: true, medios: restantes, sha: resultado.sha, local: Boolean(resultado.local) })
})
