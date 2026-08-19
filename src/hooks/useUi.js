import { useEffect, useState } from 'react'

/** `true` cuando la página ha bajado más de `offset` píxeles. */
export function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])

  return scrolled
}

/**
 * Bloquea el scroll del body mientras `locked` sea true (menú móvil y modal),
 * compensando el ancho de la barra de scroll para que el layout no salte.
 */
export function useBodyLock(locked) {
  useEffect(() => {
    if (!locked) return

    const { body, documentElement } = document
    const prevOverflow = body.style.overflow
    const prevPadding = body.style.paddingRight
    const gap = window.innerWidth - documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPadding
    }
  }, [locked])
}

/** Ejecuta `onClose` al presionar Escape. */
export function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, onClose])
}

/**
 * Marca cuál sección está a la vista para resaltar el enlace activo del menú.
 * @param {string[]} ids  ids de sección, sin '#'.
 */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    )

    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [ids])

  return active
}

/** Encierra el foco dentro de `containerRef` mientras `active` sea true. */
export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return
    const node = containerRef.current
    if (!node) return

    const selector =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const items = Array.from(node.querySelectorAll(selector)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (!items.length) return

      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => node.removeEventListener('keydown', onKeyDown)
  }, [containerRef, active])
}
