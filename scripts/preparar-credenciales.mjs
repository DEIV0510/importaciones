/**
 * Genera las credenciales del panel sin enseñarlas por pantalla.
 *
 *   node scripts/preparar-credenciales.mjs
 *
 * Deja:
 *   CREDENCIALES-PANEL.txt   la contraseña, para ti (ignorado por git)
 *   .tmp-env/                los valores sueltos, para pasarlos a Vercel
 *
 * La contraseña no se imprime en la terminal a propósito: lo que se imprime
 * queda en el historial del shell y en los registros de la sesión.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { randomBytes, randomInt } from 'node:crypto'
import { hashContrasena } from '../api/_lib/auth.js'

// Palabras cortas y sin tildes: la contraseña hay que poder teclearla en el móvil.
const PALABRAS = [
  'cinta', 'rollo', 'telar', 'aguja', 'hilo', 'bobina', 'faya', 'raso',
  'cuero', 'molde', 'tijera', 'prensa', 'motor', 'lampara', 'carnaza',
  'taller', 'fabrica', 'medellin', 'bomboná', 'elastico',
]

function generarContrasena() {
  const palabras = Array.from({ length: 3 }, () => PALABRAS[randomInt(PALABRAS.length)])
  const numero = randomInt(10, 100)
  return `${palabras.join('-')}-${numero}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const contrasena = generarContrasena()
const hash = hashContrasena(contrasena)
const secreto = randomBytes(48).toString('base64url')

mkdirSync('.tmp-env', { recursive: true })
writeFileSync('.tmp-env/ADMIN_PASSWORD_HASH', hash)
writeFileSync('.tmp-env/AUTH_SECRET', secreto)

writeFileSync(
  'CREDENCIALES-PANEL.txt',
  [
    'PANEL DE ADMINISTRACIÓN — MUNDO IMPORTACIONES',
    '='.repeat(46),
    '',
    'Dirección:  https://importaciones-olive.vercel.app/admin',
    'Usuario:    admin',
    `Contraseña: ${contrasena}`,
    '',
    '-'.repeat(46),
    'Este archivo NO se sube al repositorio (está en .gitignore).',
    'Guarda la contraseña donde la tengas a mano y borra este archivo.',
    '',
    'Para cambiarla más adelante:',
    '  1. npm run admin:hash -- "la-nueva-contraseña"',
    '  2. Pega el ADMIN_PASSWORD_HASH que imprime en Vercel',
    '     (Settings → Environment Variables) y vuelve a desplegar.',
    '',
    'La contraseña no se guarda en ningún servidor: solo viaja su hash.',
    'Si la pierdes, genera otra con el mismo comando.',
    '',
  ].join('\n'),
  'utf8'
)

// Solo una confirmación: ningún valor secreto en la salida.
console.log('Credenciales generadas.')
console.log('  CREDENCIALES-PANEL.txt  → la contraseña, para ti')
console.log('  .tmp-env/               → valores para pasarlos a Vercel')
