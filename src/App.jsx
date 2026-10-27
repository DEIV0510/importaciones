import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Products from './components/Products'
import Solutions from './components/Solutions'
import Location from './components/Location'
import Contact from './components/Contact'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import { useContent } from './content/ContentContext'

/**
 * Secciones que el panel puede ocultar y reordenar.
 * La clave es el id guardado en site.json → secciones.
 */
const SECCIONES = {
  hero: Hero,
  marquesina: Marquee,
  productos: Products,
  soluciones: Solutions,
  ubicacion: Location,
  contacto: Contact,
  ctaFinal: FinalCTA,
}

/**
 * Sitio público.
 *
 * `conCortina` se desactiva en la previsualización del panel: allí no tiene
 * sentido esperar a una pantalla de carga cada vez que se toca un campo.
 */
export default function App({ conCortina = true }) {
  const { secciones, flotante } = useContent()

  return (
    <>
      {conCortina && <LoadingScreen />}
      <Navbar />

      <main id="contenido">
        {secciones.map((id) => {
          const Seccion = SECCIONES[id]
          return Seccion ? <Seccion key={id} /> : null
        })}
      </main>

      <Footer />
      {flotante.visible !== false && <FloatingWhatsApp />}
    </>
  )
}
