/**
 * Imagen de producto.
 *
 * Sirve WebP con respaldo PNG y nunca deforma la fotografía (object-contain).
 * Las fotos se generan con fondo transparente y el producto centrado, por lo
 * que encajan sobre cualquier fondo del sitio.
 *
 * `tier`: 'sm' para tarjetas del catálogo, 'lg' para el modal y el hero.
 */
export default function ProductImage({
  name,
  alt,
  tier = 'sm',
  /** Respaldo PNG. Por defecto el del catálogo; el hero usa su propio recorte. */
  fallback = 'fallback',
  className = '',
  loading = 'lazy',
  fetchPriority,
  sizes,
  ...rest
}) {
  if (!name) return null

  return (
    // `contents` saca al <picture> del layout: la <img> queda como hijo directo
    // del contenedor, así hereda su centrado y sus porcentajes sin desalinearse.
    <picture className="contents">
      <source srcSet={`/img/${name}-${tier}.webp`} type="image/webp" sizes={sizes} />
      <img
        src={`/img/${name}-${fallback}.png`}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={`object-contain ${className}`}
        {...rest}
      />
    </picture>
  )
}
