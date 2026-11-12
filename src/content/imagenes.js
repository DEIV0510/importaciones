/**
 * Direcciones de las imágenes de la biblioteca.
 *
 * Llevan una versión (?v=…) por dos motivos, los dos reales:
 *
 * 1. Las imágenes se sirven con caché larga, y Vercel aplica esa cabecera
 *    también a los 404. Si el navegador pedía una foto recién subida antes de
 *    que terminara el despliegue, guardaba «no existe» durante 30 días: la foto
 *    ya estaba publicada, pero en ese navegador no cargaba nunca.
 * 2. Reemplazar una foto (subirla con el mismo nombre) no cambiaba su dirección,
 *    así que los visitantes seguían viendo la vieja.
 *
 * La versión es la huella que calcula el servidor al subir (`version`); las
 * imágenes anteriores a ese cambio usan su tamaño en bytes.
 */

/** Versión de cada imagen, por identificador. */
export function versionesDe(medios) {
  return Object.fromEntries(
    (medios ?? []).map((m) => [m.id, m.version || (m.bytes ? String(m.bytes) : '')])
  )
}

/**
 * El archivo que de verdad existe para esa imagen.
 *
 * No todas tienen todas las variantes: 22 fotos originales no tienen recorte
 * para la portada («hero»), y las subidas por el panel lo tienen solo en WebP.
 * Si la vitrina de la portada pedía una de esas, salía rota. Ahora se usa la
 * foto del catálogo en su lugar.
 *
 * @param {{variantes?:string[]}|undefined} medio  Entrada de la biblioteca.
 * @param {string} archivo  Variante y extensión pedidas (p. ej. 'hero.webp').
 */
export function archivoDisponible(medio, archivo) {
  if (!medio) return archivo
  const [variante, ext] = archivo.split('.')
  const tiene = (v) => (medio.variantes ?? []).includes(v)
  // El respaldo PNG de la portada solo existe en algunas originales: el del
  // catálogo existe siempre.
  if (variante === 'hero' && ext === 'png') return 'fallback.png'
  if (tiene(variante)) return archivo
  return ext === 'png' ? 'fallback.png' : 'lg.webp'
}

/**
 * @param {string} id       Identificador de la imagen (p. ej. 'cinta-faya-clasica').
 * @param {string} archivo  Variante y extensión (p. ej. 'sm.webp', 'fallback.png').
 * @param {string} [version]
 * @param {Record<string,string>} [extra]  Parámetros adicionales de la consulta.
 */
export function rutaImagen(id, archivo, version, extra = {}) {
  const consulta = new URLSearchParams()
  if (version) consulta.set('v', version)
  for (const [clave, valor] of Object.entries(extra)) consulta.set(clave, valor)
  const q = consulta.toString()
  return `/img/${id}-${archivo}${q ? `?${q}` : ''}`
}
