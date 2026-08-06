# Parche 2026-08-06 — notas para el usuario

> Informe de parche a nivel usuario (Edu y David). La versión servida en la web es
> `public/parche-usuario.html`; el grafo del flujo de la app es `public/grafo-app.html`
> (documento vivo: se actualiza con cada parche).

## Qué cambia con este parche

### Ya notabais antes (recordatorio, activo desde finales de julio / 2-ago)
- El vault muestra el contenido real: 527 fotos en 2 bloques (2021 y 2022). Antes solo se
  veían las 200 primeras (fix S151, 2-ago).
- Las canciones repetidas desaparecieron (limpieza de 30 duplicados exactos, 1-ago).
- El login con Google ya no pide acceso a Drive (1-ago).

### Con este parche (por dentro — no cambia ninguna pantalla todavía)
- Primera piedra del panel de administración: base de las pantallas de gestión (tablas,
  formularios, diálogos de confirmación, guard de permisos) integrada y probada
  (B1 admin-core + B2 requireAdmin, merge MERGE-1).
- Clasificación automática lista en el servidor (A1: migración classified_items + blurhash
  + endpoints de marcado). Las imágenes quedan preparadas para placeholder difuminado.
- Protección de datos al subir: validaciones en tracks, drops, events y entries (R11).
- Arreglos internos: la suite de pruebas vuelve a medir solo el código real (P0: exclusión
  de `.worktrees/` en vitest) y se corrigió una regex vacua (FIX-SB).

### Próximos parches
- Panel de administración visible (INT-Ola2: conexión del esqueleto con rutas reales).
- HUD rediseñada para el escritorio (t_504a2707).
- Móvil real 390x844 y PWA instalada (C1, t_dc83fadf).

## Nota de despliegue
- Frontend (Vercel): este parche llega por push a `master` el 6-ago.
- API (Cloudflare Worker): se actualiza en un paso aparte (despliegue del worker), cuando
  se cierre la integración de la Ola 2.
