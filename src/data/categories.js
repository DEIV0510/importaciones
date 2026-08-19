/**
 * Categorías del catálogo.
 *
 * `image` apunta al nombre base de un archivo en /public/img (sin sufijo de
 * tamaño ni extensión). Las categorías sin fotografía propia usan `image: null`
 * y se renderizan con un marcador gráfico elegante en lugar de una foto genérica.
 */

export const CATEGORIES = [
  {
    id: 'confeccion',
    name: 'Insumos para confección',
    short: 'Confección',
    description: 'Insumos de uso diario para talleres y fábricas de confección.',
    image: 'cinta-faya-clasica',
  },
  {
    id: 'cintas',
    name: 'Cintas y pasamanería',
    short: 'Cintas',
    description: 'Cinta raso, cinta faya y millaré en distintos colores y acabados.',
    image: 'cinta-raso-azul',
  },
  {
    id: 'elasticos',
    name: 'Elásticos',
    short: 'Elásticos',
    description: 'Elásticos planos y estampados para prendas y acabados.',
    image: 'elastico-espigado',
  },
  {
    id: 'marroquineria',
    name: 'Marroquinería',
    short: 'Marroquinería',
    description: 'Carnaza y materiales para trabajos de marroquinería y calzado.',
    image: 'carnaza-natural',
  },
  {
    id: 'repuestos',
    name: 'Repuestos para máquinas',
    short: 'Repuestos',
    description: 'Prensatelas, bobinas, aceiteras y repuestos de mantenimiento.',
    image: 'bobinas',
  },
  {
    id: 'cortadoras',
    name: 'Máquinas cortadoras',
    short: 'Cortadoras',
    description: 'Máquinas cortadoras de confección para corte de tela.',
    image: 'cortadora-compacta',
  },
  {
    id: 'lamparas',
    name: 'Lámparas para máquinas',
    short: 'Lámparas',
    description: 'Iluminación LED para puestos de trabajo y máquinas de coser.',
    image: 'lampara-led-brazo',
  },
  {
    id: 'otros',
    name: 'Otros insumos',
    short: 'Otros',
    description: 'Seda italiana, metros de modistería y demás insumos del portafolio.',
    image: 'millare-navideno',
  },
]

/** Mapa id → categoría, para lecturas puntuales. */
export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
