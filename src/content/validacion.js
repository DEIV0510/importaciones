/**
 * Validación y saneado del contenido editable.
 *
 * Este archivo es la ÚNICA definición de qué es contenido válido. El panel lo
 * usa para avisar al instante y la función del servidor lo vuelve a aplicar
 * antes de publicar: lo que llegue del navegador nunca se considera de fiar.
 *
 * No depende del DOM ni de Node, por eso puede ejecutarse en ambos lados.
 */

export class ErrorValidacion extends Error {
  constructor(mensaje, campo) {
    super(mensaje)
    this.campo = campo
  }
}

const LIMITES = {
  textoCorto: 160,
  textoMedio: 400,
  textoLargo: 2000,
  url: 600,
  lista: 60,
}

/** Quita caracteres de control que no pintan nada y solo sirven para colar cosas. */
function limpiarSinRecortar(valor) {
  // eslint-disable-next-line no-control-regex
  return String(valor ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
}

function limpiar(valor) {
  return limpiarSinRecortar(valor).trim()
}

/**
 * @param {object} [opciones]
 * @param {boolean} [opciones.espacios]  Conserva los espacios de los extremos.
 *   Hace falta en las dos partes laterales del titular: ahí el autor decide
 *   dónde va el espacio alrededor de la palabra destacada, y recortarlo pega
 *   las palabras entre sí («taller,fábricao emprendimiento»).
 */
export function texto(
  valor,
  { max = LIMITES.textoMedio, campo = '', obligatorio = false, espacios = false } = {}
) {
  const limpio = espacios ? limpiarSinRecortar(valor) : limpiar(valor)
  if (obligatorio && !limpio) throw new ErrorValidacion('No puede quedar vacío.', campo)
  if (limpio.length > max) {
    throw new ErrorValidacion(`Máximo ${max} caracteres (van ${limpio.length}).`, campo)
  }
  return limpio
}

/**
 * Solo deja pasar esquemas seguros.
 *
 * Rechaza javascript:, data:, vbscript: y cualquier otro: son la vía clásica
 * para que un enlace administrable acabe ejecutando código en el navegador de
 * los visitantes.
 */
const ESQUEMAS = ['http:', 'https:', 'mailto:', 'tel:']

export function url(valor, { campo = '', obligatorio = false, permitirRelativa = true } = {}) {
  const limpio = limpiar(valor)
  if (!limpio) {
    if (obligatorio) throw new ErrorValidacion('Falta el enlace.', campo)
    return ''
  }
  if (limpio.length > LIMITES.url) throw new ErrorValidacion('El enlace es demasiado largo.', campo)

  // Anclas internas y rutas del propio sitio
  if (permitirRelativa && /^[#/](?![/\\])/.test(limpio)) {
    if (/[<>"'`\s]/.test(limpio)) throw new ErrorValidacion('El enlace tiene caracteres no válidos.', campo)
    return limpio
  }

  let analizada
  try {
    analizada = new URL(limpio)
  } catch {
    throw new ErrorValidacion('No parece un enlace válido.', campo)
  }
  if (!ESQUEMAS.includes(analizada.protocol)) {
    throw new ErrorValidacion(
      `Esquema no permitido (${analizada.protocol}). Usa http, https, mailto o tel.`,
      campo
    )
  }
  return analizada.toString()
}

export function color(valor, { campo = '' } = {}) {
  const limpio = limpiar(valor).toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(limpio)) {
    throw new ErrorValidacion('Usa un color en formato #rrggbb.', campo)
  }
  return limpio
}

export function slug(valor, { campo = '', obligatorio = true } = {}) {
  const limpio = limpiar(valor).toLowerCase()
  if (!limpio) {
    if (obligatorio) throw new ErrorValidacion('Falta el identificador.', campo)
    return ''
  }
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(limpio)) {
    throw new ErrorValidacion('Solo minúsculas, números y guiones.', campo)
  }
  return limpio
}

/** Teléfono colombiano en formato internacional sin el signo +. */
export function numeroWhatsapp(valor, { campo = '' } = {}) {
  const limpio = limpiar(valor).replace(/[\s()+-]/g, '')
  if (!/^\d{10,15}$/.test(limpio)) {
    throw new ErrorValidacion('Debe tener entre 10 y 15 dígitos, con indicativo de país.', campo)
  }
  return limpio
}

export function booleano(valor, porDefecto = true) {
  return typeof valor === 'boolean' ? valor : porDefecto
}

/** Tope del precio, en pesos. Evita un cero de más que lo vuelva absurdo. */
export const PRECIO_MAXIMO = 999_999_999

/**
 * Precio en pesos colombianos: un entero mayor que 0, o null si no hay precio.
 *
 * Un texto solo se acepta si son puras cifras. «12.000» no se interpreta: como
 * número daría 12, y un precio equivocado en silencio es peor que un error.
 */
export function precio(valor, { campo = '' } = {}) {
  if (valor === null || valor === undefined || valor === '') return null
  const n = typeof valor === 'number' ? valor : /^\d{1,9}$/.test(valor) ? Number(valor) : NaN
  if (!Number.isInteger(n) || n <= 0 || n > PRECIO_MAXIMO) {
    throw new ErrorValidacion(
      'El precio debe ser un número entero mayor que 0, en pesos y sin puntos ni comas.',
      campo
    )
  }
  return n
}

function lista(valor, campo) {
  if (!Array.isArray(valor)) throw new ErrorValidacion('Se esperaba una lista.', campo)
  if (valor.length > LIMITES.lista) {
    throw new ErrorValidacion(`Máximo ${LIMITES.lista} elementos.`, campo)
  }
  return valor
}

// ===========================================================================
//  site.json
// ===========================================================================

const ICONOS_VALIDOS = new Set([
  'Award', 'Box', 'Boxes', 'Briefcase', 'Building2', 'Clock', 'Cog', 'Factory',
  'Footprints', 'Gem', 'Handshake', 'Hammer', 'Layers', 'Lightbulb', 'MapPin',
  'Package', 'PackageCheck', 'PackageSearch', 'Palette', 'Phone', 'Rocket',
  'Ruler', 'Scissors', 'Shapes', 'Shirt', 'ShoppingBag', 'Sparkles', 'Store',
  'Truck', 'Users', 'Wrench', 'Zap',
])

const FORMAS_VITRINA = new Set(['destacada', 'vertical', 'ancha'])
const FUENTES = new Set(['Manrope', 'Inter', 'Montserrat'])
const SECCIONES = new Set(['hero', 'marquesina', 'productos', 'soluciones', 'ubicacion', 'contacto', 'ctaFinal'])

/**
 * Anclas que publica cada sección.
 *
 * No coinciden siempre con el id: la portada se llama «hero» pero su ancla es
 * «#inicio», y la sección de productos publica dos. Este mapa es la única
 * definición; el panel y las pruebas lo leen de aquí para no desincronizarse.
 */
export const ANCLAS_DE_SECCION = {
  hero: ['#inicio'],
  marquesina: [],
  productos: ['#productos', '#catalogo'],
  soluciones: ['#soluciones'],
  ubicacion: ['#ubicacion'],
  contacto: ['#contacto'],
  ctaFinal: [],
}

/** Anclas a las que un enlace del menú puede apuntar sin romperse. */
export function anclasDisponibles(secciones) {
  return new Set(
    (secciones ?? [])
      .filter((s) => s.visible !== false)
      .flatMap((s) => ANCLAS_DE_SECCION[s.id] ?? [])
  )
}

const icono = (valor, campo) =>
  ICONOS_VALIDOS.has(valor) ? valor : (() => { throw new ErrorValidacion('Icono no reconocido.', campo) })()

export function validarSite(entrada) {
  if (!entrada || typeof entrada !== 'object') throw new ErrorValidacion('Contenido vacío.', 'site')

  const i = entrada.identidad ?? {}
  const c = entrada.contacto ?? {}
  const u = entrada.ubicacion ?? {}
  const n = entrada.navegacion ?? {}
  const h = entrada.hero ?? {}
  const s = entrada.seo ?? {}
  const t = entrada.tema ?? {}

  const telefonos = lista(c.telefonos ?? [], 'contacto.telefonos').map((tel, k) => ({
    id: texto(tel.id || `tel-${k + 1}`, { max: 40 }),
    display: texto(tel.display, { max: 40, campo: `teléfono ${k + 1}`, obligatorio: true }),
    wa: numeroWhatsapp(tel.wa, { campo: `teléfono ${k + 1}` }),
  }))
  if (!telefonos.length) throw new ErrorValidacion('Deja al menos un teléfono.', 'contacto.telefonos')

  return {
    version: 1,
    actualizado: entrada.actualizado ?? null,
    actualizadoPor: entrada.actualizadoPor ?? null,

    identidad: {
      nombreLegal: texto(i.nombreLegal, { max: 120, campo: 'nombre legal', obligatorio: true }),
      nombreCorto: texto(i.nombreCorto, { max: 60, campo: 'nombre corto', obligatorio: true }),
      lema: texto(i.lema, { max: LIMITES.textoCorto, campo: 'lema' }),
      descripcion: texto(i.descripcion, { max: LIMITES.textoMedio, campo: 'descripción' }),
      descripcionLarga: texto(i.descripcionLarga, { max: LIMITES.textoLargo, campo: 'descripción larga' }),
      logo: slug(i.logo || 'logo', { campo: 'logo' }),
      cargaTexto: texto(i.cargaTexto, { max: 60, campo: 'texto de carga' }),
    },

    contacto: {
      telefonos,
      redes: lista(c.redes ?? [], 'contacto.redes').map((r, k) => ({
        id: slug(r.id, { campo: `red ${k + 1}` }),
        label: texto(r.label, { max: 40, campo: `red ${k + 1}`, obligatorio: true }),
        handle: texto(r.handle, { max: 80, campo: `red ${k + 1}` }),
        url: url(r.url, { campo: `red ${k + 1}`, obligatorio: true, permitirRelativa: false }),
        visible: booleano(r.visible),
      })),
      mensajes: {
        cotizacion: texto(c.mensajes?.cotizacion, { max: LIMITES.textoMedio, campo: 'mensaje de cotización' }),
        general: texto(c.mensajes?.general, { max: LIMITES.textoMedio, campo: 'mensaje general' }),
        ubicacion: texto(c.mensajes?.ubicacion, { max: LIMITES.textoMedio, campo: 'mensaje de ubicación' }),
        producto: texto(c.mensajes?.producto, { max: LIMITES.textoMedio, campo: 'mensaje de producto' }),
        categoria: texto(c.mensajes?.categoria, { max: LIMITES.textoMedio, campo: 'mensaje de categoría' }),
      },
      flotante: {
        visible: booleano(c.flotante?.visible),
        tooltip: texto(c.flotante?.tooltip, { max: 60, campo: 'tooltip de WhatsApp' }),
      },
    },

    ubicacion: {
      visible: booleano(u.visible),
      eyebrow: texto(u.eyebrow, { max: 60 }),
      titulo: texto(u.titulo, { max: LIMITES.textoCorto, campo: 'título de ubicación' }),
      subtitulo: texto(u.subtitulo, { max: LIMITES.textoMedio }),
      calle: texto(u.calle, { max: 120, campo: 'dirección', obligatorio: true }),
      sector: texto(u.sector, { max: 80 }),
      referencia: texto(u.referencia, { max: 120 }),
      ciudad: texto(u.ciudad, { max: 60 }),
      region: texto(u.region, { max: 60 }),
      pais: texto(u.pais, { max: 60 }),
      codigoPais: texto(u.codigoPais, { max: 4 }),
      consultaMapa: texto(u.consultaMapa, { max: 200, campo: 'consulta del mapa' }),
      etiquetas: {
        calle: texto(u.etiquetas?.calle, { max: 40 }),
        sector: texto(u.etiquetas?.sector, { max: 40 }),
        referencia: texto(u.etiquetas?.referencia, { max: 40 }),
      },
      ctaComoLlegar: texto(u.ctaComoLlegar, { max: 40 }),
      ctaWhatsapp: texto(u.ctaWhatsapp, { max: 40 }),
    },

    navegacion: {
      enlaces: lista(n.enlaces ?? [], 'navegacion.enlaces').map((l, k) => ({
        id: texto(l.id || `nav-${k + 1}`, { max: 40 }),
        href: url(l.href, { campo: `enlace ${k + 1}`, obligatorio: true }),
        label: texto(l.label, { max: 40, campo: `enlace ${k + 1}`, obligatorio: true }),
        visible: booleano(l.visible),
      })),
      ctaTexto: texto(n.ctaTexto, { max: 40, campo: 'texto del botón', obligatorio: true }),
      barraSuperior: booleano(n.barraSuperior),
    },

    hero: {
      chip: texto(h.chip, { max: 30 }),
      chipTexto: texto(h.chipTexto, { max: LIMITES.textoCorto }),
      tituloAntes: texto(h.tituloAntes, { max: LIMITES.textoCorto, espacios: true }),
      tituloDestacado: texto(h.tituloDestacado, { max: 60 }),
      tituloDespues: texto(h.tituloDespues, { max: LIMITES.textoCorto, espacios: true }),
      subtitulo: texto(h.subtitulo, { max: LIMITES.textoMedio }),
      ctaPrimario: texto(h.ctaPrimario, { max: 40 }),
      ctaSecundario: texto(h.ctaSecundario, { max: 40 }),
      ctaSecundarioHref: url(h.ctaSecundarioHref, { campo: 'enlace del botón secundario' }),
      mostrarDireccion: booleano(h.mostrarDireccion),
      pilares: lista(h.pilares ?? [], 'hero.pilares').map((p, k) => ({
        id: texto(p.id || `pil-${k + 1}`, { max: 40 }),
        icono: icono(p.icono, `pilar ${k + 1}`),
        texto: texto(p.texto, { max: 60, campo: `pilar ${k + 1}`, obligatorio: true }),
      })),
      vitrina: lista(h.vitrina ?? [], 'hero.vitrina').map((v, k) => ({
        id: texto(v.id || `vit-${k + 1}`, { max: 40 }),
        imagen: slug(v.imagen, { campo: `vitrina ${k + 1}` }),
        label: texto(v.label, { max: 40, campo: `vitrina ${k + 1}` }),
        alt: texto(v.alt, { max: LIMITES.textoCorto, campo: `vitrina ${k + 1}` }),
        forma: FORMAS_VITRINA.has(v.forma) ? v.forma : 'vertical',
      })),
    },

    marquesina: {
      visible: booleano(entrada.marquesina?.visible),
      items: lista(entrada.marquesina?.items ?? [], 'marquesina')
        .map((x) => texto(x, { max: 60 }))
        .filter(Boolean),
    },

    categoriasSeccion: seccion(entrada.categoriasSeccion, {
      ctaTarjeta: (v) => texto(v, { max: 40 }),
    }),

    catalogoSeccion: {
      ...seccion(entrada.catalogoSeccion),
      ctaCabecera: texto(entrada.catalogoSeccion?.ctaCabecera, { max: 40 }),
      etiquetaFiltro: texto(entrada.catalogoSeccion?.etiquetaFiltro, { max: 40 }),
      etiquetaTodos: texto(entrada.catalogoSeccion?.etiquetaTodos, { max: 30 }),
      textoConsultar: texto(entrada.catalogoSeccion?.textoConsultar, { max: 30 }),
      vacio: texto(entrada.catalogoSeccion?.vacio, { max: LIMITES.textoMedio }),
      sinFoto: texto(entrada.catalogoSeccion?.sinFoto, { max: 40 }),
      sinDescripcion: texto(entrada.catalogoSeccion?.sinDescripcion, { max: LIMITES.textoMedio }),
      modalNota: texto(entrada.catalogoSeccion?.modalNota, { max: LIMITES.textoMedio }),
      precioNota: texto(entrada.catalogoSeccion?.precioNota, { max: LIMITES.textoMedio }),
      modalCta: texto(entrada.catalogoSeccion?.modalCta, { max: 40 }),
      cierre: {
        visible: booleano(entrada.catalogoSeccion?.cierre?.visible),
        titulo: texto(entrada.catalogoSeccion?.cierre?.titulo, { max: LIMITES.textoCorto }),
        texto: texto(entrada.catalogoSeccion?.cierre?.texto, { max: LIMITES.textoMedio }),
        cta: texto(entrada.catalogoSeccion?.cierre?.cta, { max: 40 }),
      },
    },

    soluciones: {
      ...seccion(entrada.soluciones),
      cta: texto(entrada.soluciones?.cta, { max: 40 }),
      items: lista(entrada.soluciones?.items ?? [], 'soluciones').map((x, k) => ({
        id: texto(x.id || `sol-${k + 1}`, { max: 40 }),
        icono: icono(x.icono, `solución ${k + 1}`),
        titulo: texto(x.titulo, { max: 60, campo: `solución ${k + 1}`, obligatorio: true }),
        texto: texto(x.texto, { max: LIMITES.textoMedio, campo: `solución ${k + 1}` }),
      })),
    },

    contactoSeccion: {
      ...seccion(entrada.contactoSeccion),
      etiquetaLlamar: texto(entrada.contactoSeccion?.etiquetaLlamar, { max: 40 }),
      etiquetaRedes: texto(entrada.contactoSeccion?.etiquetaRedes, { max: 40 }),
    },

    ctaFinal: {
      visible: booleano(entrada.ctaFinal?.visible),
      chip: texto(entrada.ctaFinal?.chip, { max: 60 }),
      titulo: texto(entrada.ctaFinal?.titulo, { max: LIMITES.textoCorto }),
      texto: texto(entrada.ctaFinal?.texto, { max: LIMITES.textoMedio }),
      ctaPrimario: texto(entrada.ctaFinal?.ctaPrimario, { max: 40 }),
      ctaSecundario: texto(entrada.ctaFinal?.ctaSecundario, { max: 40 }),
      imagenes: lista(entrada.ctaFinal?.imagenes ?? [], 'ctaFinal.imagenes')
        .slice(0, 3)
        .map((x) => slug(x, { campo: 'imagen del cierre' })),
    },

    pie: {
      descripcion: texto(entrada.pie?.descripcion, { max: LIMITES.textoLargo }),
      tituloNavegacion: texto(entrada.pie?.tituloNavegacion, { max: 40 }),
      tituloLineas: texto(entrada.pie?.tituloLineas, { max: 40 }),
      tituloContacto: texto(entrada.pie?.tituloContacto, { max: 40 }),
      copyright: texto(entrada.pie?.copyright, { max: LIMITES.textoCorto }),
      anio: Number.isInteger(entrada.pie?.anio) ? entrada.pie.anio : new Date().getFullYear(),
      volverArriba: texto(entrada.pie?.volverArriba, { max: 40 }),
      avisoLegal: texto(entrada.pie?.avisoLegal, { max: LIMITES.textoLargo }),
    },

    seo: {
      titulo: texto(s.titulo, { max: 120, campo: 'título SEO' }),
      descripcion: texto(s.descripcion, { max: 220, campo: 'descripción SEO' }),
      url: url(s.url, { campo: 'URL del sitio', permitirRelativa: false }),
      ogImagen: url(s.ogImagen, { campo: 'imagen para redes' }),
      indexar: booleano(s.indexar),
    },

    tema: {
      colores: Object.fromEntries(
        Object.entries(t.colores ?? {}).map(([k, v]) => [slug(k, { campo: 'color' }), color(v, { campo: k })])
      ),
      tipografia: {
        display: FUENTES.has(t.tipografia?.display) ? t.tipografia.display : 'Manrope',
        texto: FUENTES.has(t.tipografia?.texto) ? t.tipografia.texto : 'Inter',
      },
      radio: texto(t.radio, { max: 12 }) || '1rem',
    },

    secciones: lista(entrada.secciones ?? [], 'secciones')
      .filter((x) => SECCIONES.has(x.id))
      .map((x) => ({ id: x.id, visible: booleano(x.visible) })),
  }
}

/** Campos comunes a casi todas las secciones. */
function seccion(obj, extra = {}) {
  const base = {
    visible: booleano(obj?.visible),
    eyebrow: texto(obj?.eyebrow, { max: 60 }),
    titulo: texto(obj?.titulo, { max: LIMITES.textoCorto }),
    subtitulo: texto(obj?.subtitulo, { max: LIMITES.textoMedio }),
  }
  for (const [clave, fn] of Object.entries(extra)) base[clave] = fn(obj?.[clave])
  return base
}

// ===========================================================================
//  categories.json / products.json / media.json
// ===========================================================================

export function validarCategorias(entrada) {
  const items = lista(entrada ?? [], 'categorías')
  const vistos = new Set()
  return items.map((c, k) => {
    const id = slug(c.id, { campo: `categoría ${k + 1}` })
    if (vistos.has(id)) throw new ErrorValidacion(`El identificador «${id}» está repetido.`, 'categorías')
    vistos.add(id)
    return {
      id,
      nombre: texto(c.nombre, { max: 80, campo: `categoría ${k + 1}`, obligatorio: true }),
      corto: texto(c.corto, { max: 40, campo: `categoría ${k + 1}`, obligatorio: true }),
      descripcion: texto(c.descripcion, { max: LIMITES.textoMedio, campo: `categoría ${k + 1}` }),
      imagen: c.imagen ? slug(c.imagen, { campo: `categoría ${k + 1}` }) : null,
      visible: booleano(c.visible),
      orden: Number.isInteger(c.orden) ? c.orden : k,
    }
  })
}

export function validarProductos(entrada, idsCategorias = null) {
  const items = lista(entrada ?? [], 'productos')
  const vistos = new Set()
  return items.map((p, k) => {
    const id = slug(p.id, { campo: `producto ${k + 1}` })
    if (vistos.has(id)) throw new ErrorValidacion(`El identificador «${id}» está repetido.`, 'productos')
    vistos.add(id)

    const categorias = lista(p.categorias ?? [], `producto ${k + 1}`).map((x) =>
      slug(x, { campo: `producto ${k + 1}` })
    )
    if (idsCategorias) {
      const huerfana = categorias.find((x) => !idsCategorias.has(x))
      if (huerfana) {
        throw new ErrorValidacion(
          `«${p.nombre || id}» apunta a la categoría «${huerfana}», que no existe.`,
          'productos'
        )
      }
    }

    return {
      id,
      nombre: texto(p.nombre, { max: 80, campo: `producto ${k + 1}`, obligatorio: true }),
      categorias,
      imagen: p.imagen ? slug(p.imagen, { campo: `producto ${k + 1}` }) : null,
      galeria: Array.isArray(p.galeria) && p.galeria.length
        ? lista(p.galeria, `producto ${k + 1}`).map((x) => slug(x, { campo: `producto ${k + 1}` }))
        : null,
      descripcion: p.descripcion ? texto(p.descripcion, { max: LIMITES.textoMedio }) : null,
      precio: precio(p.precio, { campo: `producto ${k + 1}` }),
      // La unidad («por metro») solo tiene sentido junto a un precio.
      precioUnidad: p.precio && p.precioUnidad ? texto(p.precioUnidad, { max: 30 }) || null : null,
      destacado: booleano(p.destacado, false),
      visible: booleano(p.visible),
      orden: Number.isInteger(p.orden) ? p.orden : k,
    }
  })
}

export function validarMedios(entrada) {
  return lista(entrada ?? [], 'medios').slice(0, 400).map((m) => ({
    id: slug(m.id, { campo: 'medio' }),
    alt: texto(m.alt, { max: LIMITES.textoCorto, campo: 'texto alternativo' }),
    variantes: Array.isArray(m.variantes) ? m.variantes.filter((v) => typeof v === 'string').slice(0, 8) : [],
    bytes: Number.isFinite(m.bytes) ? Math.max(0, Math.round(m.bytes)) : 0,
    origen: m.origen === 'panel' ? 'panel' : 'inicial',
  }))
}

/** Comprueba que no se borre una imagen que alguna sección sigue usando. */
export function usosDeImagen(id, { site, categorias, productos }) {
  const usos = []
  if (site?.identidad?.logo === id) usos.push('el logotipo')
  for (const v of site?.hero?.vitrina ?? []) if (v.imagen === id) usos.push(`la vitrina del hero (${v.label || id})`)
  if ((site?.ctaFinal?.imagenes ?? []).includes(id)) usos.push('el bloque final')
  for (const c of categorias ?? []) if (c.imagen === id) usos.push(`la categoría «${c.nombre}»`)
  for (const p of productos ?? []) {
    if (p.imagen === id) usos.push(`el producto «${p.nombre}»`)
    else if ((p.galeria ?? []).includes(id)) usos.push(`la galería de «${p.nombre}»`)
  }
  return usos
}

export const LIMITES_TEXTO = LIMITES
