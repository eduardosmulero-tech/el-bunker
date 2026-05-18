# DECISIONES TÉCNICAS — el_bunker
> Solo se modifica cuando se toma una nueva decisión arquitectónica.
> No mezclar con estado de sesión ni pendientes.

---

## ARQUITECTURA

**Sin base de datos externa (ADR-001: Propiedad de la Base de Datos)**
Todo persiste en Google Drive mediante un único archivo JSON. No proponer Firebase, Supabase ni ningún backend externo. 
*Actualización 16 Mayo 2026:* Se abandona el uso de `appDataFolder` debido a su naturaleza estrictamente privada que impide el acceso cruzado entre cuentas. La base de datos vive ahora en una carpeta estándar del Drive de `thebunker.admin` compartida explícitamente con los usuarios. Requiere la variable `VITE_GOOGLE_SHARED_FOLDER_ID`.

**Solo 3 usuarios autorizados**
No hay registro público. La whitelist es fija en CONFIG.USERS de GoogleDriveService.js.

**Schema v3.2.0**
Incluye soporte para `music_lab.playlists` y migración automática desde v1, v2, v3.0.0 y v3.1.0. No modificar el schema sin evaluar impacto en la migración.

**PWA con Service Worker**
Estrategia cache-first para assets estáticos. Network-first para googleapis.com. No cambiar esta estrategia sin motivo crítico.

---

## DEPENDENCIAS

**Tailwind CSS v3.4.19 — NO actualizar a v4**
Tailwind v4 reescribió la arquitectura de configuración. La migración rompería el proyecto. Ver errores_conocidos.md ERROR 1.

**React 18 + Vite**
No Next.js. La app es client-side pura. Los componentes NO necesitan 'use client'.

**GIS OAuth2 (Google Identity Services)**
No usar la librería legacy de Google Sign-In. GIS es la implementación actual requerida por Google.

---

## SCOPES OAUTH REQUERIDOS

openid
email
profile
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile

*Nota:* `drive.appdata` eliminado en PLIEGO-009 (17 mayo 2026). `drive.readonly` congelado para lógica de Bibliotecas. Eliminar cualquiera de los scopes activos rompe autenticación o acceso a Drive. Ver CLAUDE.md para justificaciones completas.

---

## PRINCIPIO DE MODIFICACIÓN MÍNIMA
Solo modificar los archivos estrictamente necesarios para resolver el bug o implementar la feature. No refactorizar código que funciona.

---

## DECISIONES DE SETUP (herramientas y entorno)

**WSL2 + Ubuntu 24.04** — Pendiente de instalar. Toolchain consistente y Docker nativo. Hacerlo en sesión sin presión de proyecto.

**Open WebUI** — Pendiente, depende de WSL2. Interfaz de chat local con historial para Qwen.

**Ollama en Windows nativo** — Mantener durante la transición a WSL2 como red de seguridad. Desinstalar solo después de una semana estable en WSL2.

**Gemini 2.5 Pro como segundo arquitecto** — Disponible en aistudio.google.com sin instalación. Usar cuando Claude llegue al límite, no por defecto.

**Aider** — Descartado por ahora. Elimina el control humano por Pliego, riesgo alto con datos reales en Drive. Reevaluar en 6-12 meses.

## ESTADO DE PRODUCCIÓN

**Deploy activo** — https://el-bunker-beige.vercel.app (desde 18 mayo 2026)
- Vercel conectado a GitHub (rama main). Trigger automático activo.
- VITE_GOOGLE_CLIENT_ID y VITE_GOOGLE_SHARED_FOLDER_ID configurados en Vercel env vars.
- Service Worker activo en HTTPS con versionado dinámico (__BUNKER_SW_VERSION__).
- Git configurado con user.email = bansovi.py@gmail.com (email GitHub personal, no bunker).

## DECISIONES DE WORKFLOW

WORKFLOW B — SÍNCRONO (principal)

Edu está delante. Quiere el cambio hecho en menos de 30 minutos.

Paso 0 — Verificación de estado del repo (2 min, una vez por sesión):

powershellgit status
git diff fc98830 src/GoogleDriveService.js
git diff fc98830 src/VaultContext.jsx

Si hay algo inesperado, parar y documentar antes de continuar.

Paso 1 — Identificar el Pliego (1 min):

Abrir REGISTRO_PLIEGOS.md. Tomar el primero en cola con estado pendiente.

Paso 2 — Pedir el bloque exacto a Claude (2 min):

Decirle a Claude: "Dame el bloque SEARCH y el bloque REPLACE exactos para PLIEGO-00X, para hacer Ctrl+H en VS Code."
Claude devuelve dos bloques: lo que hay ahora y lo que debe quedar.

Paso 3 — Verificar el SEARCH en el archivo (1 min):

powershellGet-Content src/Archivo.js | Select-Object -Index (N..M)

Confirmar que el bloque SEARCH coincide exactamente con lo que está en disco. Si no coincide, decírselo a Claude para que ajuste.

Paso 4 — Aplicar el cambio en VS Code (2 min):

Ctrl+H en VS Code → pegar SEARCH en "buscar" → pegar REPLACE en "reemplazar" → reemplazar. Alternativamente, ir directamente a las líneas indicadas y sustituir manualmente si el cambio es menor de 5 líneas.

Paso 5 — Verificar en disco (1 min):

powershellGet-Content src/Archivo.js | Select-Object -Index (N..M)
Pegar el output a Claude para confirmación. Claude da OK o señala el problema.

Paso 6 — Commit (1 min):

powershellgit add src/Archivo.js
git commit -m "PLIEGO-00X: descripción breve"

Tiempo total estimado: 10-15 minutos por Pliego.

Dependencias: VS Code, PowerShell, Claude. Cero herramientas adicionales.

WORKFLOW A — ASÍNCRONO (fallback)

Edu no está disponible. Qwen trabaja solo. Edu revisa cuando vuelve.

Prerequisitos antes de lanzar:

powershellollama list          # verificar que el modelo está disponible
ollama run qwen3:14b # precalentar el modelo antes de abrir Cline

Paso 1 — Preparar el contexto para Qwen:

No dar solo el Pliego. Dar también el bloque de código actual copiado con PowerShell. Qwen no debe inferir el SEARCH — debe recibirlo literal.

Paso 2 — Lanzar en Cline y alejarse:

No quedarse mirando. Poner un timer de 20 minutos y hacer otra cosa.

Paso 3 — Al volver, antes de revisar el diff:

Copiar el bloque SEARCH/REPLACE del chat de Cline y pegarlo a Claude para verificación. No aceptar el diff hasta tener el OK del arquitecto.

Paso 4 — Si Qwen falló (ERROR 7 u 8): Rechazar. Cambiar a Workflow B. No reintentar Qwen más de una vez con el mismo Pliego.

Paso 5 — Si Qwen acertó: Aceptar en Cline, verificar con PowerShell, commit.

Tiempo estimado: 20-40 min de espera + 10 min de revisión.

Cuándo usarlo: Edu cocinando, limpiando, o en cualquier momento donde no puede estar delante del PC.

