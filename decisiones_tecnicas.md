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

**Schema v3.0.0**
Incluye migración automática desde v1 y v2. No modificar el schema sin evaluar impacto en la migración.

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
```
openid
email
profile
[https://www.googleapis.com/auth/drive.file](https://www.googleapis.com/auth/drive.file)
```
*Nota:* El scope `drive.appdata` se reemplazó por `drive.file` a raíz de la migración ADR-001. Eliminar cualquiera de estos scopes rompe la autenticación o el acceso a Drive.

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