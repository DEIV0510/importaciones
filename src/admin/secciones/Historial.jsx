import { useEffect, useState } from 'react'
import { History, RotateCcw } from 'lucide-react'
import { api } from '../api'
import { useEditor } from '../estado'
import { Boton, Confirmar, Panel, Vacio } from '../ui'

/**
 * Historial de publicaciones.
 *
 * No hay una tabla de auditoría aparte: el historial ES el registro de
 * commits del repositorio. Por eso no se puede alterar desde el panel y
 * recoge siempre quién publicó y cuándo.
 */
export default function Historial() {
  const { avisar, recargar, modo } = useEditor()
  const [versiones, setVersiones] = useState(null)
  const [error, setError] = useState(null)
  const [restaurando, setRestaurando] = useState(null)
  const [confirmando, setConfirmando] = useState(null)

  useEffect(() => {
    api.historial()
      .then((r) => setVersiones(r.versiones))
      .catch((e) => setError(e.message))
  }, [])

  async function restaurar(sha) {
    setConfirmando(null)
    setRestaurando(sha)
    try {
      await api.restaurar(sha)
      avisar('Versión restaurada. Se publicó como un cambio nuevo.')
      await recargar()
      const r = await api.historial()
      setVersiones(r.versiones)
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setRestaurando(null)
    }
  }

  const fecha = (iso) => {
    if (!iso) return 'fecha desconocida'
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="grid gap-5">
      <Panel
        titulo="Historial de publicaciones"
        descripcion="Cada publicación queda registrada con su fecha y su autor. Restaurar no borra nada: vuelve a publicar el contenido antiguo como un cambio nuevo, así que siempre puedes deshacerlo."
      >
        {modo === 'local' && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Estás en modo local: aquí se ve el historial de tu copia del proyecto, no el del sitio publicado.
          </p>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {versiones === null && !error && (
          <p className="text-sm text-slate-500">Cargando historial…</p>
        )}

        {versiones?.length === 0 && <Vacio>Todavía no hay publicaciones registradas.</Vacio>}

        {versiones?.length > 0 && (
          <ol className="grid gap-2">
            {versiones.map((v, i) => (
              <li key={v.sha} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                  <History className="size-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{v.mensaje}</p>
                  <p className="text-xs text-slate-500">
                    {fecha(v.fecha)} · {v.autor} · <code>{v.sha.slice(0, 7)}</code>
                    {i === 0 && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">versión actual</span>}
                  </p>
                </div>

                {i > 0 && (
                  <Boton
                    icono={RotateCcw}
                    cargando={restaurando === v.sha}
                    onClick={() => setConfirmando(v)}
                  >
                    Restaurar
                  </Boton>
                )}
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Confirmar
        abierto={Boolean(confirmando)}
        titulo="¿Restaurar esta versión?"
        mensaje={
          confirmando
            ? `Se publicará el contenido tal y como estaba el ${fecha(confirmando.fecha)}. Los cambios que tengas sin publicar se perderán. Podrás volver atrás desde este mismo historial.`
            : ''
        }
        textoConfirmar="Restaurar y publicar"
        onConfirmar={() => restaurar(confirmando.sha)}
        onCancelar={() => setConfirmando(null)}
      />
    </div>
  )
}
