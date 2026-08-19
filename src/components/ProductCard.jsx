import { Images, Layers, Plus } from 'lucide-react'
import ProductImage from './ui/ProductImage'
import { CATEGORY_BY_ID } from '../data/categories'

/** Marcador para productos que aún no tienen fotografía propia. */
function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <span className="grid size-12 place-items-center rounded-2xl border border-navy-800/12 bg-white text-navy-600 shadow-card sm:size-14">
          <Layers className="size-5 sm:size-6" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-muted">Foto próximamente</span>
      </div>
    </div>
  )
}

export default function ProductCard({ product, onOpen }) {
  const primaryCategory = CATEGORY_BY_ID[product.categories[0]]
  const galleryCount = product.gallery?.length ?? 0

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-navy-800/25 hover:shadow-lift">
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-navy-50 via-white to-navy-50/60">
        <div aria-hidden="true" className="grid-lines-light absolute inset-0 opacity-55" />

        {product.image ? (
          <ProductImage
            name={product.image}
            alt={product.name}
            tier="sm"
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 44vw"
            className="absolute inset-0 size-full p-5 transition-transform duration-500 ease-out group-hover:scale-[1.07] sm:p-7"
          />
        ) : (
          <ImagePlaceholder />
        )}

        {galleryCount > 1 && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-navy-900/85 px-2.5 py-1 text-[0.6875rem] font-bold text-white backdrop-blur-sm">
            <Images className="size-3" aria-hidden="true" />
            {galleryCount}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {primaryCategory && (
          <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-flame-600 uppercase">
            {primaryCategory.short}
          </p>
        )}

        <h3 className="mt-1.5 font-display text-base leading-snug font-extrabold text-ink sm:text-[1.0625rem]">
          {product.name}
        </h3>

        {product.description ? (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-body">
            {product.description}
          </p>
        ) : (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted italic">
            Consulta disponibilidad con nuestro equipo.
          </p>
        )}

        <button
          type="button"
          onClick={() => onOpen(product)}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-navy-800/15 bg-white text-sm font-bold text-navy-800 transition-[background-color,border-color,color] duration-200 group-hover:border-flame-600 group-hover:bg-flame-600 group-hover:text-white"
        >
          <Plus className="size-4" aria-hidden="true" />
          Consultar
          <span className="sr-only"> disponibilidad de {product.name}</span>
        </button>
      </div>
    </article>
  )
}
