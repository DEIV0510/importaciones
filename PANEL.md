# Panel de administración

Permite editar casi todo el sitio desde `/admin` sin tocar el código: textos,
productos, líneas, imágenes, menú, orden de las secciones, colores y SEO.

---

## 1. Puesta en marcha (una sola vez)

### 1.1 Genera la contraseña

```bash
npm run admin:hash -- "la-contraseña-que-quieras"
```

Imprime dos variables. **La contraseña en claro no se guarda en ningún archivo**:
solo viaja su hash scrypt.

### 1.2 Crea el token de GitHub

El panel publica haciendo un commit en este repositorio, así que necesita un token.

1. GitHub → *Settings* → *Developer settings* → *Personal access tokens* →
   **Fine-grained tokens** → *Generate new token*.
2. **Repository access:** *Only select repositories* → `DEIV0510/importaciones`.
3. **Permissions** → *Repository permissions* → **Contents: Read and write**.
   Nada más. Ningún otro permiso.
4. Caducidad: la que prefieras. Cuando caduque, el panel avisará al publicar.

> Un token con acceso a un solo repositorio y un solo permiso es lo mínimo que
> necesita el panel. No le des acceso a toda la cuenta.

### 1.3 Configura Vercel

En el proyecto → *Settings* → *Environment Variables*, añade:

| Variable | Valor | Marcar «Sensitive» |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | lo que imprimió `admin:hash` | sí |
| `AUTH_SECRET` | lo que imprimió `admin:hash` | sí |
| `GITHUB_TOKEN` | el token del paso anterior | sí |
| `GITHUB_REPO` | `DEIV0510/importaciones` | no |
| `GITHUB_BRANCH` | `main` | no |
| `ADMIN_USER` | `admin` (o el que prefieras) | no |
| `GIT_AUTHOR_EMAIL` | tu correo | no |

Vuelve a desplegar para que las variables tomen efecto. Hasta entonces, `/admin`
muestra un aviso de «todavía no está configurado» en lugar de fallar.

### 1.4 Entra

`https://tu-dominio/admin`

---

## 2. Cómo funciona

```
Panel /admin  ──►  /api/*  ──►  commit en src/content/*.json
                               Vercel reconstruye  ──►  sitio actualizado
```

Publicar tarda **alrededor de un minuto**: lo que ves en el sitio es el
contenido ya compilado dentro del JavaScript, no una consulta a una base de
datos. Ese es el motivo de que la página siga cargando igual de rápido que
antes y sin parpadeos.

A cambio, el historial y la restauración salen gratis: **son los commits del
repositorio**, no una tabla que haya que mantener.

### Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Textos, menú, colores, SEO | `src/content/site.json` |
| Líneas del catálogo | `src/content/categories.json` |
| Productos | `src/content/products.json` |
| Biblioteca de imágenes | `src/content/media.json` |
| Archivos de imagen | `public/img/` |
| Contraseña y token | Variables de entorno de Vercel (nunca en el repo) |

---

## 3. Seguridad

- **Contraseña:** hash scrypt con sal. Comparación en tiempo constante.
- **Sesión:** token firmado con HMAC-SHA256 en cookie `HttpOnly`, `Secure`
  y `SameSite=Strict`. Caduca a las 8 horas. El JavaScript de la página no
  puede leerla.
- **Autorización en el servidor:** *cada* endpoint protegido vuelve a verificar
  la sesión. Ocultar el botón del panel no protege nada; esto sí.
- **CSRF:** además de `SameSite=Strict`, toda operación exige la cabecera
  `X-Panel: 1`. Un formulario de otro sitio puede hacer que el navegador mande
  la cookie, pero no puede añadir cabeceras propias sin pasar por CORS.
- **Validación:** `src/content/validacion.js` es la única definición de qué es
  contenido válido, y la aplica el servidor antes de escribir. Rechaza enlaces
  `javascript:`, colores que no sean `#rrggbb`, iconos fuera de la lista,
  productos con categorías inexistentes e imágenes que no estén en la biblioteca.
- **Subidas:** se comprueban los bytes mágicos de cada archivo. Que la extensión
  diga `.webp` no basta; si el contenido no es una imagen real, se rechaza.
- **Rutas:** solo se puede escribir en `src/content/` y `public/img/`. Cualquier
  intento de salir de ahí se rechaza.
- **Intentos de acceso:** 8 por IP cada 15 minutos, más un retardo en cada
  fallo. En serverless el contador se reinicia al reciclarse la instancia: es
  una traba, no una garantía. La garantía es el hash.
- **El panel no se indexa:** `X-Robots-Tag: noindex` en `/admin`.

---

## 4. Uso diario

### Publicar

Los cambios se guardan **solo en tu navegador** hasta que pulsas *Publicar*.
Puedes cerrar la pestaña y seguir después; el panel avisa si te vas con cambios
sin publicar.

- *Previsualizar* monta el sitio real con tus cambios, no una imitación.
- *Descartar cambios* vuelve a lo publicado.
- Si otra persona publica mientras editas, el panel lo detecta y avisa en lugar
  de pisar su trabajo.

### Imágenes

Se suben y se borran **al instante**, sin esperar a publicar, porque son
archivos y no texto.

Tu navegador genera cuatro versiones antes de subir: dos para el catálogo, una
de respaldo y otra para la vitrina de la portada. Por eso no se sube nada
pesado.

La casilla **«Quitar el fondo liso»** sirve para fotos sobre fondo blanco o
negro. Mira siempre la vista previa: con fondos irregulares puede comerse parte
del producto.

No se puede borrar una imagen que alguna sección siga usando; el panel dice
cuál la está usando.

### Historial

Cada publicación queda registrada con fecha y autor. *Restaurar* no borra nada:
vuelve a publicar el contenido antiguo como un cambio nuevo, así que siempre se
puede deshacer.

---

## 5. Desarrollo

```bash
npm run dev     # el panel funciona en http://localhost:5254/admin
```

**Sin `GITHUB_TOKEN`, el panel escribe en el disco local** en lugar de en el
repositorio. Es a propósito: se puede probar entero sin tocar producción. El
panel lo indica con una etiqueta «modo local».

Copia `.env.example` a `.env` y genera las credenciales con `npm run admin:hash`.

---

## 6. Pruebas

```bash
npm run qa:contenido   # valida el contenido publicado (no necesita servidor)
npm run qa:publico     # sitio público en 8 anchos, enlaces y accesibilidad
npm run qa:admin       # autenticación, autorización, validación y persistencia
npm run qa             # las tres
```

`qa:admin` necesita `npm run dev` en otra terminal. Trabaja sobre el disco local
y restaura el contenido al terminar: **no toca el sitio publicado**.

`qa:contenido` existe por un fallo real: el validador llegó a ser más estricto
que el contenido ya publicado, de modo que el panel dejaba editar pero rechazaba
publicar. Esa prueba lo detecta en un segundo.

---

## 7. Lo que el panel no hace

- **Los metadatos del HTML inicial.** El título y la descripción para buscadores
  se aplican al cargar la página. Las etiquetas que viajan en el HTML de partida
  se actualizan en el despliegue que dispara cada publicación, no antes.
- **Borradores compartidos.** El borrador vive en tu navegador. Dos personas
  editando a la vez no se ven entre sí, aunque el panel sí impide que una pise
  la publicación de la otra.
- **Un solo usuario.** Hay una contraseña, no una tabla de administradores.
  Para varias personas con permisos distintos haría falta una base de datos.
- **Cambiar la estructura.** Se editan los textos, las imágenes y el orden de
  las secciones existentes; no se crean secciones nuevas ni se mueven bloques
  dentro de una sección.
