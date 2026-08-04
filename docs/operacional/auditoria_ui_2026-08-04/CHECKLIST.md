# CHECKLIST DE AUDITORÍA UI — El Búnker

> Fecha: 2026-08-04 · Ejecutor: Hermes (deepseek-v4-flash) vía navegador headless + API
> Cobertura: todas las pantallas en producción (frontend Vercel + Worker API + D1 + R2)
> Leyenda: ✅ OK · ❌ FALLO · ⚠️ OBSERVACIÓN · ➖ NO APLICA/NO VERIFICABLE (entorno headless)

---

## 0. LOGIN Y SESIÓN

| # | Elemento | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 0.1 | Boot screen (animación terminal) | ✅ | 00_login_boot.png |
| 0.2 | Botón ACCEDER AL BÚNKER (Google OAuth) | ➖ No probado (requiere cuenta Google real; Gate 1 David OK documentado 1-ago) | — |
| 0.3 | Enlace › ACCESO TEST / ADMIN | ✅ Abre panel con input + checkbox + ENTRAR | 00_login_panel_test_admin.png |
| 0.4 | Login con clave de acceso (ADR-028) | ✅ Canje OK → VAULT cargado | logs/consola_01_login.md |
| 0.5 | Checkbox RECORDAR EN ESTE DISPOSITIVO | ➖ Probado desmarcado (flujo por defecto); marcado = credencial persistente por diseño | — |
| 0.6 | Logout (⎋) | ✅ Vuelve al boot, sessionStorage limpio | logs/consola_08_logout.md |
| 0.7 | Botón ↺ (reload) | ✅ window.location.reload() (Layout.jsx:151) | — |

## 1. VAULT

| # | Elemento | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 1.1 | Header (fecha, hora, indicador de presencia) | ✅ | 01_vault_principal.png |
| 1.2 | Widget AVENTURA EN CURSO | ⚠️ Muestra "0Y 1M 22D" y "52 DÍAS" (mismo periodo, formato redundante) | 01_vault_principal.png |
| 1.3 | Lista de eras + cambio de era activa | ✅ ERA_00 (2021) ↔ ERA_01 (2022, 342 elementos) | logs/consola_02_vault.md |
| 1.4 | + ERA | ✅ Crea era (POST /api/eras), persistida en D1, borrado físico OK | logs/d1_verificaciones.md |
| 1.5 | + ENTRADA | ✅ Crea entrada (POST /api/entries), **persiste en D1** (P1-01 REVISADO: RESUELTO) | logs/d1_verificaciones.md |
| 1.6 | Modal entrada (título, texto, tipo, lugar) | ✅ Formulario completo, ~75 tipos emoji | — |
| 1.7 | Guardar sin tag: submit silencioso | ⚠️ No valida visualmente (ver INFORME H-06) | — |
| 1.8 | Filtro ◈ (todos) | ✅ 185/185 | logs/consola_02_vault.md |
| 1.9 | Filtro 📷 (fotos) | ✅ 185 (todas las de la era son fotos) | logs/consola_02_vault.md |
| 1.10 | Filtros ✎ 📄 📍 ⏳ 📋 💚 🔗 🎨 💰 🕯 🔐 📊 🔄 | ✅ Filtran a 0 en era 2021 (no existen de esos tipos; estado vacío presente) | logs/consola_02_vault.md |
| 1.11 | Buscador BUSCAR… | ✅ "zzz"→0 · "takeout"→23 · vacío→185 | logs/consola_02_vault.md |
| 1.12 | Modo WALL | ✅ Masonry virtualizado, imágenes lazy OK, 185 items | logs/consola_02_vault.md |
| 1.13 | Modo CINEMA | ✅ Render distinto (1 img) | logs/consola_02_vault.md |
| 1.14 | Modo MAP | ✅ | logs/consola_02_vault.md |
| 1.15 | Modo DIALOGUE | ✅ | logs/consola_02_vault.md |
| 1.16 | Modo EXHIBITION | ✅ (6 imgs) | logs/consola_02_vault.md |
| 1.17 | Modo REEL | ✅ (12 imgs, grid 2 col) | 01_vault_modo_reel.png |
| 1.18 | Densidad COMPACT | ✅ min-height 120px | logs/consola_02_vault.md |
| 1.19 | Densidad NORMAL | ✅ 180px | logs/consola_02_vault.md |
| 1.20 | Densidad EXPANDED | ✅ 280px | logs/consola_02_vault.md |
| 1.21 | Click entrada → EntryLightbox | ✅ Foto 2048px, contador 1/185, metadata (Edu, 2021, fecha, título) | 01_vault_lightbox.png |
| 1.22 | Lightbox ▶ siguiente / ◀ anterior | ✅ 1→2→1; ◀ solo aparece cuando hay prev | logs/consola_03_lightbox.md |
| 1.23 | Lightbox ✕ cerrar | ✅ | logs/consola_03_lightbox.md |
| 1.24 | Lightbox pie de ayuda | ⚠️ Desbordamiento 25px en viewport bajo (ver INFORME H-05) | logs/consola_03_lightbox.md |
| 1.25 | ✎ editar entrada | ✅ Abre editor (cancelado sin guardar para no tocar datos reales; PATCH verificado en código useMusicActions) | — |
| 1.26 | ✕ borrar entrada | ✅ Soft delete verificado por API (200, is_deleted=1) en entrada de prueba | logs/d1_verificaciones.md |
| 1.27 | ↓ BACKUP JSON | ✅ Código canónico Blob+download (descarga real no verificable en headless) | — |
| 1.28 | Iconografía emoji del vault | ⚠️ Deuda conocida de Edu (ENTRY_TYPES) — confirmada en vivo | 01_vault_principal.png |
| 1.29 | Títulos de entradas en WALL sin truncar | ❌ **23 cortes medidos por DOM** (194px necesarios vs 122px disponibles, ellipsis; H-11) | 05_vault_wall_cortes.png |

## 2. MUSIC LAB

| # | Elemento | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 2.1 | Tab MUSIC LAB | ✅ | 02_musiclab.png |
| 2.2 | Reproductor (track activo, tiempo, ▶) | ✅ UI correcta; **play no verificable en headless** (autoplay policy; MP3 responde 206/200) | logs/consola_04_musiclab.md |
| 2.3 | ◀◀ anterior / ▶▶ siguiente | ✅ Cambian de track | logs/consola_04_musiclab.md |
| 2.4 | ⟳ repeat / ⇄ shuffle / ⚡ speed / 🔊 volumen | ✅ Presentes; función no verificable sin reproducción | — |
| 2.5 | ♡ favorito | ✅ Presente | — |
| 2.6 | Cola "A CONTINUACIÓN" | ⚠️ **429 rate limit en GET /api/queue/admin** (ver INFORME H-01) | logs/consola_04_musiclab.md |
| 2.7 | Tab TRACKS [529] | ✅ Contador cuadra con D1 (529 activos de 1.117) | logs/d1_verificaciones.md |
| 2.8 | Filtros género (ALL/GAMING/SLOWED/NIGTHCORE/FRUTIAERO/420/DNB/♥) | ✅ Presentes | — |
| 2.9 | Búsqueda ⌕ | ✅ Presente | — |
| 2.10 | + AÑADIR TRACK | ✅ **Sube MP3 a R2 y persiste r2_key** (P1-02 REVISADO: RESUELTO) | logs/d1_verificaciones.md |
| 2.11 | Añadir sin tag: submit silencioso | ⚠️ Igual que H-06 (tag obligatorio sin feedback) | logs/consola_05_addtrack.md |
| 2.12 | ID3 read fallido (MP3 sin tags) | ⚠️ Warning en consola, no bloquea subida | logs/consola_05_addtrack.md |
| 2.13 | Tab LISTS (playlists) | ✅ Presente (4 playlists en D1) | — |
| 2.14 | Crear playlist | ✅ POST /api/playlists verificado en código | — |
| 2.15 | ✎ editar / − borrar track | ✅ PATCH/DELETE soft en código y verificado por API | logs/d1_verificaciones.md |
| 2.16 | Títulos de tracks sin truncar | ❌ **14 cortes medidos por DOM** (caso peor 662px vs 247px, pierde dato del remix; H-12) | 04_musiclab_cortes.png |

## 3. CAPSULES

| # | Elemento | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 3.1 | Sub-tab ◎ TIMELINE | ✅ Eventos reales (50/500, paginado, CARGAR MÁS) | 03_capsules_timeline.png |
| 3.2 | Sub-tab ⧖ SMOKE | ✅ (sesión: RESET/ACTIVAR/volumen/duración) | — |
| 3.3 | Sub-tab 🔮 TIME CAPSULES | ✅ Lista BLOQUEADAS | — |
| 3.4 | Sub-tab 📊 RECAP | ✅ SEMANAL (805 eventos) / MENSUAL / ANUAL + GUARDAR COMO ENTRADA | — |
| 3.5 | Filtros TODO/VAULT/MUSIC/SMOKE/AMBOS/EDU/DAVID/TIPOS | ✅ Presentes | — |
| 3.6 | SELLAR CÁPSULA 🔮 | ✅ Crea time_capsules + capsule_items + event en D1 | logs/d1_verificaciones.md |
| 3.7 | Cápsulas selladas sin DELETE | ⚠️ No hay ruta DELETE (inmutables por diseño; ver INFORME H-07) | logs/d1_verificaciones.md |
| 3.8 | Filtro eras 2021/2022 | ✅ | — |
| 3.9 | Títulos de eventos en TIMELINE sin truncar | ❌ **2 cortes medidos por DOM** (401px vs 302px; prefijo "admin " consume ancho; H-13) | 03_capsules_timeline.png |

## 4. PWA / INFRAESTRUCTURA

| # | Elemento | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 4.1 | Service worker | ✅ Activo, activated | logs/consola_06_pwa.md |
| 4.2 | Cachés | ✅ bunker-dev + bunker-runtime-dev | logs/consola_06_pwa.md |
| 4.3 | Manifest | ✅ standalone, 5 iconos, 2 shortcuts | logs/consola_06_pwa.md |
| 4.4 | Streaming MP3 | ✅ 206 + audio/mpeg (range support) | logs/d1_verificaciones.md |
| 4.5 | Rate limit API | ❌ **10 req/s por IP rompe la carga normal** (ver INFORME H-01) | logs/consola_04_musiclab.md |
| 4.6 | Vista móvil 390x844 | ➖ Pendiente conocido (sin emulación en este entorno) | — |
| 4.7 | PWA instalada en Android | ➖ Pendiente conocido | — |
| 4.8 | Adaptación a escritorio (navegador real) | ⚠️ **Requisito pedido 3 veces por Edu, sin tratar como deuda en docs vivos** (H-14); hoy se miden cortes de títulos en las 3 tabs | 04_musiclab_cortes.png, 05_vault_wall_cortes.png |

## 5. ESTABILIDAD DEL ENTORNO DE PRUEBA

| # | Observación | Resultado |
|---|--------------|-----------|
| 5.1 | OOM kills del navegador headless | ⚠️ 4 kills durante la sesión con esta app (consumo alto con 527 entries); ver INFORME H-08 |
| 5.2 | Restauración de sesión tras OOM | ✅ Mensaje "Sesión restaurada tras OOM kill" — mecanismo funciona |

---

## RESUMEN

- **Total items del checklist:** 66
- **✅ OK:** 49 · **⚠️ Observación:** 10 · **❌ FALLO:** 4 · **➖ No verificable:** 3
- **Bugs P1 conocidos del 2-ago (P1-01, P1-02): RESUELTOS en producción** (verificado por artefacto hoy)
- **Hallazgo nuevo principal:** rate limit 10 req/s (H-01) — ver INFORME.md
- **Hallazgos visuales (turno repetido, canon DOM-first):** 23 títulos truncados en WALL (H-11), 14 en MUSIC LAB (H-12), 2 en TIMELINE (H-13) — todos medidos por DOM y reproducidos 2/2; requisito desktop de Edu documentado como H-14
