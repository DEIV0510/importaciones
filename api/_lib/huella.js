/**
 * Huella del contenido publicado.
 *
 * La calculan dos sitios que deben coincidir: el servidor al publicar (sobre
 * los archivos que escribe) y la compilación del sitio (sobre los que
 * despliega, en /version.json). Cuando el sitio en vivo devuelve la misma
 * huella que dio la publicación, los cambios ya se ven: así el panel puede
 * decir «ya está en el sitio» en vez de «espera un minuto y recarga».
 *
 * Solo entran los textos (site, categories, products): subir una foto cambia
 * media.json, pero no lo que se acaba de publicar.
 */
import { createHash } from 'node:crypto'

export const ARCHIVOS_HUELLA = ['site', 'categories', 'products'].map((f) => `src/content/${f}.json`)

/** @param {string[]} textos  Contenido de los archivos, en el orden de ARCHIVOS_HUELLA. */
export function huellaContenido(textos) {
  const h = createHash('sha1')
  for (const t of textos) h.update(String(t).replace(/\r\n/g, '\n'))
  return h.digest('hex').slice(0, 12)
}
