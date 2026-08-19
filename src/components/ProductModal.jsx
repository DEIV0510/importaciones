import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Layers, MapPin, Phone, X } from 'lucide-react'
import ProductImage from './ui/ProductImage'
import Button from './ui/Button'
import { WhatsAppIcon } from './ui/BrandIcons'
import { CATEGORY_BY_ID } from '../data/categories'
import { ADDRESS, PHONES, WA_MESSAGES, waLink } from '../data/company'
import { useBodyLock, useEscape, useFocusTrap } from '../hooks/useUi'

export default function ProductModal({ product, onClose }) {
  const open = Boolean(product)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const [index, setIndex] = useState(0)

  useBodyLock(open)
  useEscape(open, onClose)
  useFocusTrap(panelRef, open)

  // Reinicia la galería y lleva el foco al abrir otro producto
  useEffect(() => {
    if (!open) return
    setIndex(0)
    const t = setTimeout(() => closeRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [open, product?.id])

  if (!open) return null

  const images = product.gallery?.length ? product.gallery : product.image ? [product.image] : []
  const hasGallery = images.length > 1
  const current = images[index]
  const categories = product.categories.map((id) => CATEGORY_BY_ID[id]).filter(Boolean)

  const go = (step) => setIndex((i) => (i + step + images.length) % images.length)

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-producto-titulo"
    >
      {/* Fondo */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-navy-950/70 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-3xl"
      >
        {/* Asa visual en móvil */}
        <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
          <span className="h-1.5 w-11 rounded-full bg-line" />
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de producto"
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full border border-line bg-white/90 text-navy-800 backdrop-blur transition-colors hover:bg-navy-50 sm:top-4 sm:right-4"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="scroll-slim grid flex-1 overflow-y-auto overscroll-contain sm:grid-cols-2 sm:overflow-hidden">
          {/* ---------------- Imagen ---------------- */}
          <div className="relative bg-gradient-to-br from-navy-50 via-white to-navy-50/70 sm:flex sm:flex-col">
            <div aria-hidden="true" className="grid-lines-light absolute inset-0 opacity-60" />

            <div className="relative aspect-square w-full sm:flex-1">
              {current ? (
                <ProductImage
                  key={current}
                  name={current}
                  alt={`${product.name}${hasGallery ? ` — imagen ${index + 1} de ${images.length}` : ''}`}
                  tier="lg"
                  loading="eager"
                  sizes="(min-width: 640px) 42vw, 92vw"
                  className="absolute inset-0 size-full p-8 sm:p-10"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="grid size-16 place-items-center rounded-2xl border border-navy-800/12 bg-white text-navy-600 shadow-card">
                      <Layers className="size-7" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-muted">Foto próximamente</span>
                  </div>
                </div>
              )}

              {hasGallery && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Imagen anterior"
                    className="absolute top-1/2 left-2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/90 text-navy-800 shadow-card backdrop-blur transition-colors hover:bg-white"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Imagen siguiente"
                    className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/90 text-navy-800 shadow-card backdrop-blur transition-colors hover:bg-white"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {hasGallery && (
              <div className="relative flex justify-center gap-2 px-4 pb-4">
                {images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ver imagen ${i + 1} de ${images.length}`}
                    aria-current={i === index ? 'true' : undefined}
                    className={`size-14 overflow-hidden rounded-xl border-2 bg-white transition-colors ${
                      i === index ? 'border-flame-600' : 'border-line hover:border-navy-800/30'
                    }`}
                  >
                    <ProductImage name={img} alt="" aria-hidden="true" tier="sm" className="size-full p-1.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---------------- Detalle ---------------- */}
          <div className="scroll-slim flex flex-col p-6 sm:overflow-y-auto sm:p-8">
            {categories.length > 0 && (
              <nav aria-label="Categoría" className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-muted">Catálogo</span>
                <span aria-hidden="true" className="text-line">
                  /
                </span>
                <span className="font-bold tracking-wide text-flame-600 uppercase">
                  {categories[0].name}
                </span>
              </nav>
            )}

            <h2
              id="modal-producto-titulo"
              className="mt-3 font-display text-2xl leading-tight font-extrabold text-ink sm:text-[1.75rem]"
            >
              {product.name}
            </h2>

            <p className="mt-4 text-[0.9375rem] leading-relaxed text-body">
              {product.description ??
                'Este producto hace parte de nuestro portafolio. Escríbenos y te confirmamos disponibilidad, presentaciones y colores.'}
            </p>

            {categories.length > 1 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full border border-line bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-800"
                  >
                    {c.short}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 rounded-2xl border border-line bg-shell p-4">
              <p className="text-sm leading-relaxed text-body">
                No publicamos precios en línea. Escríbenos por WhatsApp y te confirmamos{' '}
                <strong className="font-semibold text-ink">disponibilidad y condiciones</strong>.
              </p>
            </div>

            <div className="mt-6 grid gap-2.5">
              <Button
                href={waLink(WA_MESSAGES.product(product.name))}
                variant="whatsapp"
                size="lg"
                icon={WhatsAppIcon}
                className="w-full"
              >
                Consultar por WhatsApp
              </Button>

              <div className="grid grid-cols-2 gap-2.5">
                {PHONES.map((p) => (
                  <Button key={p.tel} href={`tel:${p.tel}`} variant="outline" size="md" icon={Phone}>
                    <span className="hidden sm:inline">{p.display}</span>
                    <span className="sm:hidden">Llamar</span>
                  </Button>
                ))}
              </div>
            </div>

            <p className="mt-6 flex items-start gap-2 text-sm text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-flame-600" aria-hidden="true" />
              <span>
                {ADDRESS.street} · {ADDRESS.area}
                <br />
                {ADDRESS.reference}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
