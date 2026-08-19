import { useEffect, useRef, useState } from 'react'
import { MapPin, Menu, Phone, X } from 'lucide-react'
import Button from './ui/Button'
import { WhatsAppIcon, SOCIAL_ICONS } from './ui/BrandIcons'
import {
  ADDRESS,
  NAV_LINKS,
  PHONES,
  SOCIALS,
  WA_MESSAGES,
  waLink,
} from '../data/company'
import { useActiveSection, useBodyLock, useEscape, useFocusTrap, useScrolled } from '../hooks/useUi'

const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1))

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled(40)
  const active = useActiveSection(SECTION_IDS)
  const panelRef = useRef(null)
  const toggleRef = useRef(null)

  useBodyLock(open)
  useEscape(open, () => setOpen(false))
  useFocusTrap(panelRef, open)

  // Cierra el menú si la ventana pasa a escritorio
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e) => e.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Devuelve el foco al botón al cerrar
  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  const solid = scrolled || open

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-lg focus:bg-navy-800 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
          solid
            ? 'bg-white/92 shadow-nav backdrop-blur-xl supports-[backdrop-filter]:bg-white/80'
            : 'bg-transparent'
        }`}
      >
        {/* Barra de utilidades — solo escritorio, se oculta al bajar */}
        <div
          className={`hidden overflow-hidden border-b border-white/10 bg-navy-900 text-navy-100 transition-[max-height,opacity] duration-300 lg:block ${
            scrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'
          }`}
        >
          <div className="container-x flex h-10 items-center justify-between text-[0.8125rem]">
            <p className="flex items-center gap-2">
              <MapPin className="size-3.5 text-flame-400" aria-hidden="true" />
              <span>
                {ADDRESS.street} · {ADDRESS.area} · {ADDRESS.reference}
              </span>
            </p>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                {PHONES.map((p) => (
                  <a
                    key={p.tel}
                    href={`tel:${p.tel}`}
                    className="flex items-center gap-1.5 rounded transition-colors hover:text-white"
                  >
                    <Phone className="size-3.5 text-flame-400" aria-hidden="true" />
                    {p.display}
                  </a>
                ))}
              </div>

              <span className="h-4 w-px bg-white/20" aria-hidden="true" />

              <ul className="flex items-center gap-3">
                {SOCIALS.map((s) => {
                  const Icon = SOCIAL_ICONS[s.id]
                  return (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${s.label}: ${s.handle}`}
                        className="block rounded text-navy-200 transition-colors hover:text-white"
                      >
                        <Icon className="size-4" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Barra principal */}
        <nav aria-label="Navegación principal" className="container-x">
          <div
            className={`flex items-center justify-between gap-4 transition-[height] duration-300 ${
              scrolled ? 'h-[4.75rem]' : 'h-[5.25rem] lg:h-[6.25rem]'
            }`}
          >
            <a
              href="#inicio"
              aria-label="Mundo Importaciones S.A.S. — Inicio"
              className="flex shrink-0 items-center rounded-lg"
            >
              <picture>
                <source srcSet="/img/logo-220.webp" type="image/webp" />
                <img
                  src="/img/logo-220.png"
                  alt="Mundo Importaciones S.A.S."
                  width="220"
                  height="232"
                  className={`w-auto transition-[height,filter] duration-300 ${
                    scrolled ? 'h-14 sm:h-15' : 'h-15 sm:h-18 lg:h-20'
                  } ${solid ? '' : 'drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]'}`}
                />
              </picture>
            </a>

            {/* Enlaces — escritorio */}
            <ul className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => {
                const isActive = active === link.href.slice(1)
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      aria-current={isActive ? 'true' : undefined}
                      className={`relative rounded-lg px-3.5 py-2 text-[0.9375rem] font-semibold transition-colors after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-flame-500 after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                        solid
                          ? isActive
                            ? 'text-navy-800 after:scale-x-100'
                            : 'text-body hover:text-navy-800'
                          : isActive
                            ? 'text-white after:scale-x-100'
                            : 'text-white/85 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-2">
              {/* `max-sm:hidden` (media query) gana sobre el `inline-flex` base del botón */}
              <Button
                href={waLink(WA_MESSAGES.quote)}
                variant="primary"
                size="sm"
                arrow
                className="whitespace-nowrap max-sm:hidden"
              >
                Solicitar cotización
              </Button>

              <a
                href={waLink(WA_MESSAGES.quote)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Solicitar cotización por WhatsApp"
                className="grid size-11 place-items-center rounded-xl bg-flame-600 text-white transition-colors hover:bg-flame-700 sm:hidden"
              >
                <WhatsAppIcon className="size-5" />
              </a>

              <button
                ref={toggleRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="menu-movil"
                aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                className={`grid size-11 place-items-center rounded-xl border transition-colors lg:hidden ${
                  solid
                    ? 'border-line bg-white text-navy-800 hover:bg-navy-50'
                    : 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Menú móvil */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
          onClick={close}
          className={`absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          id="menu-movil"
          ref={panelRef}
          className={`absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto overscroll-contain rounded-b-3xl bg-white pt-[5.75rem] pb-7 shadow-2xl transition-transform duration-300 ease-out ${
            open ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="container-x">
            <ul className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={close}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 font-display text-lg font-bold text-ink transition-colors hover:bg-navy-50 active:bg-navy-100"
                  >
                    {link.label}
                    <span aria-hidden="true" className="text-flame-500">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <Button href={waLink(WA_MESSAGES.quote)} variant="primary" size="lg" arrow className="w-full">
                Solicitar cotización
              </Button>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                Líneas de atención
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PHONES.map((p) => (
                  <a
                    key={p.tel}
                    href={`tel:${p.tel}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-navy-50 px-3 py-3 text-[0.9375rem] font-semibold text-navy-800"
                  >
                    <Phone className="size-4 shrink-0 text-flame-600" aria-hidden="true" />
                    {p.display}
                  </a>
                ))}
              </div>

              <p className="mt-4 flex items-start gap-2 text-sm text-body">
                <MapPin className="mt-0.5 size-4 shrink-0 text-flame-600" aria-hidden="true" />
                <span>
                  {ADDRESS.street}
                  <br />
                  {ADDRESS.area} · {ADDRESS.reference}
                </span>
              </p>

              <ul className="mt-4 flex items-center gap-2">
                {SOCIALS.map((s) => {
                  const Icon = SOCIAL_ICONS[s.id]
                  return (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${s.label}: ${s.handle}`}
                        className="grid size-11 place-items-center rounded-xl border border-line text-navy-800 transition-colors hover:border-navy-800/30 hover:bg-navy-50"
                      >
                        <Icon className="size-[1.15rem]" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
