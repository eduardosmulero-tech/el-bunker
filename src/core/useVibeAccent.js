// ============================================================
//  EL BÚNKER — useVibeAccent.js
//  Fuente única del acento vivo (ley del vibe, ADR-011 / VB8).
//  Cualquier componente que pinte chrome con el acento lo toma de
//  aquí en vez de usar ACID literal — ACID solo es el color base
//  cuando NO hay track activo (VB8), nunca un verde permanente
//  junto a un vibe naranja (hallazgo t_ff9881d1).
// ============================================================

import { usePlayer } from "./PlayerContext";
import { ACID } from "../tokens";

export function useVibeAccent() {
  const { trackVibe, resolveVibeAccent } = usePlayer();
  return (trackVibe ? resolveVibeAccent(trackVibe) : null) ?? ACID;
}
