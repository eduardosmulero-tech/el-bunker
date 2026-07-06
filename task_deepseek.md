# task_deepseek.md — encargo activo (turno: deepseek)

## RONDA 5 — YA NO MÁS TEORÍAS. INSTRUMENTAR Y MEDIR.

Historial verificado (no especulación, `git log`/`git show`):
1. `7093187`: versión original — `position: absolute; right: 0` sobre contenedor `relative`,
   SIN portal. Funcionaba ("el menú se veía al principio", confirmado por Edu).
2. Se migró a `createPortal(document.body) + position: fixed` porque un ancestro con
   `motion.div animate={{x:0}}` (el tab "tracks") rompía clipping/posición (razón dada en el
   propio commit).
3. `898b9f9` (R4): boundary-detection clamps (`left`/`top` acotados a innerWidth/innerHeight).
4. `5e30272`: fix de race condition en el toggle + `overflow-x-auto` en el toolbar (esto sí
   arregló el toolbar — confirmado por Edu).
5. Ronda de hoy: quitado `AnimatePresence`.

Cada ronda "arregló" una teoría distinta y NINGUNA se verificó con datos reales del dispositivo
de Edu. Sigue fallando (confirmado: el botón da feedback de tap, el menú nunca aparece). Edu ya
dijo explícitamente: no más teorías. Así que esta ronda NO es "prueba otro fix" — es instrumentar
para obtener evidencia real antes de tocar nada más.

## Tarea única de esta ronda

En el `onClick` del botón de sort (`MusicLab.jsx:1120-1135`), **inmediatamente después** de
calcular `top`/`left` y antes/junto a `setShowSortMenu(true)`, añade una llamada temporal a
`showToast` (ya está disponible en el scope del componente, se usa en todo el archivo, ej. línea
173) que muestre los valores reales calculados, algo como:

```js
showToast({ msg: `pos:${Math.round(left)},${Math.round(top)} vw:${window.innerWidth}x${window.innerHeight} ref:${!!sortMenuRef.current}` }, 4000);
```

También añade un log/toast equivalente si `sortMenuRef.current` es falsy en el momento del click
(rama que hoy no hace nada visible — confirma si esa rama se está colando).

No toques nada más: ni el AnimatePresence, ni el toolbar, ni la lógica de toggle. Solo instrumenta.

## Entregable
- `npm run build` limpio.
- El toast debe dispararse de forma fiable cada vez que se pulsa el botón (abriendo o no).

## Qué hace Edu después (no es parte de tu tarea, es el siguiente paso)
Edu pulsa el botón en el móvil, lee el toast con los números reales, y los reporta. Con esos
datos reales (¿el ref existe? ¿los valores de pos están dentro de rango de pantalla? ¿vw/vh son
razonables?) se decide el fix real — no antes.

## Restricciones
- Cambio mínimo y quirúrgico: solo añadir la instrumentación, cero refactor.
- No quitar el toast hasta que Edu confirme que ya reportó los datos (así no hay que repetir la
  ronda si hace falta releer valores).
