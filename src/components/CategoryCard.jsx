import { ArrowRight } from 'lucide-react'
import ProductImage from './ui/ProductImage'

/**
 * Tarjeta de categoría. Al activarse filtra el catálogo y baja hasta él.
 * Es un <button> real: funciona con teclado y lectores de pantalla.
 */
export default function CategoryCard({ category, count, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      aria-label={`Ver productos de ${category.name}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white text-left shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-navy-800/25 hover:shadow-lift"
    >
      {/* Zona de imagen */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-navy-50 to-white">
        <div
          aria-hidden="true"
          className="grid-lines-light absolute inset-0 opacity-60"
        />
        {category.image ? (
          <ProductImage
            name={category.image}
            alt=""
            aria-hidden="true"
            tier="sm"
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 88vw"
            className="absolute inset-0 size-full p-6 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        ) : null}

        {count > 0 && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-navy-800 backdrop-blur-sm sm:top-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[0.6875rem]">
            {count} {count === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>

      {/* Texto */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-sm leading-snug font-extrabold text-ink sm:text-[1.0625rem]">
          {category.name}
        </h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-body sm:mt-2 sm:text-sm">
          {category.description}
        </p>

        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-flame-600 sm:mt-4 sm:text-sm">
          Ver productos
          <ArrowRight
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-1 sm:size-4"
            aria-hidden="true"
          />
        </span>
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-navy-600 to-flame-500 transition-transform duration-400 group-hover:scale-x-100"
      />
    </button>
  )
}
