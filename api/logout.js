/** POST /api/logout — cierra la sesión borrando la cookie. */
import { cookieBorrada } from './_lib/auth.js'
import { esProduccion, json, manejar, soloMetodos } from './_lib/http.js'

export default manejar(async (req, res) => {
  soloMetodos(req, ['POST'])
  res.setHeader('Set-Cookie', cookieBorrada({ seguro: esProduccion() }))
  json(res, 200, { ok: true })
})
