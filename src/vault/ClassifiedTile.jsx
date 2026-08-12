// ============================================================
//  EL BÚNKER — ClassifiedTile.jsx
//  Tesela esmerilada con estética búnker para contenido clasificado
//  en Modo Visita (A5, diseño §3/§10.2).
//  El Worker (A3) nunca envía el original: el ítem llega en la forma
//  canónica { id, classified: true, blurhash, fecha, era }. Aquí se
//  pinta esa tesela: vidrio esmerilado + scanlines + esquinas de
//  peligro + candado SVG (sin emoji) + fecha y era.
//  Sin blurhash (A6 pendiente) se usa el patrón temático: degradación
//  aceptable según el diseño §10.2.
// ============================================================
import { FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";
import { Icon } from "../core/ui";
import { resolveEntryDate } from "./VaultHelpers";

// ─── TOKENS LOCALES ──────────────────────────────────────────
const HAZARD = "#ff3b3b"; // rojo búnker: lo censurado (mismo semántico que RED)

const fmtDate = (ts) => {
  if (!ts || Number.isNaN(new Date(ts).getTime())) return null;
  return new Date(ts).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─── TESELA ──────────────────────────────────────────────────
/**
 * ClassifiedTile
 * Props:
 *   entry       — forma saneada { id, classified, blurhash, fecha, era }
 *   era         — objeto era (para color/nombre) | null
 *   size        — "tile" (masonry, por defecto) | "mini" | "large" | "cinema"
 *   accentColor — acento fallback (era sin color)
 */
export default function ClassifiedTile({ entry, era = null, size = "tile", accentColor = "#bfff00" }) {
  const eraColor = era?.color ?? accentColor;
  const dateStr = fmtDate(resolveEntryDate(entry));
  const showMeta = size !== "mini";

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: "rgba(5,5,5,0.92)",
        fontFamily: FONT_MONO,
        minHeight: size === "mini" ? undefined : size === "large" ? 280 : 120,
      }}
      aria-label={size === "mini" ? "Contenido clasificado" : undefined}
      role={size === "mini" ? "img" : undefined}
    >
      {/* Vidrio esmerilado: rejilla + scanlines → aspecto "borroso" real */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(191,255,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(191,255,0,0.05) 1px, transparent 1px),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 4px)
          `,
          backgroundSize: size === "mini" ? "16px 16px, 16px 16px, 100% 100%" : "24px 24px, 24px 24px, 100% 100%",
          filter: "blur(1.2px)",
        }}
      />
      {/* Brillo ambiental de la era (sutil, sin información del contenido) */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 30%, ${eraColor}12 0%, transparent 70%)`,
        }}
      />

      {/* Esquinas de peligro (candado rojo, estética búnker) */}
      <span aria-hidden="true" className="absolute top-1.5 left-1.5 w-3 h-3" style={{ borderTop: `2px solid ${HAZARD}`, borderLeft: `2px solid ${HAZARD}`, opacity: 0.75 }} />
      <span aria-hidden="true" className="absolute top-1.5 right-1.5 w-3 h-3" style={{ borderTop: `2px solid ${HAZARD}`, borderRight: `2px solid ${HAZARD}`, opacity: 0.75 }} />
      <span aria-hidden="true" className="absolute bottom-1.5 left-1.5 w-3 h-3" style={{ borderBottom: `2px solid ${HAZARD}`, borderLeft: `2px solid ${HAZARD}`, opacity: 0.75 }} />
      <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 w-3 h-3" style={{ borderBottom: `2px solid ${HAZARD}`, borderRight: `2px solid ${HAZARD}`, opacity: 0.75 }} />

      {/* Centro: candado + etiqueta (SVG, sin emoji) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center"
        style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}
      >
        <Icon name="lock" size={size === "mini" ? 14 : size === "large" ? 34 : 20} decorative />
        {showMeta && (
          <span
            className="text-[9px] tracking-[0.3em] uppercase font-bold"
            style={{ color: HAZARD, textShadow: `0 0 8px ${HAZARD}66` }}
          >
            CLASIFICADO
          </span>
        )}
      </div>

      {/* Meta inferior: fecha + era (solo en teselas con espacio) */}
      {showMeta && (dateStr || era) && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-2 pb-1.5 pt-4"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }}
        >
          {dateStr ? (
            <span className="text-[8px] tracking-wider uppercase opacity-70" style={{ color: eraColor }}>
              {dateStr}
            </span>
          ) : <span />}
          {era && (
            <span className="flex items-center gap-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: eraColor, boxShadow: `0 0 4px ${eraColor}` }} />
              <span className="text-[8px] truncate uppercase tracking-wider opacity-60" style={{ color: eraColor }}>
                {era.name}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
