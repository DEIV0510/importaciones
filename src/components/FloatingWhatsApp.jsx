import { useEffect, useState } from 'react'
import { WhatsAppIcon } from './ui/BrandIcons'
import { PRIMARY_PHONE, WA_MESSAGES, waLink } from '../data/company'

/**
 * Botón flotante de WhatsApp.
 * Aparece tras salir del hero, con tooltip en escritorio y área táctil amplia
 * en móvil. Su posición usa safe-area para no chocar con la barra del sistema.
 */
export default function FloatingWhatsApp() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed right-4 bottom-4 z-[60] transition-[opacity,transform] duration-300 sm:right-6 sm:bottom-6 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <a
        href={waLink(WA_MESSAGES.general, PRIMARY_PHONE.wa)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Escribir por WhatsApp al ${PRIMARY_PHONE.display}`}
        className="group relative grid size-14 place-items-center rounded-full bg-[#128C4A] text-white shadow-[0_10px_28px_-8px_rgba(18,140,74,0.8)] transition-[background-color,transform] duration-200 hover:bg-[#0e733c] hover:scale-105 active:scale-95 sm:size-15"
      >
        {/* Halo */}
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse-ring rounded-full bg-[#128C4A]/45"
        />

        <WhatsAppIcon className="relative size-7 sm:size-8" />

        {/* Tooltip — solo escritorio */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-full mr-3 hidden origin-right scale-95 rounded-xl bg-navy-900 px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-white opacity-0 shadow-lift transition-[opacity,transform] duration-200 group-hover:scale-100 group-hover:opacity-100 lg:block"
        >
          Escríbenos por WhatsApp
          <span className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rotate-45 bg-navy-900" />
        </span>
      </a>
    </div>
  )
}
