import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, Eye, History, Image, Pencil, Rocket, X,
} from 'lucide-react'
import { Boton } from './ui'

const CLAVE_VISTA = 'mi_panel_guia_vista_v1'

/**
 * Guía de uso del panel.
 *
 * Se abre sola la primera vez y queda accesible desde el botón «?».
 *
 * El orden no es casual: empieza por «tus cambios no se ven hasta que
 * publicas», porque esa es la confusión que va a aparecer sí o sí — alguien
 * edita, mira el sitio, lo ve igual y cree que no funciona.
 */
const PASOS = [
  {
    icono: Pencil,
    titulo: 'Lo que editas no se ve todavía',
    texto:
      'Mientras escribes, los cambios se guardan solo en este navegador. El sitio que ven tus clientes sigue igual hasta que pulses Publicar.',
    detalle:
      'Puedes cerrar la pestaña e irte: al volver, el panel recupera lo que dejaste a medias.',
  },
  {
    icono: Eye,
    titulo: 'Míralo antes de publicar',
    texto:
      'El botón Previsualizar abre tu sitio de verdad con los cambios aplicados. No es una imitación: lo que veas ahí es exactamente lo que quedará.',
    detalle: 'Arriba del todo puedes cambiar entre vista de computador y de celular.',
  },
  {
    icono: Rocket,
    titulo: 'Publicar tarda cerca de un minuto',
    texto:
      'Al publicar, el sitio se vuelve a construir con tu contenido. No es instantáneo: espera alrededor de un minuto y recarga la página.',
    detalle:
      'Si recargas enseguida y lo ves igual, no te asustes: todavía se está construyendo.',
  },
  {
    icono: Image,
    titulo: 'Las fotos son la excepción',
    texto:
      'Las imágenes se suben y se borran al instante, sin esperar a publicar. Por eso aparecen de inmediato en la biblioteca.',
    detalle:
      'Tu navegador las optimiza antes de subirlas, así que no hace falta que las prepares.',
  },
  {
    icono: History,
    titulo: 'Si te equivocas, no pasa nada',
    texto:
      'Cada publicación queda guardada con su fecha. Desde Historial puedes volver a cualquier versión anterior.',
    detalle:
      'Restaurar no borra nada: publica de nuevo lo antiguo, así que también puedes deshacer la restauración.',
  },
]

export function guiaYaVista() {
  try {
    return localStorage.getItem(CLAVE_VISTA) === '1'
  } catch {
    // Modo incógnito: se mostrará otra vez, que es mejor que fallar.
    return false
  }
}

function marcarVista() {
  try {
    localStorage.setItem(CLAVE_VISTA, '1')
  } catch {
    // Sin almacenamiento: no se recuerda, pero la guía funciona igual.
  }
}

export default function Guia({ onCerrar }) {
  const [paso, setPaso] = useState(0)
  const cajaRef = useRef(null)

  const ultimo = paso === PASOS.length - 1
  const actual = PASOS[paso]
  const Icono = actual.icono

  const cerrar = () => {
    marcarVista()
    onCerrar()
  }

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape') cerrar()
      if (e.key === 'ArrowRight' && !ultimo) setPaso((p) => p + 1)
      if (e.key === 'ArrowLeft' && paso > 0) setPaso((p) => p - 1)
    }
    document.addEventListener('keydown', alTeclear)
    cajaRef.current?.focus()
    return () => document.removeEventListener('keydown', alTeclear)
  })

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guia-titulo"
    >
      <button
        type="button"
        aria-label="Cerrar la guía"
        onClick={cerrar}
        className="absolute inset-0 cursor-default bg-slate-900/60"
      />

      <div
        ref={cajaRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl outline-none"
      >
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar la guía"
          className="absolute top-3 right-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="p-7">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Cómo funciona el panel · {paso + 1} de {PASOS.length}
          </p>

          <div className="mt-5 flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
              <Icono className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="guia-titulo" className="text-lg font-semibold text-slate-900">
                {actual.titulo}
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">{actual.texto}</p>
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                {actual.detalle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-7 py-4">
          {/* Puntos de avance */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {PASOS.map((p, i) => (
              <span
                key={p.titulo}
                className={`h-1.5 rounded-full transition-all ${
                  i === paso ? 'w-5 bg-sky-600' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {paso > 0 && (
              <Boton icono={ArrowLeft} onClick={() => setPaso((p) => p - 1)}>
                Atrás
              </Boton>
            )}
            {ultimo ? (
              <Boton variante="primario" icono={Check} onClick={cerrar}>
                Entendido
              </Boton>
            ) : (
              // Sin `arrow`: esa prop es del botón del sitio público, no de
              // este, y aquí acababa puesta como atributo del DOM.
              <Boton variante="primario" onClick={() => setPaso((p) => p + 1)}>
                Siguiente
                <ArrowRight className="size-4" aria-hidden="true" />
              </Boton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
