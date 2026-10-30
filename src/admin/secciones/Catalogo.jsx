import { useId, useMemo, useState } from 'react'
import { Plus, Search, Star, Upload } from 'lucide-react'
import { useEditor } from '../estado'
import { Miniatura, SelectorImagen, SubirImagenModal } from '../medios'
import { Area, Boton, Campo, Fila, Interruptor, Lista, Panel, Texto, Vacio, claseInput } from '../ui'
import { formatearPrecio } from '../../content/formato'
import { PRECIO_MAXIMO } from '../../content/validacion'

const sinAcentos = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const idDesde = (nombre) =>
  sinAcentos(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || `item-${Date.now()}`

/* ========================================================================== */

function Categorias() {
  const { categorias, productos, set } = useEditor()

  const anadir = () =>
    set('categories', [
      ...categorias,
      {
        id: idDesde(`linea-${categorias.length + 1}`),
        nombre: 'Nueva línea',
        corto: 'Nueva',
        descripcion: '',
        imagen: null,
        visible: true,
        orden: categorias.length,
      },
    ])

  return (
    <Panel
      titulo={`Líneas del catálogo (${categorias.length})`}
      descripcion="Son las tarjetas de «Todo para tu producción» y los filtros del catálogo. El orden de esta lista es el que verá el visitante."
    >
      <Lista
        ruta="categories"
        items={categorias}
        minimo={1}
        alAnadir={anadir}
        textoAnadir="Añadir línea"
        tituloEliminar={(cat) => `¿Eliminar la línea «${cat.nombre}»?`}
        mensajeEliminar={(cat) => {
          const n = productos.filter((p) => p.categorias?.includes(cat.id)).length
          if (!n) return 'Desaparecerá del panel. El sitio público no cambia hasta que publiques.'
          return (
            `${n} producto${n === 1 ? '' : 's'} ${n === 1 ? 'está' : 'están'} en esta línea. ` +
            `No se ${n === 1 ? 'borra' : 'borran'}: solo dejan de pertenecer a ella, y luego ` +
            'podrás elegirles otra desde su ficha en Productos.'
          )
        }}
        // Sin esto, los productos seguían apuntando a una línea que ya no
        // existía: no se veían en su ficha y el servidor rechazaba publicar.
        alEliminar={(cat) =>
          set(
            'products',
            productos.map((p) =>
              p.categorias?.includes(cat.id)
                ? { ...p, categorias: p.categorias.filter((x) => x !== cat.id) }
                : p
            )
          )
        }
        render={(cat, i) => {
          const usada = productos.filter((p) => p.categorias?.includes(cat.id)).length
          return (
            <div className="grid gap-3">
              <Fila>
                <Texto ruta={`categories.${i}.nombre`} etiqueta="Nombre completo" max={80} />
                <Texto ruta={`categories.${i}.corto`} etiqueta="Nombre corto" max={40}
                  ayuda="El que aparece en los botones de filtro." />
              </Fila>
              <Area ruta={`categories.${i}.descripcion`} etiqueta="Descripción" max={400} filas={2} />
              <SelectorImagen ruta={`categories.${i}.imagen`} etiqueta="Imagen de la tarjeta" permitirVacio />
              <Interruptor ruta={`categories.${i}.visible`} etiqueta="Mostrar esta línea" />
              <p className="text-xs text-slate-500">
                Identificador: <code className="rounded bg-slate-100 px-1">{cat.id}</code> · {usada}{' '}
                producto{usada === 1 ? '' : 's'} la usan.
                {usada > 0 && ' Si la ocultas, sus productos siguen en el catálogo pero sin este filtro.'}
              </p>
            </div>
          )
        }}
      />
    </Panel>
  )
}

/* ========================================================================== */

/**
 * Precio de un producto, en pesos.
 *
 * Solo deja escribir cifras: lo que se pega con puntos, comas o el signo $ se
 * limpia. Debajo se muestra tal como lo verá el cliente, que es la forma más
 * rápida de notar un cero de más. Vacío = sin precio (el sitio invita a
 * consultarlo).
 */
function CampoPrecio({ indice }) {
  const { get, set } = useEditor()
  const id = useId()
  const ruta = `products.${indice}.precio`
  const precio = get(ruta)
  const unidad = get(`products.${indice}.precioUnidad`)

  const alEscribir = (e) => {
    const cifras = e.target.value.replace(/\D/g, '').slice(0, String(PRECIO_MAXIMO).length)
    const n = Number(cifras)
    set(ruta, n > 0 ? n : null)
  }

  const vista = formatearPrecio(precio)

  return (
    <Campo
      etiqueta="Precio (pesos)"
      id={id}
      ayuda={
        vista
          ? `En el sitio se verá: ${vista}${unidad ? ` ${unidad}` : ''}`
          : 'Déjalo vacío si no quieres publicar el precio: el sitio invitará a consultarlo por WhatsApp.'
      }
    >
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400">$</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          className={`${claseInput} pl-7`}
          value={precio ?? ''}
          placeholder="Sin precio"
          onChange={alEscribir}
        />
      </div>
    </Campo>
  )
}

/** Crear una línea sin salir de la ficha del producto. */
function NuevaLinea({ onCrear }) {
  const [abierta, setAbierta] = useState(false)
  const [nombre, setNombre] = useState('')

  if (!abierta) {
    return (
      <button type="button" onClick={() => setAbierta(true)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-400 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-sky-600 hover:text-sky-700">
        <Plus className="size-3" aria-hidden="true" />
        Nueva línea
      </button>
    )
  }

  const cerrar = () => { setAbierta(false); setNombre('') }
  const enviar = () => { if (onCrear(nombre)) cerrar() }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <input
        autoFocus
        aria-label="Nombre de la nueva línea"
        className={`${claseInput} min-w-0 flex-1 basis-48`}
        maxLength={80}
        placeholder="Ej.: Hilos y agujas"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); enviar() }
          if (e.key === 'Escape') cerrar()
        }}
      />
      <Boton variante="primario" onClick={enviar} disabled={!nombre.trim()}>Crear y añadir</Boton>
      <Boton onClick={cerrar}>Cancelar</Boton>
    </div>
  )
}

function Productos({ irALineas }) {
  const { productos, categorias, medios, set, avisar } = useEditor()
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [subiendoGaleria, setSubiendoGaleria] = useState(null) // índice del producto

  // Líneas que existen. Un producto puede seguir apuntando a una que ya no (se
  // borró, o viene de un borrador antiguo): esas referencias no se ven entre
  // las opciones y el servidor se niega a publicar con ellas.
  const idsLineas = useMemo(() => new Set(categorias.map((c) => c.id)), [categorias])
  const huerfanas = (p) => (p.categorias ?? []).filter((x) => !idsLineas.has(x))
  const sinLinea = (p) => !(p.categorias ?? []).some((x) => idsLineas.has(x))
  const aRevisar = productos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => huerfanas(p).length > 0 || sinLinea(p))

  const filtrados = useMemo(() => {
    const q = sinAcentos(busqueda.trim())
    if (!q) return productos.map((p, i) => ({ p, i }))
    return productos
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => sinAcentos(p.nombre).includes(q) || p.id.includes(q))
  }, [productos, busqueda])

  const anadir = () => {
    const nuevo = {
      id: `producto-${Date.now()}`,
      nombre: 'Nuevo producto',
      categorias: categorias[0] ? [categorias[0].id] : [],
      imagen: null,
      galeria: null,
      descripcion: null,
      precio: null,
      precioUnidad: null,
      destacado: false,
      visible: true,
      orden: productos.length,
    }
    set('products', [...productos, nuevo])
    setAbierto(productos.length)
    setBusqueda('')
    avisar('Producto creado. Complétalo y recuerda publicar.', 'info')
  }

  const mover = (i, delta) => {
    const destino = i + delta
    if (destino < 0 || destino >= productos.length) return
    const copia = [...productos]
    ;[copia[i], copia[destino]] = [copia[destino], copia[i]]
    set('products', copia.map((p, k) => ({ ...p, orden: k })))
    setAbierto(destino)
  }

  const eliminar = (i) => {
    set('products', productos.filter((_, k) => k !== i))
    setAbierto(null)
  }

  const alternarCategoria = (i, id) => {
    const actuales = productos[i].categorias ?? []
    const nuevas = actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]
    // Cuentan solo las líneas que existen: una huérfana no sostiene al producto
    if (!nuevas.some((x) => idsLineas.has(x))) {
      avisar('Un producto debe pertenecer al menos a una línea.', 'error')
      return
    }
    set(`products.${i}.categorias`, nuevas)
  }

  const quitarHuerfana = (i, id) =>
    set(`products.${i}.categorias`, (productos[i].categorias ?? []).filter((x) => x !== id))

  /** Crea la línea y deja el producto dentro de ella. Devuelve false si no se pudo. */
  const crearLinea = (i, nombre) => {
    const limpio = nombre.trim().slice(0, 80)
    if (!limpio) return false
    const repetida = categorias.find(
      (c) => sinAcentos(c.nombre) === sinAcentos(limpio) || sinAcentos(c.corto) === sinAcentos(limpio)
    )
    if (repetida) {
      avisar(`Ya existe la línea «${repetida.nombre}»: elígela en la lista.`, 'error')
      return false
    }
    const base = idDesde(limpio)
    let id = base
    for (let n = 2; idsLineas.has(id); n++) id = `${base}-${n}`
    set('categories', [
      ...categorias,
      { id, nombre: limpio, corto: limpio.slice(0, 40), descripcion: '', imagen: null, visible: true, orden: categorias.length },
    ])
    // Si el producto apuntaba a una línea borrada con este mismo identificador,
    // queda enlazado de nuevo: no se duplica.
    set(`products.${i}.categorias`, [...new Set([...(productos[i].categorias ?? []), id])])
    avisar(`Línea «${limpio}» creada y añadida a este producto.`)
    return true
  }

  const alternarGaleria = (i, idImagen) => {
    const actual = productos[i].galeria ?? []
    const nueva = actual.includes(idImagen) ? actual.filter((x) => x !== idImagen) : [...actual, idImagen]
    set(`products.${i}.galeria`, nueva.length ? nueva : null)
  }

  return (
    <Panel
      titulo={`Productos (${productos.length})`}
      descripcion="Si un producto no tiene foto, el sitio muestra un marcador discreto con «Consultar disponibilidad» en lugar de dejar un hueco."
      acciones={
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full min-w-0 sm:w-48">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input className={`${claseInput} pl-9`} placeholder="Buscar…" value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <Boton variante="primario" icono={Plus} onClick={anadir}>Nuevo</Boton>
        </div>
      }
    >
      {aRevisar.length > 0 && (
        <div data-aviso-lineas role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            {aRevisar.length === 1
              ? '1 producto necesita que le elijas una línea'
              : `${aRevisar.length} productos necesitan que les elijas una línea`}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {aRevisar.slice(0, 4).map(({ p }) => p.nombre).join(', ')}
            {aRevisar.length > 4 ? ` y ${aRevisar.length - 4} más` : ''}.
            Apuntan a una línea que ya no existe o no tienen ninguna. Mientras sigan así, el
            panel no podrá publicar.
          </p>
          <Boton className="mt-3" onClick={() => { setBusqueda(''); setAbierto(aRevisar[0].i) }}>
            Revisar {aRevisar.length === 1 ? 'el producto' : 'el primero'}
          </Boton>
        </div>
      )}

      {!filtrados.length && <Vacio>Ningún producto coincide con «{busqueda}».</Vacio>}

      <ul className="grid gap-2">
        {filtrados.map(({ p, i }) => (
          <li key={p.id} className="rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3 p-3">
              <Miniatura id={p.imagen} className="size-12 shrink-0 p-1" />

              <button type="button" onClick={() => setAbierto(abierto === i ? null : i)}
                className="min-w-0 flex-1 text-left" aria-expanded={abierto === i}>
                <span className="flex items-center gap-1.5">
                  <span className={`truncate text-sm font-semibold ${p.visible === false ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {p.nombre}
                  </span>
                  {p.destacado && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Destacado" />}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {(p.categorias ?? []).filter((c) => idsLineas.has(c))
                    .map((c) => categorias.find((x) => x.id === c).corto).join(' · ')}
                  {huerfanas(p).length > 0 && (
                    <span className="font-semibold text-amber-700">
                      {sinLinea(p) ? '' : ' · '}
                      {huerfanas(p).length === 1 ? 'una línea eliminada' : `${huerfanas(p).length} líneas eliminadas`}
                    </span>
                  )}
                  {sinLinea(p) && huerfanas(p).length === 0 && (
                    <span className="font-semibold text-amber-700">Sin línea</span>
                  )}
                  {p.precio ? ` · ${formatearPrecio(p.precio)}` : ''}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1 max-sm:w-full max-sm:justify-end max-sm:border-t max-sm:border-slate-100 max-sm:pt-2">
                <Boton variante="fantasma" className="!px-2" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">↑</Boton>
                <Boton variante="fantasma" className="!px-2" onClick={() => mover(i, 1)} disabled={i === productos.length - 1} aria-label="Bajar">↓</Boton>
                <Boton onClick={() => setAbierto(abierto === i ? null : i)}>
                  {abierto === i ? 'Cerrar' : 'Editar'}
                </Boton>
              </div>
            </div>

            {abierto === i && (
              <div className="grid gap-4 border-t border-slate-200 bg-slate-50/60 p-4">
                {/* El identificador se muestra, pero no se edita: a quien
                    administra el sitio no le sirve de nada cambiarlo y sí
                    puede confundirlo con el nombre que ven los clientes. */}
                <Texto ruta={`products.${i}.nombre`} etiqueta="Nombre" max={80}
                  ayuda={`Es lo que ven tus clientes. Referencia interna: ${p.id}`} />

                <Area ruta={`products.${i}.descripcion`} etiqueta="Descripción" max={400} filas={2}
                  ayuda="Déjala vacía si no hay información confirmada: el sitio mostrará «Consulta disponibilidad»." />

                <Fila>
                  <CampoPrecio indice={i} />
                  <Texto ruta={`products.${i}.precioUnidad`} etiqueta="Unidad del precio (opcional)" max={30}
                    vacioANulo placeholder="por metro, por rollo, por unidad…"
                    ayuda="Se muestra al lado del precio. Sin precio, no se muestra." />
                </Fila>

                <Campo etiqueta="Líneas a las que pertenece"
                  ayuda="Pulsa las que correspondan (puede ser más de una). Si falta alguna, créala aquí mismo.">
                  <div data-lineas-producto className="flex flex-wrap gap-2">
                    {categorias.map((c) => {
                      const activa = (p.categorias ?? []).includes(c.id)
                      return (
                        <button key={c.id} type="button" onClick={() => alternarCategoria(i, c.id)}
                          aria-pressed={activa}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            activa ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                          }`}>
                          {c.corto}
                        </button>
                      )
                    })}
                    {huerfanas(p).map((id) => (
                      <button key={id} type="button" onClick={() => quitarHuerfana(i, id)}
                        data-linea-eliminada
                        title="Esta línea ya no existe. Pulsa para quitarla de este producto."
                        className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                        {id} · ya no existe ✕
                      </button>
                    ))}
                    <NuevaLinea onCrear={(nombre) => crearLinea(i, nombre)} />
                  </div>
                  {irALineas && (
                    <button type="button" onClick={irALineas}
                      className="justify-self-start text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900">
                      Cambiar el nombre, la imagen o el orden de las líneas
                    </button>
                  )}
                </Campo>

                <SelectorImagen ruta={`products.${i}.imagen`} etiqueta="Foto principal" permitirVacio
                  altSugerido={p.nombre}
                  ayuda="La que se ve en la tarjeta del catálogo." />

                <Campo etiqueta="Galería"
                  ayuda="Las fotos que se pueden pasar dentro de la ficha. Si la dejas vacía, la ficha muestra solo la foto principal; si solo hay una, no se muestran flechas.">
                  <div>
                    <Boton icono={Upload} onClick={() => setSubiendoGaleria(i)}>Subir foto nueva a la galería</Boton>
                  </div>
                  <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-6">
                    {medios.map((m) => {
                      const activa = (p.galeria ?? []).includes(m.id)
                      return (
                        <button key={m.id} type="button" onClick={() => alternarGaleria(i, m.id)}
                          aria-pressed={activa} title={m.id}
                          className={`rounded-lg border-2 p-1 ${activa ? 'border-sky-500 bg-sky-50' : 'border-transparent hover:border-slate-300'}`}>
                          <Miniatura id={m.id} className="aspect-square w-full" />
                        </button>
                      )
                    })}
                  </div>
                </Campo>

                <Fila>
                  <Interruptor ruta={`products.${i}.destacado`} etiqueta="Destacado"
                    ayuda="Aparece primero en la grilla." />
                  <Interruptor ruta={`products.${i}.visible`} etiqueta="Mostrar en el catálogo" />
                </Fila>

                <div className="flex justify-end">
                  <Boton variante="peligro" onClick={() => eliminar(i)}>Eliminar producto</Boton>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {subiendoGaleria !== null && productos[subiendoGaleria] && (
        <SubirImagenModal
          altInicial={productos[subiendoGaleria].nombre}
          onCerrar={() => setSubiendoGaleria(null)}
          onSubida={(idImagen) => {
            const i = subiendoGaleria
            setSubiendoGaleria(null)
            // Subir una foto desde la galería es querer verla en ella.
            if (!(productos[i].galeria ?? []).includes(idImagen)) alternarGaleria(i, idImagen)
          }}
        />
      )}
    </Panel>
  )
}

/* ========================================================================== */

function TextosCatalogo() {
  return (
    <div className="grid gap-5">
      <Panel titulo="Textos de la sección de líneas">
        <Interruptor ruta="site.categoriasSeccion.visible" etiqueta="Mostrar la sección de líneas" />
        <Fila>
          <Texto ruta="site.categoriasSeccion.eyebrow" etiqueta="Antetítulo" max={60} />
          <Texto ruta="site.categoriasSeccion.ctaTarjeta" etiqueta="Texto del enlace de cada tarjeta" max={40} />
        </Fila>
        <Texto ruta="site.categoriasSeccion.titulo" etiqueta="Título" max={160} />
        <Area ruta="site.categoriasSeccion.subtitulo" etiqueta="Subtítulo" max={400} />
      </Panel>

      <Panel titulo="Textos del catálogo">
        <Interruptor ruta="site.catalogoSeccion.visible" etiqueta="Mostrar el catálogo" />
        <Fila>
          <Texto ruta="site.catalogoSeccion.eyebrow" etiqueta="Antetítulo" max={60} />
          <Texto ruta="site.catalogoSeccion.ctaCabecera" etiqueta="Botón de la cabecera" max={40} />
        </Fila>
        <Texto ruta="site.catalogoSeccion.titulo" etiqueta="Título" max={160} />
        <Area ruta="site.catalogoSeccion.subtitulo" etiqueta="Subtítulo" max={400} />

        <Fila columnas={3}>
          <Texto ruta="site.catalogoSeccion.etiquetaFiltro" etiqueta="Rótulo de los filtros" max={40} />
          <Texto ruta="site.catalogoSeccion.etiquetaTodos" etiqueta="Filtro «todos»" max={30} />
          <Texto ruta="site.catalogoSeccion.textoConsultar" etiqueta="Botón de cada tarjeta" max={30} />
        </Fila>

        <Fila>
          <Texto ruta="site.catalogoSeccion.sinFoto" etiqueta="Texto cuando falta la foto" max={40} />
          <Texto ruta="site.catalogoSeccion.modalCta" etiqueta="Botón de WhatsApp en la ficha" max={40} />
        </Fila>

        <Area ruta="site.catalogoSeccion.sinDescripcion" etiqueta="Texto cuando falta la descripción" max={400} filas={2} />
        <Area ruta="site.catalogoSeccion.modalNota" etiqueta="Nota en la ficha de un producto sin precio" max={400} filas={2}
          ayuda="Déjala vacía si no quieres mostrar ninguna nota." />
        <Area ruta="site.catalogoSeccion.precioNota" etiqueta="Nota en la ficha de un producto con precio" max={400} filas={2}
          ayuda="Aparece debajo del precio. Déjala vacía si no quieres mostrar ninguna nota." />
        <Area ruta="site.catalogoSeccion.vacio" etiqueta="Texto cuando una línea no tiene productos" max={400} filas={2} />
      </Panel>

      <Panel titulo="Bloque de cierre del catálogo">
        <Interruptor ruta="site.catalogoSeccion.cierre.visible" etiqueta="Mostrar el bloque" />
        <Texto ruta="site.catalogoSeccion.cierre.titulo" etiqueta="Título" max={160} />
        <Area ruta="site.catalogoSeccion.cierre.texto" etiqueta="Texto" max={400} filas={2} />
        <Texto ruta="site.catalogoSeccion.cierre.cta" etiqueta="Botón" max={40} />
      </Panel>
    </div>
  )
}

/* ========================================================================== */

const PESTANAS = [
  { id: 'productos', texto: 'Productos', Componente: Productos },
  { id: 'lineas', texto: 'Líneas', Componente: Categorias },
  { id: 'textos', texto: 'Textos', Componente: TextosCatalogo },
]

export default function Catalogo() {
  const [activa, setActiva] = useState('productos')
  const { Componente } = PESTANAS.find((p) => p.id === activa)

  return (
    <div className="grid gap-5">
      <div role="tablist" aria-label="Secciones del catálogo" className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={activa === p.id}
            onClick={() => setActiva(p.id)}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
              activa === p.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {p.texto}
          </button>
        ))}
      </div>
      <Componente irALineas={() => setActiva('lineas')} />
    </div>
  )
}
