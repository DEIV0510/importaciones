import siteJson from './site.json'
import categoriesJson from './categories.json'
import productsJson from './products.json'

/**
 * Contenido publicado, incrustado en el bundle.
 *
 * El sitio público no hace ninguna petición para pintarse: el contenido viaja
 * en el JavaScript, igual que antes estaba escrito en los componentes. Por eso
 * publicar implica un redespliegue — y por eso la página sigue siendo
 * instantánea y sin parpadeos.
 */
export const CONTENIDO_PUBLICADO = {
  site: siteJson,
  categories: categoriesJson,
  products: productsJson,
}

/** Escribe el tema en :root para que las utilidades de Tailwind lo tomen. */
export function aplicarTema(tema, destino) {
  const root = destino ?? document.documentElement
  for (const [clave, valor] of Object.entries(tema?.colores ?? {})) {
    if (typeof valor === 'string' && /^#[0-9a-f]{3,8}$/i.test(valor)) {
      root.style.setProperty(`--color-${clave}`, valor)
    }
  }
  const fuentes = tema?.tipografia ?? {}
  if (fuentes.display) {
    root.style.setProperty(
      '--font-display',
      `"${fuentes.display}", ui-sans-serif, system-ui, "Segoe UI", sans-serif`
    )
  }
  if (fuentes.texto) {
    root.style.setProperty(
      '--font-sans',
      `"${fuentes.texto}", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`
    )
  }
}
