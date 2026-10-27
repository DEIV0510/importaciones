import { useContent } from '../../content/ContentContext'

/**
 * Logotipo de la empresa.
 *
 * Lo elige el panel (Identidad → Logotipo) de la biblioteca de medios, así que
 * usa exactamente las mismas variantes que cualquier otra imagen. Antes tenía
 * nombres propios (logo-220, logo-440) y eso lo dejaba fuera de la biblioteca:
 * el panel no podía cambiarlo y el validador rechazaba las publicaciones.
 *
 * Está centralizado aquí para que la navegación, el pie y la pantalla de carga
 * no repitan la ruta: al cambiarlo, cambia en los tres sitios a la vez.
 */
export default function Logo({ className = '', tier = 'sm', ...rest }) {
  const { COMPANY } = useContent()
  const base = COMPANY.logo || 'logo'

  return (
    <picture className="contents">
      <source srcSet={`/img/${base}-${tier}.webp`} type="image/webp" />
      <img
        src={`/img/${base}-fallback.png`}
        alt={COMPANY.legalName}
        className={className}
        {...rest}
      />
    </picture>
  )
}
