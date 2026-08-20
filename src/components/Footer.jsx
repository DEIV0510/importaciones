import { ArrowUp, MapPin, Phone } from 'lucide-react'
import { SocialIcon } from './ui/BrandIcons'
import { CATEGORIES } from '../data/categories'
import { ADDRESS, COMPANY, MAPS, NAV_LINKS, PHONES, SOCIALS } from '../data/company'

const YEAR = 2026

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-navy-100">
      <div aria-hidden="true" className="grid-lines absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(7,69,125,0.55),transparent_66%)] blur-2xl"
      />

      <div className="container-x relative">
        {/* Bloque principal */}
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
          {/* Marca */}
          <div>
            <picture className="contents">
              <source srcSet="/img/logo-220.webp" type="image/webp" />
              <img
                src="/img/logo-220.png"
                alt="Mundo Importaciones S.A.S."
                width="220"
                height="232"
                loading="lazy"
                className="h-24 w-auto"
              />
            </picture>

            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-navy-200">
              {COMPANY.description} Todo lo que tu taller, fábrica o emprendimiento necesita.
            </p>

            <ul className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label}: ${s.handle}`}
                    className="grid size-11 place-items-center rounded-xl border border-white/12 bg-white/5 text-navy-100 transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/12 hover:text-white"
                  >
                    <SocialIcon id={s.id} className="size-[1.15rem]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navegación */}
          <nav aria-labelledby="footer-nav">
            <h2
              id="footer-nav"
              className="font-display text-xs font-bold tracking-[0.16em] text-white uppercase"
            >
              Navegación
            </h2>
            {/* py-1.5 mantiene el área táctil por encima de 24px (WCAG 2.5.8) */}
            <ul className="mt-4 space-y-1">
              {[...NAV_LINKS, { href: '#ubicacion', label: 'Ubicación' }].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-block py-1.5 text-[0.9375rem] text-navy-200 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Líneas de producto */}
          <nav aria-labelledby="footer-lineas">
            <h2
              id="footer-lineas"
              className="font-display text-xs font-bold tracking-[0.16em] text-white uppercase"
            >
              Líneas
            </h2>
            <ul className="mt-4 space-y-1">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <a
                    href="#productos"
                    className="inline-block py-1.5 text-[0.9375rem] text-navy-200 transition-colors hover:text-white"
                  >
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div>
            <h2 className="font-display text-xs font-bold tracking-[0.16em] text-white uppercase">
              Contacto
            </h2>

            <ul className="mt-4 space-y-1">
              {PHONES.map((p) => (
                <li key={p.tel}>
                  <a
                    href={`tel:${p.tel}`}
                    className="flex items-center gap-2.5 py-1.5 text-[0.9375rem] font-semibold text-navy-100 transition-colors hover:text-white"
                  >
                    <Phone className="size-4 shrink-0 text-flame-400" aria-hidden="true" />
                    {p.display}
                  </a>
                </li>
              ))}
            </ul>

            <address className="mt-5 not-italic">
              <a
                href={MAPS.view}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-navy-200 transition-colors hover:text-white"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-flame-400" aria-hidden="true" />
                <span>
                  {ADDRESS.street}
                  <br />
                  {ADDRESS.area}
                  <br />
                  {ADDRESS.reference}
                </span>
              </a>
            </address>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
          <p className="text-center text-[0.8125rem] text-navy-300 sm:text-left">
            © {YEAR} {COMPANY.legalName} Todos los derechos reservados.
          </p>

          <a
            href="#inicio"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-[0.8125rem] font-semibold text-navy-100 transition-[background-color,border-color,color] hover:border-white/30 hover:bg-white/8 hover:text-white"
          >
            Volver arriba
            <ArrowUp className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}
