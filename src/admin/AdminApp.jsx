import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { EditorProvider } from './estado'
import Login from './Login'
import Shell from './Shell'

/**
 * Raíz del panel.
 *
 * Pregunta primero al servidor si hay sesión. Aunque alguien se saltara esta
 * comprobación en el navegador, no conseguiría nada: cada endpoint vuelve a
 * verificar la sesión antes de leer o escribir.
 */
export default function AdminApp() {
  const [estado, setEstado] = useState({ cargando: true, usuario: null, configurado: true })

  const comprobar = useCallback(async () => {
    try {
      const s = await api.sesion()
      setEstado({ cargando: false, usuario: s.autenticado ? s.usuario : null, configurado: s.configurado })
    } catch {
      setEstado({ cargando: false, usuario: null, configurado: true })
    }
  }, [])

  useEffect(() => {
    document.title = 'Panel · Mundo Importaciones'
    comprobar()
  }, [comprobar])

  // Si la sesión caduca mientras el panel está abierto, vuelve al acceso.
  useEffect(() => {
    if (!estado.usuario) return
    const id = setInterval(async () => {
      try {
        const s = await api.sesion()
        if (!s.autenticado) setEstado((e) => ({ ...e, usuario: null }))
      } catch {
        // Un corte de red puntual no debe echar a nadie.
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [estado.usuario])

  if (estado.cargando) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-100">
        <p className="text-sm font-medium text-slate-500">Comprobando sesión…</p>
      </div>
    )
  }

  if (!estado.usuario) {
    return (
      <Login
        configurado={estado.configurado}
        onEntrar={(usuario) => setEstado((e) => ({ ...e, usuario }))}
      />
    )
  }

  return (
    <EditorProvider usuario={estado.usuario}>
      <Shell usuario={estado.usuario} onSalir={() => setEstado((e) => ({ ...e, usuario: null }))} />
    </EditorProvider>
  )
}
