import {
  Award, Box, Boxes, Briefcase, Building2, Clock, Cog, Factory, Footprints,
  Gem, Handshake, Hammer, Layers, Lightbulb, MapPin, Package, PackageCheck,
  PackageSearch, Palette, Phone, Rocket, Ruler, Scissors, Shapes, Shirt,
  ShoppingBag, Sparkles, Store, Truck, Users, Wrench, Zap,
} from 'lucide-react'

/**
 * Lista cerrada de iconos que el panel puede asignar.
 *
 * Es deliberadamente una lista y no un `import()` dinámico: el administrador
 * elige entre opciones conocidas y nunca puede inyectar un nombre arbitrario
 * que acabe ejecutando algo inesperado. Además así el bundle solo incluye
 * estos iconos.
 */
export const ICONOS = {
  Award, Box, Boxes, Briefcase, Building2, Clock, Cog, Factory, Footprints,
  Gem, Handshake, Hammer, Layers, Lightbulb, MapPin, Package, PackageCheck,
  PackageSearch, Palette, Phone, Rocket, Ruler, Scissors, Shapes, Shirt,
  ShoppingBag, Sparkles, Store, Truck, Users, Wrench, Zap,
}

export const NOMBRES_ICONOS = Object.keys(ICONOS)

/** Devuelve el icono pedido; si no existe, uno neutro, nunca `undefined`. */
export function icono(nombre) {
  return ICONOS[nombre] ?? Package
}
