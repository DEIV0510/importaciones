import Reveal from './Reveal'

/**
 * Encabezado de sección con etiqueta, título y bajada.
 * `tone='dark'` para secciones sobre azul corporativo.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = 'light',
  align = 'left',
  id,
  className = '',
}) {
  const dark = tone === 'dark'
  const centered = align === 'center'

  return (
    <div
      className={`${centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}
    >
      {eyebrow && (
        <Reveal
          className={`mb-4 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] uppercase ${
            centered ? 'justify-center' : ''
          } ${dark ? 'text-flame-400' : 'text-flame-600'}`}
        >
          <span
            aria-hidden="true"
            className={`h-px w-8 ${dark ? 'bg-flame-400/60' : 'bg-flame-600/50'}`}
          />
          {eyebrow}
        </Reveal>
      )}

      <Reveal delay={60}>
        <h2
          id={id}
          className={`text-[1.75rem] leading-[1.15] font-extrabold sm:text-4xl lg:text-[2.75rem] ${
            dark ? 'text-white' : 'text-ink'
          }`}
        >
          {title}
        </h2>
      </Reveal>

      {subtitle && (
        <Reveal delay={120}>
          <p
            className={`mt-4 text-base leading-relaxed sm:text-lg ${
              dark ? 'text-navy-100' : 'text-body'
            }`}
          >
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  )
}
