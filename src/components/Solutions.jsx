import { Briefcase, Factory, Footprints, Rocket, Shirt, Wrench } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'
import Button from './ui/Button'
import { WA_MESSAGES, waLink } from '../data/company'

const AUDIENCES = [
  {
    icon: Wrench,
    title: 'Talleres',
    text: 'Repuestos, lámparas y consumibles para mantener las máquinas trabajando.',
  },
  {
    icon: Factory,
    title: 'Fábricas',
    text: 'Abastecimiento de insumos para procesos de producción continuos.',
  },
  {
    icon: Rocket,
    title: 'Emprendedores',
    text: 'Atención cercana para quienes están armando su negocio.',
  },
  {
    icon: Shirt,
    title: 'Negocios de confección',
    text: 'Cintas, elásticos y accesorios para prendas y terminaciones.',
  },
  {
    icon: Footprints,
    title: 'Negocios de calzado',
    text: 'Materiales e insumos para los distintos procesos del calzado.',
  },
  {
    icon: Briefcase,
    title: 'Marroquinería',
    text: 'Carnaza y materiales para bolsos, cinturones y accesorios.',
  },
]

export default function Solutions() {
  return (
    <section
      id="soluciones"
      aria-labelledby="soluciones-titulo"
      className="relative scroll-mt-24 overflow-hidden bg-navy-900 py-20 sm:py-24 lg:py-28"
    >
      {/* Fondo */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#062b4f_0%,#07457d_55%,#04213e_100%)]" />
        <div className="grid-lines absolute inset-0" />
        <div className="absolute top-1/3 -left-40 size-[32rem] rounded-full bg-[radial-gradient(circle,rgba(1,153,218,0.28),transparent_65%)] blur-2xl" />
        <div className="absolute -right-32 bottom-0 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.16),transparent_65%)] blur-2xl" />
      </div>

      <div className="container-x relative">
        <SectionHeading
          id="soluciones-titulo"
          eyebrow="Para quién trabajamos"
          tone="dark"
          align="center"
          title="Soluciones para quienes hacen que las cosas sucedan."
          subtitle="Somos el aliado de abastecimiento de negocios que producen todos los días."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, text }, i) => (
            <Reveal
              key={title}
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

              <h3 className="relative mt-5 font-display text-lg font-extrabold text-white">{title}</h3>
              <p className="relative mt-2 text-[0.9375rem] leading-relaxed text-navy-100">{text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-12 flex justify-center">
          <Button href={waLink(WA_MESSAGES.general)} variant="primary" size="lg" arrow>
            Cuéntanos qué necesitas
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
