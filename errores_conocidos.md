# ERRORES CONOCIDOS — el_bunker
> Problemas ya diagnosticados. Antes de proponer cualquier solución, consultar este archivo para no repetir caminos ya recorridos.

---

## ERROR 1 — Tailwind v4 incompatible
**Síntoma:** Estilos rotos, configuración no aplicada.
**Causa real:** Tailwind v4 reescribió la arquitectura de configuración completamente.
**Solución aplicada:** Downgrade a Tailwind v3.4.19.
**NO hacer:** Intentar migrar a v4 o usar directivas de v4 en el proyecto.

---

## ERROR 2 — Scopes OAuth incompletos (email vacío, 401 en userinfo)
**Síntoma:** El email del usuario llega vacío. Error 401 al llamar a la API de userinfo.
**Causa real:** Los scopes `userinfo.email` y `userinfo.profile` no estaban incluidos en CONFIG.SCOPES.
**Solución aplicada:** Añadir ambos scopes a CONFIG.SCOPES en GoogleDriveService.js.
**NO hacer:** Añadir solo `email` sin `profile` o viceversa. Ambos son necesarios.

---

## ERROR 3 — Service Worker cacheando versión rota
**Síntoma:** La app sigue mostrando una versión antigua después de un deploy o cambio.
**Causa real:** El Service Worker tiene la versión rota en caché.
**Solución:** Clear site data completo + hard refresh.
**NO hacer:** Solo hard reload (Ctrl+Shift+R) sin clear site data previo.

---

## ERROR 4 — Login admin bloqueado en Opera GX ✅ RESUELTO
**Síntoma:** La cuenta thebunker.admin@gmail.com no podía hacer login.
**Causa real:** Incompatibilidad de Opera GX con el flujo OAuth de GIS.
**Solución aplicada:** Usar Chrome para la sesión de Admin.
**NO hacer:** Invertir tiempo en hacer funcionar el login en Opera GX.

---

## ERROR 5 — Continue (extensión VS Code) webview en blanco
**Síntoma:** El panel de Continue se muestra vacío.
**Causa real:** Proceso de VS Code en estado inválido.
**Solución:** Cerrar todos los procesos Code.exe y reiniciar VS Code.
**Nota:** Migrado de Continue a Cline como herramienta principal.

---

## ERROR 6 — Deploy a Vercel ✅ RESUELTO — 18 mayo 2026
**Síntoma:** La app solo funcionaba en localhost:5173.
**Solución aplicada:**
- VITE_GOOGLE_CLIENT_ID configurado en variables de entorno Vercel.
- URL de producción añadida a orígenes autorizados en Google Cloud Console.
- Service Worker activo en HTTPS.
- Usar Chrome, no Opera GX.

---

## ERROR 7 — Qwen trunca bloques de código en medio de una función
**Síntoma:** Cline presenta un diff donde la función queda sintácticamente rota.
**Causa real:** Qwen3 pierde el hilo en funciones largas cuando el contexto del Pliego es extenso.
**Solución:** Rechazar el diff. Reenviar el Pliego con el código final completo explícito.
**NO hacer:** Aceptar un diff con funciones truncadas.

---

## ERROR 8 — Qwen genera patrones SEARCH que no coinciden con el archivo
**Síntoma:** Cline reporta "The model used search patterns that don't match anything in the file."
**Causa real:** Qwen genera el bloque SEARCH con líneas numeradas o whitespace distinto.
**Solución:** Proporcionar el bloque SEARCH copiado literalmente del archivo fuente via PowerShell.
**NO hacer:** Confiar en que Qwen va a generar el SEARCH exacto sin haberlo visto.

---

## ERROR 9 — Timeout de Ollama durante generación de Pliego
**Síntoma:** Cline reporta `Ollama request timed out after 30 seconds`.
**Causa real:** Ollama no estaba iniciado o el modelo tardó más de 30s en cargar.
**Solución:** Verificar que Ollama está corriendo antes de lanzar cualquier Pliego: `ollama list`.
**NO hacer:** Lanzar Pliegos sin confirmar que Ollama responde.

---

## ERROR 10 — Ctrl+H falla por diferencias de encoding de PowerShell
**Síntoma:** Claude da un bloque SEARCH exacto pero VS Code no lo encuentra al hacer Ctrl+H.
**Causa real:** Encoding visual en PowerShell (caracteres especiales se imprimen deformados).
**Solución:** Ir directamente a la línea indicada en VS Code y hacer la edición manual.
**NO hacer:** Asumir que el código fuente está corrupto.

---

## ERROR 11 — PWA no se instala como app standalone en Android ✅ RESUELTO — 18 mayo 2026
**Síntoma:** Chrome en Android ofrecía "Añadir a pantalla de inicio" (acceso directo) en lugar de instalar como app standalone. La barra de Chrome seguía visible al abrir.
**Causa real:** La carpeta `public/icons/` no existía. Chrome requiere obligatoriamente iconos de 192px y 512px para considerar una PWA instalable. Sin ellos, degrada silenciosamente a acceso directo.
**Solución aplicada:** Generar los 5 iconos requeridos (72, 96, 128, 192, 512px) con estética Fallout/terminal y desplegarlos en `public/icons/`.
**NO hacer:** Asumir que el manifest.json correcto es suficiente sin verificar que los iconos existen en producción (comprobar URL directa: `/icons/icon-192.png`).

---

## ERROR 12 — Commits bloqueados en Vercel por email de Git incorrecto ✅ RESUELTO — 18 mayo 2026
**Síntoma:** Vercel bloqueaba los deploys con "commit email could not be matched to a GitHub account".
**Causa real:** Git estaba configurado con `thebunker.admin@gmail.com` en lugar del email de la cuenta de GitHub.
**Solución aplicada:** `git config --global user.email "bansovi.py@gmail.com"`.
**Efecto secundario:** El trigger automático de Vercel se rompió tras los commits bloqueados. Requirió reconectar el repo en Settings → Git para resincronizar.
**NO hacer:** Hacer commits con el email de las cuentas del bunker. Git siempre debe usar el email de la cuenta de GitHub personal.

---

## ERROR 13 — Separador Markdown `---` dentro de código JS ✅ RESUELTO — 18 mayo 2026
**Síntoma:** Build de Vercel fallaba con "Unexpected token" en GoogleDriveService.js línea 519.
**Causa real:** Un separador Markdown `---` se coló en el archivo JS entre dos funciones (línea 511), probablemente durante una edición manual. Rollup lo interpreta como operador de decremento doble sobre una expresión vacía — sintaxis inválida.
**Solución aplicada:** Eliminar la línea `---` en VS Code.
**NO hacer:** Usar separadores visuales de Markdown dentro de archivos JS. Usar comentarios JS: `// ─────────────────`.

---

## ERROR 14 — toast no declarado en MusicLab (ReferenceError) ✅ RESUELTO — 18 mayo 2026
**Síntoma:** MusicLab muestra pantalla en blanco en todas las plataformas (PWA Android + navegador).
**Error exacto en consola:** `Uncaught ReferenceError: toast is not defined at Df (index-CWAY6DaV.js:35:5753)`
**Causa real:** `toast` y `setToast` se usan en 5 lugares del componente MusicLab (4 llamadas a `setToast` + 1 render condicional `{toast && ...}`) pero nunca se declararon con `useState`. React lanza ReferenceError en el primer render y desmonta el componente silenciosamente — resultado visual: pantalla en blanco sin ningún mensaje de error visible para el usuario.
**Solución aplicada (PLIEGO-014):** Añadir `const [toast, setToast] = useState(null);` al bloque de estado del componente MusicLab, después de la declaración de `pendingTracks`.
**NO hacer:** Buscar el problema en imports, en la lógica de Drive, en el Service Worker o en Web Audio API antes de verificar que todos los estados que se usan están declarados. Revisar siempre el bloque `useState` del componente cuando un módulo entero renderiza en blanco sin error visible.

---

## ERROR 15 — 403 en heartbeat de Drive (token con scope insuficiente para write)
**Síntoma:** `Failed to load resource: 403` en `content.googleapis.com/upload/drive/v3/files/...`. El heartbeat falla silenciosamente. La app funciona pero los cambios pueden no persistir en segundo plano.
**Error exacto en consola:** `[Búnker] Heartbeat falló silenciosamente: Error: [ElBunker::UPDATE_FILE] Error actualizando el archivo DB en Drive`
**Causa probable:** El token OAuth2 obtenido en el login no incluye el scope `drive.file` con permisos de escritura efectivos sobre el archivo específico, o el token se obtiene con `prompt: ''` (silent refresh) que puede devolver un token de solo lectura.
**Estado:** Activo. Relacionado con Bug B (sin persistencia OAuth2 entre recargas). Pendiente de PLIEGO-016.
**NO hacer:** Ignorar los 403 en heartbeat — aunque sean silenciosos, indican que la DB no se está actualizando en Drive.

---

## ERROR 16 — Botón "+ Era" en Vault no hace nada (BUG-CRÍTICO-01)
**Síntoma:** Al pulsar el botón "+ Era" en el módulo Vault, no ocurre ninguna acción visible. Sin error en consola conocido aún.
**Estado:** Activo. Sin diagnóstico completo. Requiere DevTools → Console con el error exacto al pulsar.
**Hipótesis:** handler del botón llama a función de VaultContext que falla silenciosamente, o el estado del modal de creación no se inicializa correctamente.
**NO hacer:** Generar Pliego sin el error exacto de consola.

---

## ERROR 17 — Tracks y drops de MusicLab no persisten entre recargas
**Síntoma:** Edu añade un track y lanza un drop → al recargar la app, el track y el drop desaparecen. Confirmado en dos pruebas consecutivas en testing sesión 7.
**Causa probable:** La escritura en Drive está fallando silenciosamente. El 403 en heartbeat (ERROR 15) apunta a que el token no tiene permisos de escritura efectivos. Alternativamente, `saveQueue` o la función de guardado de drops puede no estar siendo llamada en el momento correcto (por ejemplo, solo se guarda al cambiar de track, no al añadir).
**Estado:** Activo. BUG-CRÍTICO-02. Bloquea también la compartición entre usuarios (ERROR 18).
**Diagnóstico necesario:** Network tab → filtrar `drive/v3` → añadir track → verificar si hay llamada PATCH/POST y su código HTTP.
**NO hacer:** Asumir que el problema es solo OAuth sin verificar primero si la llamada a Drive se está haciendo o ni siquiera se intenta.

---

## ERROR 18 — Drops y tracks no se comparten entre usuarios en MusicLab
**Síntoma:** David no ve el track añadido por Edu. David no recibe el drop lanzado por Edu.
**Causa probable:** Derivado de ERROR 17 — si la escritura en Drive falla, David nunca tiene datos nuevos que leer. Puede también haber un problema de lectura (David lee una versión cacheada o no refresca la DB al entrar a MusicLab).
**Estado:** Activo. BUG-CRÍTICO-04. Probablemente se resuelve al resolver ERROR 17.
**NO hacer:** Generar un Pliego específico para compartición hasta confirmar que ERROR 17 está resuelto y el problema persiste.

---

## ERROR 19 — Reproducción de audio muestra 0:00-0:00 y no reproduce
**Síntoma:** Al intentar reproducir un track en MusicLab, la duración aparece como 0:00-0:00 y no hay audio.
**Causa probable:** El player no está inicializando el source de YouTube correctamente. Posibles rutas: (a) el videoId no se extrae bien del objeto track, (b) el iframe de YouTube no se monta porque falta el elemento DOM en ese momento del render, (c) la YouTube IFrame API no está cargada cuando se intenta inicializar el player.
**Estado:** Activo. BUG-CRÍTICO-03. Independiente de ERROR 17 — este falla incluso si el track estuviera guardado.
**Diagnóstico necesario:** Console → intentar reproducir → capturar error exacto.
**NO hacer:** Modificar la lógica de Drive antes de confirmar que el problema está en la capa del player, no en los datos.

---

## ERROR 20 — Textos de MusicLab mezclados inglés/español y sin personalización
**Síntoma:** Textos de UI como "add track" en inglés conviven con "lanzar drop" en español. El tono es genérico, no refleja el lenguaje de Edu hacia David.
**Causa:** Los textos fueron escritos durante el desarrollo sin criterio de idioma unificado ni voz de usuario definida.
**Estado:** Activo. BUG-NUEVO-05. No bloquea funcionalidad.
**Solución:** Pliego de revisión completa de strings en MusicLab.jsx — todo al español, tono personal Edu→David. Hacer después de estabilizar bugs críticos.
**NO hacer:** Corregir strings sueltos en Pliegos de otros bugs — hacer una pasada completa en un único Pliego dedicado.