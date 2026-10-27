import { NOMBRES_ICONOS } from '../../components/ui/iconRegistry'
import { useEditor } from '../estado'
import { SelectorImagen } from '../medios'
import { Area, Fila, Interruptor, Lista, Panel, Selector, Texto, claseInput } from '../ui'

const FORMAS = [
  { valor: 'destacada', texto: 'Destacada (pieza grande)' },
  { valor: 'vertical', texto: 'Vertical (productos altos)' },
  { valor: 'ancha', texto: 'Ancha (productos apaisados)' },
]

export default function Portada() {
  const { site, set } = useEditor()
  const hero = site?.hero ?? {}
  const pilares = hero.pilares ?? []
  const vitrina = hero.vitrina ?? []
  const items = site?.marquesina?.items ?? []

  return (
    <div className="grid gap-5">
      <Panel titulo="Titular" descripcion="Lo primero que lee quien entra. La palabra destacada lleva el subrayado naranja.">
        <Fila>
          <Texto ruta="site.hero.chip" etiqueta="Etiqueta naranja" max={30} />
          <Texto ruta="site.hero.chipTexto" etiqueta="Texto junto a la etiqueta" max={160} />
        </Fila>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Titular en tres partes</p>
          <Texto ruta="site.hero.tituloAntes" etiqueta="Antes" max={160} placeholder="Todo lo que tu taller, " />
          <Texto ruta="site.hero.tituloDestacado" etiqueta="Palabra destacada" max={60} placeholder="fábrica" />
          <Texto ruta="site.hero.tituloDespues" etiqueta="Después" max={160} placeholder=" o emprendimiento necesita." />
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
            <span className="text-xs text-slate-400">Queda así: </span>
            {hero.tituloAntes}
            <span className="bg-orange-200 px-0.5 font-semibold">{hero.tituloDestacado}</span>
            {hero.tituloDespues}
          </p>
        </div>

        <Area ruta="site.hero.subtitulo" etiqueta="Texto de apoyo" max={400} />

        <Fila>
          <Texto ruta="site.hero.ctaPrimario" etiqueta="Botón principal" max={40} ayuda="Abre WhatsApp." />
          <Texto ruta="site.hero.ctaSecundario" etiqueta="Botón secundario" max={40} />
        </Fila>
        <Texto ruta="site.hero.ctaSecundarioHref" etiqueta="Destino del botón secundario"
          ayuda="Un ancla como #productos, o una dirección completa con https://" />

        <Interruptor ruta="site.hero.mostrarDireccion" etiqueta="Mostrar la dirección bajo los pilares" />
      </Panel>

      <Panel titulo="Pilares" descripcion="Las tres líneas con icono que resumen a qué se dedica la empresa.">
        <Lista
          ruta="site.hero.pilares"
          items={pilares}
          alAnadir={() => set('site.hero.pilares', [...pilares, { id: `pil-${Date.now()}`, icono: 'Package', texto: 'Nuevo pilar' }])}
          textoAnadir="Añadir pilar"
          render={(_, i) => (
            <Fila>
              <Texto ruta={`site.hero.pilares.${i}.texto`} etiqueta="Texto" max={60} />
              <Selector ruta={`site.hero.pilares.${i}.icono`} etiqueta="Icono"
                opciones={NOMBRES_ICONOS.map((n) => ({ valor: n, texto: n }))} />
            </Fila>
          )}
        />
      </Panel>

      <Panel
        titulo="Vitrina de productos"
        descripcion="Los paneles de vidrio de la portada. Elige la forma según la foto: los rollos altos lucen en vertical y los elásticos en ancha. En el móvil solo se ven las cuatro primeras."
      >
        <Lista
          ruta="site.hero.vitrina"
          items={vitrina}
          minimo={1}
          alAnadir={() => set('site.hero.vitrina', [...vitrina, { id: `vit-${Date.now()}`, imagen: '', label: '', alt: '', forma: 'vertical' }])}
          textoAnadir="Añadir pieza"
          render={(pieza, i) => (
            <div className="grid gap-3">
              {i === 4 && (
                <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  A partir de aquí las piezas solo se ven en pantallas grandes.
                </p>
              )}
              <SelectorImagen ruta={`site.hero.vitrina.${i}.imagen`} etiqueta="Imagen"
                ayuda="Necesita la variante «hero»: súbela desde Medios para generarla." />
              <Fila>
                <Texto ruta={`site.hero.vitrina.${i}.label`} etiqueta="Etiqueta sobre la foto" max={40} />
                <Selector ruta={`site.hero.vitrina.${i}.forma`} etiqueta="Forma del panel" opciones={FORMAS} />
              </Fila>
              <Texto ruta={`site.hero.vitrina.${i}.alt`} etiqueta="Texto alternativo" max={160}
                ayuda="Describe la foto para lectores de pantalla y buscadores." />
            </div>
          )}
        />
      </Panel>

      <Panel titulo="Banda de líneas" descripcion="La cinta que se desplaza bajo la portada.">
        <Interruptor ruta="site.marquesina.visible" etiqueta="Mostrar la banda" />
        <div className="grid gap-1.5">
          <label htmlFor="marquesina" className="text-sm font-medium text-slate-700">
            Textos, uno por línea
          </label>
          <textarea
            id="marquesina"
            rows={8}
            className={claseInput}
            value={items.join('\n')}
            onChange={(e) =>
              set('site.marquesina.items', e.target.value.split('\n').map((x) => x.trimStart()))
            }
          />
          <p className="text-xs text-slate-500">
            {items.filter(Boolean).length} líneas. Se repiten en bucle, así que con 8-12 queda bien.
          </p>
        </div>
      </Panel>
    </div>
  )
}
