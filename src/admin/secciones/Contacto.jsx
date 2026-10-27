import { NOMBRES_ICONOS } from '../../components/ui/iconRegistry'
import { useEditor } from '../estado'
import { SelectorImagen } from '../medios'
import { Area, Fila, Interruptor, Lista, Panel, Selector, Texto } from '../ui'

const validarWa = (v) =>
  /^\d{10,15}$/.test(String(v).replace(/[\s()+-]/g, ''))
    ? ''
    : 'Entre 10 y 15 dígitos, con indicativo de país (57 en Colombia).'

export default function Contacto() {
  const { site, set } = useEditor()
  const telefonos = site?.contacto?.telefonos ?? []
  const redes = site?.contacto?.redes ?? []
  const soluciones = site?.soluciones?.items ?? []

  return (
    <div className="grid gap-5">
      <Panel
        titulo="Líneas de WhatsApp"
        descripcion="Con estos números se arman todos los botones del sitio. La primera línea es la que usan los botones principales y el botón flotante."
      >
        <Lista
          ruta="site.contacto.telefonos"
          items={telefonos}
          minimo={1}
          alAnadir={() => set('site.contacto.telefonos', [...telefonos, { id: `tel-${Date.now()}`, display: '', wa: '' }])}
          textoAnadir="Añadir línea"
          render={(tel, i) => (
            <div className="grid gap-3">
              {i === 0 && (
                <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  Línea principal: la usan el botón flotante y los botones de cotización.
                </p>
              )}
              <Fila>
                <Texto ruta={`site.contacto.telefonos.${i}.display`} etiqueta="Cómo se muestra" max={40}
                  ayuda="Por ejemplo: 350 276 8542" />
                <Texto ruta={`site.contacto.telefonos.${i}.wa`} etiqueta="Número para WhatsApp"
                  validar={validarWa} ayuda="Con indicativo y sin signos: 573502768542" />
              </Fila>
              {tel.wa && validarWa(tel.wa) === '' && (
                <a href={`https://wa.me/${tel.wa.replace(/[\s()+-]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="justify-self-start text-xs font-semibold text-sky-700 underline">
                  Probar este enlace de WhatsApp
                </a>
              )}
            </div>
          )}
        />
      </Panel>

      <Panel titulo="Mensajes prellenados" descripcion="El texto que aparece escrito al abrir WhatsApp, según el botón que se pulse.">
        <Area ruta="site.contacto.mensajes.cotizacion" etiqueta="Botones de cotización" max={400} filas={2} />
        <Area ruta="site.contacto.mensajes.general" etiqueta="Contacto general y botón flotante" max={400} filas={2} />
        <Area ruta="site.contacto.mensajes.ubicacion" etiqueta="Botón de la sección de ubicación" max={400} filas={2} />
        <Area ruta="site.contacto.mensajes.producto" etiqueta="Ficha de producto" max={400} filas={2}
          ayuda="Escribe {producto} donde quieras que aparezca el nombre del producto." />
        <Area ruta="site.contacto.mensajes.categoria" etiqueta="Línea del catálogo" max={400} filas={2}
          ayuda="Escribe {categoria} donde quieras que aparezca el nombre de la línea." />
      </Panel>

      <Panel titulo="Redes sociales">
        <Lista
          ruta="site.contacto.redes"
          items={redes}
          alAnadir={() => set('site.contacto.redes', [...redes, { id: 'instagram', label: '', handle: '', url: '', visible: true }])}
          textoAnadir="Añadir red"
          render={(red, i) => (
            <div className="grid gap-3">
              <Fila columnas={3}>
                <Selector ruta={`site.contacto.redes.${i}.id`} etiqueta="Red"
                  opciones={[
                    { valor: 'instagram', texto: 'Instagram' },
                    { valor: 'tiktok', texto: 'TikTok' },
                    { valor: 'facebook', texto: 'Facebook' },
                  ]} />
                <Texto ruta={`site.contacto.redes.${i}.label`} etiqueta="Nombre visible" max={40} />
                <Texto ruta={`site.contacto.redes.${i}.handle`} etiqueta="Usuario" max={80} />
              </Fila>
              <Texto ruta={`site.contacto.redes.${i}.url`} etiqueta="Enlace"
                ayuda="Debe empezar por https://" />
              <Interruptor ruta={`site.contacto.redes.${i}.visible`} etiqueta="Mostrar esta red" />
              {red.url?.startsWith('https://www.facebook.com/search') && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Este enlace lleva a una búsqueda en Facebook, no a la página. Sustitúyelo por la
                  dirección real cuando la tengas.
                </p>
              )}
            </div>
          )}
        />
      </Panel>

      <Panel titulo="Sección de contacto">
        <Interruptor ruta="site.contactoSeccion.visible" etiqueta="Mostrar la sección" />
        <Texto ruta="site.contactoSeccion.eyebrow" etiqueta="Antetítulo" max={60} />
        <Texto ruta="site.contactoSeccion.titulo" etiqueta="Título" max={160} />
        <Area ruta="site.contactoSeccion.subtitulo" etiqueta="Subtítulo" max={400} />
        <Fila>
          <Texto ruta="site.contactoSeccion.etiquetaLlamar" etiqueta="Rótulo de llamada" max={40} />
          <Texto ruta="site.contactoSeccion.etiquetaRedes" etiqueta="Rótulo de redes" max={40} />
        </Fila>
      </Panel>

      <Panel titulo="Ubicación">
        <Interruptor ruta="site.ubicacion.visible" etiqueta="Mostrar la sección" />
        <Texto ruta="site.ubicacion.eyebrow" etiqueta="Antetítulo" max={60} />
        <Texto ruta="site.ubicacion.titulo" etiqueta="Título" max={160} />
        <Area ruta="site.ubicacion.subtitulo" etiqueta="Subtítulo" max={400} />

        <Fila columnas={3}>
          <Texto ruta="site.ubicacion.calle" etiqueta="Dirección" max={120} />
          <Texto ruta="site.ubicacion.sector" etiqueta="Sector" max={80} />
          <Texto ruta="site.ubicacion.referencia" etiqueta="Punto de referencia" max={120} />
        </Fila>

        <Fila columnas={3}>
          <Texto ruta="site.ubicacion.etiquetas.calle" etiqueta="Rótulo de dirección" max={40} />
          <Texto ruta="site.ubicacion.etiquetas.sector" etiqueta="Rótulo de sector" max={40} />
          <Texto ruta="site.ubicacion.etiquetas.referencia" etiqueta="Rótulo de referencia" max={40} />
        </Fila>

        <Texto ruta="site.ubicacion.consultaMapa" etiqueta="Búsqueda para el mapa" max={200}
          ayuda="Lo que se escribiría en Google Maps. Con esto se arma el mapa y el botón «Cómo llegar»." />

        {site?.ubicacion?.consultaMapa && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.ubicacion.consultaMapa)}`}
            target="_blank" rel="noopener noreferrer"
            className="justify-self-start text-xs font-semibold text-sky-700 underline">
            Comprobar que el mapa apunta al sitio correcto
          </a>
        )}

        <Fila columnas={3}>
          <Texto ruta="site.ubicacion.ciudad" etiqueta="Ciudad" max={60} />
          <Texto ruta="site.ubicacion.region" etiqueta="Departamento" max={60} />
          <Texto ruta="site.ubicacion.pais" etiqueta="País" max={60} />
        </Fila>

        <Fila>
          <Texto ruta="site.ubicacion.ctaComoLlegar" etiqueta="Botón «Cómo llegar»" max={40} />
          <Texto ruta="site.ubicacion.ctaWhatsapp" etiqueta="Botón de WhatsApp" max={40} />
        </Fila>
      </Panel>

      <Panel titulo="Para quién trabajamos" descripcion="Las tarjetas sobre fondo azul.">
        <Interruptor ruta="site.soluciones.visible" etiqueta="Mostrar la sección" />
        <Texto ruta="site.soluciones.eyebrow" etiqueta="Antetítulo" max={60} />
        <Texto ruta="site.soluciones.titulo" etiqueta="Título" max={160} />
        <Area ruta="site.soluciones.subtitulo" etiqueta="Subtítulo" max={400} />
        <Texto ruta="site.soluciones.cta" etiqueta="Botón del final" max={40} />

        <Lista
          ruta="site.soluciones.items"
          items={soluciones}
          alAnadir={() => set('site.soluciones.items', [...soluciones, { id: `sol-${Date.now()}`, icono: 'Package', titulo: 'Nuevo público', texto: '' }])}
          textoAnadir="Añadir tarjeta"
          render={(_, i) => (
            <div className="grid gap-3">
              <Fila>
                <Texto ruta={`site.soluciones.items.${i}.titulo`} etiqueta="Título" max={60} />
                <Selector ruta={`site.soluciones.items.${i}.icono`} etiqueta="Icono"
                  opciones={NOMBRES_ICONOS.map((n) => ({ valor: n, texto: n }))} />
              </Fila>
              <Area ruta={`site.soluciones.items.${i}.texto`} etiqueta="Texto" max={400} filas={2} />
            </div>
          )}
        />
      </Panel>

      <Panel titulo="Bloque de cierre">
        <Interruptor ruta="site.ctaFinal.visible" etiqueta="Mostrar el bloque" />
        <Texto ruta="site.ctaFinal.chip" etiqueta="Etiqueta superior" max={60} />
        <Texto ruta="site.ctaFinal.titulo" etiqueta="Título" max={160} />
        <Area ruta="site.ctaFinal.texto" etiqueta="Texto" max={400} filas={2} />
        <Fila>
          <Texto ruta="site.ctaFinal.ctaPrimario" etiqueta="Botón principal" max={40} />
          <Texto ruta="site.ctaFinal.ctaSecundario" etiqueta="Botón secundario" max={40} />
        </Fila>
        <Fila columnas={3}>
          <SelectorImagen ruta="site.ctaFinal.imagenes.0" etiqueta="Imagen 1" />
          <SelectorImagen ruta="site.ctaFinal.imagenes.1" etiqueta="Imagen 2" />
          <SelectorImagen ruta="site.ctaFinal.imagenes.2" etiqueta="Imagen 3" />
        </Fila>
        <p className="text-xs text-slate-500">Estas tres fotos solo se ven en pantallas grandes.</p>
      </Panel>

      <Panel titulo="Pie de página">
        <Area ruta="site.pie.descripcion" etiqueta="Descripción" max={2000} filas={3} />
        <Fila columnas={3}>
          <Texto ruta="site.pie.tituloNavegacion" etiqueta="Título de navegación" max={40} />
          <Texto ruta="site.pie.tituloLineas" etiqueta="Título de líneas" max={40} />
          <Texto ruta="site.pie.tituloContacto" etiqueta="Título de contacto" max={40} />
        </Fila>
        <Fila>
          <Texto ruta="site.pie.copyright" etiqueta="Aviso de derechos" max={160}
            ayuda="Escribe {anio} donde quieras que aparezca el año." />
          <Texto ruta="site.pie.anio" etiqueta="Año" tipo="number" />
        </Fila>
        <Texto ruta="site.pie.volverArriba" etiqueta="Texto de «volver arriba»" max={40} />
      </Panel>
    </div>
  )
}
