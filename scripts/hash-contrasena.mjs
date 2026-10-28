/**
 * Genera el hash de la contraseña del panel.
 *
 *   npm run admin:hash -- "mi contraseña"
 *
 * La contraseña en claro NO se guarda en ningún sitio: copia el hash que
 * imprime y pégalo en la variable de entorno ADMIN_PASSWORD_HASH.
 */
import { randomBytes } from 'node:crypto'
import { hashContrasena } from '../api/_lib/auth.js'

const contrasena = process.argv[2]

if (!contrasena) {
  console.error('\nUso: npm run admin:hash -- "tu-contraseña"\n')
  process.exit(1)
}
// Por debajo de 8 no se genera: a ese tamaño ni el hash salva la cuenta.
// Entre 8 y 11 sí, pero avisando: la decisión es de quien administra el sitio,
// no del script.
if (contrasena.length < 8) {
  console.error('\nDemasiado corta: usa al menos 8 caracteres.\n')
  process.exit(1)
}
if (contrasena.length < 12) {
  console.warn(
    `\n⚠  Son ${contrasena.length} caracteres y es la única llave de un panel que` +
      '\n   reescribe el sitio en vivo. Con 14 o más (por ejemplo tres palabras' +
      '\n   unidas por guiones) te proteges de los diccionarios de ataque.\n'
  )
}

console.log('\nPega estas dos variables en Vercel → Settings → Environment Variables:\n')
console.log(`ADMIN_PASSWORD_HASH=${hashContrasena(contrasena)}`)
console.log(`AUTH_SECRET=${randomBytes(48).toString('base64url')}`)
console.log('\nY recuerda: la contraseña en claro no queda guardada en ningún archivo.\n')
