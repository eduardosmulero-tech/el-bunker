# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 40 líneas. UN bug activo.
> Actualizar antes de cerrar sesión. Bugs en espera → BACKLOG.md.

---

## SESIÓN ACTUAL
**Número:** S43
**Próximo pliego:** PLIEGO-177

---

## BUG ACTIVO — BORDES-01

**Descripción:** Bordes y sombras de los botones de tag en VibeTagBar se cortan verticalmente.
**Archivo:** `src/musiclab/TrackCard.jsx`
**Causa raíz:** `overflowX: "auto"` en el div scroll también corta el eje Y. Se necesita `overflowY: "visible"` pero CSS no permite overflow-x: auto + overflow-y: visible simultáneamente — el browser fuerza ambos a auto.
**Alternativa confirmada:** Cambiar `border` de los botones por `outline` (outline no se ve afectado por overflow).
**Pliegos fallados:** P-164 (paddingBottom no era suficiente), P-165 (SEARCH no coincidió — nunca aplicado)
**Pendiente:** Generar P-166 con el SEARCH correcto usando Get-Content primero.
**Bloquea:** Nada crítico. Cosmético.

---

## SCROLL-01 — RESUELTO en S43

Causa raíz identificada con DevTools: framer-motion registraba listeners touch
que llamaban preventDefault() en touchstart, bloqueando el scroll nativo.
Fix: P-163 (motion.button → button en tags de VibeTagBar). Confirmado en Android.
P-161 (restructura position:relative) también contribuyó.

## TAG-01 — RESUELTO en S42 (P-152)

TagManager.jsx tiene useRef importado, emptyForm() como función, sin IconPicker.

---

## DECISIÓN PENDIENTE

**D1-CLOUDFLARE** — Cloudflare D1 como capa de datos rápida.
Habilita SC1–SC14, S1/S2, STAT-M9. No bloquea Fase A actual.

---

## CIERRE DE SESIÓN — checklist
- [ ] BORDES-01 resuelto y commit hecho
- [ ] Esta sección actualizada con resultado
- [ ] Bugs nuevos detectados → añadir a BACKLOG.md
- [ ] Próximo bug activo seleccionado de BACKLOG.md
