/**
 * GET  /api/history        — últimas publicaciones.
 * GET  /api/history?sha=X  — contenido tal y como estaba en esa publicación.
 * POST /api/history        — restaura una versión anterior.
 *
 * El historial no se inventa: es el registro de commits del repositorio. Por
 * eso recoge fecha, autor y qué cambió sin que haya que mantener una tabla
 * aparte, y por eso no puede manipularse desde el panel.
 *
 * Restaurar no borra nada: crea una publicación nueva con el contenido
 * antiguo, así que siempre se puede deshacer la restauración.
 */
import { ErrorHttp, exigirAdmin } from './_lib/auth.js'
import { json, leerCuerpo, manejar, soloMetodos } from './_lib/http.js'
import { escribir, historial, leer, leerEnCommit } from './_lib/repo.js'
import {
  validarCategorias, validarMedios, validarProductos, validarSite,
} from '../src/content/validacion.js'

const ARCHIVOS = {
  site: 'src/content/site.json',
  categories: 'src/content/categories.json',
  products: 'src/content/products.json',
  media: 'src/content/media.json',
}

const esSha = (v) => typeof v === 'string' && /^[0-9a-f]{7,40}$/i.test(v)

async function contenidoEn(ref) {
  const entradas = await Promise.all(
    Object.entries(ARCHIVOS).map(async ([clave, ruta]) => {
      try {
        return [clave, JSON.parse(await leerEnCommit(ruta, ref))]
      } catch {
        // Un commit anterior a que existiera el archivo.
        return [clave, null]
      }
    })
  )
  return Object.fromEntries(entradas)
}

export default manejar(async (req, res) => {
  soloMetodos(req, ['GET', 'POST'])
  const sesion = exigirAdmin(req)

  // ------------------------------------------------------------------ leer
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://local')
    const sha = url.searchParams.get('sha')

    if (sha) {
      if (!esSha(sha)) throw new ErrorHttp(400, 'Identificador de versión no válido.')
      json(res, 200, { sha, contenido: await contenidoEn(sha) })
      return
    }

    json(res, 200, { versiones: await historial('src/content', 30) })
    return
  }

  // -------------------------------------------------------------- restaurar
  const { sha } = await leerCuerpo(req)
  if (!esSha(sha)) throw new ErrorHttp(400, 'Identificador de versión no válido.')

  const antiguo = await contenidoEn(sha)
  if (!antiguo.site) {
    throw new ErrorHttp(404, 'Esa versión no contiene contenido que restaurar.')
  }

  // Se revalida: una versión antigua puede no cumplir las reglas actuales.
  const categories = validarCategorias(antiguo.categories ?? [])
  const products = validarProductos(antiguo.products ?? [], new Set(categories.map((c) => c.id)))
  const site = validarSite(antiguo.site)

  // La biblioteca de imágenes NO se restaura: es la de hoy. Restaurar la lista
  // antigua volvería a anunciar fotos ya borradas (que saldrían rotas) y
  // olvidaría las subidas después.
  const media = validarMedios(JSON.parse(await leer(ARCHIVOS.media)))
  const disponibles = new Set(media.map((m) => m.id))
  const usadas = [
    site.identidad.logo,
    ...site.hero.vitrina.map((v) => v.imagen),
    ...site.ctaFinal.imagenes,
    ...categories.map((c) => c.imagen),
    ...products.flatMap((p) => [p.imagen, ...(p.galeria ?? [])]),
  ].filter(Boolean)
  const borradas = [...new Set(usadas.filter((id) => !disponibles.has(id)))]
  if (borradas.length) {
    throw new ErrorHttp(
      422,
      `Esa versión usa imágenes que ya se borraron: ${borradas.join(', ')}. ` +
        'Súbelas otra vez con el mismo nombre y vuelve a restaurar.'
    )
  }

  site.actualizado = new Date().toISOString()
  site.actualizadoPor = sesion.u

  const resultado = await escribir(
    [
      { ruta: ARCHIVOS.site, contenido: JSON.stringify(site, null, 2) + '\n' },
      { ruta: ARCHIVOS.categories, contenido: JSON.stringify(categories, null, 2) + '\n' },
      { ruta: ARCHIVOS.products, contenido: JSON.stringify(products, null, 2) + '\n' },
    ],
    `Contenido: restaura la versión ${sha.slice(0, 7)}\n\nRestaurado por ${sesion.u} desde el panel.`,
    { nombre: sesion.u, email: process.env.GIT_AUTHOR_EMAIL || 'panel@mundoimportaciones.local' }
  )

  json(res, 200, { ok: true, sha: resultado.sha, local: Boolean(resultado.local) })
})
