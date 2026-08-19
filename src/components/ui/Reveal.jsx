import { useReveal } from '../../hooks/useReveal'

/**
 * Envoltorio de animación de entrada al hacer scroll.
 * Respeta `prefers-reduced-motion` a través del hook y del CSS base.
 */
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const [ref, visible] = useReveal()

  return (
    <Tag
      ref={ref}
      style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
