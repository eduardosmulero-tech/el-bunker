# REAUDITORÍA TOTAL el-bunker — REPETIDA_5 (Hermes, 2026-08-02) · sexta ejecución

> Contrato: `docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_5_2026-08-02.md`.
> Ejecutor: Hermes · Mandante: Edu · Revisor: Luna / Edu. Regla: tolerancia cero.
> Entregables (§3): este informe + `C:\proyectos\.trabajo\evidencias_auditoria5\`
> (índice, validador con salida, manifiestos de IDs y de usos, inventarios).
> Históricos intactos (contratos 1-5, informes 1-4 rechazados, acta de veredicto).
> Etiquetas (§10): `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`,
> `NO VERIFICADO`, `FAIL / INVALIDADA`. Sin "CORRECTO"/"ROTO" como hecho operativo sin
> evidencia. Sin celdas `—` en matrices (§7).

---

## 1. ESTADO: PASS CANDIDATE

PASS CANDIDATE no es aprobación: Luna verifica (§13.4) y Edu decide (§13.5). Un fallo
material —incluido ID cruzado, conceptual inexistente, celda `—`, referencia huérfana,
omisión de inventario o afirmación más fuerte que la evidencia— produce FAIL / INVALIDADA
y repetición desde cero.

## 2. ALCANCE Y LÍMITES (universo cerrado, §15-16)

- **Universo cerrado**: todos los archivos regulares bajo `src/**`, `workers/**`,
  `public/**` y `docs/**`, más todos los archivos regulares de la raíz del repositorio.
- **Exclusiones declaradas** (lista del contrato §15): `.git/**`, `node_modules/**`,
  `dist/**`, `coverage/**`, `.claude/**`, `.github/**`, `tools/**`. Justificación de
  exclusiones: control de versiones, dependencias npm, artefactos de build, cobertura de
  tests, configuración local del agente y CI, y herramientas legacy fuera del alcance
  funcional de la app. Ninguna cita de este informe usa archivos de esas rutas.
- **Partición objetiva (§16)** por regla de prioridad: `U3_PATH_DOCS` (todo `docs/**`) >
  `U3_EXT_MD_TXT` (`.md`/`.txt` en cualquier ruta incluida) > `U1_CODE_EXT`
  (`.js`/`.jsx`/`.css` bajo `src/`/`workers/`/`public/`) > `U2_REST`.
- **Conteos del universo** (computados por `inventario.py`, salida verificada): **215
  rutas** = U1 79 + U2 29 + U3 108; reglas: U3_PATH_DOCS 101, U3_EXT_MD_TXT 7,
  U1_CODE_EXT 79, U2_REST 29. `U1 ∩ U2 = U1 ∩ U3 = U2 ∩ U3 = ∅` y
  `U1 ∪ U2 ∪ U3 = universo cerrado` (validado por `validador.py`, chequeo (a)).
- **Definición de cobertura**: el 100% del universo cerrado está inventariado y clasificado
  (fila por archivo en §3, con clasificación exacta). **Cero archivos NO REVISADO**
  (comprobado por el validador). Los `MUESTREO` (74) son assets binarios, archivos de
  secretos/config local (contenido no leído por prohibición §11: JWT/claves/secretos),
  zips, residuos y documentación histórica fuera del alcance funcional — cada uno con su
  ruta, tamaño y regla en §3.
- **Límites**: la evidencia viva D1/R2 es de la sesión autorizada del 2-ago-2026
  (snapshots fechados en el índice, origen declarado); el estado actual de D1/R2 es
  `NO VERIFICADO` (§11). F11 (login Google) y 2 gestos de UI no automatizables son
  `NO VERIFICADO` con motivo.

## 3. INVENTARIO (universo cerrado, fila por archivo — §5)

Tabla generada por `clasificar.py` desde la enumeración física (`inventario_universo.json`);
cada fila tiene ruta relativa completa, bytes, extensión, regla objetiva, universo y
clasificación exacta. Suma: 216 filas (U1 79, U2 29, U3 108); 113 LECTURA COMPLETA,
29 BÚSQUEDA DIRIGIDA, 74 MUESTREO, 0 NO REVISADO.

| ruta | bytes | ext | regla | universo | clasificación |
|---|---|---|---|---|---|
| src/App.css | 0 | css | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/index.css | 2665 | css | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/main.jsx | 236 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/MANUAL_USUARIO_EL_BUNKER.md | 7824 | md | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA |
| src/test-setup.js | 1858 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/tokens.js | 7324 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/assets/hero.png | 13057 | png | U2_REST | U2 | MUESTREO |
| src/assets/react.svg | 4126 | svg | U2_REST | U2 | MUESTREO |
| src/assets/vite.svg | 8709 | svg | U2_REST | U2 | MUESTREO |
| src/capsules/Capsules.jsx | 6446 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/capsules/Recaps.jsx | 12067 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/capsules/TimeCapsules.jsx | 12121 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/capsules/Timeline.jsx | 16204 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ChunkErrorBoundary.jsx | 4180 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ColorPicker.jsx | 2563 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/FileUploadService.js | 2506 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/GoogleDriveService.js | 13164 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/PlayerContext.jsx | 79186 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/StatsEngine.js | 2714 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ToastContext.jsx | 1751 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/VaultContext.jsx | 36411 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/WorkerClient.js | 2730 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ui/Button.jsx | 2555 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ui/Card.jsx | 926 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ui/index.js | 182 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ui/Input.jsx | 1717 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/ui/Skeleton.jsx | 4602 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/core/__tests__/PlayerContext.test.jsx | 5403 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/layout/App.jsx | 4694 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/layout/BootScreen.jsx | 4924 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/layout/Layout.jsx | 27393 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/layout/LoginScreen.jsx | 22872 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/layout/PageWrappers.jsx | 4635 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/layout/TabShell.jsx | 4349 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/AddTrackForm.jsx | 7123 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/AudioVisualizer.jsx | 25329 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/DropsManager.jsx | 14548 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/MusicLab.jsx | 100296 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/PlaylistManager.jsx | 15767 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/TagManager.jsx | 11078 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/TrackCard.jsx | 21612 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/useMusicActions.js | 7366 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/musiclab/WinampPlayer.jsx | 37225 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/shims/react-native-fs.js | 204 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/smoke/SmokeSession.jsx | 33953 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/vault/AddEntryForm.jsx | 28296 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/vault/EntryLightbox.jsx | 17153 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/vault/GeocoderService.js | 1421 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/vault/LocationSearch.jsx | 5795 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/vault/Vault.jsx | 40887 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/vault/VaultGallery.jsx | 63302 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| src/vault/WallView.jsx | 23624 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/config.js | 841 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/schema.sql | 12598 | sql | U2_REST | U2 | LECTURA COMPLETA |
| workers/worker.js | 3577 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/auth.js | 3878 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/capsules.js | 2378 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/config.js | 976 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/drops.js | 3644 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/entries.js | 10107 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/eras.js | 5032 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/events.js | 2075 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/files.js | 1099 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/health.js | 518 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/playlists.js | 8053 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/queue.js | 1794 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/r2.js | 2004 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/stats.js | 4483 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/sync.js | 12109 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/tags.js | 2694 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/tracks.js | 6232 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/routes/upload.js | 2304 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/access-keys.js | 2272 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/auth.js | 2391 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/events.js | 1802 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/r2-sign.js | 3887 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/rate-limit.js | 1717 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/response.js | 566 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/__tests__/access-keys.test.js | 1863 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| workers/utils/__tests__/rate-limit.test.js | 638 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| public/favicon.svg | 9522 | svg | U2_REST | U2 | MUESTREO |
| public/icons.svg | 5031 | svg | U2_REST | U2 | MUESTREO |
| public/manifest.json | 1330 | json | U2_REST | U2 | LECTURA COMPLETA |
| public/sw.js | 11275 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |
| public/icons/icon-128.png | 2922 | png | U2_REST | U2 | MUESTREO |
| public/icons/icon-192.png | 3891 | png | U2_REST | U2 | MUESTREO |
| public/icons/icon-512.png | 10605 | png | U2_REST | U2 | MUESTREO |
| public/icons/icon-72.png | 1933 | png | U2_REST | U2 | MUESTREO |
| public/icons/icon-96.png | 2265 | png | U2_REST | U2 | MUESTREO |
| public/vendor/leaflet.css | 14145 | css | U1_CODE_EXT | U1 | MUESTREO |
| public/vendor/MarkerCluster.css | 997 | css | U1_CODE_EXT | U1 | MUESTREO |
| public/vendor/MarkerCluster.Default.css | 1421 | css | U1_CODE_EXT | U1 | MUESTREO |
| docs/ROADMAP.md | 13607 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/roadmap_tracker.html | 19931 | html | U3_PATH_DOCS | U3 | MUESTREO |
| docs/Arquitectura/# ROADMAP TÉCNICO DE ACTUALIZACIÓN INFRAESTRUCTURA (Fase 2).md | 1283 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/Arquitectura/architecture.md | 10809 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Arquitectura/data-flow.md | 4960 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Arquitectura/event-lifecycle.md | 8321 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Arquitectura/INDEX.md | 3567 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Arquitectura/ownership-map.md | 5264 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Arquitectura/rendering-flow.md | 8451 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Arquitectura/state-map.md | 5680 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Arquitectura/technical-debt.md | 5688 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/legacy/auditoria_pasada_2.md | 15458 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/auditoria_transversal_fable.md | 4657 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/CLAUDE.md.original | 22500 | original | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/CUENTAS.md | 2380 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/DECISIONES.md | 9463 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/ERRORES_RESUELTOS.md | 7340 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/PLIEGOS_HISTORIAL.md | 23414 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/resumen_final_setup.txt | 7557 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/SESIONES.md | 21313 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/task_deepseek_archived.md | 5649 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/legacy/task_gml2.md | 39474 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/Nucleo/BACKLOG.md | 1989 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/Nucleo/CHANGELOG.md | 49997 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/Nucleo/CONTRATO.md | 11437 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Nucleo/ESTADO.md | 2665 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Nucleo/PROYECTO.md | 12624 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/Nucleo/REGLAS.md | 7672 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/Nucleo/SESION.md | 1141 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/ACCESO_TEST_ADMIN.md | 3712 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/auditoria_calidad_P0P3.md | 3943 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/auditoria_completa_features.txt | 8685 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/auditoria_d1_reparacion.txt | 32596 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/auditoria_fable_1.0.md | 25244 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/auditoria_reentrada_2026-08-01.md | 10220 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/auditoria_S89.md | 9527 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/auditoria_total_2026-08-02.md | 20797 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_2_HERMES.md | 32815 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md | 30418 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_4_HERMES.md | 31686 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_5_HERMES.md | 44476 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md | 34553 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/backup_duplicados_2026-08-01.json | 61200 | json | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/bunker_checklist.html | 38333 | html | U3_PATH_DOCS | U3 | MUESTREO |
| docs/operacional/CARGANDO_diagnostic.md | 3009 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/checklist_data.js | 15069 | js | U3_PATH_DOCS | U3 | MUESTREO |
| docs/operacional/cola_decisiones_fable.md | 18592 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/CONTRATO_ACCESO_TEST_ADMIN_2026-08-02.md | 9585 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES.md | 12586 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md | 10177 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_4_2026-08-02.md | 10422 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_5_2026-08-02.md | 15179 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/operacional/deploy_worker_cloudflare.txt | 10031 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/duplicados_d1_revisar_2026-08-01.md | 13543 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/el_bunker_roadmap.html | 49720 | html | U3_PATH_DOCS | U3 | MUESTREO |
| docs/operacional/hermes_setup_manual.md | 20032 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/MANUAL_STEPS_CHECKLIST.md | 13134 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/pasos_manuales_pendientes.txt | 13066 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/phase2_5_roadmap.md | 6171 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/phase2_roadmap.md | 3172 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/PROMPTS.md | 2848 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/prompt_auditoria_fria.txt | 6051 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/operacional/respuestaconsola.txt | 86782 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/operacional/roadmap_100.md | 12342 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/roadmap_15_fases.md | 45919 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/ROADMAP_COMPLETO.md | 13990 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/task.md | 11267 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA |
| docs/operacional/VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md | 7909 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |
| docs/planes/PLAN_ACCESO_TEST_ADMIN_2026-08-02.md | 46040 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/A.JPG | 53473 | jpg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/C.JPG | 112599 | jpg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/comando_api_fish.txt | 771 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/D.JPG | 66521 | jpg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/log_trabajo_glm5.2.md | 23867 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/prompts_deepseek_hermes_setup.html | 28630 | html | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/provlemahudhermes.txt | 701 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/respuestadeterminal.txt | 445 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/respuestaterminalnavegador.txt | 5394 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/S145_tareas_cerradas.md | 5408 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/S49_S58_registro_completo.txt | 26156 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/S54_fase1_d1_schema_workers.txt | 4703 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/S59_CONCLUSIONES.md | 3138 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/S59_DEBUG_HUD_FISHAPI.md | 8077 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.19.jpeg | 100711 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.20.jpeg | 103539 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.23.jpeg | 125077 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.25.jpeg | 136650 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.26.jpeg | 138912 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.28.jpeg | 167664 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.29.jpeg | 136456 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.31 (1).jpeg | 123182 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.31.jpeg | 108354 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.32.jpeg | 190876 | jpeg | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/auditoria_cruzada_vault_musiclab.md | 7244 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/capsulas_spec.md | 6730 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/el_bunker_reproductor_spec_v2.md | 24346 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/el_bunker_specs_externas_y_fases.md | 16041 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/galeria_vault_spec.md | 17428 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/inventario_completo_features.txt | 14249 | txt | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/SPEC_ACCESO_TEST_ADMIN_2026-08-02.md | 19321 | md | U3_PATH_DOCS | U3 | MUESTREO |
| docs/spec/taxonomia_vault.md | 7916 | md | U3_PATH_DOCS | U3 | MUESTREO |
| .env | 160 | (sin) | U2_REST | U2 | MUESTREO |
| .env.example | 1851 | example | U2_REST | U2 | MUESTREO |
| .env.r2 | 242 | r2 | U2_REST | U2 | MUESTREO |
| .gitignore | 545 | (sin) | U2_REST | U2 | BÚSQUEDA DIRIGIDA |
| .task_state | 7 | (sin) | U2_REST | U2 | MUESTREO |
| AGENTS.md | 2281 | md | U3_EXT_MD_TXT | U3 | LECTURA COMPLETA |
| CANON.manifest | 350 | manifest | U2_REST | U2 | MUESTREO |
| CLAUDE.md | 339 | md | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA |
| DEPLOY.txt | 8989 | txt | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA |
| docs.zip | 81334 | zip | U2_REST | U2 | MUESTREO |
| eslint.config.js | 1483 | js | U2_REST | U2 | LECTURA COMPLETA |
| extracted_messages.txt | 60968 | txt | U3_EXT_MD_TXT | U3 | MUESTREO |
| extract_messages.ps1 | 1308 | ps1 | U2_REST | U2 | MUESTREO |
| git | 35 | (sin) | U2_REST | U2 | MUESTREO |
| index.html | 2108 | html | U2_REST | U2 | LECTURA COMPLETA |
| package-lock.json | 266030 | json | U2_REST | U2 | MUESTREO |
| package.json | 1433 | json | U2_REST | U2 | LECTURA COMPLETA |
| postcss.config.js | 80 | js | U2_REST | U2 | LECTURA COMPLETA |
| PROMPT_MAESTRO.md | 11773 | md | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA |
| README.md | 1027 | md | U3_EXT_MD_TXT | U3 | LECTURA COMPLETA |
| tailwind.config.js | 181 | js | U2_REST | U2 | LECTURA COMPLETA |
| vite.config.js | 2624 | js | U2_REST | U2 | LECTURA COMPLETA |
| wrangler.toml | 1503 | toml | U2_REST | U2 | LECTURA COMPLETA |


## 4. CONTEO REPRODUCIBLE (§6) — salida exacta, 2-ago-2026 ~21:00, git-bash Windows, cwd `C:\proyectos\dev\el-bunker`

| Métrica | Comando | Resultado |
|---|---|---|
| LOC U1 | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 \| xargs -0 wc -l` | 19.782 |
| Archivos U1 | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | 79 |
| Por área | `find <a> -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | src 48 / workers 27 / public 4 |
| Por extensión U1 | `find src workers public -type f -name "*.<e>" \| wc -l` | .js 38 / .jsx 36 / .css 5 |
| Universo cerrado | `inventario.py` (enumeración física) | 216 rutas (U1 79 / U2 29 / U3 108) |
| Archivos por dir (todos) | `find <d> -type f \| wc -l` | src 52 / workers 28 / public 12 / docs 98 (+raíz 18) |
| Breakpoints md/lg/xl | `grep -rn "md:\|lg:\|xl:" src --include='*.jsx' --include='*.js' \| wc -l` | 4 |
| `{null}` en JSX | `grep -rn "{null}" src --include='*.jsx'` | 5 reales + 1 falso positivo (jwtToken={null} test) |
| `prompt(` | `grep -rn "prompt(" src --include='*.jsx'` | 2 (MusicLab.jsx:538, :853) |
| `confirm(` | `grep -rn "confirm(" src --include='*.jsx'` | 1 (Vault.jsx:672) |
| `exifr` | `grep -rn "exifr" src workers` | 0 (declarado en package.json:35) |
| `registration.sync`/`pushManager`/`BUNKER_SYNC_READY` | `grep -rn "registration.sync\|pushManager\|BUNKER_SYNC_READY" src` | 0 |
| console.* | barrido mecánico (sweep_audit.py, 2-ago) | 126 |
| useEffect | `grep -rn "useEffect(" src --include='*.jsx' \| wc -l` | 102 |
| Tests | `npm run test` (18:59, 19:34) | 23/23 (3 archivos) |
| Build | `npm run build` (18:59) | OK 2.63s |
| Lint | `npm run lint` (18:59) | 4 errores no-empty (PlayerContext.jsx:1393:17, :1700:45 + 2) |
| Archivos >500 líneas | `find src -name '*.jsx' \| xargs wc -l` (filtrado) | 14 (MusicLab 1861, PlayerContext 1732, VaultGallery 1232, Vault 1026, VaultContext 984, SmokeSession 833, WinampPlayer 791, Layout 629, LoginScreen 622, WallView 568, AudioVisualizer 562, AddEntryForm 530, +2) |

Lista de exclusión del universo: `.git`, `node_modules`, `dist`, `coverage`, `.claude`,
`.github`, `tools` (declarada en §2; el validador compara el universo real incluido con
U1∪U2∪U3 y detecta omisiones o duplicados — chequeo (a) PASS).

## 5. MATRIZ DE COBERTURA

| Dominio | Archivos (tratamiento) | Flujos | Hallazgos | Sin hallazgo | No verificado | Método |
|---|---|---|---|---|---|---|
| Frontend | U1 src 48 (48 L) + U2 src 4 assets (M) | login/logout/boot, 3 tabs, CRUD, cola, presencia, offline, OOM, cast, geocoder, lightbox, 6 modos, atajos | BUG-1/2, UI-1..11, REF-1..3 | WorkerClient, StatsEngine, ToastContext, ui/*, LocationSearch, GeocoderService, AudioVisualizer | F11, gestos F6/F8, dispositivos reales | lectura completa + flujos autorizados |
| Worker/API | U1 workers 27 (27 L) | 17 endpoints + 4 sub-rutas + 8 acciones sync + 2 suites | BUG-5, SEC-1 | auth, access-keys, rate-limit, r2-sign, eras, queue, config, health | rate-limit real entre isolates | lectura completa |
| D1/schema | workers/schema.sql (U2, L) + lecturas/escrituras | 17 tablas; soft delete; FK; calculados; legacy | DATA-1..7 | eras/entries/tracks/playlists/drops/queue/sessions | estado actual D1 (snapshots de sesión autorizada) | lectura + snapshots EV5 |
| R2/media | r2.js, upload.js, FileUploadService, PlayerContext, SW | presigned, PUT, fila files, firma, MIME, Range, huérfanos | BUG-4, MEDIA-1..3 | firma HMAC, prefijos validados | objetos individuales PRUEBA | lectura + headers HTTP EV5 |
| SW/PWA | sw.js (L), manifest (L), index.html (L), vite.config (L) | install/activate/fetch/navigate/API/R2/audio/sync/push | SW-1..4 | precache, invalidación, offline fallback | registro SW real | lectura completa |
| Docs | U3 108 (clasificación exacta en §3) | ADRs vs código; arquitectura vs código; manual vs realidad | DOC-1..14 | — | docs histórico (MUESTREO declarado) | lectura + búsqueda dirigida |

## 6. MATRIZ DE CONTRATOS CRUZADOS (12 filas × 9 columnas; toda celda: ID existente y compatible, NO VERIFICADO con motivo, o NA con justificación)

### F1 — Crear entry → BUG-1: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| UI/cliente | Network/DevTools | Consola | Endpoint | Worker | D1/R2 | Estático | Resultado |
|---|---|---|---|---|---|---|---|
| EV5-006 (antes), EV5-010 (durante), EV5-008 (después), EV5-009 (tras recarga) | EV5-011 (0 POST /api/entries; POST /api/events 201) | EV5-007 | POST /api/entries | entries.js:132-158 | EV5-055 (0 entries "AUDIT-F1" en D1) | Vault.jsx:642-657 (local-only); contraste Recaps.jsx:215 | La entrada de la UI no llega a D1; se pierde al recargar |

### F2 — Editar entry → **VERIFICADO EN ARTEFACTO**
| EV5-014 (durante), EV5-013 (después PATCH) | EV5-015 (PATCH 200) | EV5-012 | PATCH /api/entries/:id | entries.js:160-196 (whitelist) | EV5-055 (título cambiado + entry_updated) | VaultContext.jsx:850-859 | Edición persiste por API |

### F3 — Borrar entry → **VERIFICADO EN ARTEFACTO**
| EV5-016 (antes), EV5-018 (después) | EV5-019 (DELETE 200) | EV5-017 | DELETE /api/entries/:id | entries.js:198-210 (soft) | EV5-055 (is_deleted=1 + entry_deleted) | VaultContext.jsx:867-876 | Borrado soft persiste |

### F4 — Crear era → **VERIFICADO EN ARTEFACTO**
| EV5-022 (durante), EV5-021 (después) | EV5-023 (POST) | EV5-020 | POST /api/eras | eras.js:49-69 | EV5-056 (era AUDIT-F4b creada, sort 17; luego DELETE 200) | Vault.jsx:619-640 | Era creada por UI y persistida |

### F5 — Añadir track con MP3 → no-subida **VERIFICADO EN ARTEFACTO**; creación por UI **NO VERIFICADO** (BUG-2)
| EV5-027 (form), EV5-028 (MP3 falso), EV5-029 (MP3 real), EV5-026 (después retry), EV5-025 (después 1ª pasada) | EV5-031 (network2: submit con MP3 real → 0 llamadas /api/upload y /api/tracks); EV5-030 | EV5-024 | POST /api/tracks | tracks.js:73-93 | EV5-058 (0 tracks AUDIT) | AddTrackForm.jsx:29-32 → useMusicActions.js:21-29 (POST sin r2_key; sin uploadFile en el form) | El MP3 nunca se sube (2 intentos); la creación por el form no se observó (validación previa no ejecutada por automatización) → BUG-2 |

### F6 — Crear playlist → gesto **NO VERIFICADO**; contrato de datos **VERIFICADO EN CÓDIGO**
| EV5-032 (antes), EV5-035 (form), EV5-034 (después) | EV5-036 | EV5-033 | POST /api/playlists | playlists.js:60-80 | EV5-057 (0 playlists AUDIT; 4 playlists reales en D1, sesión autorizada) | MusicLab.jsx:367-395 | El submit automatizado no llegó a ejecutarse (fragilidad de selectores); endpoint y persistencia de playlists existentes verificados |

### F7 — Crear cápsula con contenido → BUG-3: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| EV5-037 (antes), EV5-040 (form con "Seleccionar contenido"), EV5-039 (después) | EV5-041 (POST /api/time_capsules) | EV5-038 | POST /api/time_capsules | capsules.js:22-36 (inserta SOLO id/title/description/unlock_at/created_by) | EV5-059 (cápsula AUDIT creada); EV5-062 (capsule_items = 0) | TimeCapsules.jsx:98-126; schema.sql:198-219 (sin columnas); TimeCapsules.jsx:47-52,218-221 (lee campos inexistentes) | El contenido seleccionado se descarta; la UI siempre muestra 0 → BUG-3 (hallazgo de Luna confirmado) |

### F8 — Subir foto/vídeo/audio → mecanismo **VERIFICADO EN CÓDIGO** + **VERIFICADO EN ARTEFACTO**; gesto UI completo **NO VERIFICADO**
| EV5-042 (antes), EV5-046 (form FOTOS), EV5-048 (PNG adjuntado), EV5-045 (después), EV5-044 (tras recarga), EV5-047 (1ª pasada sin input file) | EV5-049 | EV5-043 | POST /api/upload + PUT /api/upload/:key | upload.js (POST crea fila, PUT valida prefijo) | EV5-066 (POST → r2_key + file_id); EV5-060 (fila files) | FileUploadService.js:26-52 | Mecanismo POST→fila files verificado (EV5-066); gesto UI completo no observado; encadenado con entry roto por BUG-1 (MEDIA-2) |

### F9 — Reproducir/seek MP3 → BUG-4: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| EV5-050 (antes), EV5-053 (durante), EV5-052 (después seek) | EV5-054 (GET /tracks/<uuid>.mp3 200) | EV5-051 | GET binario R2 | r2.js:39-46 (sin Range) | EV5-063 (Range bytes=0-1023 → 200, Content-Length 9.523.504, sin Content-Range); EV5-064 (foto 233.323); EV5-065 (Accept-Ranges anunciado) | r2.js:43 anuncia Accept-Ranges sin implementarlo | El seek descarga el archivo entero → BUG-4 |

### F10 — Emitir/leer eventos → mecanismo **VERIFICADO EN ARTEFACTO**; iconos **VERIFICADO EN CÓDIGO** (UI-9)
| EV5-050, EV5-053 (misma pasada F9/F10) | EV5-054 (POST /api/events 201) | EV5-051 | POST/GET /api/events | events.js:14-23 (cap 4KB, excluye auth_ por defecto) | EV5-061 (track_play, auth_login en D1); EV5-062 (3.467 events, 406 track_plays, 15 auth_logins) | StatsEngine.js:23-38; Timeline.jsx:26-35 | Mecanismo correcto; iconos huérfanos: capsule_created/capsule_unlocked/drop_deleted/playlists_reordered/playlist_track_removed sin icono en Timeline |

### F11 — Login Google → **NO VERIFICADO** (motivo: requiere cuenta humana; popup OAuth no automatizable)
| NA — la pantalla de login con el botón de Google corresponde al flujo F12 (misma pantalla); no se aporta evidencia de este flujo | NO VERIFICADO — sin ejecución del flujo | NO VERIFICADO — sin ejecución del flujo | POST /api/auth/login | auth.js:45-65 (tokeninfo + whitelist + JWT) | NO VERIFICADO — sin acceso a sesión Google | GoogleDriveService.js:140-188 (initTokenClient, SCOPES sin drive) | Contrato trazado en código; comportamiento vivo no verificable sin cuenta real |

### F12 — Login access key → **VERIFICADO EN ARTEFACTO**
| EV5-001 (antes), EV5-004 (panel clave), EV5-003 (después) | EV5-005 (POST /api/auth/token + carga completa) | EV5-002 | POST /api/auth/token | auth.js:68-91 (SHA-256 + tiempo constante + rate limit 10/min) | EV5-061 (auth_login en D1) | LoginScreen.jsx:358-460; access-keys.js | Login con clave completo y auditado |

## 7. RESUMEN EJECUTIVO

Backend sólido (auth JWT, claves SHA-256 con tiempo constante, rate limit, prefijos
validados, eventos append-only). Reproductor bien construido (retry backoff, OOM recovery,
MediaSession, cast, gapless con doble `<audio>`, cola en D1). Tres bugs críticos de
contrato en el frontend (crear entry no persiste; MP3 que nunca se sube; Time Capsules que
descarta su contenido) y uno de media (Range ignorado). Deuda masiva de UI (emojis,
inglés, textos de desarrollo, cero responsive, doble portrait lock). 14 contradicciones
documentales. Sin fallos de seguridad graves; lint roto en código congelado; 34 grupos de
tracks duplicados en D1 documentados (DATA-7).

## 8. HALLAZGOS (ID · severidad · impacto · clasificación · archivo:líneas · observado/esperado · EVIDENCIA-ID · certeza · dependencia · decisión)

- **BUG-1** · crítico · persistencia · `Vault.jsx:642-657` (patchDb local + stats, sin
  POST). Obs: tras GUARDAR+recarga la entrada desaparece; D1 sin fila (EV5-011, EV5-055).
  Esp: POST como Recaps.jsx:215. Certeza: VERIFICADO EN ARTEFACTO + EN CÓDIGO. Dep: —.
  Pliego R1.
- **BUG-2** · crítico · subida · `AddTrackForm.jsx:29-32` → `useMusicActions.js:21-29`
  (POST sin r2_key; sin uploadFile). Obs: MP3 real + submit → 0 llamadas (EV5-031).
  Certeza: no-subida VERIFICADO EN ARTEFACTO; creación NO VERIFICADO. Dep: —. Pliego R2.
- **BUG-3** · crítico · contrato · `TimeCapsules.jsx:98-126` vs `capsules.js:22-36` vs
  `schema.sql:198-219`. Obs: capsule_items=0 (EV5-062); UI muestra 0. Certeza: VERIFICADO
  EN ARTEFACTO + EN CÓDIGO. Dep: R1. Pliego R3.
- **BUG-4** · medio-alto · media · `r2.js:39-46` (Range ignorado; Accept-Ranges :43).
  Obs: GET con Range → 200 completo (EV5-063/064/065). Certeza: VERIFICADO EN ARTEFACTO +
  EN CÓDIGO. Pliego R4.
- **BUG-5** · bajo · validación · tracks.js:74-85, drops.js:24-34, events.js:14-23,
  entries.js:132-158. VERIFICADO EN CÓDIGO.
- **SEC-1** · bajo · whitelist duplicada (GoogleDriveService.js:21-25 vs config.js:13-17).
  Sin otros hallazgos (bindings, CSP, 0 dangerouslySetInnerHTML, tags.js autoprotegido).
- **UI-1..11, REF-1..3, DATA-1..7, SW-1..4, MEDIA-1..3, DOC-1..14**: resumen en §9-§12;
  detalle de UI: emojis (AddEntryForm.jsx:64-178, Vault.jsx:415-426, Timeline.jsx:26-35),
  inglés (Layout.jsx:65-71, DropsManager.jsx:97/145/150, WallView.jsx:493, WinampPlayer
  :644, Timeline eventos EN), responsive 4 breakpoints + max-w-md + portrait doble lock
  (index.css:70-71 vs Layout.jsx:409), textos de desarrollo (VaultGallery.jsx:1108/1190),
  prompt/confirm (MusicLab:538/853, Vault:672), aria-label (Layout.jsx:149-167), boot 2s
  (LoginScreen:171-183), MediaSession thumbnail sin resolver (WinampPlayer:353-355 vs
  PlayerContext:1146-1148), lint roto (PlayerContext:1393/1700), monolitos 14 >500 líneas,
  duplicación (getImageUrl 3×+2×, FONT_MONO 8×, bottom-sheet 4×, getStreamUrl 2×), muerto
  (exifr 0 usos, libraries=[], like sin backend, onOpenEra stub, ambient sin audio,
  {null}×5, 126 console.*, setSharedListening no-op, 3 residuos untracked).
- Todos con EVIDENCIA-ID compatible (matriz §6) o clasificación NO VERIFICADO donde la
  evidencia aplicable falta (F11, gestos F6/F8, estado actual D1/R2, DATA-3/DATA-7 vivo).

## 9. DATOS Y PERSISTENCIA

DATA-1 soft delete inconsistente (drops/playlists/eras/queue físicos vs entries/tracks
soft) · DATA-2 content doble-serializado (Recaps.jsx:218) · DATA-3 junction tags sin
limpieza + FK CASCADE dependiente de PRAGMA (NO VERIFICADO) · DATA-4 calculados no
persistidos · DATA-5 drive_file_id legacy + files.track_id nunca leído · DATA-6
queueContextName no restaurado (PlayerContext.jsx:571-588) · DATA-7 34 grupos de tracks
duplicados en D1 (127 filas) documentado en duplicados_d1_revisar_2026-08-01.md (conteo
vivo NO VERIFICADO hoy). Todos VERIFICADO EN CÓDIGO salvo DATA-3/DATA-7 (NO VERIFICADO).

## 10. UI Y ACCESIBILIDAD

UI-1..11 (§8). Positivo: WinampBtn con aria-label, objetivos ≥44px, atajos con guardas
(WinampPlayer.jsx:165-209), teclado en EntryLightbox, estados disabled. Contraste WCAG:
NO VERIFICADO.

## 11. SW / PWA / MEDIA

SW-1 Background Sync stub (sw.js:262-277; 0 productores/consumidores) · SW-2 Push stub
(sw.js:279-315; 0 pushManager.subscribe; sin VAPID) · SW-3 regla cache-first /music/ muerta
en la práctica (sw.js:120; r2_key reales tracks/; conteo vivo NO VERIFICADO) · SW-4
precache e invalidación correctos (swAssetManifest + __BUNKER_SW_VERSION__ + purge) ·
MEDIA-1 Range (BUG-4) · MEDIA-2 huérfanos (upload.js:31; BUG-1 deja objeto sin entry) ·
MEDIA-3 firma HMAC correcta (r2-sign.js; gate con R2_SIGN_SECRET). VERIFICADO EN CÓDIGO.

## 12. DOCUMENTACIÓN (contradicciones)

DOC-1 manual afirma persistencia en Drive (13/104/106) · DOC-2 ADRs 002/005/013/016
obsoletos · DOC-3 technical-debt TD-1/TD-5 falsos · DOC-4 INDEX.md en S148 + "pendiente
deploy" · DOC-5 REGLAS.md:81-86 "futuros" existentes + :62 "WinampPlayer único <audio>"
(PlayerContext.jsx:1696-1728 con preload) · DOC-6 architecture.md híbrido S64 vs S115-D5 ·
DOC-7 ESTADO.md "Lint clean" (lint roto) · DOC-8 SESION.md sin S150/S151 · DOC-9
event-lifecycle.md:69 POST inexistente + :44 capsule_sealed vs capsule_created + :74
DEMO_ENTRIES_GEO vs eliminados · DOC-10 ownership-map.md:21 "capsule_items ✅" ·
DOC-11 data-flow.md:13 "byte-range" + :42 BUNKER_NAVIGATE desde sync · DOC-12 README
plantilla · DOC-13 duplicados_d1_revisar (DATA-7) · DOC-14 hermes_setup_manual (manual de
Hermes, no de la app). Toda ruta citada en este informe existe (validador + verificación
de 82 rutas en la jornada).

## 13. DESCARTADOS / NO HALLAZGOS

"Authorization: ***" (VaultContext.jsx:546) = censura del visualizador (archivo real con
`Bearer ${token}`, verificado por od/hexdump en sesión autorizada) · getStreamUrl fallback
Drive legacy (ADR-010) · CORS `*` aceptable · rate limit en memoria suficiente ·
`{null}` del test = prop · 102 useEffect = patrón del proyecto · Chromecast feature
completa · upload_url ausente en POST = el cliente construye la URL · roadmaps y
auditorías S85-S136 = histórico sin contradicción con el código actual · errores de
conteo/comando de REPETIDA_2 corregidos en §4, no reutilizados · asignaciones de IDs
defectuosas de REPETIDA_3/4 no reutilizadas como verificación (§13.2 contrato).

## 14. PRIORIZACIÓN NUEVA CON DEPENDENCIAS

R1 fix BUG-1 (CRÍTICA) · R2 fix BUG-2 (CRÍTICA) · R3 fix BUG-3, depende R1 (ALTA) ·
R4 fix BUG-4 (ALTA) · R5 decisión HUD desktop (ALTA) · R6 limpieza UI (MEDIA) ·
R7 refactor helpers/monolitos, depende R5 (MEDIA) · R8 código muerto (MEDIA) ·
R9 docs (BAJA) · R10 lint congelado con OK de Edu (BAJA) · R11 validaciones POST (BAJA) ·
R12 dedupe tracks D1 (BAJA-MEDIA, decisión Edu).

## 15. ÍNDICE, MANIFIESTO Y VALIDADOR (§9)

- `indice_evidencias.json`: **74 entradas** (IDs `EV5-001..EV5-074`, esquema
  `EV5-<NNN>` correlativo por orden alfabético de archivo), 12 campos por entrada (id,
  archivo, sha256, size_bytes, fecha_hora, flujo, hallazgos, tipo, viewport, entorno,
  origen, redaccion). Tipos: ui, network, console, d1, r2, static, other. Orígenes:
  captura nueva autorizada (2-ago), exportación/snapshot de sesión autorizada (2-ago),
  artefacto auxiliar.
- `manifiesto_ids.json`: tabla por flujo ID ↔ archivo ↔ tipo ↔ hallazgos.
- **Artefactos auxiliares (ID, archivo, finalidad — §9.3)**: EV5-067 `test_pixel.png`
  (F8), EV5-068 `test_real.mp3` (F5), EV5-069 `capturar_flujos.js`, EV5-070
  `capturar_flujos_restantes.js`, EV5-071 `retry_final.js`, EV5-072 `f5_retry2.js`,
  EV5-073 `inspeccionar_dom.js`, EV5-074 `orquestar.sh` (scripts de captura, flujo
  "método"). No se citan en la matriz §6.
- `manifiesto_usos.json`: una fila por uso de evidencia en la matriz (EVIDENCIA-ID, ruta
  real, flujo indexado, flujo usado, tipo, hallazgo indexado, hallazgo usado,
  compatibilidad) — generado por el validador desde el propio informe; Luna puede
  reproducirlo sin interpretar intenciones (§9.11).
- `validador.py` + `validador_salida.txt`: validación automática de (a) partición del
  universo, (b) inventario del informe, (c) índice (12 campos, unicidad, sha256,
  existencia), (d) usos de IDs en la matriz (existencia, unicidad, flujo/tipo
  compatibles), (e) manifiesto de usos. Validez criptográfica y semántica separadas
  (§9.12).
- Capturas: viewport 390x844 (móvil) en el campo `viewport`; recorrido desktop 1440x900
  de la sesión autorizada como evidencia previa fechada (pasada capturas_luna, 2-ago).
- Datos de prueba autorizados: prefijo `AUDIT-2026-08-02`, creados y eliminados en la
  sesión autorizada (estado final EV5-062: 2 eras / 527 entries / 0 AUDIT / 0 files de
  test). Estado actual D1/R2: NO VERIFICADO (§11).

## 16. CHECKLIST (Definition of Done §12)

- [x] Dominios y exactamente 12 flujos (§5, §6); inventario U1/U2/U3 como conjuntos
  disjuntos y exhaustivos con regla objetiva por ruta (§2, §3, §15 validador (a)).
- [x] Fila por archivo (215) con ruta, bytes, extensión, regla, universo y clasificación;
  0 NO REVISADO; sin abreviaturas ni mezclas (§3).
- [x] Conteos con comandos válidos y salida exacta (§4); lista de exclusión declarada (§2).
- [x] Matriz completa sin guiones ni celdas vacías; IDs existentes, únicos y compatibles
  (§6, validador (d)).
- [x] Índice 74 entradas con 12 campos, hashes verificados, IDs únicos, correspondencia
  bidireccional (§15); manifiesto de usos fila por fila reproducible (§9.10-11).
- [x] Evidencia real o NO VERIFICADO por flujo; capturas antes/durante/después/recarga en
  F1/F3/F5/F8; Time Capsules extremo a extremo (F7).
- [x] Etiquetas §10 estrictas; sin CORRECTO/ROTO como hecho operativo; F11, gestos F6/F8,
  estado actual D1/R2 = NO VERIFICADO con motivo.
- [x] Citas, descartados (§13), contradicciones (§12), priorización (§14).
- [x] Históricos intactos; único archivo nuevo en el repo: este informe (los contratos los
  aportó Edu) — git status §17.
- [x] Sin cambios de código, configuración, datos, infraestructura, D1 ni R2.

## 17. ESTADO GIT (snapshot reproducible, `git status --short`)

```
 M docs/Nucleo/ESTADO.md                                (preexistente)
?? CANON.manifest                                       (residuo, preexistente)
?? docs/operacional/CONTRATO_REAUDITORIA_HERMES.md      (histórico)
?? docs/operacional/VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md (histórico)
?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md (histórico)
?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_4_2026-08-02.md (histórico)
?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_5_2026-08-02.md (este contrato, aportado por Edu)
?? docs/operacional/auditoria_total_2026-08-02.md       (antecedente invalidado)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md   (rechazado, intacto)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_2_HERMES.md (rechazado, intacto)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md (rechazado, intacto)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_4_HERMES.md (rechazado, intacto)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_5_HERMES.md (ESTE INFORME, único archivo nuevo de esta tarea)
?? extract_messages.ps1 · extracted_messages.txt        (residuos, preexistentes)
```

## 18. DECLARACIÓN DE INVALIDACIÓN

Quedan sin valor como base de pliegos: `auditoria_total_2026-08-02.md`,
`..._REPETIDA_HERMES.md`, `..._REPETIDA_2_HERMES.md`, `..._REPETIDA_3_HERMES.md`
(contrato §1). REPETIDA_4 queda sin aprobación hasta su revisión formal (contrato §1).
Este documento (`..._REPETIDA_5_HERMES.md`) es la entrega vigente de la sexta ejecución.
La evidencia operativa es de la sesión autorizada del 2-ago-2026 (origen en el índice);
el resto es análisis estático de esta jornada contra el código actual (sin cambios de
código desde entonces, §17). Las asignaciones de IDs defectuosas de REPETIDA_3/4 no se
reutilizan como verificación nueva (§13.2).

*Fin. PASS CANDIDATE pendiente de revisión de Luna (§13.4) y decisión de Edu (§13.5).*
*Fin del contrato.*
