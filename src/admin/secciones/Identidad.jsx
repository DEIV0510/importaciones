import { useEditor } from '../estado'
import { SelectorImagen } from '../medios'
import { Area, Fila, Interruptor, Panel, Texto } from '../ui'

export default function Identidad() {
  const { site } = useEditor()

  return (
    <div className="grid gap-5">
      <Panel
        titulo="Identidad"
        descripcion="El nombre, el lema y el logotipo que aparecen en la navegación, el pie y la pantalla de carga."
      >
        <Fila>
          <Texto ruta="site.identidad.nombreLegal" etiqueta="Nombre legal" max={120}
            ayuda="Aparece en el pie, en el aviso de derechos y en los datos para buscadores." />
          <Texto ruta="site.identidad.nombreCorto" etiqueta="Nombre corto" max={60}
            ayuda="Para espacios donde el nombre completo no cabe." />
        </Fila>

        <Texto ruta="site.identidad.lema" etiqueta="Lema" max={160} />
        <Area ruta="site.identidad.descripcion" etiqueta="Descripción breve" max={400}
          ayuda="Se usa bajo el titular de la portada." />
        <Area ruta="site.identidad.descripcionLarga" etiqueta="Descripción larga" max={2000} filas={4} />

        <SelectorImagen ruta="site.identidad.logo" etiqueta="Logotipo"
          ayuda="Se usa en la navegación, el pie y la pantalla de carga." />

        <Texto ruta="site.identidad.cargaTexto" etiqueta="Texto de la pantalla de carga" max={60}
          ayuda="La frase que acompaña al logo mientras el sitio carga." />
      </Panel>

      <Panel
        titulo="Buscadores (SEO)"
        descripcion="Cómo aparece el sitio en Google y al compartirlo por WhatsApp o redes."
      >
        <Texto ruta="site.seo.titulo" etiqueta="Título para buscadores" max={120}
          ayuda="Google suele mostrar unos 60 caracteres; el resto lo corta. El actual tiene más, a propósito, para incluir las búsquedas largas." />
        <Area ruta="site.seo.descripcion" etiqueta="Descripción para buscadores" max={220}
          ayuda="El texto gris bajo el título en los resultados. Entre 120 y 160 funciona bien." />

        <Fila>
          <Texto ruta="site.seo.url" etiqueta="Dirección del sitio"
            ayuda="Con https://. Cámbiala cuando tengas el dominio definitivo." />
          <Texto ruta="site.seo.ogImagen" etiqueta="Imagen al compartir"
            ayuda="Ruta dentro del sitio, por ejemplo /og-image.jpg" />
        </Fila>

        <Interruptor ruta="site.seo.indexar" etiqueta="Permitir que Google indexe el sitio"
          ayuda="Desactívalo solo si quieres mantener el sitio fuera de los buscadores." />

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Estos campos se aplican al cargar la página. Las etiquetas que viajan en el HTML
          inicial (las que leen algunos robots sin ejecutar JavaScript) se actualizan en el
          despliegue que dispara cada publicación.
        </p>
      </Panel>

      <Panel titulo="Pantalla de carga y botón flotante">
        <Interruptor ruta="site.contacto.flotante.visible" etiqueta="Mostrar el botón flotante de WhatsApp" />
        <Texto ruta="site.contacto.flotante.tooltip" etiqueta="Texto del globo al pasar el cursor" max={60} />
        <p className="text-xs text-slate-500">
          Última publicación: {site?.actualizado
            ? `${new Date(site.actualizado).toLocaleString('es-CO')} por ${site.actualizadoPor ?? 'desconocido'}`
            : 'todavía no se ha publicado nada desde el panel.'}
        </p>
      </Panel>
    </div>
  )
}
