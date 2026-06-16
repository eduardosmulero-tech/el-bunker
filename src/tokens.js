// ============================================================
//  EL BÚNKER — tokens.js
//  Design Tokens · Fuente única de verdad para color y tipografía
//  Todos los componentes nuevos importan desde aquí.
//  Los existentes migran cuando se toquen por otra razón.
// ============================================================

// ─── CORE COLORS ─────────────────────────────────────────────
export const ACID   = "#bfff00";
export const PURPLE = "#d966ff";
export const RED    = "#ff3b3b";
export const ORANGE = "#ff6b35";
export const BG     = "#050505";

// ─── INFRASTRUCTURE URLS (fuente única de verdad) ───────────
// S121: Unificado a el-bunker-api (tiene binding R2 verificado en wrangler.toml).
// R2 se sirve desde el-bunker-api (tiene binding R2 verificado en wrangler.toml).
// El antiguo el-bunker-r2-proxy fue eliminado — ya no se usa.
export const R2_PUBLIC_BASE = "https://el-bunker-api.thebunker-admin.workers.dev";

// ─── TYPOGRAPHY ──────────────────────────────────────────────
export const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

// ─── GLASS SURFACES ──────────────────────────────────────────
export const GLASS_BG      = "rgba(191,255,0,0.03)";
export const GLASS_BORDER  = "rgba(191,255,0,0.12)";
export const PURPLE_BG     = "rgba(217,102,255,0.04)";
export const PURPLE_BORDER = "rgba(217,102,255,0.2)";

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
    namespace: "music",
    seedColor: "#00ffcc",
    palette:   buildPalette("#00ffcc"),
  },
  {
    id:        "420_chill",
    label:     "420",
    icon:      "◎",
    namespace: "music",
    seedColor: "#aaff44",
    palette:   buildPalette("#aaff44"),
  },
  {
    id:        "dnb",
    label:     "DnB",
    icon:      "⚡",
    namespace: "music",
    seedColor: "#ff6b35",
    palette:   buildPalette("#ff6b35"),
  },
  {
    id:        "romantiqueo",
    label:     "♥",
    icon:      "♥",
    namespace: "music",
    seedColor: "#d966ff",
    palette:   buildPalette("#d966ff"),
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

// ─── Fase 4.3 — VB10: Contraste algorítmico WCAG ──────────
// Calcula ratio de contraste entre dos colores hex.
// Ajusta luminosidad del texto si ratio < 4.5:1 (AA normal).
export const ensureContrast = (textHex, bgHex = "#050505") => {
  const hexToRgb = (h) => ({
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  });
  const luminance = ({ r, g, b }) => {
    const nl = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * nl(r) + 0.7152 * nl(g) + 0.0722 * nl(b);
  };
  const ratio = (l1, l2) => {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };
  const textLum = luminance(hexToRgb(textHex));
  const bgLum = luminance(hexToRgb(bgHex));
  const cr = ratio(textLum, bgLum);
  if (cr >= 4.5) return textHex;
  // Ajustar: si el fondo es oscuro, aclarar texto; si claro, oscurecer
  const adjust = (ch) => bgLum < 0.5 ? Math.min(255, ch + 40) : Math.max(0, ch - 40);
  const rgb = hexToRgb(textHex);
  return `#${adjust(rgb.r).toString(16).padStart(2, "0")}${adjust(rgb.g).toString(16).padStart(2, "0")}${adjust(rgb.b).toString(16).padStart(2, "0")}`;
};

// ─── UTIL: hash string → color HSL consistente ──────────────
// Usado para tags huérfanos (en tracks pero no en DB de tags).
// Mismo input → mismo output siempre. Saturación al 55% para legibilidad.
export const stringToColor = (str) => {
  if (!str) return "#555555";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
};
