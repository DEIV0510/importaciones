import { useEffect, useRef, useState } from 'react'
import { Monitor, Smartphone, X } from 'lucide-react'
import App from '../App'
import { ContentProvider } from '../content/ContentContext'
import { aplicarTema } from '../content/publicado'
import { useEditor } from './estado'

/**
 * Previsualización del sitio con el borrador.
 *
 * Monta los MISMOS componentes del sitio público, no una imitación: si algo
 * se ve bien aquí, se verá igual al publicar. El contenido llega por el
 * contexto y el tema se aplica solo a este contenedor, para que los colores
 * que estás probando no repinten el panel.
 */
export default function Previsualizacion({ onCerrar }) {
  const { borrador } = useEditor()
  const [ancho, setAncho] = useState('escritorio')
  const contenedor = useRef(null)

  useEffect(() => {
    if (contenedor.current) aplicarTema(borrador?.site?.tema, contenedor.current)
  }, [borrador?.site?.tema])

  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclear)
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900" role="dialog" aria-modal="true" aria-label="Previsualización del sitio">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700 px-4 py-2.5">
        <p className="text-sm font-semibold text-white">
          Previsualización
          <span className="ml-2 font-normal text-slate-400">así quedará al publicar</span>
        </p>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5">
            <button type="button" onClick={() => setAncho('escritorio')} aria-pressed={ancho === 'escritorio'}
              className={`rounded-md p-1.5 ${ancho === 'escritorio' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
              aria-label="Ver como escritorio">
              <Monitor className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setAncho('movil')} aria-pressed={ancho === 'movil'}
              className={`rounded-md p-1.5 ${ancho === 'movil' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
              aria-label="Ver como celular">
              <Smartphone className="size-4" aria-hidden="true" />
            </button>
          </div>

          <button type="button" onClick={onCerrar}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-200">
            <X className="size-4" aria-hidden="true" />
            Cerrar
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-800 p-0 sm:p-4">
        <div
          ref={contenedor}
          className={`mx-auto min-h-full overflow-hidden bg-white ${
            ancho === 'movil' ? 'max-w-[390px] sm:rounded-2xl sm:shadow-2xl' : 'max-w-none'
          }`}
        >
          <ContentProvider contenido={borrador} aplicarTemaGlobal={false}>
            <App conCortina={false} />
          </ContentProvider>
        </div>
      </div>
    </div>
  )
}
