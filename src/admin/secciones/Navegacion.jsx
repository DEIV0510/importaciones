import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { useEditor } from '../estado'
import { anclasDisponibles } from '../../content/validacion'
import { Fila, Interruptor, Lista, Panel, Texto, claseInput } from '../ui'

/** Nombre legible de cada sección reordenable. */
const NOMBRES = {
  hero: 'Portada',
  marquesina: 'Banda de líneas',
  productos: 'Categorías y catálogo',
  soluciones: 'Para quién trabajamos',
  ubicacion: 'Ubicación',
  contacto: 'Contacto',
  ctaFinal: 'Bloque de cierre',
}

export default function Navegacion() {
  const { site, set } = useEditor()
  const enlaces = site?.navegacion?.enlaces ?? []
  const secciones = site?.secciones ?? []

  const anadirEnlace = () =>
    set('site.navegacion.enlaces', [
      ...enlaces,
      { id: `nav-${Date.now()}`, href: '#inicio', label: 'Nueva opción', visible: true },
    ])

  const mover = (i, delta) => {
    const destino = i + delta
    if (destino < 0 || destino >= secciones.length) return
    const copia = [...secciones]
    ;[copia[i], copia[destino]] = [copia[destino], copia[i]]
    set('site.secciones', copia)
  }

  const alternar = (i) =>
    set('site.secciones', secciones.map((s, k) => (k === i ? { ...s, visible: s.visible === false } : s)))

  // Anclas a las que un enlace puede apuntar sin romperse
  const anclasValidas = anclasDisponibles(secciones)

  return (
    <div className="grid gap-5">
      <Panel
        titulo="Menú"
        descripcion="Las opciones del menú superior y del menú móvil. Un enlace que apunte a una sección oculta no llevará a ninguna parte."
      >
        <Lista
          ruta="site.navegacion.enlaces"
          items={enlaces}
          minimo={1}
          alAnadir={anadirEnlace}
          textoAnadir="Añadir opción al menú"
          render={(enlace, i) => (
            <div className="grid gap-3">
              <Fila>
                <Texto ruta={`site.navegacion.enlaces.${i}.label`} etiqueta="Texto" max={40} />
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor={`href-${i}`}>
                    Destino
                  </label>
                  <select
                    id={`href-${i}`}
                    className={claseInput}
                    value={enlace.href}
                    onChange={(e) => set(`site.navegacion.enlaces.${i}.href`, e.target.value)}
                  >
                    {[...anclasValidas].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    {!anclasValidas.has(enlace.href) && (
                      <option value={enlace.href}>{enlace.href} (sección oculta)</option>
                    )}
                  </select>
                  {!anclasValidas.has(enlace.href) && (
                    <p className="text-xs text-amber-600">
                      Esta sección está oculta: el enlace no llevará a ningún sitio.
                    </p>
                  )}
                </div>
              </Fila>
              <Interruptor ruta={`site.navegacion.enlaces.${i}.visible`} etiqueta="Mostrar en el menú" />
            </div>
          )}
        />

        <Texto ruta="site.navegacion.ctaTexto" etiqueta="Texto del botón destacado" max={40}
          ayuda="El botón naranja del menú. Siempre abre WhatsApp con el mensaje de cotización." />

        <Interruptor ruta="site.navegacion.barraSuperior"
          etiqueta="Mostrar la barra superior con dirección, teléfonos y redes"
          ayuda="Solo se ve en pantallas grandes y desaparece al bajar." />
      </Panel>

      <Panel
        titulo="Secciones de la página"
        descripcion="Cambia el orden en que aparecen y oculta las que no quieras mostrar. La portada y el catálogo son las que más conviene dejar arriba."
      >
        <ul className="grid gap-2">
          {secciones.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                s.visible === false ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
              }`}
            >
              <span className="w-6 text-center text-xs font-semibold text-slate-400">{i + 1}</span>
              <span className={`flex-1 text-sm font-medium ${s.visible === false ? 'text-slate-400' : 'text-slate-800'}`}>
                {NOMBRES[s.id] ?? s.id}
              </span>

              <button type="button" onClick={() => alternar(i)}
                aria-label={s.visible === false ? `Mostrar ${NOMBRES[s.id]}` : `Ocultar ${NOMBRES[s.id]}`}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                {s.visible === false
                  ? <EyeOff className="size-4" aria-hidden="true" />
                  : <Eye className="size-4" aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0}
                aria-label={`Subir ${NOMBRES[s.id]}`}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                <ChevronUp className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => mover(i, 1)} disabled={i === secciones.length - 1}
                aria-label={`Bajar ${NOMBRES[s.id]}`}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                <ChevronDown className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
