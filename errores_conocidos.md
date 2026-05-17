# ERRORES CONOCIDOS — el_bunker
> Problemas ya diagnosticados. Antes de proponer cualquier solución, consultar este archivo para no repetir caminos ya recorridos.

---

## ERROR 1 — Tailwind v4 incompatible
**Síntoma:** Estilos rotos, configuración no aplicada.
**Causa real:** Tailwind v4 reescribió la arquitectura de configuración completamente. El proyecto usa tailwind.config.js estándar que v4 no procesa igual.
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
**Síntoma:** La app sigue mostrando una versión antigua después de un deploy o cambio. Hard reload no ayuda.
**Causa real:** El Service Worker tiene la versión rota en caché y la sirve antes de que el navegador pueda actualizar.
**Solución:** Clear site data completo + hard refresh. Ajustes del navegador → Privacidad → Borrar datos del sitio → solo para la URL de la app.
**NO hacer:** Solo hard reload (Ctrl+Shift+R) sin clear site data previo. No resuelve el problema.

---

## ERROR 4 — Login admin bloqueado (RESUELTO — 16 mayo 2026)
**Síntoma:** La cuenta thebunker.admin@gmail.com no podía hacer login o veía la base de datos a 0, mientras que las cuentas de usuario (bansovi.py, dcgdozt) sí entraban correctamente. Ocurrió inicialmente probando en Opera GX.
**Causa real:** Dos factores. Primero, posible conflicto de caché/Service Worker antiguo en Opera GX. Segundo y más importante, limitación arquitectónica: la DB original se creó en el `appDataFolder` del primer usuario que ingresó (bansovi.py). Como el `appDataFolder` es estrictamente privado y no compartible, el admin al entrar tenía un entorno vacío y se le creaba una DB nueva.
**Solución aplicada:** Se tomó la decisión arquitectónica (ADR-001) de migrar la base de datos desde `appDataFolder` a una carpeta de Drive estándar compartida. Redactados PLIEGOS 001, 002 y 003 para aplicar la migración.
**NO hacer:** Intentar forzar acceso cruzado usando `appDataFolder`. 

---

## ERROR 5 — Continue (extensión VS Code) webview en blanco
**Síntoma:** El panel de Continue se muestra vacío. El botón Enter no envía prompts.
**Causa real:** Proceso de VS Code en estado inválido → "Could not register service worker: InvalidStateError".
**Solución:** Cerrar todos los procesos Code.exe desde el Administrador de Tareas y reiniciar VS Code.
**Nota:** Se migró de Continue a Cline como herramienta principal. Este error es menos relevante si se usa Cline.

---

## ERROR 6 — Deploy a Vercel/GitHub (PENDIENTE)
**Síntoma:** La app solo funciona en localhost:5173.
**Causa real:** No se ha realizado el deploy todavía.
**Consideraciones para el deploy:**
- VITE_GOOGLE_CLIENT_ID y VITE_GOOGLE_SHARED_FOLDER_ID deben configurarse como variables de entorno en Vercel, no en el repo.
- La URL de producción debe añadirse a los orígenes autorizados en Google Cloud Console antes de que OAuth funcione.
- El Service Worker solo funciona en HTTPS, que Vercel provee por defecto.