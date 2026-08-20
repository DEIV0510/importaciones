# MUNDO IMPORTACIONES S.A.S. — Sitio web corporativo

Sitio corporativo y catálogo visual para **Mundo Importaciones S.A.S.**, importador y
distribuidor de insumos de confección, calzado, marroquinería y repuestos para máquinas
en el Centro de Medellín.

**Objetivo de conversión:** que el visitante contacte a la empresa por WhatsApp.

El recorrido es deliberadamente corto: del hero se pasa directo al catálogo.
No hay sección «Nosotros» — se retiró junto con sus bloques de propuesta de
valor para no interponer texto entre la portada y los productos.

---

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5254
npm run build    # genera dist/
npm run preview  # sirve dist/ para revisarlo
```

## Tecnología

| Pieza | Elección |
|---|---|
| Framework | React 19 + Vite 8 |
| Estilos | Tailwind CSS 4 (`@theme`, sin archivo de configuración JS) |
| Iconos | `lucide-react` + SVG propios para logotipos de marca |
| Animación | CSS puro + `IntersectionObserver` (sin librerías de animación) |

No se usa Framer Motion: las animaciones necesarias (entrada al hacer scroll, flotación,
hover, marquesina) se resuelven con CSS, lo que evita kilobytes de JavaScript y respeta
`prefers-reduced-motion` de forma nativa.

---

## Estructura

```
public/
  img/                 fotos de producto (webp + png de respaldo) e iconos
  og-image.jpg         imagen para redes sociales
  favicon.png · apple-touch-icon.png · site.webmanifest
  robots.txt · sitemap.xml
src/
  data/
    company.js         NAP, teléfonos, redes, enlaces de WhatsApp y Google Maps
    categories.js      las 8 líneas del catálogo
    products.js        catálogo de productos
  hooks/
    useReveal.js       animación de entrada + detección de motion reducido
    useUi.js           scroll, bloqueo de body, Escape, foco atrapado, sección activa
  components/
    ui/                Button · ProductImage · Reveal · SectionHeading · BrandIcons
    LoadingScreen · Navbar · Hero · Marquee · Products
    CategoryCard · ProductCard · ProductModal · Solutions
    Location · Contact · FinalCTA · Footer · FloatingWhatsApp
```

---

## Cómo ampliar el catálogo

Todo el catálogo vive en `src/data/products.js`; no hay productos escritos dentro del HTML.

**1. Prepara las fotos.** Con fondo transparente y el producto centrado. Guarda en
`public/img/` con este patrón:

```
<slug>-sm.webp        ~400 px  (tarjetas del catálogo)
<slug>-lg.webp        ~800 px  (modal)
<slug>-fallback.png   ~560 px  (navegadores sin WebP)
```

Estas tres van sobre **lienzo cuadrado**, para que la grilla del catálogo se vea
pareja. Los cinco productos de la vitrina del hero tienen además un recorte
ajustado al contorno (`<slug>-hero.webp` y `<slug>-hero.png`), porque allí cada
panel tiene su propia proporción y el lienzo cuadrado dejaba las fotos pequeñas.

**2. Añade el producto** a la lista `PRODUCTS`:

```js
{
  id: 'mi-producto',           // único
  name: 'Nombre del producto',
  categories: ['cintas'],      // uno o varios ids de categories.js
  image: 'mi-producto',        // nombre base del archivo, o null si aún no hay foto
  gallery: ['mi-producto', 'mi-producto-2'],  // opcional
  description: 'Texto corto.', // opcional
  featured: true,              // opcional: lo sube al principio de la grilla
}
```

Un producto con `image: null` se muestra con un marcador gráfico y el botón
«Consultar disponibilidad», sin romper la maquetación.

---

## Datos de la empresa

Se editan en un solo lugar: `src/data/company.js`.

Todo el contenido del sitio proviene del material entregado por la empresa.
**No se inventaron** años de experiencia, número de clientes, países de origen,
certificaciones, marcas aliadas, testimonios, premios, horarios ni precios.

### Pendiente de confirmar con el cliente

- **URL real de Facebook.** La empresa entregó el nombre de la página
  («MUNDO IMPORTACIONES SAS»), no su dirección. El enlace actual lleva a la búsqueda de
  ese nombre en Facebook; reemplázalo en `SOCIALS` cuando tengas la URL definitiva.
- **Horario de atención.** No se publicó porque no fue suministrado. Si lo confirmas,
  puede añadirse a la sección de ubicación y a los datos estructurados
  (`openingHoursSpecification` en `index.html`).
- **Dominio definitivo.** `index.html`, `robots.txt` y `sitemap.xml` usan
  `https://mundoimportaciones.vercel.app`. Cámbialo al dominio real antes de publicar.

---

## Sistema visual

Los colores se muestrearon directamente de los píxeles del logotipo oficial:

| Token | Valor | Uso |
|---|---|---|
| `navy-800` | `#07457D` | azul principal del logo |
| `navy-600` | `#0C7DC3` | azul medio del logo |
| `navy-500` | `#0199DA` | azul brillante del logo |
| `flame-600` | `#D04800` | fondo de los CTA (4,56:1 con texto blanco → AA) |
| `flame-500` | `#FF6B1A` | acentos e iconos sobre azul oscuro |

El naranja de los botones es un tono más profundo que el de los acentos precisamente
para cumplir el contraste AA con texto blanco; el naranja vivo se reserva para
elementos gráficos sobre fondo oscuro, donde sí lo cumple.

Tipografías: **Manrope** (títulos) e **Inter** (texto), servidas desde Google Fonts.

El logotipo no se rediseñó, recortó ni recoloreó en ningún punto del sitio.

---

## Accesibilidad y rendimiento

- HTML semántico, un solo `<h1>`, jerarquía de encabezados sin saltos.
- `alt` en todas las imágenes; los elementos decorativos usan `aria-hidden`.
- Navegación completa por teclado: foco visible, enlace «saltar al contenido»,
  foco atrapado y devuelto en el modal y el menú móvil, cierre con `Escape`.
- Áreas táctiles de 24 px o más en toda la interfaz.
- `prefers-reduced-motion` desactiva animaciones y muestra la marquesina estática.
- Imágenes en WebP con respaldo PNG, `loading="lazy"` salvo en el hero,
  y `object-fit: contain` para no deformar ninguna fotografía.

Verificado sin scroll horizontal, sin imágenes rotas y sin errores de consola en
1920, 1440, 1366, 1024, 768, 430, 390 y 375 px.

---

## Despliegue

Proyecto Vite estático: `npm run build` genera `dist/`.

En Vercel se detecta automáticamente (comando `npm run build`, salida `dist`).
