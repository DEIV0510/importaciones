/**
 * Cliente del API del panel.
 *
 * Todas las peticiones llevan la cabecera `X-Panel: 1`. El servidor la exige
 * para aceptar una operación: un formulario de otro sitio puede lograr que el
 * navegador envíe la cookie, pero no puede añadir cabeceras propias sin pasar
 * por CORS. Es la defensa contra CSRF, junto con SameSite=Strict.
 */

export class ErrorApi extends Error {
  constructor(mensaje, { estado, campo } = {}) {
    super(mensaje)
    this.estado = estado
    this.campo = campo
  }
}

async function peticion(ruta, { metodo = 'GET', cuerpo } = {}) {
  let res
  try {
    res = await fetch(ruta, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        'X-Panel': '1',
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ErrorApi('No se pudo contactar con el servidor. Revisa tu conexión.')
  }

  let datos = null
  try {
    datos = await res.json()
  } catch {
    // Respuesta sin cuerpo (p. ej. un 204)
  }

  if (!res.ok) {
    throw new ErrorApi(datos?.error || `Error ${res.status}.`, {
      estado: res.status,
      campo: datos?.campo,
    })
  }
  return datos
}

export const api = {
  sesion: () => peticion('/api/session'),
  entrar: (usuario, contrasena) =>
    peticion('/api/login', { metodo: 'POST', cuerpo: { usuario, contrasena } }),
  salir: () => peticion('/api/logout', { metodo: 'POST' }),

  contenido: () => peticion('/api/content'),
  publicar: (contenido, sha, mensaje) =>
    peticion('/api/content', { metodo: 'PUT', cuerpo: { ...contenido, sha, mensaje } }),

  subirImagen: (id, alt, variantes) =>
    peticion('/api/media', { metodo: 'POST', cuerpo: { id, alt, variantes } }),
  borrarImagen: (id) => peticion('/api/media', { metodo: 'DELETE', cuerpo: { id } }),

  historial: () => peticion('/api/history'),
  version: (sha) => peticion(`/api/history?sha=${encodeURIComponent(sha)}`),
  restaurar: (sha) => peticion('/api/history', { metodo: 'POST', cuerpo: { sha } }),
}
