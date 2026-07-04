# 🔴 S145 — El fix del grid centró el corazón pero descentró el tag de vibe (regresión)

> **Estado:** 🔴 Reabierta 2026-07-05. El cambio de flexbox a CSS grid en el Title Bar de
> `WinampPlayer.jsx` centró bien el corazón, pero rompió la alineación a la derecha del cluster
> derecho (botón CAST + badge de vibe). Sonnet ya encontró la causa exacta leyendo el código —
> es un fix de una línea, no hace falta re-investigar.
> **Contrato:** editar código directamente. Nunca pliego.
> **Verificación:** Sonnet revisa con grep puntual + build.

## Causa exacta (confirmada, no re-investigar)

`src/musiclab/WinampPlayer.jsx:401-407`: el Title Bar es ahora `display: grid` con
`gridTemplateColumns: "1fr auto 1fr"`. El div del cluster derecho (línea 560,
`<div className="flex gap-2">`, contiene el botón CAST condicional + el badge de vibe) es hijo
directo de ese grid, así que por el `justify-items: stretch` por defecto de CSS Grid, ese div
se estira para ocupar TODO el ancho de su columna `1fr`. Como el div es `flex` sin
`justify-content`, su contenido (flex-start por defecto) queda pegado al borde IZQUIERDO de esa
columna ya estirada — que está en algún punto del centro-derecha de la barra, no en el borde
derecho real. Por eso Edu ve el badge "centrado" en vez de pegado a la derecha.

El cluster izquierdo (línea 409, `<div className="flex items-center gap-2">`) no tiene este
problema porque `justify-content: flex-start` (default) ya coincide con pegarse al borde
izquierdo, que es donde debe estar.

## Fix (una línea)

En `src/musiclab/WinampPlayer.jsx:560`, cambiar:
```
<div className="flex gap-2">
```
por:
```
<div className="flex gap-2 justify-end">
```

Eso empuja el contenido del cluster derecho (CAST + badge) al borde derecho real de su columna
estirada, que coincide con el borde derecho de la barra completa.

## Restricciones

- Solo ese cambio. No toques el grid del corazón (ya está bien) ni el cluster izquierdo.
- `npm run build` debe pasar antes de reportar hecho.
- Antes de reportar hecho, confirma tú mismo (leyendo el archivo) que el cambio quedó aplicado
  exactamente como se describe arriba.

## Hand-off a Sonnet

Confirma la línea final del archivo tras el cambio. Sonnet verifica con grep puntual.
