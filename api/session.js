/**
 * GET /api/session — ¿hay sesión abierta?
 *
 * El panel lo consulta al cargar. Devuelve 200 con `autenticado:false` en vez
 * de un 401 para no ensuciar la consola del navegador en el caso normal de
 * «todavía no he entrado».
 */
import { leerCookies, leerToken, NOMBRE_COOKIE } from './_lib/auth.js'
import { enGitHub } from './_lib/repo.js'
import { json, manejar, soloMetodos } from './_lib/http.js'

export default manejar(async (req, res) => {
  soloMetodos(req, ['GET'])

  const secreto = process.env.AUTH_SECRET
  const configurado = Boolean(process.env.ADMIN_PASSWORD_HASH && secreto && secreto.length >= 32)
  const sesion = configurado ? leerToken(leerCookies(req)[NOMBRE_COOKIE], secreto) : null

  json(res, 200, {
    autenticado: Boolean(sesion),
    usuario: sesion?.u ?? null,
    expira: sesion?.exp ?? null,
    configurado,
    // Avisa al panel de si publicará de verdad o solo escribirá en disco.
    modo: enGitHub() ? 'github' : 'local',
  })
})
