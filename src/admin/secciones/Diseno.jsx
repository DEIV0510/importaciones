import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { useEditor } from '../estado'
import { Boton, Color, Fila, Panel, Selector } from '../ui'
import { CONTENIDO_PUBLICADO } from '../../content/publicado'

/** Contraste WCAG entre dos colores #rrggbb. */
function contraste(a, b) {
  const luz = (hex) => {
    const c = hex.replace('#', '')
    const v = [0, 1, 2].map((i) => {
      const x = parseInt(c.substr(i * 2, 2), 16) / 255
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
  }
  try {
    const [l1, l2] = [luz(a), luz(b)].sort((x, y) => y - x)
    return (l1 + 0.05) / (l2 + 0.05)
  } catch {
    return 0
  }
}

const GRUPOS = [
  {
    titulo: 'Azules corporativos',
    nota: 'Salieron del logotipo. Son el fondo de la portada, los botones azules y los textos oscuros.',
    claves: ['navy-950', 'navy-900', 'navy-850', 'navy-800', 'navy-700', 'navy-600', 'navy-500', 'navy-400', 'navy-100', 'navy-50'],
  },
  {
    titulo: 'Naranjas de acción',
    nota: 'El naranja de los botones es más oscuro que el de los acentos a propósito: así cumple contraste con el texto blanco encima.',
    claves: ['flame-700', 'flame-600', 'flame-500', 'flame-400'],
  },
  {
    titulo: 'Textos y superficies',
    claves: ['ink', 'body', 'muted', 'line', 'shell'],
  },
]

/** Pares que deben mantener contraste suficiente. */
const COMPROBACIONES = [
  { texto: '#ffffff', fondo: 'flame-600', minimo: 4.5, donde: 'Texto blanco sobre los botones naranjas' },
  { texto: '#ffffff', fondo: 'navy-800', minimo: 4.5, donde: 'Texto blanco sobre los botones azules' },
  { texto: '#ffffff', fondo: 'navy-900', minimo: 4.5, donde: 'Texto blanco sobre el fondo de la portada' },
  { texto: 'ink', fondo: '#ffffff', minimo: 4.5, donde: 'Títulos sobre fondo blanco' },
  { texto: 'body', fondo: '#ffffff', minimo: 4.5, donde: 'Párrafos sobre fondo blanco' },
  { texto: 'muted', fondo: '#ffffff', minimo: 4.5, donde: 'Textos secundarios sobre fondo blanco' },
]

const SIN_COLORES = {}

export default function Diseno() {
  const { site, set, avisar } = useEditor()
  // Se referencia el objeto guardado, no una copia nueva en cada render:
  // así useMemo solo recalcula cuando los colores cambian de verdad.
  const colores = site?.tema?.colores ?? SIN_COLORES

  const alertas = useMemo(() => {
    const valor = (c) => (c.startsWith('#') ? c : colores[c])
    return COMPROBACIONES.map((c) => {
      const ratio = contraste(valor(c.texto), valor(c.fondo))
      return { ...c, ratio, pasa: ratio >= c.minimo }
    })
  }, [colores])

  const fallos = alertas.filter((a) => !a.pasa)

  const restaurar = () => {
    set('site.tema', JSON.parse(JSON.stringify(CONTENIDO_PUBLICADO.site.tema)))
    avisar('Colores y tipografías restaurados a los originales.', 'info')
  }

  return (
    <div className="grid gap-5">
      <Panel
        titulo="Tipografías"
        descripcion="Solo se ofrecen fuentes ya cargadas por el sitio, así que cambiarlas no añade ninguna descarga ni retrasa la página."
      >
        <Fila>
          <Selector ruta="site.tema.tipografia.display" etiqueta="Títulos"
            opciones={[
              { valor: 'Manrope', texto: 'Manrope (actual)' },
              { valor: 'Inter', texto: 'Inter' },
              { valor: 'Montserrat', texto: 'Montserrat' },
            ]} />
          <Selector ruta="site.tema.tipografia.texto" etiqueta="Textos"
            opciones={[
              { valor: 'Inter', texto: 'Inter (actual)' },
              { valor: 'Manrope', texto: 'Manrope' },
              { valor: 'Montserrat', texto: 'Montserrat' },
            ]} />
        </Fila>
      </Panel>

      {fallos.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900">Revisa el contraste</h3>
          <p className="mt-1 text-sm text-amber-800">
            Con estos colores hay texto difícil de leer. Puedes publicar igualmente, pero se verá
            mal para quien tenga poca visión o mire la pantalla a pleno sol.
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm text-amber-900">
            {fallos.map((f) => (
              <li key={f.donde}>
                · {f.donde}: <strong>{f.ratio.toFixed(2)}:1</strong> (hace falta {f.minimo}:1)
              </li>
            ))}
          </ul>
        </div>
      )}

      {GRUPOS.map((grupo) => (
        <Panel key={grupo.titulo} titulo={grupo.titulo} descripcion={grupo.nota}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.claves.filter((k) => k in colores).map((clave) => (
              <Color key={clave} ruta={`site.tema.colores.${clave}`} etiqueta={clave} />
            ))}
          </div>
        </Panel>
      ))}

      <Panel titulo="Volver al diseño original"
        descripcion="Restaura los colores y las tipografías con los que se entregó el sitio. No toca ningún texto ni producto.">
        <Boton icono={RotateCcw} onClick={restaurar} className="justify-self-start">
          Restaurar colores y tipografías
        </Boton>
      </Panel>
    </div>
  )
}
