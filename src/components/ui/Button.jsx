import { ArrowRight } from 'lucide-react'

const BASE =
  'group/btn relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-[background-color,color,box-shadow,transform] duration-200 ease-out ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-55'

const VARIANTS = {
  /* Naranja de acción — 4.56:1 con texto blanco (AA) */
  primary:
    'bg-flame-600 text-white shadow-cta hover:bg-flame-700 hover:shadow-[0_10px_26px_-10px_rgb(185_61_0/0.75)]',
  /* Azul corporativo */
  navy: 'bg-navy-800 text-white hover:bg-navy-850 shadow-[0_8px_22px_-12px_rgb(7_69_125/0.9)]',
  /* Contorno sobre fondo claro */
  outline:
    'border-2 border-navy-800/20 bg-white text-navy-800 hover:border-navy-800/45 hover:bg-navy-50',
  /* Contorno sobre fondo oscuro */
  ghostLight:
    'border-2 border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/12',
  /* WhatsApp */
  whatsapp: 'bg-[#128C4A] text-white hover:bg-[#0e733c] shadow-[0_8px_22px_-12px_rgb(18_140_74/0.9)]',
}

const SIZES = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-[0.9375rem]',
  lg: 'h-14 px-7 text-base',
}

/**
 * Botón/enlace del sistema de diseño.
 * Se renderiza como <a> si recibe `href`, y como <button> en caso contrario.
 */
export default function Button({
  as,
  href,
  variant = 'primary',
  size = 'md',
  arrow = false,
  icon: Icon,
  className = '',
  children,
  ...rest
}) {
  const Tag = as || (href ? 'a' : 'button')
  const isExternal = href?.startsWith('http')

  const external = isExternal
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <Tag
      href={href}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...external}
      {...(Tag === 'button' && !rest.type ? { type: 'button' } : {})}
      {...rest}
    >
      {Icon && <Icon className="size-[1.15em] shrink-0" aria-hidden="true" />}
      <span>{children}</span>
      {arrow && (
        <ArrowRight
          className="size-[1.05em] shrink-0 transition-transform duration-200 ease-out group-hover/btn:translate-x-1"
          aria-hidden="true"
        />
      )}
    </Tag>
  )
}
