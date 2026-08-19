/**
 * Datos corporativos de MUNDO IMPORTACIONES S.A.S.
 *
 * IMPORTANTE PARA QUIEN EDITE ESTE ARCHIVO:
 * Todo lo que hay aquí proviene del material entregado por la empresa.
 * No se han añadido años de experiencia, número de clientes, certificaciones,
 * marcas aliadas, países de origen, horarios ni precios porque esa información
 * no fue suministrada. Si más adelante se confirma, añádela aquí.
 */

export const COMPANY = {
  legalName: 'MUNDO IMPORTACIONES S.A.S.',
  shortName: 'Mundo Importaciones',
  tagline: 'Todo lo que tu taller, fábrica o emprendimiento necesita.',
  description:
    'Importamos y distribuimos insumos de confección, calzado, marroquinería y repuestos para máquinas.',
  longDescription:
    'Importamos y distribuimos insumos de confección, calzado, marroquinería y repuestos para máquinas. Todo lo que tu taller, fábrica o emprendimiento necesita, ofreciendo variedad, disponibilidad y atención cercana para negocios, talleres y emprendedores.',
}

export const ADDRESS = {
  street: 'CLL 47 43-85 PISO 2',
  area: 'Centro de Medellín',
  reference: 'Por las Torres de Bomboná',
  city: 'Medellín',
  region: 'Antioquia',
  country: 'Colombia',
  countryCode: 'CO',
  /** Cadena completa, usada en el enlace de Google Maps y en Schema.org */
  full: 'CLL 47 43-85 PISO 2, Centro de Medellín, Medellín, Antioquia, Colombia',
}

/** Consulta usada en Google Maps. No se usan coordenadas porque no fueron suministradas. */
const MAPS_QUERY = encodeURIComponent('Calle 47 # 43-85, Centro, Medellín, Antioquia, Colombia')

export const MAPS = {
  /** Iframe sin API key: funciona con la dirección textual. */
  embed: `https://www.google.com/maps?q=${MAPS_QUERY}&hl=es&z=17&output=embed`,
  /** Abre la ficha en Google Maps. */
  view: `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`,
  /** Inicia la navegación paso a paso. */
  directions: `https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`,
}

export const PHONES = [
  { display: '350 276 8542', tel: '+573502768542', wa: '573502768542' },
  { display: '305 391 9202', tel: '+573053919202', wa: '573053919202' },
]

/** Línea usada por defecto en los CTA principales. */
export const PRIMARY_PHONE = PHONES[0]

export const SOCIALS = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: 'Mundo_importaciones__',
    url: 'https://www.instagram.com/mundo_importaciones__/',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    handle: '@Mundo_importacioness',
    url: 'https://www.tiktok.com/@mundo_importacioness',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'MUNDO IMPORTACIONES SAS',
    // La empresa entregó el nombre de la página, no su URL directa. Este enlace
    // lleva a la búsqueda de ese nombre en Facebook. Sustitúyelo por la URL real
    // (p. ej. https://www.facebook.com/<pagina>) cuando la tengas.
    url: 'https://www.facebook.com/search/top?q=MUNDO%20IMPORTACIONES%20SAS',
  },
]

const WA_BASE = 'https://wa.me/'

/**
 * Construye un enlace de WhatsApp con mensaje prellenado.
 * @param {string} message  Texto del mensaje.
 * @param {string} [wa]     Número en formato internacional sin '+'.
 */
export function waLink(message, wa = PRIMARY_PHONE.wa) {
  return `${WA_BASE}${wa}?text=${encodeURIComponent(message)}`
}

export const WA_MESSAGES = {
  quote: 'Hola, quiero solicitar una cotización de insumos. Me gustaría conocer disponibilidad y condiciones.',
  general: 'Hola, vengo de la página web de Mundo Importaciones y quisiera más información.',
  location: 'Hola, quisiera confirmar la ubicación y cómo llegar al punto de venta.',
  product: (name) => `Hola, quiero consultar disponibilidad de: ${name}.`,
  category: (name) => `Hola, quiero información sobre la línea de ${name}.`,
}

/** Enlaces de la navegación principal. */
export const NAV_LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#productos', label: 'Productos' },
  { href: '#soluciones', label: 'Soluciones' },
  { href: '#contacto', label: 'Contacto' },
]

export const SITE = {
  url: 'https://mundoimportaciones.vercel.app',
  title: 'Mundo Importaciones S.A.S. | Insumos de confección, calzado y marroquinería en Medellín',
  description:
    'Importamos y distribuimos insumos de confección, calzado, marroquinería y repuestos para máquinas en el Centro de Medellín. Cintas, elásticos, carnaza, lámparas y máquinas cortadoras.',
}
