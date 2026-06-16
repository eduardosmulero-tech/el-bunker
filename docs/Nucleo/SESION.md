# SESION.md — El Búnker

> Dispatcher del sistema. Leer primero.
> Actualizar al cerrar cada sesión.

## S116-L2 — SPLIT APP.JSX MONOLÍTICO (16 Junio 2026)

### Extracciones
- **BootScreen.jsx**: GlobalLoadingScreen + ErrorScreen + PageLoader. Tokens (ACID/BG/FONT) importados de `../tokens` en vez de redefinidos localmente.
- **PageWrappers.jsx**: VaultPage, MusicPage (con lazy + tag handlers), CapsulesPage. Code splitting preservado.
- **TabShell.jsx**: AuthenticatedApp (tab router + DropAlertModal + Layout + slide direccional) + UnauthorizedScreen.
- **App.jsx**: 480→119 líneas. Solo providers + GlobalErrorBoundary + AppCore + App.

### Validación
- Build: ✅ 20.85s
- Lint: ✅ 0 errores
- Code review: ✅ sin regresiones

### Archivos creados/modificados (4)
- `src/layout/BootScreen.jsx` (nuevo, ~120 líneas)
- `src/layout/PageWrappers.jsx` (nuevo, ~130 líneas)
- `src/layout/TabShell.jsx` (nuevo, ~105 líneas)
- `src/layout/App.jsx` (reescrito, 119 líneas)

### Pendiente (manual)
1. Commit + push: `git add -A && git commit -m "refactor: S116-L2 — split App.jsx 480→119 lines (BootScreen + PageWrappers + TabShell)"`
2. `npx wrangler deploy` (worker refactorizado)
3. Smoke test completo

### Lo que queda del roadmap
- S117-T1/T2: Auditoría completa de tokens + migración (3h)
- S118-P1-P4: Gallery premium modes (12h)
