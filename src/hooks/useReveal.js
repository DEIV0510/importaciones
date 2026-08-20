import { useEffect, useRef, useState } from 'react'

/** Detecta si el usuario pidió reducir el movimiento. */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Añade la clase `is-visible` cuando el elemento entra en pantalla.
 * Si el usuario pidió reducir movimiento, marca visible de inmediato.
 */
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null)
  // Si no hay animación posible (motion reducido o sin IntersectionObserver),
  // el contenido nace visible en lugar de aparecer tras un efecto.
  const [visible, setVisible] = useState(
    () => prefersReducedMotion() || typeof IntersectionObserver === 'undefined'
  )

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin, visible])

  return [ref, visible]
}
