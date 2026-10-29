import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ImageOff, Search, Trash2, Upload } from 'lucide-react'
import { api } from './api'
import { useEditor } from './estado'
import { cargarImagen, generarVariantes, nombreAId } from './imagen'
import { usosDeImagen } from '../content/validacion'
import { Boton, Campo, Confirmar, Panel, Vacio, claseInput } from './ui'

/** Miniatura de una imagen de la biblioteca. */
export function Miniatura({ id, className = '' }) {
  if (!id) {
    return (
      <div className={`grid place-items-center rounded-lg bg-slate-100 text-slate-400 ${className}`}>
        <ImageOff className="size-5" aria-hidden="true" />
      </div>
    )
  }
  return (
    <img
      src={`/img/${id}-sm.webp`}
      alt=""
      loading="lazy"
      className={`rounded-lg bg-slate-100 object-contain ${className}`}
    />
  )
}

function useCerrarConEscape(onCerrar) {
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCerrar])
}

/* ========================================================================== */
/*  Subir una imagen                                                          */
/* ========================================================================== */

/**
 * Elegir un archivo, ver cómo quedará y subirlo a la biblioteca.
 *
 * Es el mismo flujo en tres sitios: la sección Imágenes, el selector de foto de
 * cada producto y la galería. Por eso vive aquí y no dentro de ninguno de ellos.
 *
 * @param {(id:string)=>void} [onSubida]  Se llama con el id cuando la imagen ya
 *   está en la biblioteca. El selector lo usa para dejarla puesta al instante.
 * @param {string} [altInicial]  Texto alternativo con el que arranca la imagen
 *   (p. ej. el nombre del producto), para que nadie tenga que inventarlo.
 */
export function SubirImagen({ onSubida, altInicial = '' }) {
  const { medios, sincronizarMedios, avisar, modo } = useEditor()
  const archivoRef = useRef(null)
  const idNombre = useId()
  const idAlt = useId()

  const [preparando, setPreparando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [pendiente, setPendiente] = useState(null) // {id, alt, variantes, vistaPrevia, bytes}
  const [quitarF, setQuitarF] = useState(false)
  const [imagenCruda, setImagenCruda] = useState(null)

  async function procesar(img, id, quitar) {
    setPreparando(true)
    try {
      // Cede el hilo para que el navegador pinte el estado de carga.
      await new Promise((r) => setTimeout(r, 20))
      const { variantes, vistaPrevia, bytes } = generarVariantes(img, { quitarFondo: quitar })
      setPendiente((p) => ({ id: p?.id ?? id, alt: p?.alt ?? altInicial, variantes, vistaPrevia, bytes }))
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setPreparando(false)
    }
  }

  async function alElegirArchivo(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    try {
      const img = await cargarImagen(archivo)
      setImagenCruda(img)
      setQuitarF(false)
      setPendiente(null)
      await procesar(img, nombreAId(archivo.name), false)
    } catch (err) {
      avisar(err.message, 'error')
    }
  }

  async function alternarFondo(valor) {
    setQuitarF(valor)
    if (imagenCruda) await procesar(imagenCruda, pendiente?.id, valor)
  }

  async function subir() {
    if (!pendiente?.id) return
    setSubiendo(true)
    try {
      const res = await api.subirImagen(pendiente.id, pendiente.alt, pendiente.variantes)
      sincronizarMedios(res.medios)
      avisar(
        res.reemplazo
          ? `«${pendiente.id}» reemplazada.`
          : `«${pendiente.id}» añadida a la biblioteca.`
      )
      const id = pendiente.id
      setPendiente(null)
      setImagenCruda(null)
      onSubida?.(id)
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="grid gap-4">
      <input
        ref={archivoRef}
        type="file"
        accept="image/*"
        onChange={alElegirArchivo}
        className="hidden"
        data-subir-imagen
      />

      <div className="flex flex-wrap items-center gap-3">
        <Boton variante="primario" icono={Upload} onClick={() => archivoRef.current?.click()}>
          {pendiente ? 'Elegir otra imagen' : 'Elegir imagen'}
        </Boton>
        {modo === 'local' && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Modo local: se guarda en el disco, no en el repositorio
          </span>
        )}
      </div>

      {pendiente && (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="grid gap-2">
            <div className="aspect-square rounded-lg bg-[conic-gradient(#e2e8f0_25%,#fff_0_50%,#e2e8f0_0_75%,#fff_0)] bg-[length:16px_16px] p-2">
              {preparando ? (
                <div className="grid size-full place-items-center text-xs text-slate-500">Procesando…</div>
              ) : (
                <img src={pendiente.vistaPrevia} alt="Vista previa" className="size-full object-contain" />
              )}
            </div>
            <p className="text-center text-xs text-slate-500">
              ≈ {Math.round(pendiente.bytes / 1024)} KB en total
            </p>
          </div>

          <div className="grid content-start gap-3">
            <Campo id={idNombre} etiqueta="Nombre del archivo" ayuda="Solo minúsculas, números y guiones. Con él se referencia la imagen.">
              <input
                id={idNombre}
                className={claseInput}
                value={pendiente.id}
                onChange={(e) => setPendiente({ ...pendiente, id: nombreAId(e.target.value) })}
              />
            </Campo>

            <Campo id={idAlt} etiqueta="Texto alternativo" ayuda="Describe la foto para quien no puede verla. Mejora también el SEO.">
              <input
                id={idAlt}
                className={claseInput}
                value={pendiente.alt}
                onChange={(e) => setPendiente({ ...pendiente, alt: e.target.value })}
                placeholder="Rollos de cinta raso en tonos azules"
              />
            </Campo>

            <label className="flex items-start gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-slate-300"
                checked={quitarF}
                onChange={(e) => alternarFondo(e.target.checked)}
              />
              <span>
                Quitar el fondo liso
                <span className="block text-xs text-slate-500">
                  Útil si la foto está sobre fondo blanco o negro. Mira la vista previa antes de subir:
                  con fondos irregulares puede comerse parte del producto.
                </span>
              </span>
            </label>

            {medios.some((m) => m.id === pendiente.id) && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Ya existe una imagen con ese nombre. Al subir, la reemplazarás en todos los
                sitios donde se use.
              </p>
            )}

            <div className="flex gap-2">
              <Boton variante="primario" onClick={subir} cargando={subiendo} disabled={!pendiente.id || preparando}>
                {onSubida ? 'Subir y usar' : 'Subir a la biblioteca'}
              </Boton>
              <Boton onClick={() => { setPendiente(null); setImagenCruda(null) }}>Cancelar</Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Ventana para subir una imagen sin salir de lo que se está editando. */
export function SubirImagenModal({ onCerrar, onSubida, altInicial }) {
  useCerrarConEscape(onCerrar)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Subir imagen nueva">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default bg-slate-900/50" />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Subir una imagen nueva</h3>
            <p className="mt-1 text-xs text-slate-500">
              Se guarda al instante en la biblioteca, sin esperar a publicar. Tu navegador la
              optimiza antes de subirla.
            </p>
          </div>
          <Boton onClick={onCerrar}>Cerrar</Boton>
        </div>
        <SubirImagen onSubida={onSubida} altInicial={altInicial} />
      </div>
    </div>
  )
}

/* ========================================================================== */
/*  Selector de imagen (campo reutilizable)                                   */
/* ========================================================================== */

export function SelectorImagen({ ruta, etiqueta, ayuda, permitirVacio = false, altSugerido = '' }) {
  const { get, set, medios } = useEditor()
  // null = cerrado · 'elegir' = biblioteca · 'subir' = biblioteca ya en «subir»
  const [abierto, setAbierto] = useState(null)
  const actual = get(ruta)

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-slate-300 bg-white p-2">
        <Miniatura id={actual} className="size-14 shrink-0 p-1" />
        <div className="min-w-0 flex-1 basis-28">
          <p className="truncate text-sm font-medium text-slate-800">{actual || 'Sin imagen'}</p>
          {ayuda && <p className="truncate text-xs text-slate-500">{ayuda}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-1 max-sm:w-full">
          <Boton icono={Upload} onClick={() => setAbierto('subir')}>Subir nueva</Boton>
          <Boton onClick={() => setAbierto('elegir')}>Elegir existente</Boton>
          {permitirVacio && actual && (
            <Boton variante="fantasma" onClick={() => set(ruta, null)} aria-label="Quitar la imagen">
              Quitar
            </Boton>
          )}
        </div>
      </div>

      {abierto && (
        <Biblioteca
          medios={medios}
          seleccionada={actual}
          iniciarSubiendo={abierto === 'subir'}
          altInicial={altSugerido}
          onElegir={(id) => { set(ruta, id); setAbierto(null) }}
          onCerrar={() => setAbierto(null)}
        />
      )}
    </div>
  )
}

/** Modal para elegir una imagen de la biblioteca, o subir una nueva. */
function Biblioteca({ medios, seleccionada, iniciarSubiendo, altInicial, onElegir, onCerrar }) {
  const [busqueda, setBusqueda] = useState('')
  const [subiendo, setSubiendo] = useState(iniciarSubiendo)
  const filtrados = useMemo(
    () => medios.filter((m) => m.id.includes(busqueda.toLowerCase().trim())),
    [medios, busqueda]
  )

  useCerrarConEscape(onCerrar)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Elegir imagen">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default bg-slate-900/50" />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          {subiendo ? (
            <>
              <Boton icono={ArrowLeft} onClick={() => setSubiendo(false)}>Volver a la biblioteca</Boton>
              <h3 className="flex-1 font-semibold text-slate-900 max-sm:order-last max-sm:basis-full">
                Subir una imagen nueva
              </h3>
            </>
          ) : (
            <>
              <div className="relative min-w-0 flex-1 basis-40">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  autoFocus
                  className={`${claseInput} pl-9`}
                  placeholder="Buscar imagen…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <Boton variante="primario" icono={Upload} onClick={() => setSubiendo(true)}>Subir nueva</Boton>
            </>
          )}
          <Boton onClick={onCerrar}>Cerrar</Boton>
        </header>

        {subiendo ? (
          <div className="overflow-y-auto p-4">
            <SubirImagen altInicial={altInicial} onSubida={onElegir} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-5">
            {filtrados.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onElegir(m.id)}
                className={`rounded-xl border-2 p-2 text-left transition-colors ${
                  m.id === seleccionada ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <Miniatura id={m.id} className="aspect-square w-full" />
                <span className="mt-1.5 block truncate text-[0.6875rem] text-slate-600">{m.id}</span>
              </button>
            ))}
            {!filtrados.length && (
              <p className="col-span-full py-8 text-center text-sm text-slate-500">
                Ninguna imagen coincide con «{busqueda}».
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ========================================================================== */
/*  Sección: biblioteca de medios                                             */
/* ========================================================================== */

export default function Medios() {
  const { medios, site, categorias, productos, sincronizarMedios, avisar } = useEditor()

  const [aBorrar, setABorrar] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(
    () => medios.filter((m) => m.id.includes(busqueda.toLowerCase().trim())),
    [medios, busqueda]
  )

  async function borrar(id) {
    setABorrar(null)
    try {
      const res = await api.borrarImagen(id)
      sincronizarMedios(res.medios)
      avisar(`«${id}» eliminada.`)
    } catch (err) {
      avisar(err.message, 'error')
    }
  }

  const usos = aBorrar
    ? usosDeImagen(aBorrar, { site, categorias, productos })
    : []

  return (
    <div className="grid gap-5">
      <Panel
        titulo="Subir una imagen"
        descripcion="Se guarda en cuatro tamaños optimizados: dos para el catálogo, uno de respaldo y otro para la vitrina del hero. El trabajo lo hace tu navegador, así que no se sube nada pesado. También puedes subirlas directamente desde la ficha de cada producto."
      >
        <SubirImagen />
      </Panel>

      <Panel
        titulo={`Biblioteca (${medios.length})`}
        descripcion="Las imágenes se suben y se borran al instante, sin esperar a publicar."
        acciones={
          <div className="relative w-full min-w-0 sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className={`${claseInput} pl-9`}
              placeholder="Buscar…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        }
      >
        {filtrados.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {filtrados.map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-200 p-2">
                <Miniatura id={m.id} className="aspect-square w-full" />
                <p className="mt-1.5 truncate text-xs font-medium text-slate-700">{m.id}</p>
                <p className="truncate text-[0.6875rem] text-slate-400">
                  {Math.round((m.bytes ?? 0) / 1024)} KB
                </p>
                <Boton
                  variante="fantasma"
                  icono={Trash2}
                  className="mt-1 w-full !px-2 !py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setABorrar(m.id)}
                >
                  Eliminar
                </Boton>
              </li>
            ))}
          </ul>
        ) : (
          <Vacio>No hay imágenes que coincidan con la búsqueda.</Vacio>
        )}
      </Panel>

      <Confirmar
        abierto={Boolean(aBorrar)}
        titulo={usos.length ? 'No se puede eliminar' : `¿Eliminar «${aBorrar}»?`}
        mensaje={
          usos.length
            ? `La usa ${usos.join(', ')}. Cámbiala primero en esos sitios y vuelve a intentarlo.`
            : 'Se borrará del repositorio y no se puede deshacer desde el panel. Si te equivocas, el archivo sigue en el historial de git.'
        }
        textoConfirmar={usos.length ? 'Entendido' : 'Eliminar'}
        peligro={!usos.length}
        onConfirmar={() => (usos.length ? setABorrar(null) : borrar(aBorrar))}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  )
}
