import siteJson from './site.json'
import categoriesJson from './categories.json'
import productsJson from './products.json'
import mediaJson from './media.json'

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
  // Solo para la versión de cada imagen en su dirección (?v=…)
  media: mediaJson,
}

// Solo en desarrollo: publicar o subir una foto reescribe estos JSON, y Vite
// recargaba entonces todas las pestañas abiertas; el panel perdía lo que tenía
// abierto. Aceptando el cambio aquí no se recarga nada: las páginas que se
// abran después ya leen el contenido nuevo.
if (import.meta.hot) import.meta.hot.accept(() => {})

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
