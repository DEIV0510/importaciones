import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'
import Button from './ui/Button'
import { icono } from './ui/iconRegistry'
import { useContent } from '../content/ContentContext'

export default function Solutions() {
  const { soluciones, WA_MESSAGES, waLink } = useContent()
  const items = soluciones.items ?? []

  return (
    <section
      id="soluciones"
      aria-labelledby="soluciones-titulo"
      className="relative scroll-mt-24 overflow-hidden bg-navy-900 py-20 sm:py-24 lg:py-28"
    >
      {/* Fondo */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--color-navy-900)_0%,var(--color-navy-800)_55%,var(--color-navy-950)_100%)]" />
        <div className="grid-lines absolute inset-0" />
        <div className="absolute top-1/3 -left-40 size-[32rem] rounded-full bg-[radial-gradient(circle,rgba(1,153,218,0.28),transparent_65%)] blur-2xl" />
        <div className="absolute -right-32 bottom-0 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.16),transparent_65%)] blur-2xl" />
      </div>

      <div className="container-x relative">
        <SectionHeading
          id="soluciones-titulo"
          eyebrow={soluciones.eyebrow}
          tone="dark"
          align="center"
          title={soluciones.titulo}
          subtitle={soluciones.subtitulo}
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = icono(item.icono)
            return (
              <Reveal
                key={item.id ?? item.titulo}
                delay={(i % 3) * 90}
                className="group relative h-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.055] p-6 backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/10 sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-16 -right-16 size-32 rounded-full bg-flame-500/0 blur-2xl transition-colors duration-500 group-hover:bg-flame-500/20"
                />

                <span className="relative grid size-12 place-items-center rounded-xl bg-white/10 text-flame-400 transition-colors duration-300 group-hover:bg-flame-500 group-hover:text-white">
                  <Icon className="size-6" aria-hidden="true" />
                </span>

                <h3 className="relative mt-5 font-display text-lg font-extrabold text-white">
                  {item.titulo}
                </h3>
                <p className="relative mt-2 text-[0.9375rem] leading-relaxed text-navy-100">
                  {item.texto}
                </p>
              </Reveal>
            )
          })}
        </div>

        {soluciones.cta && (
          <Reveal delay={200} className="mt-12 flex justify-center">
            <Button href={waLink(WA_MESSAGES.general)} variant="primary" size="lg" arrow>
              {soluciones.cta}
            </Button>
          </Reveal>
        )}
      </div>
    </section>
  )
}
