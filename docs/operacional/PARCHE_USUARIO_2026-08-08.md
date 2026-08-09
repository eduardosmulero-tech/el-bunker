# Parche 2026-08-08 — notas para el usuario

> Informe de parche a nivel usuario (Edu y David). La versión servida en la web es
> `public/parche-usuario.html`; el grafo del flujo de la app es `public/grafo-app.html`
> (documento vivo: se actualiza con cada parche). El parche anterior (6-ago) queda
> registrado en `PARCHE_USUARIO_2026-08-06.md`.

## Qué cambia con este parche

### Visible para vosotros
- **El panel de administración ya se ve**: en la dirección `/admin` se abre la Terminal de
  Mando, donde se gestiona el contenido (canciones, fotos, listas, cápsulas...) con los
  permisos de administrador. Es la integración de la Ola 2 completa: el esqueleto del parche
  anterior conectado con las rutas reales del servidor.
- **Las fotos ya se pueden editar y eliminar desde el visor**: al abrir una foto, hay botón
  de editar (título, texto, etiquetas, era...) y botón de eliminar con confirmación. Antes
  solo se podía desde la lista, no desde la galería.
- **Modo Visita**: se puede entrar con una clave (sin cuenta de Google) para visitar.
- **El login se ve más limpio**: el botón de acceder perdió los cuadrados decorativos de las
  esquinas y los avisos de error ahora se ven centrados.

### Por dentro (no cambia ninguna pantalla)
- Retirada completa del código de Drive (el login ya no pedía acceso desde el parche
  anterior; ahora tampoco queda código de esa época).
- Clasificación y marcado en lote de contenido en el servidor (endpoint de sesión de visita
  incluido).
- Herramienta de auditoría de la interfaz: un pase automático que mide textos truncados,
  desbordamientos, errores de consola y fallos de red en cada pantalla (24 hallazgos
  reproducibles en su primer pase).
- Pruebas de regresión nuevas (el cliente de datos ya no puede volver a emitir cabeceras
  malformadas) y la auditoría del canon del proyecto ahora lee las especificaciones vivas,
  que antes se saltaba.

### Próximos parches
- HUD rediseñada para el escritorio (diseño firmado, ejecución pendiente).
- Móvil real 390x844 y PWA instalada (C1).
- Comprobación de recarga de `/admin` con la PWA instalada (F5 con el servicio en
  segundo plano).

## Nota de despliegue
- Frontend (Vercel): este parche llega por push a `master` el 8-ago.
- API (Cloudflare Worker): el código del worker va integrado en el mismo push; el
  despliegue a Cloudflare se hace en un paso aparte.
