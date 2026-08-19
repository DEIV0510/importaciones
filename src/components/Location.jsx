import { Building2, MapPin, Navigation } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'
import Button from './ui/Button'
import { WhatsAppIcon } from './ui/BrandIcons'
import { ADDRESS, MAPS, WA_MESSAGES, waLink } from '../data/company'

const DETAILS = [
  { icon: MapPin, label: 'Dirección', value: ADDRESS.street },
  { icon: Building2, label: 'Sector', value: ADDRESS.area },
  { icon: Navigation, label: 'Punto de referencia', value: ADDRESS.reference },
]

export default function Location() {
  return (
    <section
      id="ubicacion"
      aria-labelledby="ubicacion-titulo"
      className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
    >
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Datos */}
          <div>
            <SectionHeading
              id="ubicacion-titulo"
              eyebrow="Ubicación"
              title="Visítanos en el Centro de Medellín"
              subtitle="Estamos en pleno centro, con atención directa para negocios, talleres y emprendedores."
            />

            <ul className="mt-10 space-y-3">
              {DETAILS.map(({ icon: Icon, label, value }, i) => (
                <Reveal
                  as="li"
                  key={label}
                  delay={i * 90}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-shell p-4 sm:p-5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-800 text-white">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.6875rem] font-bold tracking-[0.14em] text-muted uppercase">
                      {label}
                    </span>
                    <span className="mt-0.5 block font-display text-[1.0625rem] font-extrabold text-ink">
                      {value}
                    </span>
                  </span>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={280} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href={MAPS.directions} variant="navy" size="lg" icon={Navigation}>
                Cómo llegar
              </Button>
              <Button
                href={waLink(WA_MESSAGES.location)}
                variant="whatsapp"
                size="lg"
                icon={WhatsAppIcon}
              >
                Escribir por WhatsApp
              </Button>
            </Reveal>
          </div>

          {/* Mapa */}
          <Reveal delay={120}>
            <div className="relative overflow-hidden rounded-3xl border border-line shadow-lift">
              <div className="aspect-4/3 w-full bg-navy-50 sm:aspect-16/12 lg:aspect-square">
                <iframe
                  title={`Mapa de la ubicación de Mundo Importaciones S.A.S. en ${ADDRESS.full}`}
                  src={MAPS.embed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="size-full border-0"
                />
              </div>

              {/* Ficha sobre el mapa — deja libre la atribución de Google al pie */}
              <div className="pointer-events-none absolute inset-x-3 bottom-8 sm:inset-x-4 sm:bottom-9">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3.5 shadow-card backdrop-blur sm:p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flame-600 text-white">
                    <MapPin className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-extrabold text-ink">
                      Mundo Importaciones S.A.S.
                    </p>
                    <p className="truncate text-xs text-body">
                      {ADDRESS.street} · {ADDRESS.area}
                    </p>
                  </div>
                  <a
                    href={MAPS.view}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-navy-800 transition-colors hover:bg-navy-50"
                  >
                    Abrir
                    <span className="sr-only"> en Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
