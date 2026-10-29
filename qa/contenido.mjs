/**
 * Comprobación del contenido publicado. No necesita navegador ni servidor.
 *
 *   npm run qa:contenido
 *
 * Existe por un fallo real: el validador llegó a ser más estricto que el
 * contenido que ya estaba publicado, así que el panel aceptaba editar pero
 * rechazaba publicar. Esta prueba lo detecta en un segundo.
 */
import { readFileSync, existsSync } from 'node:fs'
import { crearInforme } from './lib.mjs'
import {
  validarCategorias, validarMedios, validarProductos, validarSite, usosDeImagen,
  anclasDisponibles, precio, PRECIO_MAXIMO,
} from '../src/content/validacion.js'
import { formatearPrecio } from '../src/content/formato.js'

const leer = (f) => JSON.parse(readFileSync(`src/content/${f}`, 'utf8'))

const inf = crearInforme('CONTENIDO PUBLICADO')

const site = leer('site.json')
const categorias = leer('categories.json')
const productos = leer('products.json')
const medios = leer('media.json')

// ------------------------------------------------- pasa su propia validación
let validado = null
try {
  const cats = validarCategorias(categorias)
  const prods = validarProductos(productos, new Set(cats.map((c) => c.id)))
  const s = validarSite(site)
  validarMedios(medios)
  validado = { site: s, cats, prods }
  inf.check('El contenido publicado pasa su propia validación', true)
} catch (err) {
  inf.check('El contenido publicado pasa su propia validación', false, `${err.campo ?? ''}: ${err.message}`)
}

const idsMediosLogo = new Set(medios.map((m) => m.id))

/**
 * Validar no debe cambiar el contenido.
 *
 * Esto nació de un fallo real: `texto()` hacía trim() a todo, y eso se comió
 * los espacios de los extremos del titular. El resultado en vivo fue
 * «taller,fábricao emprendimiento». Como el panel valida en cada publicación,
 * un validador que altera valores los corrompe poco a poco, publicación tras
 * publicación, sin que nadie toque esos campos.
 */
if (validado) {
  const sinSello = (s) => {
    const copia = JSON.parse(JSON.stringify(s))
    delete copia.actualizado
    delete copia.actualizadoPor
    return copia
  }

  const diferencias = []
  const comparar = (a, b, ruta = '') => {
    for (const k of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
      const r = ruta ? `${ruta}.${k}` : k
      const va = a?.[k]
      const vb = b?.[k]
      if (va && vb && typeof va === 'object' && typeof vb === 'object') comparar(va, vb, r)
      else if (JSON.stringify(va) !== JSON.stringify(vb)) {
        diferencias.push(`${r}: ${JSON.stringify(va)} → ${JSON.stringify(vb)}`)
      }
    }
  }
  comparar(sinSello(site), sinSello(validado.site))
  comparar(categorias, validado.cats)
  comparar(productos, validado.prods)

  inf.check('Validar no altera el contenido publicado', diferencias.length === 0,
    diferencias.slice(0, 4).join(' · '))
}

// -------------------------------------------------- las imágenes existen ---
const EXT = { sm: 'webp', lg: 'webp', fallback: 'png', hero: 'webp' }

const faltantes = []
for (const m of medios) {
  for (const v of m.variantes ?? []) {
    const ruta = `public/img/${m.id}-${v}.${EXT[v] ?? 'webp'}`
    if (!existsSync(ruta)) faltantes.push(ruta)
  }
}
inf.check('Todos los archivos de la biblioteca existen', faltantes.length === 0,
  faltantes.slice(0, 5).join(', '))

// El logo usa las mismas variantes que el resto de la biblioteca
inf.check('El logotipo está en la biblioteca',
  idsMediosLogo.has(site.identidad.logo), site.identidad.logo)
inf.check('El logotipo tiene sus archivos',
  existsSync(`public/img/${site.identidad.logo}-sm.webp`) &&
  existsSync(`public/img/${site.identidad.logo}-fallback.png`),
  site.identidad.logo)

// ------------------------------------- las referencias apuntan a algo real --
const idsMedios = new Set(medios.map((m) => m.id))
const rotas = []
const revisar = (id, donde) => { if (id && !idsMedios.has(id)) rotas.push(`${donde} → ${id}`) }

site.hero.vitrina.forEach((v) => revisar(v.imagen, `vitrina «${v.label}»`))
site.ctaFinal.imagenes.forEach((x, i) => revisar(x, `cierre ${i + 1}`))
categorias.forEach((c) => revisar(c.imagen, `categoría «${c.nombre}»`))
productos.forEach((p) => {
  revisar(p.imagen, `producto «${p.nombre}»`)
  ;(p.galeria ?? []).forEach((g) => revisar(g, `galería de «${p.nombre}»`))
})
inf.check('Ninguna sección apunta a una imagen inexistente', rotas.length === 0, rotas.slice(0, 5).join(' · '))

// La vitrina del hero necesita la variante «hero»
const sinHero = site.hero.vitrina
  .filter((v) => v.imagen)
  .filter((v) => !medios.find((m) => m.id === v.imagen)?.variantes?.includes('hero'))
  .map((v) => v.imagen)
inf.check('Las fotos de la vitrina tienen su variante «hero»', sinHero.length === 0, sinHero.join(', '))

// --------------------------------------------------- coherencia interna ----
const idsCategorias = new Set(categorias.map((c) => c.id))
const huerfanos = productos
  .filter((p) => !(p.categorias ?? []).some((c) => idsCategorias.has(c)))
  .map((p) => p.nombre)
inf.check('Todos los productos tienen una línea existente', huerfanos.length === 0, huerfanos.join(', '))

const anclas = anclasDisponibles(site.secciones)
const navRotas = site.navegacion.enlaces
  .filter((l) => l.visible !== false && l.href.startsWith('#') && !anclas.has(l.href))
  .map((l) => `${l.label} → ${l.href}`)
inf.check('Ningún enlace del menú apunta a una sección oculta', navRotas.length === 0, navRotas.join(', '))

// Nadie debe quedarse sin forma de contactar
inf.check('Hay al menos un teléfono', site.contacto.telefonos.length > 0)
inf.check('Hay al menos una red social visible',
  site.contacto.redes.some((r) => r.visible !== false))

// --------------------------------------------------------- sin secretos ----
const crudo = readFileSync('src/content/site.json', 'utf8')
inf.check('El contenido no incluye secretos',
  !/(ADMIN_PASSWORD|AUTH_SECRET|GITHUB_TOKEN|ghp_|github_pat_)/i.test(crudo))

// Una imagen en uso no debería poder borrarse: se comprueba la función
if (validado) {
  const enUso = productos.find((p) => p.imagen)?.imagen
  inf.check('Detecta cuándo una imagen está en uso',
    usosDeImagen(enUso, { site, categorias, productos }).length > 0, enUso)
  inf.check('No inventa usos para una imagen libre',
    usosDeImagen('imagen-inexistente-xyz', { site, categorias, productos }).length === 0)
}

// ------------------------------------------------------------- precios ----
// Ningún precio publicado lo puso nadie: hasta que el dueño los escriba, todos null.
inf.check('Todos los productos traen precio y unidad (null si no hay)',
  productos.every((p) => 'precio' in p && 'precioUnidad' in p))

const aceptaPrecio = (v) => { try { return precio(v) } catch { return 'ERROR' } }
inf.check('Sin precio es null', [null, undefined, ''].every((v) => aceptaPrecio(v) === null))
inf.check('Acepta un entero en pesos', aceptaPrecio(12500) === 12500)
inf.check('Acepta cifras en texto', aceptaPrecio('12500') === 12500)
inf.check('Rechaza 0, negativos y decimales',
  [0, -5, 12.5, '0', '-5', '12.5'].every((v) => aceptaPrecio(v) === 'ERROR'))
// «12.000» daría 12 si se interpretara como número: debe rechazarse, no adivinarse
inf.check('Rechaza «12.000» y «12,000» en lugar de leerlos mal',
  ['12.000', '12,000', '$12000', '12 000', 'abc'].every((v) => aceptaPrecio(v) === 'ERROR'))
inf.check('Rechaza un precio por encima del tope',
  aceptaPrecio(PRECIO_MAXIMO + 1) === 'ERROR' && aceptaPrecio(PRECIO_MAXIMO) === PRECIO_MAXIMO)

const muestra = (extra) => validarProductos([{ id: 'p', nombre: 'P', categorias: [], ...extra }])[0]
inf.check('La unidad se descarta si no hay precio',
  muestra({ precioUnidad: 'por metro' }).precioUnidad === null)
inf.check('La unidad se conserva junto a un precio',
  muestra({ precio: 3000, precioUnidad: 'por metro' }).precioUnidad === 'por metro')
inf.check('Una unidad demasiado larga se rechaza', (() => {
  try { muestra({ precio: 3000, precioUnidad: 'x'.repeat(31) }); return false } catch { return true }
})())

inf.check('El formato separa los miles con punto',
  formatearPrecio(500) === '$500' && formatearPrecio(1500) === '$1.500' &&
  formatearPrecio(12500) === '$12.500' && formatearPrecio(1250000) === '$1.250.000')
inf.check('Sin precio válido el formato es vacío',
  [null, 0, -1, 1.5, undefined].every((v) => formatearPrecio(v) === ''))

process.exit(inf.resumen() ? 0 : 1)
