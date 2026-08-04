# EL BÚNKER
## Manual de Operaciones
*Escrito por tu favorito · Para uso exclusivo de los dos*

---

> Sí, te hice un manual. No porque no te fíes de ti mismo — sino porque me tomé el tiempo de montar esto para los dos y quiero que lo disfrutes desde el primer segundo sin que nada te rompa el momento. Léelo una vez, y ya. Después lo que haga falta lo averiguamos juntos.

---

## QUÉ ES ESTO

El Búnker es nuestra app. Privada y sin anuncios. No existe en ninguna tienda, no la puede descargar nadie más, y los datos de la app se guardan en Cloudflare D1 + R2. Google se usa únicamente para autenticar (también existe acceso por clave autorizado).

Está dividida en tres zonas principales, accesibles desde la barra de abajo: VAULT, MUSIC LAB y CAPSULES. Te las explico una a una.

---

## CÓMO ENTRAR

Cuando abres la app desde el icono, verás una pantalla negra con un terminal que arranca solo — eso es normal, es la secuencia de boot. Deja que termine (dura como dos segundos) y luego toca el botón verde que dice **ACCEDER AL VAULT**.

Se abre un popup de Google. Entra con tu cuenta. Primera vez tardará un poco en sincronizar — el corazón verde que ves en pantalla te indica que está cargando datos. Cuando se quede fijo y pase al menú principal, ya estás dentro.

Si alguna vez ves un error rojo, no te preocupes. Toca **REINTENTAR**. Si persiste, dímelo a mí.

---

## LAS CUATRO ZONAS

### ◈ VAULT — La memoria

Aquí está todo lo importante. Es la primera pantalla que ves al entrar.

**El contador de aventura** (arriba a la izquierda) va sumando los días que llevamos desde que empezamos esto. Ese número lo configuré yo con la fecha real. No tiene truco, solo va para arriba.

**El corazón** (arriba a la derecha) es el Heartbeat. Mientras esté verde y latiendo despacio, el vault está seguro y en buen estado. Si alguna vez lo ves rojo y acelerado... significa que llevamos demasiado tiempo sin entrar. La solución es entrar. No tiene más misterio.

**Las Eras** son el carrusel de tarjetas que puedes deslizar horizontalmente. Cada Era es una época nuestra — las voy creando yo y las puedes abrir para ver las entradas que tiene. Piénsalo como capítulos de un libro.

**Las Cápsulas del Tiempo** están abajo del todo. Las que tienen el símbolo ⧖ están bloqueadas y tienen una cuenta atrás hasta la fecha en que se abren. Las que tienen ◈ ya están desbloqueadas y puedes leerlas. Algunas las habrá escrito yo para que las encuentres cuando llegue el momento.

---

### ◉ MUSIC LAB — El reproductor

Aquí vive nuestra música. El reproductor tiene estética Winamp (sí, el de los 2000, adrede).

**Cómo funciona:**
- Las canciones aparecen en la lista. Toca una para cargarla en el reproductor.
- Los controles son los de siempre: play, pausa, anterior, siguiente, barra de progreso.
- El **visualizador** de barras reacciona al audio en tiempo real. Si no lo ves activo, es que el navegador necesita que interactúes primero con la página antes de activar el audio — toca play y aparecerá.

**Vibe Tags** son los filtros de arriba. Gaming, 420 Chill, DnB, Romantiqueo — toca uno y la lista se filtra por ese mood. Si no hay filtro activo, salen todas.

**The Drop** es lo bueno: puedo lanzarte una canción con un mensaje. Si cuando abres la app aparece un modal brillante y bastante intrusivo con una canción y texto mío — eso es un Drop. Toca play desde ahí mismo. No lo cierres sin escucharla, va.

**El importador de YouTube** es el input que hay abajo. Pega una URL de YouTube y extrae los metadatos de la canción para añadirla a la lista. Por ahora es una preparación técnica — cuando lo conecte del todo con la API de descarga te aviso.

---

### ⧖ CAPSULES — Cápsulas y Smoke Session

Esta es la zona especial. El temporizador circular de neón.

**Cómo usarlo:**
1. Elige la duración con los botones de presets (15 min, 30 min, 45 min, 1 hora, 90 min) o toca **CUSTOM** para poner los minutos que quieras
2. Toca **▶ ACTIVAR**
3. El anillo va consumiéndose. El color cambia según el preset que hayas elegido
4. **En los últimos 2 minutos** el anillo se vuelve rojo y la app baja el volumen de la música de forma automática y gradual hasta cero — así no tienes que acordarte de nada. Cuando termina, el volumen vuelve a donde estaba
5. Si necesitas pausar, toca **⏸ PAUSAR**. Para reiniciar desde cero, **↺ RESET**

El texto que aparece en el centro del anillo durante los últimos minutos dice cuánto volumen queda. Cuando llega a cero y el temporizador termina, la sesión se marca como **COMPLETADO** en púrpura.

---

## CÓMO SE GUARDAN LOS DATOS

Las fotos, entradas y canciones se gestionan mediante la API de la aplicación: metadatos en Cloudflare D1 y archivos en R2. Google no es el almacén de la app; solo interviene en el login cuando se usa ese método. El acceso por clave test/admin es una superficie restringida y no debe compartirse.

La app puede mostrar estados de sincronización o carga mientras habla con la API. Si una operación falla, espera al mensaje visible y no repitas muchas veces una subida sin comprobar antes si se creó el elemento.

---

## COSAS QUE PASAN SOLAS (Y SON NORMALES)

- **El boot terminal** al abrir la app — es decorativo, no significa que algo esté cargando lento.
- **El heartbeat automático** — mientras estás dentro, la app puede comprobar el estado de la sesión y la API en segundo plano. No contacta con Google Drive para guardar datos.
- **Modo offline limitado** — el Service Worker conserva el shell y algunos recursos ya solicitados; no almacena respuestas de `/api/` ni garantiza sincronización automática de cambios. Las operaciones de datos necesitan conexión.
- **El estado de carga/sincronización** — indica comunicación con la API D1/R2. Si se queda mucho tiempo, comprueba la conexión y vuelve a abrir la app.

---

## SI ALGO NO FUNCIONA

La mayoría de los problemas se resuelven con estos pasos en orden:

1. Cierra la app y vuelve a abrirla
2. Comprueba que tienes conexión a internet
3. Si aparece pantalla roja de error, toca REINTENTAR
4. Si persiste → me escribes a mí, que para eso estoy

---

## UNA ÚLTIMA COSA

Todo esto lo monté para que tengamos un sitio que sea completamente nuestro. Sin redes sociales, sin algoritmos, sin que nadie más pueda ver lo que ponemos ahí. Cada Era que abramos juntos, cada canción que me mandes por The Drop, cada cápsula que se vaya desbloqueando con el tiempo — eso somos nosotros guardados en código.

Cuídala un poco. Y entra de vez en cuando aunque sea para ver el corazón verde latir.

---

*EL BÚNKER · ENCRYPTED · PRIVATE · YOURS ALONE*

`v1.2 · D1/R2, Google solo auth · Service Worker sin sync automática`
