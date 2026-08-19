import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Products from './components/Products'
import Solutions from './components/Solutions'
import Location from './components/Location'
import Contact from './components/Contact'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'
import FloatingWhatsApp from './components/FloatingWhatsApp'

export default function App() {
  return (
    <>
      <LoadingScreen />
      <Navbar />

      <main id="contenido">
        <Hero />
        <Marquee />
        <About />
        <Products />
        <Solutions />
        <Location />
        <Contact />
        <FinalCTA />
      </main>

      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
