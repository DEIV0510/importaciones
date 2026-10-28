import { useState } from 'react'
import {
  AlertCircle, Eye, HelpCircle, History, Image, LayoutGrid, LogOut, Menu,
  Palette, Rocket, Settings, Share2, Sparkles, X,
} from 'lucide-react'
import { api } from './api'
import { useEditor } from './estado'
import { Avisos, Boton, Confirmar, claseInput } from './ui'
import Previsualizacion from './Previsualizacion'
import Guia, { guiaYaVista } from './Guia'
import Identidad from './secciones/Identidad'
import Navegacion from './secciones/Navegacion'
import Portada from './secciones/Portada'
import Catalogo from './secciones/Catalogo'
import Contacto from './secciones/Contacto'
import Diseno from './secciones/Diseno'
import Historial from './secciones/Historial'
import Medios from './medios'

const APARTADOS = [
  { id: 'catalogo', texto: 'Catálogo', icono: LayoutGrid, Componente: Catalogo,
    nota: 'Productos, líneas y los textos del catálogo.' },
  { id: 'portada', texto: 'Portada', icono: Sparkles, Componente: Portada,
    nota: 'Titular, vitrina de productos y banda de líneas.' },
  { id: 'contacto', texto: 'Contacto y secciones', icono: Share2, Componente: Contacto,
    nota: 'WhatsApp, redes, ubicación, cierre y pie de página.' },
  { id: 'medios', texto: 'Imágenes', icono: Image, Componente: Medios,
    nota: 'Sube, reemplaza y borra fotos.' },
  { id: 'navegacion', texto: 'Menú y secciones', icono: Settings, Componente: Navegacion,
    nota: 'Opciones del menú y orden de las secciones.' },
  { id: 'identidad', texto: 'Identidad y SEO', icono: Settings, Componente: Identidad,
    nota: 'Nombre, logotipo y cómo aparece en Google.' },
  { id: 'diseno', texto: 'Diseño', icono: Palette, Componente: Diseno,
    nota: 'Colores y tipografías.' },
  { id: 'historial', texto: 'Historial', icono: History, Componente: Historial,
    nota: 'Publicaciones anteriores y restauración.' },
]

export default function Shell({ usuario, onSalir }) {
  const { sucio, guardando, publicar, descartar, modo, cargando, error, recargar } = useEditor()

  const [apartado, setApartado] = useState('catalogo')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [previsualizando, setPrevisualizando] = useState(false)
  const [confirmarDescartar, setConfirmarDescartar] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [nota, setNota] = useState('')
  // La primera vez se abre sola: pedirle a alguien que busque el botón de
  // ayuda antes de saber que existe no funciona.
  const [guiaAbierta, setGuiaAbierta] = useState(() => !guiaYaVista())

  const actual = APARTADOS.find((a) => a.id === apartado)

  async function salir() {
    if (sucio && !window.confirm('Tienes cambios sin publicar. ¿Seguro que quieres salir?')) return
    await api.salir().catch(() => {})
    onSalir()
  }

  async function confirmarPublicar() {
    const ok = await publicar(nota)
    if (ok) { setPublicando(false); setNota('') }
  }

  if (cargando) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-100">
        <p className="text-sm font-medium text-slate-500">Cargando contenido…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-100 p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="font-semibold text-slate-900">No se pudo cargar el contenido</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Boton variante="primario" className="mt-4" onClick={recargar}>Reintentar</Boton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-slate-100">
      {/* ------------------------------------------------------ cabecera */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto} aria-controls="menu-panel"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            {menuAbierto ? <Menu className="size-5" /> : <Menu className="size-5" />}
          </button>

          <img src="/img/logo-fallback.png" alt="" className="h-9 w-auto shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">Panel de administración</p>
            <p className="truncate text-xs text-slate-500">
              {usuario}
              {modo === 'local' && <span className="ml-2 text-amber-600">· modo local</span>}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Boton
              variante="fantasma"
              icono={HelpCircle}
              onClick={() => setGuiaAbierta(true)}
              aria-label="Cómo funciona el panel"
              title="Cómo funciona el panel"
              className="!px-2"
            />
            <Boton icono={Eye} onClick={() => setPrevisualizando(true)} className="max-sm:!px-2">
              <span className="max-sm:hidden">Previsualizar</span>
            </Boton>
            {/* El title explica por qué está apagado: un botón gris sin
                explicación es la forma más rápida de que alguien se atasque. */}
            <Boton
              variante="primario"
              icono={Rocket}
              disabled={!sucio}
              title={sucio ? 'Publicar los cambios en el sitio' : 'No hay cambios nuevos que publicar'}
              onClick={() => setPublicando(true)}
              className="max-sm:!px-2"
            >
              <span className="max-sm:hidden">Publicar</span>
            </Boton>
            <Boton variante="fantasma" icono={LogOut} onClick={salir} aria-label="Cerrar sesión" className="!px-2" />
          </div>
        </div>

        {/* Banda de cambios sin publicar.
            Antes era una pastilla pequeña que se perdía entre los botones, y
            justo es lo que nadie debe pasar por alto: sin publicar, el sitio
            sigue igual. */}
        {sucio && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-amber-200 bg-amber-50 px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              Tienes cambios sin publicar
            </span>
            <span className="text-sm text-amber-800">
              Solo los ves tú. El sitio no cambia hasta que pulses Publicar.
            </span>
            <button
              type="button"
              onClick={() => setConfirmarDescartar(true)}
              className="ml-auto rounded-lg px-2 py-1 text-sm font-semibold text-amber-900 underline underline-offset-2 hover:bg-amber-100"
            >
              Descartar
            </button>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* ------------------------------------------------- menú lateral */}
        <aside
          id="menu-panel"
          className={`${menuAbierto ? 'fixed inset-0 z-40 bg-slate-900/40 lg:static lg:bg-transparent' : 'hidden'} lg:block lg:w-64 lg:shrink-0`}
          onClick={(e) => e.target === e.currentTarget && setMenuAbierto(false)}
        >
          <nav className={`${menuAbierto ? 'h-full w-72 overflow-y-auto bg-white p-4 shadow-xl lg:w-auto lg:bg-transparent lg:p-0 lg:shadow-none' : ''} lg:sticky lg:top-24`}>
            {menuAbierto && (
              <div className="mb-3 flex justify-end lg:hidden">
                <button type="button" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <X className="size-5" />
                </button>
              </div>
            )}
            <ul className="grid gap-1">
              {APARTADOS.map((a) => {
                const Icono = a.icono
                const activo = apartado === a.id
                return (
                  <li key={a.id}>
                    <button type="button"
                      onClick={() => { setApartado(a.id); setMenuAbierto(false) }}
                      aria-current={activo ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        activo ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'
                      }`}>
                      <Icono className="size-4 shrink-0" aria-hidden="true" />
                      {a.texto}
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* El aviso de cambios sin publicar vive en la banda de arriba,
                que se ve siempre. Aquí abajo queda el acceso a la guía. */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-600">
                ¿Dudas con algo? Abre la guía y repasa cómo funciona el panel en un minuto.
              </p>
              <Boton
                icono={HelpCircle}
                className="mt-2 w-full !py-1.5 text-xs"
                onClick={() => setGuiaAbierta(true)}
              >
                Cómo funciona
              </Boton>
            </div>
          </nav>
        </aside>

        {/* ---------------------------------------------------- contenido */}
        <main className="min-w-0 flex-1">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-slate-900">{actual.texto}</h1>
            <p className="text-sm text-slate-500">{actual.nota}</p>
          </div>
          <actual.Componente />
        </main>
      </div>

      {guiaAbierta && <Guia onCerrar={() => setGuiaAbierta(false)} />}

      {previsualizando && <Previsualizacion onCerrar={() => setPrevisualizando(false)} />}

      {/* ------------------------------------------------ publicar */}
      {publicando && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="publicar-titulo">
          <button type="button" aria-label="Cancelar" onClick={() => setPublicando(false)}
            className="absolute inset-0 cursor-default bg-slate-900/50" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="publicar-titulo" className="font-semibold text-slate-900">Publicar los cambios</h3>
            <p className="mt-2 text-sm text-slate-600">
              {modo === 'local'
                ? 'Estás en modo local: se escribirá en tu copia del proyecto, no en el sitio publicado.'
                : 'Se guardarán en el repositorio y el sitio se reconstruirá solo. Tarda alrededor de un minuto en verse.'}
            </p>

            <label htmlFor="nota" className="mt-4 block text-sm font-medium text-slate-700">
              ¿Qué cambiaste? <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input id="nota" className={`${claseInput} mt-1`} value={nota} maxLength={100}
              onChange={(e) => setNota(e.target.value)}
              placeholder="precios de temporada, fotos nuevas de elásticos…" />
            <p className="mt-1 text-xs text-slate-500">
              Aparecerá en el historial para que sepas qué hiciste en cada publicación.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Boton onClick={() => setPublicando(false)}>Cancelar</Boton>
              <Boton variante="primario" icono={Rocket} cargando={guardando} onClick={confirmarPublicar}>
                Publicar
              </Boton>
            </div>
          </div>
        </div>
      )}

      <Confirmar
        abierto={confirmarDescartar}
        titulo="¿Descartar los cambios?"
        mensaje="Volverás a lo que está publicado ahora mismo. Lo que hayas editado sin publicar se pierde."
        textoConfirmar="Descartar"
        peligro
        onConfirmar={() => { descartar(); setConfirmarDescartar(false) }}
        onCancelar={() => setConfirmarDescartar(false)}
      />

      <Avisos />
    </div>
  )
}
