import { MapPin, PackageCheck, Scissors, Wrench } from 'lucide-react'
import Button from './ui/Button'
import ProductImage from './ui/ProductImage'
import { ADDRESS, COMPANY, WA_MESSAGES, waLink } from '../data/company'

/** Piezas de la composición del hero: producto real + posición + ritmo de flotación. */
const COMPOSITION = [
  {
    name: 'cinta-raso-azul',
    alt: 'Rollos de cinta raso en tonos azules',
    className: 'left-[2%] top-[1%] w-[40%] sm:left-[6%] sm:top-[4%] sm:w-[46%]',
    anim: 'animate-float-slow',
    delay: '0ms',
    priority: true,
    mobile: true,
  },
  {
    name: 'cinta-faya-rosada',
    alt: 'Rollos de cinta faya en tonos rosados',
    className: 'right-[0%] top-[6%] w-[38%] sm:right-[2%] sm:top-[15%] sm:w-[42%]',
    anim: 'animate-float-mid',
    delay: '900ms',
    mobile: true,
  },
  {
    name: 'cortadora-compacta',
    alt: 'Máquina cortadora de confección',
    className: 'left-[0%] bottom-[0%] w-[27%] sm:left-[2%] sm:bottom-[3%] sm:w-[33%]',
    anim: 'animate-float-mid',
    delay: '1600ms',
    mobile: true,
  },
  {
    name: 'lampara-led-brazo',
    alt: 'Lámpara LED de brazo flexible para máquina de coser',
    className: 'right-[0%] bottom-[0%] w-[31%] sm:right-[1%] sm:bottom-[1%] sm:w-[38%]',
    anim: 'animate-float-slow',
    delay: '450ms',
    mobile: true,
  },
  {
    name: 'elastico-espigado',
    alt: 'Elásticos espigados en tonos tierra',
    className: 'left-[31%] top-[45%] w-[31%]',
    anim: 'animate-float-mid',
    delay: '1200ms',
  },
]

const PILLARS = [
  { icon: Scissors, label: 'Confección' },
  { icon: PackageCheck, label: 'Marroquinería y calzado' },
  { icon: Wrench, label: 'Repuestos de máquina' },
]

export default function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-titulo"
      className="relative flex min-h-svh items-center overflow-hidden bg-navy-900 pt-32 pb-16 lg:pt-40 lg:pb-24"
    >
      {/* Fondo */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,#04213e_0%,#07457d_48%,#062b4f_100%)]" />
        <div className="grid-lines absolute inset-0" />
        <div className="absolute -top-32 -right-24 size-[38rem] rounded-full bg-[radial-gradient(circle,rgba(1,153,218,0.34),transparent_66%)] blur-2xl" />
        <div className="absolute -bottom-40 -left-32 size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.18),transparent_66%)] blur-2xl" />
        {/* Arcos que evocan el trazo del logo */}
        <svg
          className="absolute -top-[18%] -right-[12%] h-[130%] w-auto text-white/[0.07]"
          viewBox="0 0 600 600"
          fill="none"
        >
          <path d="M-40 480C120 300 320 150 640 90" stroke="currentColor" strokeWidth="2" />
          <path d="M-40 540C140 350 360 200 660 140" stroke="currentColor" strokeWidth="2" />
          <path d="M-40 600C160 400 400 250 680 190" stroke="currentColor" strokeWidth="2" />
        </svg>
        {/* Degradado de salida hacia la sección siguiente */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-navy-950/45" />
      </div>

      <div className="container-x relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 xl:gap-16">
          {/* ---------------- Columna de texto ---------------- */}
          <div className="max-w-2xl">
            <p className="reveal is-visible inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 py-1.5 pr-4 pl-2 text-[0.8125rem] font-semibold text-navy-100 backdrop-blur-sm">
              <span className="rounded-full bg-flame-500 px-2.5 py-0.5 text-[0.6875rem] font-bold tracking-wider text-white uppercase">
                Importación
              </span>
              Distribución para talleres, fábricas y emprendimientos
            </p>

            <h1
              id="hero-titulo"
              className="mt-6 text-[2.25rem] leading-[1.06] font-extrabold text-white sm:text-5xl lg:text-[3.5rem] xl:text-[3.9rem]"
            >
              Todo lo que tu taller,{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">fábrica</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1 z-0 h-[0.28em] rounded-full bg-flame-500/70"
                />
              </span>{' '}
              o emprendimiento necesita.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
              {COMPANY.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={waLink(WA_MESSAGES.quote)} variant="primary" size="lg" arrow>
                Solicitar cotización
              </Button>
              <Button href="#productos" variant="ghostLight" size="lg">
                Ver productos
              </Button>
            </div>

            {/* Pilares */}
            <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/12 pt-7">
              {PILLARS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm font-semibold text-navy-100">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-flame-400">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <p className="mt-6 flex items-center gap-2 text-sm text-navy-200">
              <MapPin className="size-4 shrink-0 text-flame-400" aria-hidden="true" />
              {ADDRESS.street} · {ADDRESS.area}
            </p>
          </div>

          {/* ---------------- Composición de producto ---------------- */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Algo más baja en móvil para no alargar el hero */}
            <div className="relative aspect-5/4 w-full sm:aspect-square">
              {/* Halo y anillos */}
              <div
                aria-hidden="true"
                className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0)_64%)]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-[10%] rounded-full border border-white/12"
              />
              <div
                aria-hidden="true"
                className="absolute inset-[22%] rounded-full border border-dashed border-white/10"
              />

              {COMPOSITION.map((item) => (
                <figure
                  key={item.name}
                  className={`absolute ${item.className} ${item.anim} ${
                    item.mobile ? '' : 'hidden sm:block'
                  }`}
                  style={{ animationDelay: item.delay }}
                >
                  <ProductImage
                    name={item.name}
                    alt={item.alt}
                    tier="lg"
                    loading={item.priority ? 'eager' : 'lazy'}
                    fetchPriority={item.priority ? 'high' : undefined}
                    sizes="(min-width: 1024px) 22vw, 40vw"
                    className="w-full drop-shadow-[0_26px_44px_rgba(0,0,0,0.45)]"
                  />
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
