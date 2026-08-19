import { useCallback, useMemo, useRef, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'
import Button from './ui/Button'
import CategoryCard from './CategoryCard'
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'
import { WhatsAppIcon } from './ui/BrandIcons'
import { CATEGORIES } from '../data/categories'
import { PRODUCTS, countByCategory, productsByCategory } from '../data/products'
import { WA_MESSAGES, waLink } from '../data/company'

const FILTERS = [{ id: 'all', short: 'Todos' }, ...CATEGORIES]

export default function Products() {
  const [category, setCategory] = useState('all')
  const [openProduct, setOpenProduct] = useState(null)
  const catalogRef = useRef(null)

  const visible = useMemo(() => {
    const list = productsByCategory(category)
    // Los destacados primero, conservando el orden del archivo de datos
    return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
  }, [category])

  const selectCategory = useCallback((id) => {
    setCategory(id)
    // Lleva al usuario al catálogo ya filtrado
    requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const closeModal = useCallback(() => setOpenProduct(null), [])

  return (
    <>
      {/* ============================ Categorías ============================ */}
      <section
        id="productos"
        aria-labelledby="productos-titulo"
        className="scroll-mt-24 bg-shell py-20 sm:py-24 lg:py-28"
      >
        <div className="container-x">
          <SectionHeading
            id="productos-titulo"
            eyebrow="Nuestras líneas"
            title="Todo para tu producción"
            subtitle="Insumos, repuestos y equipos para confección, calzado y marroquinería. Elige una línea y mira lo que tenemos disponible."
          />

          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.id} delay={(i % 4) * 80} className="h-full">
                <CategoryCard
                  category={cat}
                  count={countByCategory(cat.id)}
                  onSelect={selectCategory}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= Catálogo ============================= */}
      <section
        id="catalogo"
        ref={catalogRef}
        aria-labelledby="catalogo-titulo"
        className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
      >
        <div className="container-x">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="catalogo-titulo"
              eyebrow="Catálogo"
              title="Nuestros productos"
              subtitle="Fotografías reales de nuestro portafolio. Toca cualquier producto para ver el detalle y consultar disponibilidad."
            />

            <Reveal delay={120} className="shrink-0">
              <Button href={waLink(WA_MESSAGES.quote)} variant="primary" size="lg" arrow>
                Solicitar cotización
              </Button>
            </Reveal>
          </div>

          {/* Filtros */}
          <Reveal className="mt-10">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              Filtrar por línea
            </div>

            <div
              role="group"
              aria-label="Filtrar productos por línea"
              className="mt-3 flex flex-wrap gap-2"
            >
              {FILTERS.map((f) => {
                const isActive = category === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCategory(f.id)}
                    aria-pressed={isActive}
                    className={`h-10 rounded-full border-2 px-4 text-sm font-bold transition-[background-color,border-color,color] duration-200 ${
                      isActive
                        ? 'border-navy-800 bg-navy-800 text-white'
                        : 'border-line bg-white text-body hover:border-navy-800/35 hover:text-navy-800'
                    }`}
                  >
                    {f.short}
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* Grilla */}
          <p aria-live="polite" className="mt-6 text-sm font-medium text-muted">
            {visible.length} {visible.length === 1 ? 'producto' : 'productos'}
            {category !== 'all' && ' en esta línea'}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {visible.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 70} className="h-full">
                <ProductCard product={product} onOpen={setOpenProduct} />
              </Reveal>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-10 rounded-2xl border border-line bg-shell p-8 text-center text-body">
              Aún no hay productos publicados en esta línea. Escríbenos y te contamos qué tenemos
              disponible.
            </p>
          )}

          {/* Cierre del catálogo */}
          <Reveal className="mt-14 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-navy-50 to-white p-7 sm:p-10">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <h3 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                  ¿No encuentras lo que buscas?
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">
                  Nuestro portafolio es más amplio que lo publicado aquí. Cuéntanos qué insumo
                  necesitas y te orientamos.
                </p>
              </div>
              <Button
                href={waLink(WA_MESSAGES.general)}
                variant="whatsapp"
                size="lg"
                icon={WhatsAppIcon}
                className="shrink-0"
              >
                Escríbenos por WhatsApp
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <ProductModal product={openProduct} onClose={closeModal} />
    </>
  )
}

export { PRODUCTS }
