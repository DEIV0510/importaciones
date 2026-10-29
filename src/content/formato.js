/**
 * Formato de precios, compartido por el sitio y el panel.
 *
 * Se arma a mano en lugar de usar Intl: en español, Intl no agrupa los números
 * de cuatro cifras («1500» en vez de «1.500»), y un precio que cambia de
 * aspecto según el navegador no sirve. Los pesos colombianos no llevan
 * decimales, así que basta con separar los miles con punto.
 */
export function formatearPrecio(valor) {
  if (!Number.isInteger(valor) || valor <= 0) return ''
  return `$${String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}
