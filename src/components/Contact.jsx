import { ArrowUpRight, MessageSquareText, Phone } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'
import { WhatsAppIcon, SOCIAL_ICONS } from './ui/BrandIcons'
import { PHONES, SOCIALS, WA_MESSAGES, waLink } from '../data/company'

export default function Contact() {
  return (
    <section
      id="contacto"
      aria-labelledby="contacto-titulo"
      className="scroll-mt-24 bg-shell py-20 sm:py-24 lg:py-28"
    >
      <div className="container-x">
        <SectionHeading
          id="contacto-titulo"
          eyebrow="Contacto"
          align="center"
          title="¿Qué necesitas para tu negocio?"
          subtitle="Cuéntanos qué producto estás buscando y nuestro equipo podrá orientarte."
        />

        {/* Líneas de WhatsApp */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {PHONES.map((p, i) => (
            <Reveal key={p.tel} delay={i * 100}>
              <a
                href={waLink(WA_MESSAGES.general, p.wa)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#128C4A]/40 hover:shadow-lift sm:p-6"
              >
                <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-[#128C4A] text-white transition-transform duration-300 group-hover:scale-105">
                  <WhatsAppIcon className="size-6" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[0.6875rem] font-bold tracking-[0.14em] text-muted uppercase">
                    WhatsApp
                  </span>
                  <span className="mt-0.5 block font-display text-xl font-extrabold text-ink">
                    {p.display}
                  </span>
                </span>

                <ArrowUpRight
                  className="size-5 shrink-0 text-muted transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#128C4A]"
                  aria-hidden="true"
                />
              </a>
            </Reveal>
          ))}
        </div>

        {/* Llamada directa */}
        <Reveal delay={200} className="mx-auto mt-4 max-w-3xl">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:gap-5">
            <span className="flex items-center gap-2 text-sm font-semibold text-body">
              <Phone className="size-4 text-flame-600" aria-hidden="true" />
              ¿Prefieres llamar?
            </span>
            <span className="flex flex-wrap justify-center gap-2">
              {PHONES.map((p) => (
                <a
                  key={p.tel}
                  href={`tel:${p.tel}`}
                  className="rounded-xl border-2 border-navy-800/15 px-4 py-2 font-display text-sm font-bold text-navy-800 transition-colors hover:border-navy-800/40 hover:bg-navy-50"
                >
                  {p.display}
                </a>
              ))}
            </span>
          </div>
        </Reveal>

        {/* Redes sociales */}
        <div className="mx-auto mt-14 max-w-4xl">
          <Reveal className="flex items-center gap-3">
            <MessageSquareText className="size-4 text-flame-600" aria-hidden="true" />
            <h3 className="font-display text-sm font-bold tracking-[0.14em] text-muted uppercase">
              Síguenos
            </h3>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </Reveal>

          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {SOCIALS.map((s, i) => {
              const Icon = SOCIAL_ICONS[s.id]
              return (
                <Reveal as="li" key={s.id} delay={i * 90} className="h-full">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full items-center gap-3.5 rounded-2xl border border-line bg-white p-4 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-navy-800/25 hover:shadow-card"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-800 transition-colors duration-300 group-hover:bg-navy-800 group-hover:text-white">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-sm font-extrabold text-ink">
                        {s.label}
                      </span>
                      <span className="block truncate text-xs text-body">{s.handle}</span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </a>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
