import { useCallback, useMemo, useRef, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'
import Button from './ui/Button'
import CategoryCard from './CategoryCard'
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'
import { WhatsAppIcon } from './ui/BrandIcons'
import { useContent } from '../content/ContentContext'

export default function Products() {
  const {
    CATEGORIES,
    productsByCategory,
    countByCategory,
    WA_MESSAGES,
    waLink,
    categoriasSeccion,
    catalogoSeccion,
    visible,
  } = useContent()

  const [category, setCategory] = useState('all')
  const [openProduct, setOpenProduct] = useState(null)
  const catalogRef = useRef(null)

  const filtros = useMemo(
    () => [{ id: 'all', short: catalogoSeccion.etiquetaTodos || 'Todos' }, ...CATEGORIES],
    [CATEGORIES, catalogoSeccion.etiquetaTodos]
  )

  const visibles = useMemo(() => {
    const lista = productsByCategory(category)
    // Los destacados primero, conservando el orden del catálogo
    return [...lista].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
  }, [category, productsByCategory])

  const seleccionarCategoria = useCallback((id) => {
    setCategory(id)
    requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const cerrarModal = useCallback(() => setOpenProduct(null), [])

  // Si el panel oculta una categoría que estaba filtrada, vuelve a "Todos"
  if (category !== 'all' && !CATEGORIES.some((c) => c.id === category)) {
    setCategory('all')
  }

  return (
    <>
      {/* ============================ Categorías ============================ */}
      {visible('productos') && categoriasSeccion.visible !== false && (
        <section
          id="productos"
          aria-labelledby="productos-titulo"
          className="scroll-mt-24 bg-shell py-20 sm:py-24 lg:py-28"
        >
          <div className="container-x">
            <SectionHeading
              id="productos-titulo"
              eyebrow={categoriasSeccion.eyebrow}
              title={categoriasSeccion.titulo}
              subtitle={categoriasSeccion.subtitulo}
            />

            <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
              {CATEGORIES.map((cat, i) => (
                <Reveal key={cat.id} delay={(i % 4) * 80} className="h-full">
                  <CategoryCard
                    category={cat}
                    count={countByCategory(cat.id)}
                    cta={categoriasSeccion.ctaTarjeta}
                    onSelect={seleccionarCategoria}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================= Catálogo ============================= */}
      {catalogoSeccion.visible !== false && (
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
                eyebrow={catalogoSeccion.eyebrow}
                title={catalogoSeccion.titulo}
                subtitle={catalogoSeccion.subtitulo}
              />

              {catalogoSeccion.ctaCabecera && (
                <Reveal delay={120} className="shrink-0">
                  <Button href={waLink(WA_MESSAGES.quote)} variant="primary" size="lg" arrow>
                    {catalogoSeccion.ctaCabecera}
                  </Button>
                </Reveal>
              )}
            </div>

            {/* Filtros */}
            <Reveal className="mt-10">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                {catalogoSeccion.etiquetaFiltro}
              </div>

              <div
                role="group"
                aria-label="Filtrar productos por línea"
                className="mt-3 flex flex-wrap gap-2"
              >
                {filtros.map((f) => {
                  const activo = category === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCategory(f.id)}
                      aria-pressed={activo}
                      className={`h-10 rounded-full border-2 px-4 text-sm font-bold transition-[background-color,border-color,color] duration-200 ${
                        activo
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
              {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
              {category !== 'all' && ' en esta línea'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
              {visibles.map((product, i) => (
                <Reveal key={product.id} delay={(i % 4) * 70} className="h-full">
                  <ProductCard product={product} onOpen={setOpenProduct} />
                </Reveal>
              ))}
            </div>

            {visibles.length === 0 && (
              <p className="mt-10 rounded-2xl border border-line bg-shell p-8 text-center text-body">
                {catalogoSeccion.vacio}
              </p>
            )}

            {/* Cierre del catálogo */}
            {catalogoSeccion.cierre?.visible !== false && (
              <Reveal className="mt-14 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-navy-50 to-white p-7 sm:p-10">
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-xl">
                    <h3 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                      {catalogoSeccion.cierre?.titulo}
                    </h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">
                      {catalogoSeccion.cierre?.texto}
                    </p>
                  </div>
                  <Button
                    href={waLink(WA_MESSAGES.general)}
                    variant="whatsapp"
                    size="lg"
                    icon={WhatsAppIcon}
                    className="shrink-0"
                  >
                    {catalogoSeccion.cierre?.cta}
                  </Button>
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* `key` por producto: al abrir otro, la galería arranca en la primera imagen */}
      <ProductModal key={openProduct?.id ?? 'cerrado'} product={openProduct} onClose={cerrarModal} />
    </>
  )
}
