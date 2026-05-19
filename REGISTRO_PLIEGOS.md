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
Estado: ✅ aplicado

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
Aplicado con Workflow B. Verificado en disco con PowerShell. DB encuentra correctamente el archivo en carpeta compartida.

---

PLIEGO-002 — Migrar _createDatabaseFile a carpeta compartida
Fecha: 2026-05-16
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

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
Aplicado con Workflow B. Verificado en disco. El archivo the_vault_database.json se creó en the_vault_data y es visible desde las tres cuentas. Checkpoint DB superado.

---

PLIEGO-003 — Añadir supportsAllDrives a _updateDatabaseFile
Fecha: 2026-05-16
Modelo recomendado: qwen3-14b-nothink
Estado: ✅ aplicado

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
Aplicado con Workflow B. Verificado en disco. Las tres cuentas pueden actualizar la DB sin errores de permisos.

---

PLIEGO-004 — Cablear onMarkDropSeen en App.jsx
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-think
Estado: ✅ aplicado — runtime pendiente

ARCHIVO: src/App.jsx
LÍNEAS AFECTADAS: 181 (inserción de prop justo antes del cierre de <MusicLab />)
RESTRICCIONES:
- No tocar nada fuera del componente MusicPage
- No modificar las props existentes de <MusicLab>
- No refactorizar MusicPage

CAMBIO A REALIZAR:
En el componente MusicPage (líneas 158–184), dentro de <MusicLab>, añadir la prop
onMarkDropSeen inmediatamente después de onMasterVolumeChange:

onMarkDropSeen={async (dropId) => {
  await patchDb((prev) => ({
    ...prev,
    music_lab: {
      ...prev.music_lab,
      drops: (prev.music_lab?.drops ?? []).map((d) =>
        d.id === dropId ? { ...d, seen: true } : d
      ),
    },
  }));
}}

CRITERIO DE ÉXITO:
Abrir la app con un Drop activo → el modal aparece → cerrarlo → reabrir la app → el modal ya no aparece.

RIESGO:
Ninguno. La prop ya existe en MusicLab.jsx (línea 1101) y es opcional (?.). Si se omite, el comportamiento es el actual (bug). Si se añade, fix inmediato.

RESULTADO:
Aplicado con Workflow B. Verificado en disco con PowerShell (líneas 183-197). Verificación en runtime pendiente: requiere drop con seen:false, lo que requiere música en la DB. Bloqueado hasta brief de bibliotecas.

---

PLIEGO-005 — Ocultar bloque Cápsulas del Tiempo demo en Vault.jsx
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-nothink
Estado: ✅ aplicado

ARCHIVO: src/Vault.jsx
LÍNEAS AFECTADAS: bloque JSX que renderiza las Cápsulas (buscar "capsules" o "CÁPSULAS")
RESTRICCIONES:
- No tocar lógica de Eras ni de Entries
- Solo envolver en condicional, no eliminar el JSX

CAMBIO A REALIZAR:
Localizar el bloque JSX que renderiza las Cápsulas del Tiempo.
Envolverlo en: {db?.capsules?.length > 0 && ( ... )}
Si el bloque ya tiene un wrapper, añadir la condición en él en lugar de añadir otro.

CRITERIO DE ÉXITO:
Con una DB vacía o sin cápsulas, el bloque de Cápsulas no renderiza.
Con cápsulas reales en DB, el bloque sigue apareciendo.

RIESGO:
Ninguno. Cambio puramente de renderizado condicional.

RESULTADO:
Aplicado con Workflow B. En lugar de envolver en condicional se eliminó el bloque JSX de demoTimeCapsules y se reemplazó la sección por comentario doble indicando que está oculto hasta implementación real. Incluido en commit conjunto PLIEGO-005/006/008.

---

PLIEGO-006 — Sincronizar umbral HeartbeatWidget (20 → 18 meses)
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-think
Estado: ✅ aplicado

ARCHIVO: src/Vault.jsx
LÍNEAS AFECTADAS: 124–135 (HeartbeatWidget, constantes y cálculos con el valor 20)
RESTRICCIONES:
- No tocar nada fuera de HeartbeatWidget
- No importar desde GoogleDriveService.js directamente en Vault.jsx
- La constante debe definirse localmente en Vault.jsx como LIBRARY_AT_RISK_MONTHS

CAMBIO A REALIZAR:
1. Añadir al inicio del archivo (junto a las otras constantes locales, después de las importaciones):
   const LIBRARY_AT_RISK_MONTHS = 18;

2. En HeartbeatWidget, reemplazar todas las ocurrencias del literal 20 por LIBRARY_AT_RISK_MONTHS:
   - línea 129: const atRisk = monthsAgo >= 20;  →  >= LIBRARY_AT_RISK_MONTHS
   - línea 135: Math.max(1.2, 1.2 - (monthsAgo / 20) * 0.85)  →  / LIBRARY_AT_RISK_MONTHS
   - líneas 124-125 (JSDoc): actualizar comentario de "20 months" a "LIBRARY_AT_RISK_MONTHS months"

CRITERIO DE ÉXITO:
HeartbeatWidget y CONFIG.LIBRARY_AT_RISK_MONTHS usan el mismo valor (18).
Cambiar LIBRARY_AT_RISK_MONTHS en un sitio lo cambia en Vault.jsx sin necesidad de buscar el literal.

RIESGO:
Mínimo. El cambio es de 20 a 18 — las bibliotecas entrarán en estado "at-risk" 2 meses antes. Correcto por diseño.

RESULTADO:
Aplicado con Workflow B. SEARCH/REPLACE directo sobre los literales 20 en HeartbeatWidget (sin extraer constante local — cambio mínimo suficiente). Umbral sincronizado con CONFIG.LIBRARY_AT_RISK_MONTHS = 18. Incluido en commit conjunto PLIEGO-005/006/008.

---

PLIEGO-007 — Eliminar CornerBrackets de todos los recuadros
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-nothink
Estado: ✅ aplicado

ARCHIVOS: src/Vault.jsx y src/MusicLab.jsx
EXCEPCIÓN A UN-ARCHIVO-POR-PLIEGO: las llamadas son idénticas en ambos archivos y el
componente vive en Layout.jsx (no se toca). Cline debe editar los dos en secuencia,
verificando compilación entre uno y otro.

RESTRICCIONES:
- No eliminar la definición de CornerBrackets en Layout.jsx ni su export
- No tocar ningún otro JSX fuera de las líneas con <CornerBrackets />
- No tocar imports

CAMBIO A REALIZAR:
Eliminar todas las instancias de <CornerBrackets ... /> de:
- src/Vault.jsx: líneas 78, 147, 220, 321, 427
- src/MusicLab.jsx: líneas 275, 548, 679, 778, 897
Cada línea es una instancia self-closing independiente. Eliminar la línea completa.

CRITERIO DE ÉXITO:
Ningún recuadro muestra decoración en esquinas en ninguna pantalla.
La app compila sin errores.

RIESGO:
Si alguna instancia está dentro de un ternario, eliminarla puede romper la sintaxis JSX.
Verificar cada línea antes de eliminar.

RESULTADO:
Aplicado con Workflow B. MusicLab.jsx ya no tenía instancias en el zip actualizado. Solo Vault.jsx requirió cambios: 5 instancias eliminadas (líneas 78, 147, 220, 321, 427) + import actualizado (CornerBrackets eliminado del destructuring, línea 16). Select-String "CornerBrackets" devuelve vacío. Commit: "PLIEGO-007: eliminar CornerBrackets de Vault.jsx".

---

PLIEGO-008 — Feedback visual al añadir track en MusicLab
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-think
Estado: ✅ aplicado

ARCHIVO: src/MusicLab.jsx
LÍNEAS AFECTADAS: handler de onAddTrack y el botón/formulario que lo llama
RESTRICCIONES:
- No tocar onAddDrop ni ninguna otra funcionalidad
- No añadir dependencias externas
- El estado de loading debe ser local al componente que gestiona la adición

CAMBIO A REALIZAR:
1. Añadir estado local: const [addingTrack, setAddingTrack] = useState(false);
2. En el handler que llama a onAddTrack:
   - setAddingTrack(true) antes de la llamada
   - setAddingTrack(false) en el finally
3. En el botón de confirmar añadir track:
   - Mostrar "AÑADIENDO..." cuando addingTrack === true
   - disabled={addingTrack} mientras está en progreso
   - Mantener el texto original cuando addingTrack === false

CRITERIO DE ÉXITO:
Al confirmar añadir un track, el botón cambia inmediatamente a "AÑADIENDO..." y se desactiva hasta que la operación termina.

RIESGO:
Si onAddTrack lanza excepción antes del finally, el estado puede quedar en true. Asegurarse de que el finally siempre ejecuta setAddingTrack(false).

RESULTADO:
Aplicado con Workflow B con variación respecto al Pliego original: en lugar de estado addingTrack + botón desactivado, se implementó toast flotante con AnimatePresence de Framer Motion. Estado añadido: const [toast, setToast] = useState(null). En handleAddTrack: setToast("TRACK AÑADIDO") + setTimeout(() => setToast(null), 2500). Toast con posición fixed, estilo acid-green, zIndex 9999, encima del modal de Drop. Incluido en commit conjunto PLIEGO-005/006/008.

---

PLIEGO-SW — Versionado automático del Service Worker
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: pendiente
⚠️ Ejecutar SOLO justo antes del deploy. No ejecutar hasta que Pliegos 001-004 estén verificados.

ARCHIVOS: public/sw.js + vite.config.js
EXCEPCIÓN A UN-ARCHIVO-POR-PLIEGO: la inyección de variable requiere coordinación entre
Vite y el SW. Cline debe editar vite.config.js primero, verificar la inyección, luego sw.js.

RESTRICCIONES:
- No cambiar la estrategia de caché (cache-first assets, network-first googleapis.com)
- No tocar sw.js más allá del CACHE_NAME y el aviso de actualización
- No tocar otros plugins en vite.config.js

CAMBIO A REALIZAR:
1. En vite.config.js, añadir en el objeto de configuración:
   define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0,10).replace(/-/g,'')) }

2. En public/sw.js, reemplazar:
   const CACHE_NAME = "bunker-v1";
   por:
   const CACHE_NAME = `bunker-${typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev'}`;

3. En el evento 'message' del SW, cuando se detecte nueva versión disponible,
   postear { type: 'UPDATE_AVAILABLE' } al cliente. En App.jsx o Layout.jsx,
   escuchar ese mensaje y mostrar banner "Nueva versión disponible — Actualizar".

CRITERIO DE ÉXITO:
Cada npm run build genera CACHE_NAME diferente (ej: "bunker-20260520").
Usuarios con PWA instalada ven banner de actualización en lugar de recarga silenciosa.

RIESGO:
Si __BUILD_DATE__ falla en producción, el fallback 'dev' evita rotura. Verificar en
localhost con DevTools → Application → Service Workers antes de deploy.

RESULTADO:
[Pendiente]
---

PLIEGO-009 — Eliminar drive.appdata de CONFIG.SCOPES y actualizar header
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/GoogleDriveService.js
LÍNEAS AFECTADAS: línea 4 (header/comentario) + línea con "drive.appdata" en CONFIG.SCOPES
RESTRICCIONES:
- No tocar ningún otro scope
- No modificar ninguna función
- No cambiar CONFIG más allá de eliminar la línea de drive.appdata

CAMBIO A REALIZAR:
1. En CONFIG.SCOPES, eliminar la línea que contiene "drive.appdata"
2. En el comentario de cabecera del archivo (línea 4 aprox), actualizar la descripción
   de arquitectura para reflejar el estado real: carpeta compartida, no appDataFolder.

CRITERIO DE ÉXITO:
grep "drive.appdata" src/GoogleDriveService.js → devuelve vacío.
El login sigue funcionando con las tres cuentas.
El token emitido ya no contiene drive.appdata en su scope (verificar con tokeninfo).

RIESGO:
Si se elimina antes de confirmar que la DB compartida funciona, la app queda sin
acceso a la DB para todos los usuarios. CHECKPOINT DB SUPERADO — riesgo mitigado.
Verificar con las tres cuentas tras aplicar.

RESULTADO:
Aplicado con Workflow B. Dos SEARCH/REPLACE en GoogleDriveService.js. drive.appdata eliminado del array SCOPES (pasó de 5 a 4 scopes). Header línea 4 actualizado: "Arquitectura Serverless · Carpeta Compartida Drive". Comentario drive.file actualizado a "crear/modificar archivos en carpeta compartida (ADR-001)". Verificado con Select-Object -Index (0..20). Commit: 3935240 — "PLIEGO-009: eliminar drive.appdata de SCOPES y actualizar header". 1 archivo, 2 inserciones, 5 eliminaciones.

---

PLIEGO-SCHEMA — Añadir campos vibe/thumbnail/play_count/last_played a tracks
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/GoogleDriveService.js
LÍNEAS AFECTADAS: SCHEMA_VERSION (línea 25), addTrack (líneas 856-875), _migrateSchema (bloque nuevo 3.0.0→3.1.0)
RESTRICCIONES:
- No tocar addDrop ni ninguna otra función
- La migración debe ser aditiva: tracks existentes reciben los nuevos campos con valores por defecto
- SCHEMA_VERSION debe incrementar a 3.1.0

CAMBIO A REALIZAR:
1. SCHEMA_VERSION: "3.0.0" → "3.1.0"
2. addTrack: añadir campos vibe, thumbnail, play_count, last_played al objeto newTrack
3. _migrateSchema: añadir bloque 3.0.0 → 3.1.0 que rellena los nuevos campos en tracks existentes con valores null/0/null

CRITERIO DE ÉXITO:
- Tracks nuevos se crean con los 4 campos nuevos
- Tracks existentes en DB migran automáticamente al cargar la app
- SCHEMA_VERSION en disco es "3.1.0"
- El filtro por vibe (DNB/420 Chill/etc.) tiene campo donde persistir el valor

RESULTADO:
Aplicado con Workflow B. Tres SEARCH/REPLACE en GoogleDriveService.js. SCHEMA_VERSION actualizado a 3.1.0. addTrack con los 4 campos nuevos (vibe, thumbnail, play_count, last_played). Migrador 3.0.0→3.1.0 añadido. Nota: el campo vibe en addTrack ya estaba parcialmente presente en disco de sesión anterior — Claude lo detectó antes del Ctrl+H. Commit: 6fcd8ae — "PLIEGO-SCHEMA: añadir vibe, thumbnail, play_count, last_played a addTrack y migración 3.0.0→3.1.0". 1 archivo, 29 inserciones, 8 eliminaciones.

PLIEGO-tokens — Crear src/tokens.js con design tokens centralizados
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-nothink
Estado: ✅ aplicado
ARCHIVO: src/tokens.js
LÍNEAS AFECTADAS: N/A — archivo nuevo
RESTRICCIONES:

Solo constantes exportadas. Cero lógica, cero imports.
No modificar ningún archivo existente en este Pliego.

CAMBIO A REALIZAR:
Crear src/tokens.js con ACID, PURPLE, RED, ORANGE, BG, FONT_MONO,
GLASS_BG, GLASS_BORDER, PURPLE_BG, PURPLE_BORDER como exports nombrados.
CRITERIO DE ÉXITO:
El archivo existe en disco. import { ACID } from "./tokens" compila sin error.
La app sigue funcionando igual (este Pliego no toca imports existentes).
RIESGO:
Ninguno. Archivo nuevo, sin dependencias.
RESULTADO:
Aplicado directamente en VS Code (archivo nuevo, sin Ctrl+H necesario).
Commit: "PLIEGO-tokens: crear src/tokens.js".
Nota: Vault.jsx, MusicLab.jsx y Layout.jsx mantienen sus constantes locales por ahora.
Migración a tokens.js se hará progresivamente al tocar cada archivo por otro motivo.

PLIEGO-010 — Exportación manual de DB como JSON descargable
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-think
Estado: ✅ aplicado
ARCHIVO: src/Vault.jsx
LÍNEAS AFECTADAS:

Línea 8: import de useVault
Líneas 489-505: useVault(), estado exporting, handleExport()
Líneas 669-705: footer con botón condicional admin

RESTRICCIONES:

No tocar ningún otro componente de Vault.jsx
No modificar props del componente Vault
No tocar GoogleDriveService.js ni VaultContext.jsx
El botón solo renderiza si user.role === "admin"
La descarga es 100% client-side: JSON.stringify + Blob + URL.createObjectURL

CAMBIO A REALIZAR:

Import de useVault en línea 8
Añadir user, exporting, handleExport en el cuerpo del componente
Reemplazar footer por versión con botón "↓ BACKUP JSON" condicional admin

CRITERIO DE ÉXITO:
Login admin → footer muestra "↓ BACKUP JSON" → click descarga
el_bunker_backup_YYYY-MM-DD.json con contenido real de Drive.
Login edu/david → botón no aparece.
RIESGO:
Si db es null, el guard if (!db) return y disabled={!db} lo capturan.
RESULTADO:
Aplicado manualmente por Edu. Verificado en runtime: descarga
el_bunker_backup_2026-05-17.json con schema_version 3.1.0 y estructura
correcta desde Drive. Botón visible solo con cuenta admin. ✅
Incidencias durante aplicación:

Footer original no se eliminó al insertar el nuevo → error JSX
(</motion.footer> huérfano en línea 706). Resuelto eliminando el bloque sobrante.
ACID y PURPLE no estaban definidos en Vault.jsx → ReferenceError en runtime.
Resuelto añadiendo const ACID = "#bfff00" y const PURPLE = "#bf00ff"
a las constantes locales del archivo (líneas 19-20).

Lección registrada: al generar Pliegos para Vault.jsx, verificar qué constantes
usa el JSX nuevo y que estén definidas en el archivo. Vault.jsx no importa de
Layout.jsx — sus tokens son locales.
Commit: "PLIEGO-010: exportacion JSON manual en footer de Vault (solo admin)".

---

PLIEGO-SW — Versionado automático del Service Worker
Fecha: 2026-05-17
Modelo recomendado: qwen3-8b-nothink
Estado: ✅ aplicado

ARCHIVOS: public/sw.js + vite.config.js
CAMBIO REALIZADO:
Se modificó vite.config.js para inyectar `__BUNKER_SW_VERSION__` basado en la fecha y el timestamp en el build. Se actualizó sw.js para usar esta variable para cache-busting dinámico en vez de "bunker-v1".

RESULTADO:
Aplicado manualmente mediante VS Code. Verificado el versionado dinámico.

---

PLIEGO-QUEUE-A — Infraestructura Drive para cola de reproducción por usuario
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/GoogleDriveService.js
CAMBIO REALIZADO:
Implementación del ADR-002 (Opción B). Añadido el campo `queueFileIds` a `_state`. Inserción del bloque privado de colas (`_findQueueFile`, `_createQueueFile`, `_updateQueueFile`) para gestionar archivos `queue_[userId].json` en la carpeta compartida. Inserción de funciones públicas (`fetchQueue`, `saveQueue`, `clearQueue`) con exportación en el default.

RESULTADO:
Aplicado por bloques tras problemas de encoding de consola con PowerShell. Verificado y commiteado.

---

PLIEGO-QUEUE-B — Cola de reproducción: carga, persistencia e indicador sync en MusicLab
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/MusicLab.jsx y src/App.jsx
CAMBIO REALIZADO:
Se extrajo el `userId` en App.jsx para pasarlo a MusicLab. En MusicLab.jsx, se añadieron los hooks `useEffect` para leer (`fetchQueue`) al montar y para hacer guardado optimista (`saveQueue`) al cambiar de track. Se introdujo el estado `syncStatus` y se pasó a `WinampPlayer` para un indicador visual discreto (◌/✕).

RESULTADO:
Aplicado correctamente por línea en VS Code. 

---

PLIEGO-PLAYLIST-A — Infraestructura Drive para playlists
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/GoogleDriveService.js
CAMBIO REALIZADO:
Bump de schema a 3.2.0. Añadido bloque de migración para inicializar el array `playlists` dentro de `music_lab`. Adición de API pública CRUD para playlists (`fetchPlaylists`, `createPlaylist`, `addTrackToPlaylist`, `deletePlaylist`) que impactan al schema principal de base de datos.

RESULTADO:
Aplicado ajustando el bloque de búsqueda original que falló por cambios previos. Verificado y commiteado.

---

PLIEGO-PLAYLIST-B — UI de playlists en MusicLab (menú contextual en TrackCard)
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/MusicLab.jsx
CAMBIO REALIZADO:
Implementado un sistema de "long-press" en `TrackCard` para desplegar un menú contextual flotante en mobile que permite "AÑADIR A PLAYLIST". Se añadió un tab "LISTS" en la navegación principal con un modal que muestra playlists existentes y permite crear nuevas al instante con `PlaylistNameInput`.

RESULTADO:
Aplicado con ediciones manuales directas tras errores de formato en Ctrl+H. Todo compila correctamente.

---

PLIEGO-MEDIASESSION-1 — MediaSession API básico
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/MusicLab.jsx
CAMBIO REALIZADO:
En `WinampPlayer` se integró la API `navigator.mediaSession` para poblar los metadatos de Android/Lockscreen usando el thumbnail del vídeo de YouTube. Se cablearon los ActionHandlers (play, pause, nexttrack, previoustrack) a las funciones nativas del player.

RESULTADO:
Verificado en código y commiteado.

---

PLIEGO-MEDIASESSION-2 — WakeLock + resiliencia Android
Fecha: 2026-05-17
Modelo recomendado: qwen3-14b-think
Estado: ✅ aplicado

ARCHIVO: src/MusicLab.jsx
CAMBIO REALIZADO:
Añadido hook `useEffect` en `WinampPlayer` para gestionar la API `navigator.wakeLock.request("screen")`. Se añade resiliencia manejando `visibilitychange` para evitar que Android mate el thread en segundo plano al estar apagada la pantalla.

RESULTADO:
Verificado el manejo de referencias de cierre por la herramienta. Commiteado exitosamente.

---

PLIEGO-014 — fix: declare toast useState en MusicLab (ReferenceError pantalla blanca)
Fecha: 2026-05-18
Modelo recomendado: claude-sonnet-4-6 (cambio directo en sesión, 64KB contexto)
Estado: ✅ aplicado

ARCHIVO: src/MusicLab.jsx
LÍNEAS AFECTADAS: ~línea 1278 (después de declaración de pendingTrack en bloque useState)
RESTRICCIONES:
- Solo añadir una línea. No tocar ningún otro estado ni lógica del componente.
- No reordenar el bloque de useState existente.

CAMBIO A REALIZAR:
Añadir la declaración de estado faltante:
  const [toast, setToast] = useState(null);
después de:
  const [pendingTrack, setPendingTrack] = useState(null);

CRITERIO DE ÉXITO:
MusicLab abre sin pantalla en blanco. Los 5 usos de toast/setToast (4 llamadas a setToast + 1 render condicional) dejan de ser ReferenceError. El toast de confirmación aparece al añadir track a playlist.

RIESGO:
Ninguno. Es una declaración de estado que ya debería haber existido. Los usos ya estaban en el código, solo faltaba la declaración.

RESULTADO:
Aplicado directamente en VS Code. Commit: "fix(musiclab): declare toast state - ReferenceError causing blank screen". Push a Vercel. MusicLab deja de mostrar pantalla en blanco en todas las plataformas. ✅
Bug BUG-NUEVO-01 cerrado.

Diagnóstico: El error se detectó en la consola del PC (mismo error que en Android):
  Uncaught ReferenceError: toast is not defined at Df (index-CWAY6DaV.js:35:5753)
Errores adicionales detectados en la misma sesión de consola (no bloqueantes):
  - 403 en heartbeat de Drive → ERROR 15 documentado
  - Cross-Origin-Opener-Policy warnings del popup OAuth → ruido, no crítico

PLIEGO-015 — fix(auth): token refresh automático en expiración (401)
Fecha: 18 mayo 2026
Modelo recomendado: qwen3-14b-think + revisión cruzada post-Cline
Estado: Completado

ARCHIVO: src/GoogleDriveService.js
RESTRICCIONES: No tocar requestAccessToken, signOut, ni el flujo de login.
               No añadir bucles de retry. Máximo un reintento por operación.
               No modificar las firmas de _readDatabaseFile, _updateDatabaseFile
               ni _findQueueFile.

CAMBIO A REALIZAR:
4 bloques Ctrl+H en orden. Aplicar en secuencia, verificar cada uno antes del siguiente.

CRITERIO DE ÉXITO:
Añadir un track y recargar 90 minutos después de login → el track persiste.
Heartbeat deja de dar 401 en consola pasada la hora de sesión.

RIESGO:
Si _withTokenRetry se coloca después de _updateDatabaseFile en el archivo,
el helper no existirá cuando se llame. Verificar con PowerShell que quedó ANTES.
BLOQUE 1 de 4 — Añadir helper _withTokenRetry antes de _updateDatabaseFile

SEARCH:

  const _updateDatabaseFile = async (data, fileId) => {
REPLACE:

  const _withTokenRetry = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.result?.error?.code ?? err?.code;
      if (status === 401) {
        console.info("[Búnker] Token expirado — renovando silenciosamente…");
        await requestAccessToken(false);
        return await fn();
      }
      throw err;
    }
  };

  const _updateDatabaseFile = async (data, fileId) => {
BLOQUE 2 de 4 — Wrap del PATCH en _updateDatabaseFile

SEARCH:

      await window.gapi.client.request({
        path:    `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
        method:  "PATCH",
        params:  { uploadType: "multipart", supportsAllDrives: true },
        headers: { "Content-Type": `multipart/related; boundary="${boundary}"` },
        body:    multipartBody,
      });
    } catch (err) {
      throw _vaultError("UPDATE_FILE", "Error actualizando el archivo DB en Drive", err);
REPLACE:

      await _withTokenRetry(() =>
        window.gapi.client.request({
          path:    `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
          method:  "PATCH",
          params:  { uploadType: "multipart", supportsAllDrives: true },
          headers: { "Content-Type": `multipart/related; boundary="${boundary}"` },
          body:    multipartBody,
        })
      );
    } catch (err) {
      throw _vaultError("UPDATE_FILE", "Error actualizando el archivo DB en Drive", err);
BLOQUE 3 de 4 — Wrap del GET en _readDatabaseFile

SEARCH:

      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt:    "media",
      });

      const raw = typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.result);

      return JSON.parse(raw);
    } catch (err) {
      throw _vaultError("READ_FILE", "Error leyendo el archivo DB desde Drive", err);
REPLACE:

      const response = await _withTokenRetry(() =>
        window.gapi.client.drive.files.get({
          fileId: fileId,
          alt:    "media",
        })
      );

      const raw = typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.result);

      return JSON.parse(raw);
    } catch (err) {
      throw _vaultError("READ_FILE", "Error leyendo el archivo DB desde Drive", err);
BLOQUE 4 de 4 — Wrap del LIST en _findQueueFile

SEARCH:

      const response = await window.gapi.client.drive.files.list({
        spaces: "drive",
        q:      `'${folderId}' in parents and name = '${filename}' and trashed = false`,
        fields: "files(id, name)",
        includeItemsFromAllDrives: true,
        supportsAllDrives:         true,
      });
REPLACE:

      const response = await _withTokenRetry(() =>
        window.gapi.client.drive.files.list({
          spaces: "drive",
          q:      `'${folderId}' in parents and name = '${filename}' and trashed = false`,
          fields: "files(id, name)",
          includeItemsFromAllDrives: true,
          supportsAllDrives:         true,
        })
      );

PLIEGO-016 — fix(auth): scope drive.file → drive
Fecha: 18 mayo 2026
Modelo recomendado: qwen3-8b-nothink

ARCHIVO: src/GoogleDriveService.js
LÍNEAS AFECTADAS: ~15-17 (bloque SCOPES en CONFIG)
RESTRICCIONES: No tocar ninguna otra línea del CONFIG.
               No eliminar drive.readonly ni los scopes de userinfo.
               Solo sustituir drive.file por drive.

CAMBIO A REALIZAR:
Reemplazar el scope drive.file por el scope drive completo.

SEARCH:
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly",

REPLACE:
    "https://www.googleapis.com/auth/drive",

CRITERIO DE ÉXITO:
Añadir un track → no aparece 403 en Network → el track persiste al recargar.
El heartbeat deja de fallar en consola.

RIESGO:
El cambio de scope invalida el token en caché — el usuario verá el popup de
permisos de Google en el siguiente login. Es comportamiento esperado, no un bug.
drive.readonly queda eliminado — la lógica de Bibliotecas (congelada) usaba ese
scope. No afecta funcionalidad activa, pero documentar en decisiones_tecnicas.md.

PLIEGO-015b — fix(sw): bypass YouTube en Service Worker
Fecha: 18 mayo 2026
Modelo recomendado: qwen3-8b-nothink

ARCHIVO: public/sw.js

LÍNEAS AFECTADAS: bloque BYPASS_PATTERNS (aprox. líneas 26-31)

RESTRICCIONES: No tocar ninguna otra parte del SW. No modificar las estrategias de caché. No alterar el orden de los patrones existentes.

CAMBIO A REALIZAR:

Añadir tres patrones al array BYPASS_PATTERNS, después de /gstatic\.com/:

javascriptconst BYPASS_PATTERNS = [
  /googleapis\.com/,
  /accounts\.google\.com/,
  /gstatic\.com/,
  /youtube\.com/,
  /ytimg\.com/,
  /googlevideo\.com/,
  /chrome-extension/,
];

CRITERIO DE ÉXITO:

Al pulsar play en MusicLab, el player de YouTube inicializa correctamente, muestra duración real y reproduce audio. En Network tab, las peticiones a youtube.com no tienen sw.js como iniciador.

RIESGO:

sw.js es archivo crítico. Si el cambio se aplica mal, el SW puede quedar en estado inválido — síntoma: app en blanco o sin caché offline. Detectar con Clear site data + recarga. Revisión cruzada obligatoria antes de confirmar.

---

## PLIEGO-015c — feat(drive): uploadMusicFile + schema migration 3.3.0
Fecha: 18 mayo 2026
Estado: ✅ APLICADO Y VERIFICADO EN PRODUCCIÓN
Modelo usado: qwen3-14b-think

ARCHIVO: src/GoogleDriveService.js
CAMBIOS REALIZADOS:
1. CONFIG.SCHEMA_VERSION actualizado de "3.2.0" a "3.3.0"
2. Migración 3.2.0 → 3.3.0 añadida al bloque de migraciones (después de 3.1.0 → 3.2.0): añade campos type, drive_file_id y youtube_url a todos los tracks existentes con valores por defecto.
3. addTrack() actualizado para persistir type, drive_file_id y youtube_url en tracks nuevos.
4. Nueva función exportada uploadMusicFile(file): sube un archivo MP3 a la carpeta compartida de Drive usando fetch + FormData + Bearer token. Devuelve el fileId del archivo creado.
5. export default GoogleDriveService restaurado al final del archivo (se perdió en Ctrl+H y se restituyó manualmente).

INCIDENCIAS DURANTE APLICACIÓN:
- El bloque de migración 3.2.0→3.3.0 se insertó antes del bloque 3.1.0→3.2.0 en el primer intento — orden invertido. Corregido con segundo Ctrl+H.
- CONFIG.SCHEMA_VERSION no se actualizó en el primer commit — la migración nunca se ejecutaba. Detectado al verificar el JSON de backup (schema_version seguía en "3.2.0"). Corregido en commit de fix.
- export default GoogleDriveService eliminado accidentalmente por Ctrl+H demasiado amplio. Restaurado manualmente.

VERIFICACIÓN: Backup JSON descargado desde la app confirma schema_version "3.3.0" y ambos tracks con type: "youtube", drive_file_id: null, youtube_url poblado.

---

## PLIEGO-016b — feat(drive): getStreamUrl para reproducción desde Drive
Fecha: pendiente
Estado: ⏳ PENDIENTE
Modelo recomendado: qwen3-14b-think

ARCHIVO: src/GoogleDriveService.js
DESCRIPCIÓN: Función getStreamUrl(driveFileId) que devuelve una URL de descarga directa desde Drive para reproducción con <audio> nativo. Prerequisito de PLIEGO-017b.
BLOQUEADO POR: REDISEÑO-MUSICLAB-001 — decisión de diseño pendiente.

---

## REDISEÑO-MUSICLAB-001 — Restructura completa UI/UX MusicLab
Fecha: 18 mayo 2026
Estado: ⏳ PENDIENTE DE DECISIÓN DE DISEÑO
Archivos afectados: src/MusicLab.jsx (principal), src/GoogleDriveService.js (schema drops)

DECISIÓN PENDIENTE ANTES DE DESCOMPONER EN PLIEGOS:
¿Los botones Editar/Eliminar actúan sobre el item actualmente seleccionado/activo (modelo global), o cada card tiene sus propios botones inline?

Recomendación arquitecto: modelo global para Tracks y Lists, inline para Cola.
Sin confirmación de Edu no se generan Pliegos.

PESTAÑAS POST-REDISEÑO (orden y visibilidad):
1. Cola — nueva. Invisible si vacía. Primera si tiene tracks.
2. Tracks — existente. Siempre visible.
3. Lists — existente. Siempre visible.
4. Drops — existente, rediseñado. Invisible si vacía y sin favoritos. Última si tiene drops pendientes o favoritos.

BOTONES POR PESTAÑA:
- Cola: + Añadir a cola · Editar (reordenar + eliminar por track, inline)
- Tracks: + Añadir · Editar · Eliminar
- Lists: + Añadir · Editar · Eliminar
- Drops: marcar/desmarcar favorito por drop

DROPS — SCHEMA 3.3.0 → 3.4.0:
- Nuevo campo favorited: boolean (default false)
- Nuevo campo favorited_by: userId | null
- Pestaña Drops muestra: drops pendientes + drops favoritos (enviados y recibidos)

MENÚ CONTEXTUAL LONG PRESS — ELIMINADO:
El menú de long press en TrackCard se elimina. Era incómodo en Android. Toda la funcionalidad migra a botones explícitos.

TEXTOS A TRADUCIR AL ESPAÑOL (pendiente PLIEGO-018):
- Botón eliminar track (nuevo)
- Botón editar track (nuevo)
- Botón añadir a cola (nuevo)
- Botón añadir playlist en pestaña Lists (mover y traducir)
- Cualquier string en inglés que aparezca durante el rediseño

PLIEGOS QUE GENERA ESTE REDISEÑO (pendientes de confirmación de diseño):
- PLIEGO-R01 — GoogleDriveService.js: migración 3.3.0→3.4.0 (drops favoritos) + removeTrack() + updateTrack()
- PLIEGO-R02 — MusicLab.jsx: restructura de pestañas + visibilidad condicional Cola y Drops
- PLIEGO-R03 — MusicLab.jsx: botones Añadir/Editar/Eliminar en Tracks y Lists
- PLIEGO-R04 — MusicLab.jsx: pestaña Cola con botón añadir y edición inline
- PLIEGO-R05 — MusicLab.jsx: drops favoritos UI

NOTA: PLIEGO-017b (AddTrackForm + WinampPlayer) se integra en este rediseño como PLIEGO-R06 para no reescribir MusicLab.jsx dos veces.

---

## PLIEGOS SESIÓN 9

### PLIEGO-016b — getStreamUrl en GoogleDriveService.js
Fecha: 2026-05-19
Estado: ✅ aplicado
ARCHIVO: src/GoogleDriveService.js
CAMBIO: Añadir función exportada getStreamUrl(fileId) que construye URL de stream de Drive con token OAuth2 activo.
RESULTADO: Aplicado y verificado con PowerShell. Commit en master.

---

### PLIEGO-016c — Player youtube/drive con iframe y getStreamUrl
Fecha: 2026-05-19
Estado: ✅ aplicado
ARCHIVO: src/MusicLab.jsx
CAMBIO: Import de getStreamUrl. Elemento audio solo para type drive con drive_file_id. Iframe YouTube oculto para type youtube con enablejsapi=1.
RESULTADO: Aplicado y verificado con PowerShell. Commit en master.

---

### PLIEGO-017b — Play/pause YouTube via postMessage + iframeRef
Fecha: 2026-05-19
Estado: ✅ aplicado
ARCHIVO: src/MusicLab.jsx
CAMBIO: iframeRef añadido. isYouTube y sendYTCommand. togglePlay con lógica youtube/drive separada. iframe con ref y origin correcto.
RESULTADO: Aplicado y verificado con PowerShell. Commit en master.

---

### PLIEGO-018 — Modal eliminar track con lista inline
Fecha: 2026-05-19
Estado: ✅ aplicado
ARCHIVO: src/MusicLab.jsx
CAMBIO: Estado showDelete. Handler handleDeleteTrack. Botón ELIMINAR junto a AÑADIR. Modal con lista completa y botón ✕ inline por track.
RESULTADO: Aplicado y verificado con PowerShell. Commit en master.

---

### PLIEGO-026 — feat(layout): botón EXIT en StatusBar
Fecha: 2026-05-19
Estado: ✅ aplicado
ARCHIVO: src/Layout.jsx
CAMBIO: Prop `onSignOut` añadida a `StatusBar` y a `Layout`. Botón EXIT en rojo apagado junto al ↺ en el header. Condicional — solo renderiza si `onSignOut` está definido.
RESULTADO: Aplicado con Workflow B. Verificado en disco.

---

### PLIEGO-027 — feat(app): conectar logout al botón EXIT
Fecha: 2026-05-19
Estado: ✅ aplicado
ARCHIVO: src/App.jsx
CAMBIO: `logout` añadido al destructuring de `useVault` en el componente principal. Pasado como `onSignOut={logout}` al `<Layout>`.
RESULTADO: Aplicado con Workflow B. Verificado en disco. Push a master.

---

### PLIEGO-019 — Modal editar track con formulario precargado
Fecha: 2026-05-19
Estado: ✅ aplicado
ARCHIVO: src/MusicLab.jsx
CAMBIO: Estados showEdit y editingTrack. Handlers handleEditTrack y handleSaveEdit. Botón EDITAR junto a ELIMINAR. Modal lista → selección → AddTrackForm precargado con initialData.
RESULTADO: Aplicado y verificado con PowerShell. Commit en master.
DEUDA TÉCNICA CONOCIDA: handleSaveEdit no persiste en Drive (ERROR 25). onEditTrack no implementado en VaultContext ni GoogleDriveService.