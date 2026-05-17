# PLIEGOS — el_bunker
> Registro de todos los Pliegos de Condiciones generados para este proyecto.
> Cada Pliego se añade aquí al generarse. El número es secuencial y no se resetea entre sesiones.

---

## PLANTILLA

```
PLIEGO-[NNN] — [nombre descriptivo]
Fecha: [YYYY-MM-DD]
Modelo recomendado: [qwen3-8b-nothink | qwen3-8b-think | qwen3-14b-nothink | qwen3-14b-think]
Estado: [pendiente | aplicado | descartado]

ARCHIVO: [ruta exacta desde raíz]
LÍNEAS AFECTADAS: [línea inicio – línea fin, o descripción del bloque]
RESTRICCIONES: [qué no tocar]

CAMBIO A REALIZAR:
[descripción técnica precisa]

CRITERIO DE ÉXITO:
[cómo verificar que funcionó]

RESULTADO:
[rellenar después de aplicar — qué pasó, si hubo ajustes]
```

---

## PLIEGOS GENERADOS

PLIEGO-001 — Migrar _findDatabaseFile a carpeta compartida
Fecha: 2026-05-16
Modelo recomendado: qwen3-14b-think
Estado: pendiente

ARCHIVO: src/GoogleDriveService.js
LÍNEAS AFECTADAS: 286–309 (función _findDatabaseFile)
RESTRICCIONES:
- No tocar ninguna otra función del archivo
- No modificar _state, CONFIG ni ninguna constante
- No cambiar la firma de la función ni su comportamiento de retorno
- El cache _state.dbFileId debe seguir funcionando igual

CAMBIO A REALIZAR:
Reemplazar la búsqueda en appDataFolder por búsqueda en la carpeta compartida configurada en VITE_GOOGLE_SHARED_FOLDER_ID.
La función debe:
1. Leer el folder ID desde import.meta.env.VITE_GOOGLE_SHARED_FOLDER_ID al inicio de la función (no en CONFIG global, para no romper otros usos). Si la variable no está definida o está vacía, lanzar _vaultError con código "MISSING_FOLDER_ID" y mensaje: "VITE_GOOGLE_SHARED_FOLDER_ID no está configurada. Revisa el .env."
2. Cambiar el parámetro spaces de "appDataFolder" a "drive" en la llamada a window.gapi.client.drive.files.list
3. Cambiar el parámetro q para buscar dentro de la carpeta compartida: `q: '${folderId}' in parents and name = '${CONFIG.DB_FILENAME}' and trashed = false`
4. Añadir los parámetros:
   includeItemsFromAllDrives: true
   supportsAllDrives: true
   (necesarios para acceder a carpetas compartidas desde cuentas no propietarias)
5. Mantener toda la lógica existente de desempate por modifiedTime si hay múltiples archivos, y el cache en _state.dbFileId.
6. Logging:
   - console.info al inicio: "[Búnker] Buscando DB en carpeta compartida: {folderId}"
   - console.warn si hay múltiples archivos (ya existe, mantener)
   - console.info si no se encuentra ningún archivo: "[Búnker] DB no encontrada en carpeta compartida"
   - console.error en el catch con el error original antes de relanzar
7. Manejo de errores:
   - Si la llamada a Drive devuelve 403: _vaultError("FOLDER_ACCESS_DENIED", "Sin acceso a la carpeta compartida. Verifica que el usuario tiene permisos de Editor.")
   - Si la llamada devuelve 404: _vaultError("FOLDER_NOT_FOUND", "La carpeta compartida no existe o fue eliminada. Revisa VITE_GOOGLE_SHARED_FOLDER_ID.")
   - Cualquier otro error: mantener el _vaultError("FIND_FILE") existente
8. Comentario JSDoc encima de la función:
   "@scale — si en el futuro hay múltiples archivos DB por migración fallida, el sort por modifiedTime puede devolver una versión incorrecta. Implementar limpieza periódica de archivos huérfanos."

CRITERIO DE ÉXITO:
- Con VITE_GOOGLE_SHARED_FOLDER_ID configurado y la carpeta compartida existente, las tres cuentas (admin, edu, david) encuentran el mismo archivo DB.
- Sin la variable configurada, la app lanza error claro en consola antes de intentar ninguna llamada a Drive.
- En Network se ve una sola llamada GET a drive/v3/files con el folderId en el parámetro q, sin llamadas a appDataFolder.

RIESGO:
- Si el token del usuario no tiene acceso a la carpeta (no fue añadido como Editor), la llamada devuelve 403. Detectable en Network inmediatamente.
- Si VITE_GOOGLE_SHARED_FOLDER_ID apunta a una carpeta eliminada, devuelve lista vacía (no 404), lo que llevaría a crear una DB nueva huérfana. El log de "DB no encontrada" debe alertar de esto.

RESULTADO:
[Pendiente]

---

PLIEGO-002 — Migrar _createDatabaseFile a carpeta compartida
Fecha: 2026-05-16
Modelo recomendado: qwen3-14b-think
Estado: pendiente

ARCHIVO: src/GoogleDriveService.js
LÍNEAS AFECTADAS: 311–347 (función _createDatabaseFile)
RESTRICCIONES:
- No tocar _findDatabaseFile ni _updateDatabaseFile ni _readDatabaseFile
- No modificar la estructura del multipart body ni el boundary
- No cambiar el retorno de la función (sigue devolviendo el fileId)
- No mover ni tocar CONFIG

CAMBIO A REALIZAR:
Reemplazar "appDataFolder" en el array parents por el ID de la carpeta compartida.
La función debe:
1. Leer VITE_GOOGLE_SHARED_FOLDER_ID al inicio de la función. Si no está definida o vacía, lanzar _vaultError con código "MISSING_FOLDER_ID" y mensaje: "VITE_GOOGLE_SHARED_FOLDER_ID no está configurada. No se puede crear la DB."
2. En el objeto metadata, cambiar:
   parents: ["appDataFolder"]
   por:
   parents: [folderId]
3. Añadir a los params de la request:
   supportsAllDrives: true
   (necesario para crear archivos en carpetas compartidas como non-owner)
4. Logging:
   - console.info al inicio: "[Búnker] Creando DB en carpeta compartida: {folderId}"
   - console.info al éxito (ya existe, mantener y añadir el folderId): "[Búnker] DB creada en Drive ✓ (fileId: {id}, folder: {folderId})"
   - console.error en el catch con error original antes de relanzar
5. Manejo de errores específicos antes del _vaultError("CREATE_FILE") genérico:
   - HTTP 403: _vaultError("CREATE_DENIED", "Sin permisos para crear archivos en la carpeta compartida. El usuario necesita rol Editor.")
   - HTTP 507 o error de quota: _vaultError("DRIVE_QUOTA", "Sin espacio disponible en el Drive del propietario de la carpeta.")
   - Detectar el código HTTP desde err.status ?? err.result?.error?.code
6. Comentario JSDoc encima de la función:
   "@scale — si dos usuarios llaman a _createDatabaseFile simultáneamente (primera ejecución en paralelo), se crearán dos archivos DB. _findDatabaseFile resuelve esto con el sort por modifiedTime, pero quedará un archivo huérfano. Considerar un lock optimista en el futuro."

CRITERIO DE ÉXITO:
- Al entrar por primera vez con cualquiera de las tres cuentas, se crea UN SOLO archivo the_vault_database.json visible en la carpeta el_bunker_db del Drive del admin.
- El archivo es visible desde el Drive de Edu y David (carpeta compartida con ellos).
- En Network se ve una llamada POST a /upload/drive/v3/files con supportsAllDrives=true.

RIESGO:
- El mayor riesgo es que Edu y David no tengan rol Editor en la carpeta en el momento de la primera ejecución. El error 403 específico del paso 5 lo hace detectable inmediatamente sin ambigüedad.

RESULTADO:
[Pendiente]

---

PLIEGO-003 — Añadir supportsAllDrives a _updateDatabaseFile
Fecha: 2026-05-16
Modelo recomendado: qwen3-14b-nothink
Estado: pendiente

ARCHIVO: src/GoogleDriveService.js
LÍNEAS AFECTADAS: 349–375 (función _updateDatabaseFile)
RESTRICCIONES:
- No tocar la estructura del multipart body
- No tocar _readDatabaseFile ni ninguna otra función
- No cambiar la firma ni el retorno (la función no devuelve nada significativo)
- Cambio mínimo: solo añadir el parámetro que falta

CAMBIO A REALIZAR:
Añadir supportsAllDrives: true a los params de la request PATCH existente.
La función debe:
1. En el objeto params de window.gapi.client.request, añadir:
   supportsAllDrives: true
   junto a uploadType: "multipart" que ya existe.
2. Logging:
   - console.info al inicio: "[Búnker] Actualizando DB (fileId: {fileId})"
   - console.info al éxito: "[Búnker] DB actualizada en Drive ✓ (fileId: {fileId})"
     (el log de éxito actual está en updateData, moverlo aquí para más granularidad y mantener también el de updateData)
   - console.error en el catch con fileId y error original antes de relanzar
3. Manejo de errores específicos antes del _vaultError("UPDATE_FILE") genérico:
   - HTTP 403: _vaultError("UPDATE_DENIED", "Sin permisos para modificar la DB. Verifica que el usuario tiene rol Editor en la carpeta compartida.")
   - HTTP 404: _vaultError("FILE_GONE", "El archivo DB no existe en Drive. Puede haber sido eliminado manually. Reinicia la app para recrearlo.")
   - HTTP 412: _vaultError("PRECONDITION_FAILED", "Conflicto de escritura concurrente detectado. Recarga la app para sincronizar.")
   - Detectar el código HTTP desde err.status ?? err.result?.error?.code
4. Comentario JSDoc encima de la función:
   "@scale — esta función no implementa control de concurrencia. Si dos usuarios hacen PATCH simultáneo, el último en llegar sobreescribe al primero sin aviso. Para uso de dos personas con patrones de uso alternados, el riesgo es aceptable. A mayor concurrencia, implementar ETag + If-Match."

CRITERIO DE ÉXITO:
- Las tres cuentas pueden modificar la DB sin errores.
- En Network se ve el PATCH a /upload/drive/v3/files/{fileId} con supportsAllDrives=true en los query params.
- Un usuario sin permisos Editor recibe el error UPDATE_DENIED en consola, no un error genérico.

RIESGO:
- Si se omite este pliego, las actualizaciones fallarán con 403 para Edu y David cuando intenten escribir en un archivo del Drive del admin.

RESULTADO:
[Pendiente]