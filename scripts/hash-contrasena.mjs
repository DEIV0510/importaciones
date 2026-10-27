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
if (contrasena.length < 12) {
  console.error('\nUsa al menos 12 caracteres. Es la única llave del panel.\n')
  process.exit(1)
}

console.log('\nPega estas dos variables en Vercel → Settings → Environment Variables:\n')
console.log(`ADMIN_PASSWORD_HASH=${hashContrasena(contrasena)}`)
console.log(`AUTH_SECRET=${randomBytes(48).toString('base64url')}`)
console.log('\nY recuerda: la contraseña en claro no queda guardada en ningún archivo.\n')
