import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronUp, Info, Trash2, X } from 'lucide-react'
import { useEditor } from './estado'

/* ========================================================================== */
/*  Envoltorios                                                               */
/* ========================================================================== */

export function Panel({ titulo, descripcion, children, acciones }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">{titulo}</h2>
          {descripcion && <p className="mt-1 max-w-2xl text-sm text-slate-500">{descripcion}</p>}
        </div>
        {acciones}
      </header>
      <div className="grid gap-5 p-5">{children}</div>
    </section>
  )
}

export function Fila({ children, columnas = 2 }) {
  return (
    <div className={`grid gap-4 ${columnas === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
      {children}
    </div>
  )
}

export function Campo({ etiqueta, ayuda, error, children, id }) {
  return (
    // content-start: si el campo de al lado es más alto (p. ej. lleva contador),
    // la cuadrícula estiraría las filas de este y bajaría su casilla.
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-red-600">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-slate-500">{ayuda}</p>
      )}
    </div>
  )
}

/* ========================================================================== */
/*  Campos enlazados al contenido                                             */
/* ========================================================================== */

const claseInput =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-400'

/**
 * @param {string} ruta  Ruta dentro del contenido, p. ej. 'site.hero.titulo'.
 * @param {(v:string)=>string} [validar]  Devuelve mensaje de error o ''.
 * @param {boolean} [vacioANulo]  Al vaciar el campo guarda null en lugar de ''.
 *   Para los campos que se publican como null cuando no hay valor: con '' el
 *   panel creería que hay cambios sin publicar aunque el sitio quede igual.
 */
export function Texto({ ruta, etiqueta, ayuda, max, validar, placeholder, tipo = 'text', vacioANulo = false }) {
  const { get, set } = useEditor()
  const id = useId()
  const [error, setError] = useState('')
  const valor = get(ruta) ?? ''

  const comprobar = (v) => setError(validar ? validar(v) : '')

  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error} id={id}>
      <input
        id={id}
        type={tipo}
        className={claseInput}
        value={valor}
        placeholder={placeholder}
        maxLength={max}
        onChange={(e) => {
          set(ruta, vacioANulo && e.target.value === '' ? null : e.target.value)
          if (error) comprobar(e.target.value)
        }}
        onBlur={(e) => comprobar(e.target.value)}
      />
      {max && (
        <p className={`text-right text-[0.6875rem] ${valor.length > max * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
          {valor.length}/{max}
        </p>
      )}
    </Campo>
  )
}

export function Area({ ruta, etiqueta, ayuda, max, filas = 3 }) {
  const { get, set } = useEditor()
  const id = useId()
  const valor = get(ruta) ?? ''

  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} id={id}>
      <textarea
        id={id}
        rows={filas}
        className={claseInput}
        value={valor}
        maxLength={max}
        onChange={(e) => set(ruta, e.target.value)}
      />
      {max && (
        <p className={`text-right text-[0.6875rem] ${valor.length > max * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
          {valor.length}/{max}
        </p>
      )}
    </Campo>
  )
}

export function Interruptor({ ruta, etiqueta, ayuda }) {
  const { get, set } = useEditor()
  const activo = get(ruta) !== false

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={() => set(ruta, !activo)}
        className={`mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${activo ? 'bg-sky-600' : 'bg-slate-300'}`}
      >
        <span
          className={`block size-4 rounded-full bg-white transition-transform ${activo ? 'translate-x-4' : ''}`}
        />
      </button>
      <span>
        <span className="block text-sm font-medium text-slate-700">{etiqueta}</span>
        {ayuda && <span className="block text-xs text-slate-500">{ayuda}</span>}
      </span>
    </label>
  )
}

export function Selector({ ruta, etiqueta, ayuda, opciones }) {
  const { get, set } = useEditor()
  const id = useId()
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} id={id}>
      <select id={id} className={claseInput} value={get(ruta) ?? ''} onChange={(e) => set(ruta, e.target.value)}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
    </Campo>
  )
}

export function Color({ ruta, etiqueta }) {
  const { get, set } = useEditor()
  const id = useId()
  const valor = get(ruta) ?? '#000000'
  const valido = /^#[0-9a-f]{6}$/i.test(valor)

  return (
    <Campo etiqueta={etiqueta} id={id} error={valido ? '' : 'Usa el formato #rrggbb.'}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Selector de color para ${etiqueta}`}
          className="size-9 shrink-0 cursor-pointer rounded border border-slate-300 bg-white"
          value={valido ? valor : '#000000'}
          onChange={(e) => set(ruta, e.target.value)}
        />
        <input
          id={id}
          className={`${claseInput} font-mono text-xs`}
          value={valor}
          onChange={(e) => set(ruta, e.target.value)}
        />
      </div>
    </Campo>
  )
}

/* ========================================================================== */
/*  Botones y avisos                                                          */
/* ========================================================================== */

const VARIANTES = {
  primario: 'bg-sky-600 text-white hover:bg-sky-700 disabled:bg-sky-300',
  peligro: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  neutro: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  fantasma: 'text-slate-600 hover:bg-slate-100',
}

export function Boton({ variante = 'neutro', icono: Icono, cargando, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      disabled={cargando || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none disabled:cursor-not-allowed ${VARIANTES[variante]} ${className}`}
      {...rest}
    >
      {cargando ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        Icono && <Icono className="size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}

export function Avisos() {
  const { avisos } = useEditor()
  const estilos = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  }
  const iconos = { ok: Check, error: AlertTriangle, info: Info }

  // `w-full` evita que el ancho lo marque el aviso más largo y acabe
  // desbordando la pantalla en móvil.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex w-full flex-col items-center gap-2 px-4" aria-live="polite">
      {avisos.map((a) => {
        const Icono = iconos[a.tipo]
        return (
          <div key={a.id} className={`pointer-events-auto flex max-w-[min(32rem,100%)] items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${estilos[a.tipo]}`}>
            <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{a.texto}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Diálogo de confirmación para acciones que no se pueden deshacer solas. */
export function Confirmar({ abierto, titulo, mensaje, textoConfirmar = 'Confirmar', peligro, onConfirmar, onCancelar }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e) => e.key === 'Escape' && onCancelar()
    document.addEventListener('keydown', alTeclear)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirmar-titulo">
      <button type="button" aria-label="Cancelar" onClick={onCancelar} className="absolute inset-0 cursor-default bg-slate-900/50" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 id="confirmar-titulo" className="font-semibold text-slate-900">{titulo}</h3>
        <p className="mt-2 text-sm text-slate-600">{mensaje}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Boton onClick={onCancelar}>Cancelar</Boton>
          <Boton ref={ref} variante={peligro ? 'peligro' : 'primario'} onClick={onConfirmar}>
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  )
}

/* ========================================================================== */
/*  Listas reordenables                                                       */
/* ========================================================================== */

/**
 * Lista con subir/bajar/eliminar.
 *
 * Usa botones y no arrastrar-y-soltar a propósito: funciona con teclado, en
 * móvil y con lectores de pantalla, que es más de lo que suele dar un
 * reordenamiento por arrastre.
 */
export function Lista({ ruta, items, render, alAnadir, textoAnadir, minimo = 0, clave = 'id' }) {
  const { set } = useEditor()
  const [aBorrar, setABorrar] = useState(null)

  const mover = (desde, hacia) => {
    if (hacia < 0 || hacia >= items.length) return
    const copia = [...items]
    ;[copia[desde], copia[hacia]] = [copia[hacia], copia[desde]]
    set(ruta, copia)
  }

  const eliminar = (i) => {
    set(ruta, items.filter((_, k) => k !== i))
    setABorrar(null)
  }

  return (
    <div className="grid gap-3">
      {items.map((item, i) => (
        <div key={item[clave] ?? i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {i + 1} de {items.length}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0}
                aria-label={`Subir el elemento ${i + 1}`}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30">
                <ChevronUp className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => mover(i, i + 1)} disabled={i === items.length - 1}
                aria-label={`Bajar el elemento ${i + 1}`}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30">
                <ChevronDown className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setABorrar(i)} disabled={items.length <= minimo}
                aria-label={`Eliminar el elemento ${i + 1}`}
                className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30">
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          {render(item, i)}
        </div>
      ))}

      {alAnadir && (
        <Boton onClick={alAnadir} variante="neutro" className="justify-self-start">
          {textoAnadir}
        </Boton>
      )}

      <Confirmar
        abierto={aBorrar !== null}
        titulo="¿Eliminar este elemento?"
        mensaje="Desaparecerá del panel. El sitio público no cambia hasta que publiques."
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={() => eliminar(aBorrar)}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  )
}

export function Vacio({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {children}
    </p>
  )
}

export { claseInput, X }
