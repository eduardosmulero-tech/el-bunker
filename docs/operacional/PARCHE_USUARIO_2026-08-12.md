# Parche 2026-08-12 — notas para el usuario

> Informe de parche a nivel usuario (Edu y David). La versión servida en la web es
> `public/parche-usuario.html`; el grafo del flujo de la app es `public/grafo-app.html`
> (documento vivo: se actualiza con cada parche). El parche anterior (8-ago) queda
> registrado en `PARCHE_USUARIO_2026-08-08.md`.

## Qué cambia con este parche

### Visible para vosotros
- **El panel de administración gana tres consolas nuevas** (en `/admin`):
  - **SALUD**: recuentos en vivo del búnker leídos de la base de datos (fotos,
    canciones activas, eliminadas, referencias y colgantes) — sirve para detectar
    datos huérfanos de un vistazo.
  - **AUDITORÍA**: un lector del registro de actividad de la app (eventos), con
    filtros por tipo, usuario y fechas, y paginación — para ver quién hizo qué.
  - **ACCESOS**: la consola de revocación de sesiones. Muestra quién tiene acceso
    (por Google o por clave) y permite cortar las sesiones de cualquiera al
    momento: al revocar, los dispositivos con una sesión antigua dejan de entrar
    (el servidor les responde 401) hasta que vuelvan a identificarse.
- **Modo Visita completo**: además del servidor censurando lo clasificado (sin
  título, sin nota, sin archivo), ahora tiene su **interfaz propia**: interruptor
  en la cabecera y tesela esmerilada para el contenido clasificado en la galería,
  el visor y las demás vistas. El candado no se puede saltar guardando una copia
  antigua de la sesión: la censura la decide el servidor.
- **La pantalla de inicio rediseñada para el escritorio (HUD)**: marco de
  escritorio con mejor aprovechamiento del espacio, títulos con límite de dos
  líneas (los textos largos ya no se cortan feo) y nueva iconografía — sin
  cambiar nada por debajo de 1280px.

### Por dentro (no cambia ninguna pantalla)
- Saneamiento server-side del modo visita en las rutas de contenido y en el feed.
- **Revocación de sesiones por "epoch"**: cada usuario tiene un contador en la
  base de datos; los tokens llevan ese contador y el servidor comprueba que siga
  vigente en cada petición. Revocar = subir el contador. Cubre a David (Google) y
  a las claves de acceso por igual, sin tablas nuevas ni limpieza de caducados.
- **Línea base de auditoría de textos truncados**: herramienta de medición
  reproducida (24 hallazgos documentados) y primer **delta** contra la versión
  anterior: 10 truncados resueltos, 0 agravados, 6 mediciones nuevas en escritorio.
- El harness de auditoría ahora mide también el escritorio (antes solo móvil).
- Arreglada la fecha de la "aventura en curso": la app ya no inventa una fecha
  falsa cuando la real no está disponible — el contador se queda en ceros.
- La tabla de iconografía del diseño HUD declara las 20 líneas reales que usan
  iconos y todas quedan alineadas al registro único de iconos.

### Próximos parches
- Móvil real 390x844 y PWA instalada (C1).
- Comprobación de recarga de `/admin` con la PWA instalada (F5 con el servicio en
  segundo plano).
- Despliegue del worker con las rutas nuevas (salud, auditoría, accesos) y
  verificación autenticada en producción.

## Nota de despliegue
- Frontend (Vercel): este parche llega por push a `master` el 12-ago.
- API (Cloudflare Worker): pendiente de despliegue — las rutas nuevas
  (`/api/admin/health`, `/api/admin/audit`, `/api/admin/access`) se verifican en
  producción tras el deploy.
