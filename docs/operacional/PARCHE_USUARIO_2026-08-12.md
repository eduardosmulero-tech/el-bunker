# Parche 2026-08-12 — notas para el usuario

> Informe de parche a nivel usuario (Edu y David). La versión servida en la web es
> `public/parche-usuario.html`; el grafo del flujo de la app es `public/grafo-app.html`
> (documento vivo: se actualiza con cada parche). El parche anterior (8-ago) queda
> registrado en `PARCHE_USUARIO_2026-08-08.md`.

## Qué cambia con este parche

### Visible para vosotros
- **El panel de administración gana dos consolas nuevas** (en `/admin`):
  - **SALUD**: recuentos en vivo del búnker leídos de la base de datos (fotos,
    canciones activas, eliminadas, referencias y colgantes) — sirve para detectar
    datos huérfanos de un vistazo.
  - **AUDITORÍA**: un lector del registro de actividad de la app (eventos), con
    filtros por tipo, usuario y fechas, y paginación — para ver quién hizo qué.
- **Modo Visita reforzado por el servidor**: además del interruptor, ahora el
  servidor censura de verdad lo clasificado (sin título, sin nota, sin archivo) en
  los listados y en el feed cuando se entra en modo visita. El candado ya no se
  puede saltar guardando una copia antigua de la sesión: la censura se aplica
  servidor mediante.

### Por dentro (no cambia ninguna pantalla)
- Saneamiento server-side del modo visita en las rutas de contenido y en el feed.
- **Línea base de auditoría de textos truncados**: herramienta de medición
  reproducida (24 hallazgos documentados) y primer **delta** contra la versión
  anterior: 10 truncados resueltos, 0 agravados, 6 mediciones nuevas en escritorio.
- El harness de auditoría ahora mide también el escritorio (antes solo móvil).
- Arreglada la fecha de la "aventura en curso": la app ya no inventa una fecha
  falsa cuando la real no está disponible; se queda sin fecha hasta que exista.
- La tabla de iconografía del diseño HUD declara las 20 líneas reales que usan
  iconos (fuente de verdad para futuros cambios visuales).

### Próximos parches
- HUD rediseñada para el escritorio (trabajo en curso, pendiente de integrar).
- Interfaz del Modo Visita (desenfoque y control) y revocación de sesiones
  (diseñada, pendiente de implementar).
- Móvil real 390x844 y PWA instalada (C1).
- Comprobación de recarga de `/admin` con la PWA instalada (F5 con el servicio en
  segundo plano).

## Nota de despliegue
- Frontend (Vercel): este parche llega por push a `master` el 12-ago.
- API (Cloudflare Worker): pendiente de despliegue — las rutas nuevas
  (`/api/admin/health`, `/api/admin/audit`) se verifican en producción tras el
  deploy.
