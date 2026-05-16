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

## ERROR 4 — Login admin bloqueado (SIN RESOLVER — 15 mayo 2026)
**Síntoma:** La cuenta thebunker.admin@gmail.com no puede hacer login. Las cuentas de usuario (bansovi.py, dcgdozt) sí entran.
**Sesión invertida:** 4 horas el 15 mayo sin resolver. Se modificaron GoogleDriveService.js y VaultContext.jsx sin encontrar la causa.
**Archivos modificados en esa sesión:** GoogleDriveService.js (+15 bytes), VaultContext.jsx (+132 bytes).
**Estado:** Pendiente. Es el primer bug a resolver con metodología correcta (protocolo Sherlock + Network abierto).
**Hipótesis NO confirmadas:** Múltiples intentos sin datos de Network → descartar todo lo intentado y empezar desde cero con error HTTP exacto.

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
- VITE_GOOGLE_CLIENT_ID debe configurarse como variable de entorno en Vercel, no en el repo.
- La URL de producción debe añadirse a los orígenes autorizados en Google Cloud Console antes de que OAuth funcione.
- El Service Worker solo funciona en HTTPS, que Vercel provee por defecto.
