import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { api } from './api'
import { Boton, Campo, claseInput } from './ui'

export default function Login({ onEntrar, configurado }) {
  const [usuario, setUsuario] = useState('admin')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const res = await api.entrar(usuario, contrasena)
      onEntrar(res.usuario)
    } catch (err) {
      setError(err.message)
      setContrasena('')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="/img/logo-fallback.png" alt="" className="mx-auto h-20 w-auto" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Panel de administración</h1>
          <p className="text-sm text-slate-500">Mundo Importaciones S.A.S.</p>
        </div>

        {!configurado ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">El panel todavía no está configurado.</p>
            <p className="mt-2">
              Faltan las variables <code>ADMIN_PASSWORD_HASH</code> y <code>AUTH_SECRET</code>.
              Genéralas con este comando y pégalas en Vercel:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-amber-100 p-2 text-xs">
              npm run admin:hash -- &quot;tu-contraseña&quot;
            </pre>
          </div>
        ) : (
          <form onSubmit={enviar} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Campo etiqueta="Usuario" id="usuario">
              <input id="usuario" className={claseInput} autoComplete="username"
                value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            </Campo>

            <Campo etiqueta="Contraseña" id="contrasena">
              <input id="contrasena" type="password" className={claseInput} autoComplete="current-password"
                autoFocus value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
            </Campo>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <Boton type="submit" variante="primario" icono={LogIn} cargando={cargando}
              disabled={!contrasena} className="w-full">
              Entrar
            </Boton>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          <a href="/" className="underline hover:text-slate-600">Volver al sitio</a>
        </p>
      </div>
    </div>
  )
}
