// src/core/playerMath.js
// Matemáticas del reproductor — portadas del audit fastpotify (MIT, solo
// conceptos, cero código copiado) y adaptadas al búnker.
//
// 1) Curva de volumen perceptual. fastpotify sustituye la ganancia lineal por
//    una curva de potencia porque la lineal desperdicia la mitad baja del
//    slider (su análisis: lineal = −6 dB en el centro, cúbica ≈ −16 dB, y el
//    oído percibe logarítmico). Aquí portamos el mismo principio con
//    ganancia = (slider/100)²: −12 dB en el centro, control fino en la zona
//    baja y remate fuerte arriba. HTMLMediaElement.volume es ganancia lineal,
//    así que toda la percepción la aporta esta curva.
//
// 2) Umbral de escucha real. Spotify cuenta un play tras 30 s, o la mitad de
//    tracks más cortos (mínimo 1 s). Así los skips no inflan historial ni
//    stats. fastpotify lo aplica a su historial local; el búnker lo aplica al
//    registro honesto de plays (stats engine único, tabla events en D1).
//
// Funciones puras, cero DOM — testeables sin jsdom.

/**
 * Convierte un valor de slider [0..100] a ganancia [0..1] con curva perceptual.
 * @param {number} slider 0..100 (acepta decimales; valores fuera se clampan)
 * @returns {number} 0..1 — asignar directo a HTMLMediaElement.volume
 */
export function gananciaVolumen(slider) {
  const t = Math.min(100, Math.max(0, Number(slider) || 0)) / 100;
  return t * t;
}

/**
 * Inversa de gananciaVolumen: de ganancia [0..1] del elemento a slider [0..100].
 * Necesaria para leer el <audio>: p.ej. BUG-22 (volumechange de botones físicos
 * Android) reconstruye el slider a partir de audio.volume.
 * @param {number} ganancia 0..1
 * @returns {number} 0..100 entero
 */
export function sliderDesdeGanancia(ganancia) {
  const g = Math.min(1, Math.max(0, Number(ganancia) || 0));
  return Math.round(Math.sqrt(g) * 100);
}

/**
 * Segundos de escucha necesarios para que un play cuente como escucha real.
 * @param {number} duracionSeg duración del track en segundos (0/desconocida → 30)
 * @returns {number} segundos
 */
export function umbralEscucha(duracionSeg) {
  const dur = Number(duracionSeg) || 0;
  if (dur <= 0) return 30;
  return Math.max(1, Math.min(30, dur / 2));
}
