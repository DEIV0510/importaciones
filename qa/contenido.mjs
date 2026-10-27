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
  anclasDisponibles,
} from '../src/content/validacion.js'

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

process.exit(inf.resumen() ? 0 : 1)
