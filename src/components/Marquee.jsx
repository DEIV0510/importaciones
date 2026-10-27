import { prefersReducedMotion } from '../hooks/useReveal'
import { useContent } from '../content/ContentContext'

function Item({ label }) {
  return (
    <li className="flex items-center gap-8 whitespace-nowrap">
      <span className="font-display text-sm font-bold tracking-[0.13em] text-navy-800 uppercase sm:text-base">
        {label}
      </span>
      <span aria-hidden="true" className="size-1.5 rotate-45 bg-flame-500" />
    </li>
  )
}

/**
 * Banda de líneas de producto bajo el hero.
 * Con `prefers-reduced-motion` se muestra estática y sin duplicar contenido.
 */
export default function Marquee() {
  const { marquesina } = useContent()
  const reduced = prefersReducedMotion()
  const items = (marquesina.items ?? []).filter(Boolean)

  if (!items.length) return null

  if (reduced) {
    return (
      <section aria-label="Líneas de producto" className="border-y border-line bg-shell py-5">
        <ul className="container-x flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map((label) => (
            <Item key={label} label={label} />
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section aria-label="Líneas de producto" className="border-y border-line bg-shell py-5">
      <div className="mask-fade-x flex overflow-hidden">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 animate-marquee items-center gap-8 pr-8"
          >
            {items.map((label) => (
              <Item key={label} label={label} />
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
