import Button from './ui/Button'
import Reveal from './ui/Reveal'
import ProductImage from './ui/ProductImage'
import { WA_MESSAGES, waLink } from '../data/company'

export default function FinalCTA() {
  return (
    <section aria-labelledby="cta-final-titulo" className="bg-shell pb-20 sm:pb-24 lg:pb-28">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[1.75rem] bg-navy-900 px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          {/* Fondo */}
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(125deg,#04213e_0%,#07457d_52%,#062b4f_100%)]" />
            <div className="grid-lines absolute inset-0" />
            <div className="absolute -top-24 -right-16 size-96 rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.26),transparent_66%)] blur-2xl" />
            <div className="absolute -bottom-28 -left-20 size-80 rounded-full bg-[radial-gradient(circle,rgba(1,153,218,0.3),transparent_66%)] blur-2xl" />
            <svg
              className="absolute -top-8 right-0 h-[140%] w-auto text-white/[0.06]"
              viewBox="0 0 400 400"
              fill="none"
            >
              <path d="M-20 340C100 220 240 120 460 70" stroke="currentColor" strokeWidth="2" />
              <path d="M-20 390C120 260 280 160 480 110" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-bold tracking-[0.14em] text-flame-300 uppercase">
                Mundo Importaciones S.A.S.
              </p>

              <h2
                id="cta-final-titulo"
                className="mt-5 text-[1.875rem] leading-[1.1] font-extrabold text-white sm:text-4xl lg:text-[2.75rem]"
              >
                Encuentra los insumos que tu negocio necesita.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
                Conoce nuestro portafolio y comunícate con Mundo Importaciones.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href={waLink(WA_MESSAGES.quote)} variant="primary" size="lg" arrow>
                  Solicitar cotización
                </Button>
                <Button href="#productos" variant="ghostLight" size="lg">
                  Ver productos
                </Button>
              </div>
            </div>

            {/* Composición de producto */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto aspect-square w-full max-w-sm">
                <div
                  aria-hidden="true"
                  className="absolute inset-[6%] rounded-full border border-white/12"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_66%)]"
                />

                <figure className="absolute top-[2%] left-[4%] w-[52%] animate-float-slow">
                  <ProductImage
                    name="cinta-faya-clasica"
                    alt=""
                    aria-hidden="true"
                    tier="sm"
                    className="w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
                  />
                </figure>
                <figure
                  className="absolute right-[2%] bottom-[16%] w-[46%] animate-float-mid"
                  style={{ animationDelay: '800ms' }}
                >
                  <ProductImage
                    name="carnaza-natural"
                    alt=""
                    aria-hidden="true"
                    tier="sm"
                    className="w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
                  />
                </figure>
                <figure
                  className="absolute bottom-[2%] left-[12%] w-[38%] animate-float-mid"
                  style={{ animationDelay: '1500ms' }}
                >
                  <ProductImage
                    name="bobinas"
                    alt=""
                    aria-hidden="true"
                    tier="sm"
                    className="w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
                  />
                </figure>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
