import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'

/**
 * Estado del editor.
 *
 * Mantiene dos copias: lo publicado y lo que estás tocando. De ahí salen el
 * aviso de «cambios sin publicar», el botón de descartar y la advertencia al
 * cerrar la pestaña.
 *
 * El borrador se guarda también en el navegador para que un cierre accidental
 * no se lleve media hora de trabajo. Es un apunte personal del editor, no el
 * contenido del sitio: lo que ven los visitantes solo cambia al publicar.
 */

const EditorContext = createContext(null)
const CLAVE_BORRADOR = 'mi_panel_borrador_v1'

const clonar = (x) => JSON.parse(JSON.stringify(x))
const iguales = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/** Escribe en una ruta tipo 'hero.pilares.0.texto' sin mutar el original. */
function asignar(objeto, ruta, valor) {
  const partes = Array.isArray(ruta) ? ruta : ruta.split('.')
  if (!partes.length) return valor
  const copia = Array.isArray(objeto) ? [...objeto] : { ...objeto }
  const [cabeza, ...resto] = partes
  copia[cabeza] = resto.length ? asignar(copia[cabeza] ?? {}, resto, valor) : valor
  return copia
}

function obtener(objeto, ruta) {
  return (Array.isArray(ruta) ? ruta : ruta.split('.')).reduce(
    (acc, k) => (acc == null ? acc : acc[k]),
    objeto
  )
}

export function EditorProvider({ usuario, children }) {
  const [publicado, setPublicado] = useState(null)
  const [borrador, setBorrador] = useState(null)
  const [sha, setSha] = useState(null)
  const [modo, setModo] = useState('local')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [avisos, setAvisos] = useState([])
  const idAviso = useRef(0)

  const avisar = useCallback((texto, tipo = 'ok') => {
    const id = ++idAviso.current
    setAvisos((a) => [...a, { id, texto, tipo }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === 'error' ? 7000 : 3500)
  }, [])

  // ------------------------------------------------------------- carga
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [datos, sesion] = await Promise.all([api.contenido(), api.sesion()])
      const limpio = {
        site: datos.site,
        categories: datos.categories,
        products: datos.products,
        media: datos.media,
      }
      setPublicado(limpio)
      setSha(datos.sha)
      setModo(sesion.modo)

      // ¿Había un borrador local más reciente?
      let guardado = null
      try {
        const crudo = localStorage.getItem(CLAVE_BORRADOR)
        if (crudo) {
          const parsed = JSON.parse(crudo)
          if (parsed?.sha === datos.sha && !iguales(parsed.contenido, limpio)) guardado = parsed.contenido
        }
      } catch {
        // Un borrador ilegible no debe impedir abrir el panel.
      }

      setBorrador(guardado ?? clonar(limpio))
      if (guardado) avisar('Recuperamos los cambios que no habías publicado.', 'info')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [avisar])

  useEffect(() => { cargar() }, [cargar])

  // --------------------------------------------- persistencia del borrador
  const sucio = useMemo(
    () => Boolean(publicado && borrador && !iguales(publicado, borrador)),
    [publicado, borrador]
  )

  useEffect(() => {
    if (!borrador || !sha) return
    try {
      if (sucio) localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ sha, contenido: borrador }))
      else localStorage.removeItem(CLAVE_BORRADOR)
    } catch {
      // Modo incógnito o almacenamiento lleno: el panel sigue funcionando.
    }
  }, [borrador, sha, sucio])

  // Avisa antes de cerrar la pestaña con cambios sin publicar
  useEffect(() => {
    if (!sucio) return
    const alSalir = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', alSalir)
    return () => window.removeEventListener('beforeunload', alSalir)
  }, [sucio])

  // ------------------------------------------------------------- acciones
  const set = useCallback((ruta, valor) => {
    setBorrador((b) => (b ? asignar(b, ruta, valor) : b))
  }, [])

  const get = useCallback((ruta) => obtener(borrador, ruta), [borrador])

  const publicar = useCallback(
    async (mensaje) => {
      setGuardando(true)
      try {
        const res = await api.publicar(borrador, sha, mensaje)
        setPublicado(clonar(borrador))
        setSha(res.sha)
        try { localStorage.removeItem(CLAVE_BORRADOR) } catch { /* sin almacenamiento */ }
        avisar(
          res.local
            ? 'Guardado en el disco local (modo desarrollo).'
            : 'Publicado. El sitio se actualiza en aproximadamente un minuto.'
        )
        return true
      } catch (err) {
        avisar(err.message, 'error')
        if (err.estado === 409) await cargar()
        return false
      } finally {
        setGuardando(false)
      }
    },
    [borrador, sha, avisar, cargar]
  )

  const descartar = useCallback(() => {
    setBorrador(clonar(publicado))
    try { localStorage.removeItem(CLAVE_BORRADOR) } catch { /* sin almacenamiento */ }
    avisar('Cambios descartados.', 'info')
  }, [publicado, avisar])

  /** Tras subir o borrar una imagen, la biblioteca la manda el servidor. */
  const sincronizarMedios = useCallback((medios) => {
    setBorrador((b) => (b ? { ...b, media: medios } : b))
    setPublicado((p) => (p ? { ...p, media: medios } : p))
  }, [])

  const valor = useMemo(
    () => ({
      usuario, publicado, borrador, sha, modo, cargando, guardando, error, sucio, avisos,
      set, get, publicar, descartar, recargar: cargar, avisar, sincronizarMedios,
      site: borrador?.site, categorias: borrador?.categories,
      productos: borrador?.products, medios: borrador?.media,
    }),
    [usuario, publicado, borrador, sha, modo, cargando, guardando, error, sucio, avisos,
     set, get, publicar, descartar, cargar, avisar, sincronizarMedios]
  )

  return <EditorContext.Provider value={valor}>{children}</EditorContext.Provider>
}

export function useEditor() {
  const v = useContext(EditorContext)
  if (!v) throw new Error('useEditor debe usarse dentro de <EditorProvider>')
  return v
}
