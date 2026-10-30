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

`https://importaciones-olive.vercel.app/admin`

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

### Cambiar la contraseña

```bash
npm run admin:hash -- "la-nueva-contraseña"
```

Después, en Vercel → *Settings* → *Environment Variables*:

1. **Borra** `ADMIN_PASSWORD_HASH`.
2. Créala de nuevo con el hash que imprimió el comando.
3. Redespliega (basta con un push a `main`).

> El primer paso no es opcional. `vercel env add --force` **no** reemplaza el
> valor existente y la CLI no se queja: dice que la añadió y deja el anterior.
> Si solo haces `add`, el panel seguirá aceptando la contraseña vieja sin que
> nadie lo note. Compruébalo entrando de verdad, o con `npm run qa:produccion`.

El comando rechaza menos de 8 caracteres y avisa por debajo de 12. La longitud
importa más que los símbolos: tres palabras unidas por guiones resisten mejor
un diccionario que «Palabra2026*».

---

## 4. Uso diario

### Publicar

Los cambios se guardan **solo en tu navegador** hasta que pulsas *Publicar*.
Puedes cerrar la pestaña y seguir después; el panel avisa si te vas con cambios
sin publicar.

- *Previsualizar* monta el sitio real con tus cambios, no una imitación.
- *Descartar cambios* vuelve a lo publicado.
- Si el contenido cambia mientras editas (otra persona publicó), el panel no
  publica a ciegas: **conserva tu borrador**, avisa, y solo si vuelves a pulsar
  *Publicar* tu versión reemplaza lo que se publicó entretanto.
- Si cierras el panel con cambios sin publicar y el sitio se actualizó mientras
  tanto, al volver se recupera tu borrador igualmente, con un aviso. La
  biblioteca de imágenes nunca viene del borrador: se sube y se borra al
  instante, así que siempre es la del servidor.

**La «versión» del contenido** es el último commit que modificó `src/content/`
(no el último de la rama). Subir una foto es un commit y cambia esa versión; el
panel la anota al terminar la subida. Antes se comparaba la rama entera, y por
eso cualquier foto subida —o cualquier cambio de código— hacía que el siguiente
*Publicar* se rechazara como «el contenido cambió».

### Líneas de un producto

En la ficha de cada producto, **Líneas a las que pertenece** muestra todas las
líneas como botones: se pulsan las que correspondan (puede ser más de una). Ahí
mismo:

- **Nueva línea** crea una línea con ese nombre y deja el producto dentro de
  ella. No crea duplicados: si ya existe una con ese nombre, lo dice.
- El enlace *Cambiar el nombre, la imagen o el orden de las líneas* lleva a la
  pestaña *Líneas*.

Al **eliminar una línea** en la pestaña *Líneas*, el panel pregunta cuántos
productos están en ella y, al confirmar, los saca de esa línea (no se borran).
Si algún producto se queda sin línea, o apunta a una que ya no existe (por
ejemplo, un borrador antiguo), un aviso sobre la lista de productos lo dice con
sus nombres, y la línea fantasma aparece en su ficha como un botón
«… · ya no existe ✕» para quitarla. Con una línea inexistente el servidor se
niega a publicar.

### Precios

Cada producto tiene un campo **Precio (pesos)** y otro, opcional, de **Unidad
del precio** («por metro», «por rollo»…). El precio es un número entero en
pesos colombianos; el panel quita puntos, comas y el signo `$` al escribir, y
debajo muestra cómo lo verá el cliente (`$12.500 por metro`), que es la forma
más rápida de notar un cero de más.

- **Vacío = sin precio.** Ningún producto trae precio de fábrica: solo aparece
  el que alguien escribe. Sin precio, la ficha invita a consultarlo por WhatsApp.
- Con precio se ve en la tarjeta del catálogo y en la ficha. La unidad solo se
  muestra si hay precio.
- Dos textos se editan en *Catálogo → Textos*: la nota de la ficha **con**
  precio y la de la ficha **sin** precio.
- El servidor rechaza precios que no sean un entero mayor que 0 (hasta
  999.999.999). «12.000» no se interpreta: como número daría 12, así que se
  rechaza en lugar de adivinarlo.
- Como el resto del texto, el precio no se ve en el sitio hasta que pulsas
  *Publicar*.

### Imágenes

Se suben y se borran **al instante**, sin esperar a publicar, porque son
archivos y no texto.

Se pueden subir desde tres sitios, con el mismo flujo: la sección *Imágenes*, el
botón **Subir nueva** de «Foto principal» (la deja puesta al terminar) y
**Subir foto nueva a la galería** (la añade a ella). Al subir desde un producto,
el texto alternativo arranca con el nombre del producto.

La ficha del producto muestra solo las fotos de su galería; si la galería está
vacía, muestra la foto principal. Por eso, al cambiar la foto principal de un
producto que ya tiene galería, conviene revisar también la galería.

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
  editando a la vez no se ven entre sí; el panel avisa cuando una publicó antes
  que la otra, pero no mezcla los cambios: quien publique después decide si
  reemplaza lo anterior.
- **Un solo usuario.** Hay una contraseña, no una tabla de administradores.
  Para varias personas con permisos distintos haría falta una base de datos.
- **Cambiar la estructura.** Se editan los textos, las imágenes y el orden de
  las secciones existentes; no se crean secciones nuevas ni se mueven bloques
  dentro de una sección.
