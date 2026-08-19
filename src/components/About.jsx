import { Boxes, Check, Handshake, Layers, PackageSearch } from 'lucide-react'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'
import Button from './ui/Button'
import { COMPANY, WA_MESSAGES, waLink } from '../data/company'

/** Los 4 bloques de propuesta de valor entregados por la empresa. */
const VALUES = [
  {
    icon: Boxes,
    title: 'Variedad',
    text: 'Amplio portafolio de insumos y productos.',
  },
  {
    icon: PackageSearch,
    title: 'Disponibilidad',
    text: 'Productos pensados para las necesidades de talleres y negocios.',
  },
  {
    icon: Handshake,
    title: 'Atención cercana',
    text: 'Atención directa y personalizada.',
  },
  {
    icon: Layers,
    title: 'Soluciones',
    text: 'Productos para diferentes procesos de confección, calzado y marroquinería.',
  },
]

const STATEMENTS = [
  'Un solo lugar para encontrar los insumos que tu negocio necesita.',
  'Variedad para diferentes procesos productivos.',
  'Atención cercana para negocios, talleres y emprendedores.',
]

export default function About() {
  return (
    <section
      id="nosotros"
      aria-labelledby="nosotros-titulo"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="grid-lines-light absolute inset-x-0 top-0 h-72 opacity-70 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
      />

      <div className="container-x relative">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
          {/* Columna narrativa */}
          <div>
            <SectionHeading
              id="nosotros-titulo"
              eyebrow="¿Por qué Mundo Importaciones?"
              title="Un solo lugar para encontrar los insumos que tu negocio necesita."
              subtitle={COMPANY.longDescription}
            />

            <ul className="mt-9 space-y-3.5">
              {STATEMENTS.map((text, i) => (
                <Reveal as="li" key={text} delay={i * 90} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-navy-800 text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="text-[0.9375rem] leading-relaxed font-medium text-body sm:text-base">
                    {text}
                  </span>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={280} className="mt-9">
              <Button href={waLink(WA_MESSAGES.general)} variant="navy" size="lg" arrow>
                Hablar con un asesor
              </Button>
            </Reveal>
          </div>

          {/* Bloques de propuesta de valor */}
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <Reveal
                key={title}
                delay={i * 90}
                className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-navy-800/25 hover:shadow-lift sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-navy-600 to-flame-500 transition-transform duration-400 group-hover:scale-x-100"
                />
                <span className="grid size-12 place-items-center rounded-xl bg-navy-50 text-navy-800 transition-colors duration-300 group-hover:bg-navy-800 group-hover:text-white">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
