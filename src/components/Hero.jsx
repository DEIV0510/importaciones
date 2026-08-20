import { MapPin, PackageCheck, Scissors, Wrench } from 'lucide-react'
import Button from './ui/Button'
import ProductImage from './ui/ProductImage'
import { ADDRESS, COMPANY, WA_MESSAGES, waLink } from '../data/company'

/**
 * Vitrina del hero: bento de productos reales sobre paneles de vidrio.
 *
 * En escritorio cada pieza tiene la proporción de su fotografía —los rollos
 * altos van en piezas verticales y los elásticos en una horizontal— para que
 * ningún producto quede diminuto dentro de su panel.
 * En móvil se reduce a una rejilla 2×2 para no empujar el titular fuera de
 * pantalla.
 */
const SHOWCASE = [
  {
    name: 'cinta-faya-rosada',
    label: 'Cinta faya',
    alt: 'Rollos de cinta faya en tonos rosados',
    span: 'lg:col-span-2 lg:row-span-2',
    pad: 'p-3 sm:p-4 lg:p-6',
    delay: '0ms',
    featured: true,
    priority: true,
  },
  {
    name: 'cinta-raso-azul',
    label: 'Cinta raso',
    alt: 'Rollos de cinta raso en tonos azules',
    span: 'lg:row-span-2',
    pad: 'p-2.5 sm:p-3 lg:p-4',
    delay: '900ms',
  },
  {
    name: 'cortadora-compacta',
    label: 'Cortadoras',
    alt: 'Máquina cortadora de confección',
    span: 'lg:row-span-2',
    pad: 'p-2.5 sm:p-3 lg:p-4',
    delay: '1500ms',
  },
  {
    name: 'lampara-led-flexible',
    label: 'Lámparas',
    alt: 'Lámpara LED de brazo flexible para máquina de coser',
    span: 'lg:col-span-2',
    pad: 'p-2.5 sm:p-3 lg:p-3',
    delay: '600ms',
  },
  {
    name: 'elastico-espigado',
    label: 'Elásticos',
    alt: 'Elásticos espigados en tonos tierra',
    span: 'lg:col-span-2 max-lg:hidden',
    pad: 'p-2.5 sm:p-3 lg:p-3',
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
      className="relative flex min-h-svh items-center overflow-hidden bg-navy-900 pt-26 pb-16 sm:pt-32 lg:pt-40 lg:pb-24"
    >
      {/* Fondo */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,#04213e_0%,#07457d_48%,#062b4f_100%)]" />
        <div className="grid-lines absolute inset-0" />
        <div className="absolute -top-32 -right-24 size-[38rem] rounded-full bg-[radial-gradient(circle,rgba(1,153,218,0.34),transparent_66%)] blur-2xl" />
        <div className="absolute -bottom-40 -left-32 size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.18),transparent_66%)] blur-2xl" />
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
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* ---------------- Vitrina de producto ----------------
              En móvil va primero: lo primero que se ve son los productos.
              El orden del DOM no cambia, así el <h1> sigue encabezando la página. */}
          <div className="order-1 mx-auto w-full max-w-[21rem] sm:max-w-md lg:order-2 lg:max-w-none">
            <div className="relative">
              {/* Foco de luz detrás de la vitrina */}
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-[3rem] bg-[radial-gradient(circle_at_50%_38%,rgba(120,200,255,0.20),transparent_70%)] blur-xl"
              />

              {/* La tercera fila es algo más alta para que las piezas anchas
                  (lámparas y elásticos) no queden demasiado apaisadas */}
              <ul className="relative grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:aspect-4/3 lg:grid-cols-4 lg:grid-rows-[1fr_1fr_1.35fr]">
                {SHOWCASE.map((item) => (
                  <li
                    key={item.name}
                    className={`group/tile relative aspect-square overflow-hidden rounded-2xl border backdrop-blur-sm transition-[border-color,background-color] duration-500 lg:aspect-auto ${
                      item.featured
                        ? 'border-white/20 bg-white/[0.085] hover:border-flame-500/45'
                        : 'border-white/12 bg-white/[0.055] hover:border-white/28'
                    } ${item.span}`}
                  >
                    {/* Brillo interior del panel */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 ${
                        item.featured
                          ? 'bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.20),transparent_64%)]'
                          : 'bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.12),transparent_62%)]'
                      }`}
                    />
                    {/* Filo superior iluminado */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                    {/* Destello naranja al pasar el cursor */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -bottom-10 size-28 rounded-full bg-flame-500/0 blur-2xl transition-colors duration-500 group-hover/tile:bg-flame-500/25"
                    />

                    {/* Fotografía — ocupa el panel entero; la etiqueta va encima */}
                    <div className={`absolute inset-0 flex items-center justify-center ${item.pad}`}>
                      <ProductImage
                        name={item.name}
                        alt={item.alt}
                        tier="hero"
                        fallback="hero"
                        loading={item.priority ? 'eager' : 'lazy'}
                        fetchPriority={item.priority ? 'high' : undefined}
                        sizes="(min-width: 1024px) 24vw, 44vw"
                        className={`max-h-full max-w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out group-hover/tile:scale-[1.06] ${
                          item.featured ? 'animate-float-slow' : 'animate-float-mid'
                        }`}
                        style={{ animationDelay: item.delay }}
                      />
                    </div>

                    {/* Etiqueta — aria-hidden porque el alt de la foto ya la nombra */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-w-0 items-center gap-1.5 bg-gradient-to-t from-navy-950/60 via-navy-950/25 to-transparent px-2 pt-7 pb-2.5 font-bold text-white uppercase sm:gap-2 sm:px-3 sm:pb-3 ${
                        item.featured
                          ? 'text-[0.5625rem] tracking-[0.14em] sm:text-[0.6875rem]'
                          : // en portátiles de 1024px los paneles verticales son
                            // los más estrechos: ahí la etiqueta baja de tamaño
                            'text-[0.5rem] tracking-[0.08em] sm:text-[0.5625rem] lg:text-[0.5rem] xl:text-[0.625rem]'
                      }`}
                    >
                      {/* En 1024-1279px los paneles verticales no dan para el
                          guion decorativo sin recortar el texto */}
                      <span
                        className={`h-px w-2.5 shrink-0 bg-flame-500 sm:w-3.5 ${
                          item.featured ? '' : 'lg:hidden xl:block'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
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
