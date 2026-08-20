import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../hooks/useReveal'

const MIN_VISIBLE = 700 // ms — evita un parpadeo brusco en conexiones rápidas
const MAX_VISIBLE = 2200 // ms — nunca retiene la página más de esto

/**
 * Pantalla de carga corporativa.
 * Logo oficial + arco en órbita y líneas de ruta (importación · distribución).
 * Desaparece sola en cuanto la página está lista y se desmonta tras el fundido.
 */
export default function LoadingScreen() {
  const [done, setDone] = useState(false) // empieza el fundido de salida
  const [gone, setGone] = useState(false) // se retira del DOM

  useEffect(() => {
    const started = Date.now()
    const reduced = prefersReducedMotion()
    let hideTimer

    const finish = () => {
      const elapsed = Date.now() - started
      const wait = reduced ? 0 : Math.max(0, MIN_VISIBLE - elapsed)
      hideTimer = setTimeout(() => setDone(true), wait)
    }

    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })

    const safety = setTimeout(() => setDone(true), MAX_VISIBLE)

    return () => {
      window.removeEventListener('load', finish)
      clearTimeout(hideTimer)
      clearTimeout(safety)
    }
  }, [])

  // Bloquea el scroll mientras la cortina está visible
  useEffect(() => {
    if (gone) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [gone])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 620)
    return () => clearTimeout(t)
  }, [done])

  if (gone) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando Mundo Importaciones"
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-navy-900 transition-opacity duration-[600ms] ease-out ${
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Malla técnica de fondo */}
      <div className="grid-lines absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(1,153,218,0.28),transparent_62%)]"
        aria-hidden="true"
      />

      {/* Líneas de ruta que cruzan la pantalla */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 space-y-14" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative h-px w-full overflow-hidden bg-white/8">
            <span
              className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-flame-500 to-transparent animate-sweep"
              style={{ animationDelay: `${i * 260}ms` }}
            />
          </div>
        ))}
      </div>

      <div className="relative flex flex-col items-center px-6">
        {/* Logo con arco en órbita */}
        <div className="relative grid size-40 place-items-center sm:size-48">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full animate-orbit text-flame-500"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="46 245"
            />
          </svg>
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-white/12" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>

          <picture>
            <source srcSet="/img/logo-220.webp" type="image/webp" />
            <img
              src="/img/logo-220.png"
              alt="Mundo Importaciones S.A.S."
              width="220"
              height="232"
              className="w-[62%] drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
              fetchPriority="high"
            />
          </picture>
        </div>

        <p className="mt-8 text-center font-display text-xs font-bold tracking-[0.34em] text-navy-200 uppercase sm:text-sm">
          Importación · Distribución
        </p>

        {/* Indicador de progreso */}
        <div className="relative mt-5 h-[3px] w-44 overflow-hidden rounded-full bg-white/12 sm:w-56">
          <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-navy-500 to-flame-500 animate-sweep" />
        </div>
      </div>
    </div>
  )
}
