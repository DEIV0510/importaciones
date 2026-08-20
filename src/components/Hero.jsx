import { MapPin, PackageCheck, Scissors, Wrench } from 'lucide-react'
import Button from './ui/Button'
import ProductImage from './ui/ProductImage'
import { ADDRESS, COMPANY, WA_MESSAGES, waLink } from '../data/company'

/**
 * Vitrina del hero: cuatro productos reales en una rejilla 2×2.
 * Se eligieron por cubrir líneas distintas (cintas, máquinas, lámparas) y por
 * tener colores que contrastan entre sí sobre el azul corporativo.
 */
const SHOWCASE = [
  {
    name: 'cinta-raso-azul',
    alt: 'Rollos de cinta raso en tonos azules',
    caption: 'Cinta raso',
    priority: true,
  },
  {
    name: 'cinta-faya-rosada',
    alt: 'Rollos de cinta faya en tonos rosados',
    caption: 'Cinta faya',
  },
  {
    name: 'cortadora-compacta',
    alt: 'Máquina cortadora de confección',
    caption: 'Cortadoras',
  },
  {
    name: 'lampara-led-brazo',
    alt: 'Lámpara LED de brazo flexible para máquina de coser',
    caption: 'Lámparas',
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
      className="relative flex min-h-svh items-center overflow-hidden bg-navy-900 pt-26 pb-16 sm:pt-32 lg:pt-40 lg:pb-24"
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
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-navy-950/45" />
      </div>

      <div className="container-x relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* ---------------- Vitrina de producto ----------------
              En móvil va primero: lo primero que se ve son los productos.
              El orden del DOM no cambia, así el <h1> sigue encabezando la página. */}
          <div className="order-1 mx-auto w-full max-w-[19rem] sm:max-w-sm lg:order-2 lg:max-w-none">
            <div className="relative">
              {/* Halo detrás de la rejilla */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.14),transparent_68%)]"
              />
              {/* Marco sutil que agrupa la vitrina */}
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2rem] border border-white/10 bg-white/[0.03] sm:-inset-4"
              />

              <ul className="relative grid grid-cols-2 items-start gap-3 sm:gap-5">
                {SHOWCASE.map((item, i) => (
                  <li
                    key={item.name}
                    className={`relative grid aspect-square place-items-center ${
                      // La segunda columna baja un poco: da ritmo sin desordenar.
                      // Va con margen, no con translate, para que el marco de la
                      // vitrina crezca y siga conteniendo las fotos.
                      i % 2 === 1 ? 'mt-4 sm:mt-7' : ''
                    }`}
                  >
                    <ProductImage
                      name={item.name}
                      alt={item.alt}
                      tier="lg"
                      loading={item.priority ? 'eager' : 'lazy'}
                      fetchPriority={item.priority ? 'high' : undefined}
                      sizes="(min-width: 1024px) 20vw, 42vw"
                      className="max-h-[86%] max-w-[86%] drop-shadow-[0_22px_38px_rgba(0,0,0,0.45)]"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---------------- Columna de texto ---------------- */}
          <div className="order-2 max-w-2xl lg:order-1">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 py-1.5 pr-4 pl-2 text-[0.8125rem] font-semibold text-navy-100 backdrop-blur-sm">
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
        </div>
      </div>
    </section>
  )
}
