import { createContext, useContext, useEffect, useMemo } from 'react'
import { derive } from './derive'
import { CONTENIDO_PUBLICADO, aplicarTema } from './publicado'

const ContentContext = createContext(null)

/**
 * @param {object}  props
 * @param {object} [props.contenido]  Contenido crudo; por defecto, el publicado.
 * @param {boolean} [props.aplicarTemaGlobal]  false en la previsualización del panel,
 *   para no repintar el propio panel con los colores que se están probando.
 */
export function ContentProvider({ contenido, aplicarTemaGlobal = true, children }) {
  const fuente = contenido ?? CONTENIDO_PUBLICADO

  const valor = useMemo(
    () => derive(fuente.site, fuente.categories, fuente.products),
    [fuente]
  )

  useEffect(() => {
    if (!aplicarTemaGlobal) return
    aplicarTema(valor.tema)
  }, [valor.tema, aplicarTemaGlobal])

  return <ContentContext.Provider value={valor}>{children}</ContentContext.Provider>
}

export function useContent() {
  const valor = useContext(ContentContext)
  if (!valor) throw new Error('useContent debe usarse dentro de <ContentProvider>')
  return valor
}
