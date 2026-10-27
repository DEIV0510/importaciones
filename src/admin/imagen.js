/**
 * Preparación de imágenes en el navegador.
 *
 * Todo el trabajo pesado ocurre aquí, antes de subir: así al servidor solo
 * llegan archivos pequeños y el repositorio no engorda con fotos de 4 MB.
 * Reproduce el mismo tratamiento que recibieron las fotos originales, para
 * que una imagen nueva encaje con las que ya están.
 */

const MAX_ORIGEN = 1600 // píxeles del lado largo antes de procesar

export const TAMANOS = {
  sm: 400,
  lg: 800,
  fallback: 560,
  hero: 900,
}

/** Lee un File y lo convierte en una imagen ya decodificada. */
export function cargarImagen(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo.type.startsWith('image/')) {
      reject(new Error('Ese archivo no es una imagen.'))
      return
    }
    if (archivo.size > 25 * 1024 * 1024) {
      reject(new Error('La imagen pesa más de 25 MB. Usa una más liviana.'))
      return
    }
    const url = URL.createObjectURL(archivo)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')) }
    img.src = url
  })
}

function lienzo(ancho, alto) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(ancho))
  c.height = Math.max(1, Math.round(alto))
  return c
}

/** Dibuja la imagen reduciéndola si hace falta. */
export function aLienzo(img) {
  const escala = Math.min(1, MAX_ORIGEN / Math.max(img.naturalWidth, img.naturalHeight))
  const c = lienzo(img.naturalWidth * escala, img.naturalHeight * escala)
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return c
}

/**
 * Quita el fondo liso partiendo de los bordes.
 *
 * Avanza desde el borde hacia dentro y solo borra píxeles conectados al borde
 * y parecidos al color de las esquinas. Al no borrar por color suelto, un
 * detalle blanco DENTRO del producto se conserva.
 *
 * @param {number} tolerancia  0-100. Más alto, más agresivo.
 */
export function quitarFondo(canvasOrigen, tolerancia = 12) {
  const { width: w, height: h } = canvasOrigen
  const ctx = canvasOrigen.getContext('2d', { willReadFrequently: true })
  const datos = ctx.getImageData(0, 0, w, h)
  const px = datos.data

  // Color de referencia: la mediana aproximada de las cuatro esquinas
  const esquinas = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([x, y]) => {
    const i = (y * w + x) * 4
    return [px[i], px[i + 1], px[i + 2]]
  })
  const ref = [0, 1, 2].map((c) => Math.round(esquinas.reduce((a, e) => a + e[c], 0) / 4))

  const umbral = (tolerancia / 100) * 441 // distancia máxima en RGB
  const visitado = new Uint8Array(w * h)
  const cola = []

  const parecido = (i) => {
    const d = Math.hypot(px[i] - ref[0], px[i + 1] - ref[1], px[i + 2] - ref[2])
    return d <= umbral
  }

  for (let x = 0; x < w; x++) {
    cola.push(x, (h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    cola.push(y * w, y * w + w - 1)
  }

  while (cola.length) {
    const p = cola.pop()
    if (visitado[p]) continue
    visitado[p] = 1
    const i = p * 4
    if (!parecido(i)) continue
    px[i + 3] = 0

    const x = p % w
    const y = (p / w) | 0
    if (x > 0) cola.push(p - 1)
    if (x < w - 1) cola.push(p + 1)
    if (y > 0) cola.push(p - w)
    if (y < h - 1) cola.push(p + w)
  }

  // Suaviza el filo: deja semitransparentes los píxeles que tocan el vacío
  const copia = new Uint8ClampedArray(px)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      if (copia[i + 3] === 0) continue
      const vecinos = [i - 4, i + 4, i - w * 4, i + w * 4]
      if (vecinos.some((v) => copia[v + 3] === 0)) px[i + 3] = Math.min(px[i + 3], 170)
    }
  }

  ctx.putImageData(datos, 0, 0)
  return canvasOrigen
}

/** Recorta el borde totalmente transparente. */
export function recortar(canvasOrigen) {
  const { width: w, height: h } = canvasOrigen
  const ctx = canvasOrigen.getContext('2d', { willReadFrequently: true })
  const px = ctx.getImageData(0, 0, w, h).data

  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) return canvasOrigen // imagen vacía: se devuelve tal cual

  const destino = lienzo(x1 - x0 + 1, y1 - y0 + 1)
  destino.getContext('2d').drawImage(canvasOrigen, x0, y0, destino.width, destino.height, 0, 0, destino.width, destino.height)
  return destino
}

/** Centra el contenido en un lienzo cuadrado con aire alrededor. */
function aCuadrado(origen, margen = 1.08) {
  const lado = Math.round(Math.max(origen.width, origen.height) * margen)
  const c = lienzo(lado, lado)
  c.getContext('2d').drawImage(
    origen,
    Math.round((lado - origen.width) / 2),
    Math.round((lado - origen.height) / 2)
  )
  return c
}

/** Añade un margen proporcional sin cuadrar: lo que usa la vitrina del hero. */
function conMargen(origen, factor = 0.04) {
  const mx = Math.round(origen.width * factor)
  const my = Math.round(origen.height * factor)
  const c = lienzo(origen.width + mx * 2, origen.height + my * 2)
  c.getContext('2d').drawImage(origen, mx, my)
  return c
}

function redimensionar(origen, maxLado) {
  const escala = Math.min(1, maxLado / Math.max(origen.width, origen.height))
  const c = lienzo(origen.width * escala, origen.height * escala)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(origen, 0, 0, c.width, c.height)
  return c
}

function aBase64(canvas, tipo, calidad) {
  const url = canvas.toDataURL(tipo, calidad)
  if (!url.startsWith(`data:${tipo}`)) {
    throw new Error(`Tu navegador no sabe exportar ${tipo}. Prueba con Chrome, Edge o Firefox.`)
  }
  return url.split(',')[1]
}

/**
 * Genera las cuatro variantes que consume el sitio.
 * @returns {{variantes:Object, vistaPrevia:string, bytes:number}}
 */
export function generarVariantes(img, { quitarFondo: quitar = false, tolerancia = 12 } = {}) {
  let base = aLienzo(img)
  if (quitar) base = quitarFondo(base, tolerancia)
  base = recortar(base)

  const cuadrado = aCuadrado(base)
  const ajustado = conMargen(base)

  const variantes = {
    sm: aBase64(redimensionar(cuadrado, TAMANOS.sm), 'image/webp', 0.82),
    lg: aBase64(redimensionar(cuadrado, TAMANOS.lg), 'image/webp', 0.82),
    fallback: aBase64(redimensionar(cuadrado, TAMANOS.fallback), 'image/png'),
    hero: aBase64(redimensionar(ajustado, TAMANOS.hero), 'image/webp', 0.84),
  }

  const bytes = Object.values(variantes).reduce((a, b) => a + Math.ceil((b.length * 3) / 4), 0)

  return {
    variantes,
    vistaPrevia: `data:image/webp;base64,${variantes.lg}`,
    bytes,
  }
}

/** Convierte un nombre de archivo en un identificador válido. */
export function nombreAId(nombre) {
  return nombre
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
