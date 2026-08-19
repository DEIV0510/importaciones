/**
 * Catálogo de productos.
 *
 * CÓMO AMPLIAR EL CATÁLOGO
 * ------------------------
 * 1. Guarda la foto en /public/img con este patrón de nombres:
 *      <slug>-400.webp   <slug>-800.webp   <slug>-fallback.png
 *    (fondo transparente y producto centrado; el sitio nunca deforma la imagen).
 * 2. Añade un objeto a la lista PRODUCTS con la forma:
 *      {
 *        id: 'slug-unico',
 *        name: 'Nombre del producto',
 *        categories: ['cintas'],          // ids de categories.js
 *        image: 'slug',                   // nombre base del archivo, o null
 *        gallery: ['slug', 'otro-slug'],  // opcional: fotos adicionales
 *        description: 'Texto corto',      // opcional
 *        featured: true,                  // opcional: lo destaca en la grilla
 *      }
 *
 * No se incluyen precios, referencias ni especificaciones técnicas porque la
 * empresa no los suministró. Los productos sin fotografía se muestran con un
 * marcador gráfico y el botón "Consultar disponibilidad".
 */

export const PRODUCTS = [
  // ---------------------------------------------------------------- Cintas
  {
    id: 'cinta-faya',
    name: 'Cinta faya',
    categories: ['cintas', 'confeccion'],
    image: 'cinta-faya-clasica',
    gallery: ['cinta-faya-clasica', 'cinta-faya-rosada'],
    description:
      'Cinta faya de textura acanalada, disponible en varios colores. Consulta los tonos y anchos disponibles.',
    featured: true,
  },
  {
    id: 'cinta-raso',
    name: 'Cinta raso',
    categories: ['cintas', 'confeccion'],
    image: 'cinta-raso-azul',
    gallery: ['cinta-raso-azul', 'cinta-raso-roja'],
    description:
      'Cinta raso de acabado satinado, disponible en varios colores. Consulta los tonos y anchos disponibles.',
    featured: true,
  },
  {
    id: 'millare',
    name: 'Millaré',
    categories: ['cintas', 'otros'],
    image: 'millare-dorado',
    gallery: ['millare-dorado', 'millare-plata'],
    description:
      'Pasamanería tipo millaré para apliques y terminaciones decorativas.',
    featured: true,
  },
  {
    id: 'millare-navideno',
    name: 'Millaré navideño',
    categories: ['cintas', 'otros'],
    image: 'millare-navideno',
    description:
      'Millaré en combinación de colores navideños para trabajos de temporada.',
    featured: true,
  },

  // -------------------------------------------------------------- Elásticos
  {
    id: 'elasticos-estampados',
    name: 'Elásticos estampados',
    categories: ['elasticos', 'confeccion'],
    image: 'elastico-monograma',
    gallery: ['elastico-monograma', 'elastico-griego', 'elastico-espigado'],
    description:
      'Elásticos con diseño estampado en distintos anchos y combinaciones de color.',
    featured: true,
  },
  {
    id: 'elastico-plano',
    name: 'Elástico plano',
    categories: ['elasticos', 'confeccion'],
    image: 'elastico-plano-blanco',
    gallery: ['elastico-plano-blanco', 'elastico-plano-negro'],
    description: 'Elástico plano en presentación de rollo, en blanco y negro.',
    featured: true,
  },

  // ---------------------------------------------------------- Marroquinería
  {
    id: 'carnaza',
    name: 'Carnaza',
    categories: ['marroquineria'],
    image: 'carnaza-natural',
    gallery: ['carnaza-natural', 'carnaza-blanca'],
    description:
      'Tira de carnaza en rollo para trabajos de marroquinería, calzado y accesorios.',
    featured: true,
  },

  // -------------------------------------------------------------- Repuestos
  {
    id: 'prensatelas',
    name: 'Prensatelas',
    categories: ['repuestos'],
    image: 'prensatelas',
    description: 'Prensatelas de repuesto para máquina de confección.',
  },
  {
    id: 'bobinas',
    name: 'Bobinas',
    categories: ['repuestos'],
    image: 'bobinas',
    description: 'Bobinas metálicas para máquina de confección, en caja.',
    featured: true,
  },
  {
    id: 'aceitera',
    name: 'Aceitera',
    categories: ['repuestos'],
    image: 'aceitera',
    description: 'Aceitera para lubricación y mantenimiento de máquinas.',
  },
  {
    id: 'repuestos-maquina',
    name: 'Repuestos para máquina',
    categories: ['repuestos'],
    image: 'repuesto-metalico',
    description:
      'Piezas y repuestos para máquinas de confección. Consúltanos la referencia que necesitas.',
  },

  // ------------------------------------------------------------- Cortadoras
  {
    id: 'maquina-cortadora',
    name: 'Máquina cortadora de confección',
    categories: ['cortadoras'],
    image: 'cortadora-compacta',
    gallery: ['cortadora-compacta', 'cortadora-industrial'],
    description:
      'Máquina cortadora de disco para corte de tela. Consulta los modelos disponibles.',
    featured: true,
  },

  // --------------------------------------------------------------- Lámparas
  {
    id: 'lampara-led-maquina',
    name: 'Lámpara LED para máquina',
    categories: ['lamparas'],
    image: 'lampara-led-brazo',
    gallery: [
      'lampara-led-brazo',
      'lampara-led-barra-larga',
      'lampara-led-arco',
      'lampara-led-flexible',
      'lampara-led-compacta',
    ],
    description:
      'Lámpara LED de brazo flexible para iluminar el área de trabajo de la máquina. Consulta los modelos disponibles.',
    featured: true,
  },
  {
    id: 'lampara-led-modulo',
    name: 'Lámpara LED tipo barra',
    categories: ['lamparas'],
    image: 'lampara-led-modulo',
    description: 'Módulo de iluminación LED tipo barra para puesto de trabajo.',
  },

  // ------------------------------------------------------------------ Otros
  {
    id: 'metros-modisteria',
    name: 'Metros de modistería',
    categories: ['otros', 'confeccion'],
    image: null,
    description: null,
  },
  {
    id: 'seda-italiana',
    name: 'Seda italiana',
    categories: ['otros', 'confeccion'],
    image: null,
    description: null,
  },
]

/** Filtra el catálogo por id de categoría. `all` devuelve todo. */
export function productsByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return PRODUCTS
  return PRODUCTS.filter((p) => p.categories.includes(categoryId))
}

/** Número de productos por categoría, para las tarjetas de categoría. */
export function countByCategory(categoryId) {
  return PRODUCTS.filter((p) => p.categories.includes(categoryId)).length
}
