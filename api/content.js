/**
 * GET  /api/content  — contenido publicado + sha vigente.
 * PUT  /api/content  — valida y publica en un único commit.
 *
 * El `sha` es la pieza que evita pisarse entre administradores: el panel lo
 * recibe al cargar y lo devuelve al publicar. Si entretanto alguien publicó,
 * el sha ya no coincide y la petición se rechaza con un mensaje claro en vez
 * de sobrescribir su trabajo en silencio.
 */
import { ErrorHttp, exigirAdmin } from './_lib/auth.js'
import { json, leerCuerpo, manejar, soloMetodos } from './_lib/http.js'
import { escribir, leer, sha as shaActual } from './_lib/repo.js'
import {
  ErrorValidacion, validarCategorias, validarMedios, validarProductos, validarSite,
} from '../src/content/validacion.js'

const ARCHIVOS = {
  site: 'src/content/site.json',
  categories: 'src/content/categories.json',
  products: 'src/content/products.json',
  media: 'src/content/media.json',
}

async function leerTodo() {
  const entradas = await Promise.all(
    Object.entries(ARCHIVOS).map(async ([clave, ruta]) => [clave, JSON.parse(await leer(ruta))])
  )
  return Object.fromEntries(entradas)
}

export default manejar(async (req, res) => {
  soloMetodos(req, ['GET', 'PUT'])

  // ------------------------------------------------------------------ leer
  if (req.method === 'GET') {
    exigirAdmin(req)
    const contenido = await leerTodo()
    json(res, 200, { ...contenido, sha: await shaActual() })
    return
  }

  // --------------------------------------------------------------- publicar
  const sesion = exigirAdmin(req)
  const cuerpo = await leerCuerpo(req)

  let site, categories, products, media
  try {
    categories = validarCategorias(cuerpo.categories)
    const ids = new Set(categories.map((c) => c.id))
    products = validarProductos(cuerpo.products, ids)
    site = validarSite(cuerpo.site)
    media = validarMedios(cuerpo.media)
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      const e = new ErrorHttp(422, err.message)
      e.campo = err.campo
      throw e
    }
    throw err
  }

  // Comprueba que las imágenes referenciadas existan en la biblioteca.
  const disponibles = new Set(media.map((m) => m.id))
  const faltan = new Set()
  const revisar = (id) => { if (id && !disponibles.has(id)) faltan.add(id) }
  revisar(site.identidad.logo)
  site.hero.vitrina.forEach((v) => revisar(v.imagen))
  site.ctaFinal.imagenes.forEach(revisar)
  categories.forEach((c) => revisar(c.imagen))
  products.forEach((p) => { revisar(p.imagen); (p.galeria ?? []).forEach(revisar) })
  if (faltan.size) {
    throw new ErrorHttp(422, `Estas imágenes no están en la biblioteca: ${[...faltan].join(', ')}.`)
  }

  site.actualizado = new Date().toISOString()
  site.actualizadoPor = sesion.u

  const nota = String(cuerpo.mensaje ?? '').trim().slice(0, 100)
  const mensaje = [
    `Contenido: ${nota || 'actualización desde el panel'}`,
    '',
    `Publicado por ${sesion.u} desde el panel de administración.`,
  ].join('\n')

  const resultado = await escribir(
    [
      { ruta: ARCHIVOS.site, contenido: JSON.stringify(site, null, 2) + '\n' },
      { ruta: ARCHIVOS.categories, contenido: JSON.stringify(categories, null, 2) + '\n' },
      { ruta: ARCHIVOS.products, contenido: JSON.stringify(products, null, 2) + '\n' },
      { ruta: ARCHIVOS.media, contenido: JSON.stringify(media, null, 2) + '\n' },
    ],
    mensaje,
    { nombre: sesion.u, email: process.env.GIT_AUTHOR_EMAIL || 'panel@mundoimportaciones.local' },
    cuerpo.sha
  )

  json(res, 200, {
    ok: true,
    sha: resultado.sha,
    local: Boolean(resultado.local),
    actualizado: site.actualizado,
  })
})

export const ARCHIVOS_CONTENIDO = ARCHIVOS
