// ============================================================
//  EL BÚNKER — tokens.js
//  Design Tokens · Fuente única de verdad para color y tipografía
//  Todos los componentes nuevos importan desde aquí.
//  Los existentes migran cuando se toquen por otra razón.
// ============================================================

// ─── CORE COLORS ─────────────────────────────────────────────
export const ACID   = "#bfff00";
export const PURPLE = "#bf00ff";
export const RED    = "#ff3b3b";
export const ORANGE = "#ff6b35";
export const BG     = "#050505";

// ─── TYPOGRAPHY ──────────────────────────────────────────────
export const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

// ─── GLASS SURFACES ──────────────────────────────────────────
export const GLASS_BG      = "rgba(191,255,0,0.03)";
export const GLASS_BORDER  = "rgba(191,255,0,0.12)";
export const PURPLE_BG     = "rgba(191,0,255,0.04)";
export const PURPLE_BORDER = "rgba(191,0,255,0.2)";

// ─── VIBE PALETTE BUILDER ─────────────────────────────────────
// Deriva 6 tokens de color desde un hex semilla.
// Base siempre oscura (VB12). Contraste garantizado (VB10).
// H = hue extraído del hex semilla. S y L fijados por rol.
export const buildPalette = (hex) => {
  // hex → r,g,b
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d   = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const hDeg = Math.round(h * 360);
  const hsl = (hue, sat, lig) => `hsl(${hue}, ${sat}%, ${lig}%)`;
  return {
    // acento: color vivo, alta saturación, luminosidad media-alta
    accent:    hsl(hDeg, 90, 60),
    // primario: versión algo más apagada del acento
    primary:   hsl(hDeg, 80, 50),
    // texto: claro, desaturado, legible sobre fondos oscuros
    text:      hsl(hDeg, 60, 85),
    // fondo: casi negro con tinte del hue (VB12 — base siempre oscura)
    background:hsl(hDeg, 15,  6),
    // superficie: ligeramente más claro que fondo para capas
    surface:   hsl(hDeg, 12, 10),
    // borde: visible pero sutil
    border:    hsl(hDeg, 40, 20),
  };
};

// ─── VIBE TAGS CANÓNICOS ──────────────────────────────────────
// Fuente única de verdad para tags de vibe (VB1, VB2).
// "all" NO está aquí — es filtro de UI, no tag real (VB2).
// Cada tag tiene: id, label, icon, seedColor (hex), palette (6 tokens).
// seedColor es el color base elegido por el usuario.
// Para personalizar: cambiar seedColor → palette se recalcula.
export const VIBE_TAGS = [
  {
    id:        "gaming",
    label:     "GAMING",
    icon:      "◉",
    seedColor: "#00ffcc",
    palette:   buildPalette("#00ffcc"),
  },
  {
    id:        "420_chill",
    label:     "420",
    icon:      "◎",
    seedColor: "#aaff44",
    palette:   buildPalette("#aaff44"),
  },
  {
    id:        "dnb",
    label:     "DnB",
    icon:      "⚡",
    seedColor: "#ff6b35",
    palette:   buildPalette("#ff6b35"),
  },
  {
    id:        "romantiqueo",
    label:     "♥",
    icon:      "♥",
    seedColor: "#bf00ff",
    palette:   buildPalette("#bf00ff"),
  },
];

// ─── FILTER TAGS (UI solamente) ───────────────────────────────
// Para VibeTagBar y libraryFilter. Incluye "all" al frente.
// "all" tiene color base ACID — es UI, no vibe (VB2).
// Componentes de filtro importan esto, no VIBE_TAGS.
export const FILTER_TAGS = [
  { id: "all", label: "ALL", icon: "◈", seedColor: "#bfff00", palette: buildPalette("#bfff00") },
  ...VIBE_TAGS,
];

// ─── HELPER: resolver config de un tag por id ─────────────────
// Usado por WinampPlayer, TrackCard, PlayerContext.
// Si el id no existe, devuelve el primer tag real (no "all").
export const getVibeConfig = (tagId) =>
  VIBE_TAGS.find((v) => v.id === tagId) ?? VIBE_TAGS[0];

// ─── HELPER: color de acento por tag id ──────────────────────
// Atajo para PlayerContext y cualquier uso que solo necesite el acento.
export const getVibeAccent = (tagId) =>
  getVibeConfig(tagId).palette.accent;
