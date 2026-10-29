/**
 * Convierte el contenido editable (JSON) en el modelo que consumen los
 * componentes públicos.
 *
 * Es una función pura: la misma entrada da la misma salida y no toca el DOM.
 * Gracias a eso el panel puede pasarle un borrador y previsualizar el sitio
 * real sin duplicar un solo componente.
 */

import { formatearPrecio } from './formato'

const WA_BASE = 'https://wa.me/'

/** Sustituye marcadores tipo {producto} sin ejecutar nada. */
function plantilla(texto, valores) {
  return String(texto ?? '').replace(/\{(\w+)\}/g, (m, clave) =>
    Object.prototype.hasOwnProperty.call(valores, clave) ? valores[clave] : m
  )
}

export function derive(site, categorias, productos) {
  const telefonos = (site.contacto?.telefonos ?? []).filter((t) => t.wa)

  const PHONES = telefonos.map((t) => ({
    id: t.id,
    display: t.display,
    tel: `+${t.wa}`,
    wa: t.wa,
  }))

  const PRIMARY_PHONE = PHONES[0] ?? { id: 'none', display: '', tel: '', wa: '' }

  const u = site.ubicacion ?? {}
  const consulta = encodeURIComponent(u.consultaMapa || '')

  const ADDRESS = {
    street: u.calle ?? '',
    area: u.sector ?? '',
    reference: u.referencia ?? '',
    city: u.ciudad ?? '',
    region: u.region ?? '',
    country: u.pais ?? '',
    countryCode: u.codigoPais ?? '',
    full: [u.calle, u.sector, u.ciudad, u.region, u.pais].filter(Boolean).join(', '),
  }

  const MAPS = {
    embed: `https://www.google.com/maps?q=${consulta}&hl=es&z=17&output=embed`,
    view: `https://www.google.com/maps/search/?api=1&query=${consulta}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${consulta}`,
  }

  const waLink = (message, wa = PRIMARY_PHONE.wa) =>
    `${WA_BASE}${wa}?text=${encodeURIComponent(message ?? '')}`

  const m = site.contacto?.mensajes ?? {}
  const WA_MESSAGES = {
    quote: m.cotizacion ?? '',
    general: m.general ?? '',
    location: m.ubicacion ?? '',
    product: (nombre) => plantilla(m.producto, { producto: nombre }),
    category: (nombre) => plantilla(m.categoria, { categoria: nombre }),
  }

  const SOCIALS = (site.contacto?.redes ?? []).filter((r) => r.visible !== false)

  const NAV_LINKS = (site.navegacion?.enlaces ?? []).filter((l) => l.visible !== false)

  // ----- Catálogo -----
  const orden = (a, b) => (a.orden ?? 0) - (b.orden ?? 0)

  const CATEGORIES = [...(categorias ?? [])]
    .filter((c) => c.visible !== false)
    .sort(orden)
    .map((c) => ({
      id: c.id,
      name: c.nombre,
      short: c.corto,
      description: c.descripcion,
      image: c.imagen || null,
    }))

  const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

  const PRODUCTS = [...(productos ?? [])]
    .filter((p) => p.visible !== false)
    .sort(orden)
    .map((p) => ({
      id: p.id,
      name: p.nombre,
      categories: (p.categorias ?? []).filter((id) => CATEGORY_BY_ID[id]),
      image: p.imagen || null,
      gallery: p.galeria?.length ? p.galeria : null,
      description: p.descripcion || null,
      // Sin precio válido no se muestra nada: ni «$0» ni un hueco.
      priceLabel: formatearPrecio(p.precio) || null,
      priceUnit: formatearPrecio(p.precio) && p.precioUnidad ? p.precioUnidad : null,
      featured: Boolean(p.destacado),
    }))

  const productsByCategory = (categoryId) =>
    !categoryId || categoryId === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.categories.includes(categoryId))

  const countByCategory = (categoryId) =>
    PRODUCTS.filter((p) => p.categories.includes(categoryId)).length

  // ----- Identidad -----
  const i = site.identidad ?? {}
  const COMPANY = {
    legalName: i.nombreLegal ?? '',
    shortName: i.nombreCorto ?? '',
    tagline: i.lema ?? '',
    description: i.descripcion ?? '',
    longDescription: i.descripcionLarga ?? '',
    logo: i.logo || 'logo',
    loadingText: i.cargaTexto ?? '',
  }

  const seo = site.seo ?? {}
  const SITE = {
    url: seo.url ?? '',
    title: seo.titulo ?? '',
    description: seo.descripcion ?? '',
    ogImage: seo.ogImagen ?? '',
    index: seo.indexar !== false,
  }

  /** Secciones visibles, en el orden guardado. */
  const seccionesVisibles = (site.secciones ?? [])
    .filter((s) => s.visible !== false)
    .map((s) => s.id)

  const visible = (id) => seccionesVisibles.includes(id)

  return {
    raw: site,
    COMPANY,
    ADDRESS,
    MAPS,
    PHONES,
    PRIMARY_PHONE,
    SOCIALS,
    NAV_LINKS,
    WA_MESSAGES,
    SITE,
    waLink,
    CATEGORIES,
    CATEGORY_BY_ID,
    PRODUCTS,
    productsByCategory,
    countByCategory,
    nav: site.navegacion ?? {},
    hero: site.hero ?? {},
    marquesina: site.marquesina ?? {},
    categoriasSeccion: site.categoriasSeccion ?? {},
    catalogoSeccion: site.catalogoSeccion ?? {},
    soluciones: site.soluciones ?? {},
    contactoSeccion: site.contactoSeccion ?? {},
    ubicacion: u,
    ctaFinal: site.ctaFinal ?? {},
    pie: site.pie ?? {},
    tema: site.tema ?? {},
    flotante: site.contacto?.flotante ?? { visible: true },
    secciones: seccionesVisibles,
    visible,
  }
}
