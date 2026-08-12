// ============================================================
//  EL BÚNKER — WallView.jsx
//  Fase 1: WALL virtualizado con IntersectionObserver +
//  pinch-to-zoom densidad + badges contexto + stagger animations
//  VB9: vibe-accent propagation via accentColor prop
//  FASE C.2.2 (veredicto V2 Fable S147): WALL como museo —
//  el masonry se agrupa en "salas" por era con headers curatoriales
//  (nombre + rango de fechas + color + contador). La virtualización
//  se preserva: el agrupado se hace ANTES de la ventana de render
//  (useMemo estable), cada WallItem sigue con su IntersectionObserver.
//  "Sin era" → divisor sutil, no sala completa (las eras son las salas).
// ============================================================
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";
import { Icon } from "../core/ui";
import { CATEGORY_FILTERS } from "./AddEntryForm";
import { ENTRY_CATEGORY, getImageUrl } from "./VaultHelpers";

// ─── CONSTANTS ──────────────────────────────────────────────
const LONG_PRESS_MS = 500;
const PINCH_THRESHOLD = 60;
const OBSERVER_MARGIN = "400px";

const CAT_LABEL = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.label]));
const CAT_ICON  = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.icon]));

const DENSITY_CONFIG = {
  compact:  { columns: 4, gap: 6,  minCol: "100px", label: "COMPACT", intrinsicH: 120 },
  normal:   { columns: 3, gap: 8,  minCol: "140px", label: "NORMAL",  intrinsicH: 180 },
  expanded: { columns: 2, gap: 10, minCol: "220px", label: "EXPANDED", intrinsicH: 280 },
};

const DENSITY_ORDER = ["compact", "normal", "expanded"];

// ─── UTILITIES ──────────────────────────────────────────────
const buildMasonryColumns = (items, columnCount) => {
  const columns = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => {
    columns[i % columnCount].push(item);
  });
  return columns;
};

// FASE C.2.2 — Helper: rango de fechas de un grupo de entries (event_date > created_at).
const computeDateRange = (eraEntries) => {
  const ts = eraEntries
    .map((e) => e.content?.event_date || e.created_at)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !isNaN(t));
  if (!ts.length) return null;
  return { min: Math.min(...ts), max: Math.max(...ts) };
};

const fmtMonthYear = (ts) =>
  new Date(ts).toLocaleDateString("es-ES", { month: "short", year: "numeric" }).replace(".", "");

// FASE C.2.2 — Helper: agrupa entries por era_id en orden de `eras`, "sin era" al final.
// Devuelve [{ eraId, era, eraEntries, isSinEra, startIndex, dateRange, vibeCount }] —
// startIndex acumulado para que el stagger animation global no se resetee entre salas;
// dateRange y vibeCount pre-calculados aquí (no en cada render del header) para evitar
// recompute O(n) en cada pintada.
const groupEntriesByEra = (entries, eras) => {
  const groups = [];
  let startIndex = 0;
  const eraOrder = eras.map((e) => e.id);
  const byEra = new Map();
  const sinEra = [];
  for (const entry of entries) {
    if (entry.era_id && eraOrder.includes(entry.era_id)) {
      if (!byEra.has(entry.era_id)) byEra.set(entry.era_id, []);
      byEra.get(entry.era_id).push(entry);
    } else {
      sinEra.push(entry);
    }
  }
  const buildGroup = (eraId, era, eraEntries, isSinEra) => {
    const dateRange = computeDateRange(eraEntries);
    const vibeCount = new Set();
    for (const e of eraEntries) vibeCount.add(e.tag || "otros");
    const group = { eraId, era, eraEntries, isSinEra, startIndex, dateRange, vibeCount: vibeCount.size };
    startIndex += eraEntries.length;
    return group;
  };
  for (const eraId of eraOrder) {
    const eraEntries = byEra.get(eraId);
    if (!eraEntries || !eraEntries.length) continue;
    groups.push(buildGroup(eraId, eras.find((e) => e.id === eraId), eraEntries, false));
  }
  if (sinEra.length) {
    groups.push(buildGroup("_sin_era", null, sinEra, true));
  }
  return groups;
};

// ─── ERA SECTION HEADER (FASE C.2.2 — "sala" curatorial) ────
// dateRange y vibeCount vienen pre-calculados en `group` (no se recomputan por render).
const EraSectionHeader = ({ era, eraEntries, dateRange, vibeCount, accentColor = ACID }) => {
  const eraColor = era?.color ?? accentColor;
  const eraName = era?.name ?? "Sin Era";
  const dateLabel = dateRange      ? dateRange.min === dateRange.max
        ? fmtMonthYear(dateRange.min)
        : <>{fmtMonthYear(dateRange.min)} <Icon name="arrowRight" size={11} decorative /> {fmtMonthYear(dateRange.max)}</>
      : "";
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 pl-3 pr-2 py-3 min-h-[56px] rounded-sm"
      style={{
        borderLeft: `4px solid ${eraColor}`,
        background: `${eraColor}06`,
        fontFamily: FONT_MONO,
      }}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: eraColor, boxShadow: `0 0 6px ${eraColor}` }}
            title={eraName}
          />
          <span
            className="text-sm font-bold tracking-wide truncate xl:line-clamp-2 xl:whitespace-normal"
            style={{ color: eraColor, textShadow: `0 0 10px ${eraColor}44` }}
          >
            {eraName}
          </span>
        </div>
        {dateLabel && (
          <span className="text-[10px] opacity-50 mt-0.5 tracking-wider" style={{ color: eraColor }}>
            {dateLabel}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] opacity-60 tabular-nums" style={{ color: eraColor }}>
          {eraEntries.length} {eraEntries.length === 1 ? "pieza" : "piezas"}
        </span>
        <span className="text-[9px] opacity-40 tabular-nums" style={{ color: eraColor }}>
          {vibeCount} {vibeCount === 1 ? "vibe" : "vibes"}
        </span>
      </div>
    </motion.div>
  );
};

// FASE C.2.2 — Divisor sutil para entries sin era (no es una sala).
const SinEraDivider = ({ accentColor = ACID, count }) => (
  <div className="flex items-center gap-2 py-2" style={{ fontFamily: FONT_MONO }}>
    <div className="flex-1 h-px" style={{ background: `${accentColor}22` }} />
    <span className="text-[9px] tracking-[0.3em] uppercase opacity-30" style={{ color: accentColor }}>
      sin era · {count}
    </span>
    <div className="flex-1 h-px" style={{ background: `${accentColor}22` }} />
  </div>
);

// ─── WALL ITEM (virtualized) ────────────────────────────────
const WallItem = ({ entry, era, density, index, onLongPress, onTap, accentColor = ACID }) => {
  const imgUrl = getImageUrl(entry);
  const longPressTimer = useRef(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef(null);

  const config = DENSITY_CONFIG[density] || DENSITY_CONFIG.normal;

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([obs]) => {
        if (obs.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: OBSERVER_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onPointerDown = useCallback(() => {
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      onLongPress?.(entry);
    }, LONG_PRESS_MS);
  }, [entry, onLongPress]);

  const onPointerUp = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      onTap?.(entry);
    }
  }, [entry, onTap]);

  const onPointerLeave = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const whoColor = entry.from_user === "edu" ? accentColor : entry.from_user === "david" ? PURPLE : `${accentColor}66`;
  const whoInitial = entry.from_user === "edu" ? "E" : entry.from_user === "david" ? "D" : "";
  const ac = accentColor;

  return (
    <div
      ref={itemRef}
      style={{ minHeight: config.intrinsicH, containIntrinsicSize: `auto ${config.intrinsicH}px`, contentVisibility: "auto" }}
    >
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.03, 0.6), duration: 0.35, ease: "easeOut" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          onPointerCancel={onPointerLeave}
          className="relative cursor-pointer overflow-hidden rounded-sm group"
          style={{
            background: era?.color ? `${era.color}18` : GLASS_BG,
            border: `1px solid ${GLASS_BORDER}`,
            marginBottom: `${config.gap}px`,
            breakInside: "avoid",
          }}
          whileHover={{ borderColor: `${era?.color || ac}66`, boxShadow: `0 0 12px ${era?.color || ac}11` }}
        >
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={entry.title || ""}
              className="w-full object-cover block"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="flex items-center justify-center text-3xl opacity-25"
              style={{ minHeight: config.columns === 4 ? 70 : config.columns === 2 ? 200 : 130, color: ac }}
            >
              <Icon name="camera" size={32} label="Sin imagen" />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-x-0 bottom-0 p-2"
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
          >
            {entry.title && (
              <p className="text-xs truncate xl:line-clamp-2 xl:whitespace-normal leading-tight" style={{ color: ac, fontFamily: FONT_MONO }}>
                {entry.title}
              </p>
            )}
            {entry.content?.text && (
              <p className="text-xs opacity-50 truncate xl:line-clamp-2 xl:whitespace-normal mt-0.5" style={{ color: ac, fontFamily: FONT_MONO }}>
                {entry.content.text.slice(0, 60)}
              </p>
            )}
          </motion.div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {whoInitial && (
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-sm font-bold"
                style={{
                  background: `${whoColor}22`,
                  color: whoColor,
                  fontFamily: FONT_MONO,
                  border: `1px solid ${whoColor}33`,
                }}
              >
                {whoInitial}
              </span>
            )}
            {era && (
              <div
                className="w-2.5 h-2.5 rounded-full opacity-80"
                style={{ background: era.color, boxShadow: `0 0 6px ${era.color}` }}
                title={era.name}
              />
            )}
            <span
              className="text-[8px] px-1 py-0.5 rounded-sm opacity-70"
              style={{ background: "rgba(0,0,0,0.55)", color: ac, fontFamily: FONT_MONO }}
            >
              <Icon name={CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "archive"} size={12} decorative />
            </span>
          </div>

          {entry.is_capsule_locked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              <span className="text-lg" style={{ color: ac, opacity: 0.6 }}><Icon name="timer" size={20} label="Cápsula bloqueada" /></span>
            </div>
          )}

          {isPressed && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ background: `${ac}15`, border: `2px solid ${ac}44` }}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

// ─── LONG PRESS PREVIEW (enhanced Fase 1.5) ─────────────────
const LongPressPreview = ({ entry, era, position, onClose, accentColor = ACID }) => {
  if (!entry) return null;
  const imgUrl = getImageUrl(entry);
  const ac = accentColor;
  const whoColor = entry.from_user === "edu" ? ac : entry.from_user === "david" ? PURPLE : `${ac}66`;
  const whoName = entry.from_user === "edu" ? "Edu" : entry.from_user === "david" ? "David" : "";
  const dateStr = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const timeStr = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="fixed z-50 p-3 rounded-sm shadow-2xl max-w-xs"
      style={{
        top: Math.min(position?.y ?? 100, window.innerHeight - 380),
        left: Math.max(8, Math.min((position?.x ?? 40) - 140, window.innerWidth - 300)),
        background: "rgba(10,10,10,0.97)",
        border: `1px solid ${era?.color || ac}55`,
        fontFamily: FONT_MONO,
        backdropFilter: "blur(16px)",
        maxHeight: 360,
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      <div className="flex items-center gap-2 mb-2">
        {whoName && (
          <span className="text-xs px-1.5 py-0.5 rounded-sm font-bold" style={{ background: `${whoColor}22`, color: whoColor }}>
            {whoName}
          </span>
        )}
        {era && (
          <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ background: `${era.color}22`, color: era.color }}>
            {era.name}
          </span>
        )}
        <span className="text-[9px] px-1 py-0.5 rounded-sm opacity-60" style={{ background: `${ac}15`, color: ac }}>
          <Icon name={CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "archive"} size={12} decorative /> {CAT_LABEL[ENTRY_CATEGORY[entry.type]] ?? entry.type}
        </span>
        <span className="text-xs opacity-30 ml-auto" style={{ color: ac }}>
          {dateStr}
        </span>
      </div>

      {imgUrl ? (
        <div className="rounded-sm overflow-hidden mb-2" style={{ maxHeight: 180 }}>
          <img src={imgUrl} alt={entry.title || ""} className="w-full object-cover" style={{ maxHeight: 180 }} loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 mb-2 text-4xl opacity-20" style={{ color: ac }}><Icon name="camera" size={36} label="Sin imagen" /></div>
      )}

      <p className="text-xs font-bold truncate xl:line-clamp-2 xl:whitespace-normal" style={{ color: ac }}>{entry.title || "Sin título"}</p>
      {entry.content?.text && (
        <p className="text-xs opacity-50 mt-1 line-clamp-3 xl:line-clamp-2" style={{ color: ac }}>{entry.content.text}</p>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {timeStr && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-sm opacity-40" style={{ color: ac, border: `1px solid ${ac}22` }}>
            <Icon name="sparkles" size={10} decorative /> {timeStr}
          </span>
        )}
        {entry.content?.location_name && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-sm opacity-40" style={{ color: ac, border: `1px solid ${ac}22` }}>
            <Icon name="map" size={10} decorative /> {entry.content.location_name}
          </span>
        )}
      </div>

      <p className="text-xs mt-2 opacity-20" style={{ color: ac }}>tap para cerrar</p>
    </motion.div>
  );
};


// ─── MAIN WALL VIEW EXPORT ──────────────────────────────────
// FASE C.1: ZoomModal reemplazado por onOpenLightbox callback
// FASE C.2.2: masonry agrupado por era en "salas" con headers curatoriales
export default function WallView({ entries = [], eras = [], density, setDensity, filterCategory, accentColor = ACID, onOpenLightbox }) {
  const [previewEntry, setPreviewEntry] = useState(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const pinchRef = useRef({ startDist: 0, initialDensity: density });
  const ac = accentColor;

  // FASE C.2.2 — Agrupar entries por era ANTES de la ventana de render (caveat V2).
  // useMemo estable en [entries, eras] — no se recompute por render, preserva virtualización.
  const eraGroups = useMemo(() => groupEntriesByEra(entries, eras), [entries, eras]);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { startDist: Math.sqrt(dx * dx + dy * dy), initialDensity: density };
    }
  }, [density]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && setDensity) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist - pinchRef.current.startDist;
      if (Math.abs(delta) > PINCH_THRESHOLD) {
        const currentIdx = DENSITY_ORDER.indexOf(pinchRef.current.initialDensity);
        if (delta > 0 && currentIdx < DENSITY_ORDER.length - 1) {
          setDensity(DENSITY_ORDER[currentIdx + 1]);
          pinchRef.current.initialDensity = DENSITY_ORDER[currentIdx + 1];
        } else if (delta < 0 && currentIdx > 0) {
          setDensity(DENSITY_ORDER[currentIdx - 1]);
          pinchRef.current.initialDensity = DENSITY_ORDER[currentIdx - 1];
        }
        pinchRef.current.startDist = dist;
      }
    }
  }, [setDensity]);

  const config = DENSITY_CONFIG[density] || DENSITY_CONFIG.normal;

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      className="flex flex-col gap-3"
      style={{ fontFamily: FONT_MONO }}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Object.entries(DENSITY_CONFIG).map(([key, cfg]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.92 }}
              onClick={() => setDensity?.(key)}
              className="text-xs px-3 py-2.5 min-h-[44px] uppercase tracking-widest rounded-sm"
              style={{
                color: density === key ? ac : `${ac}66`,
                border: density === key ? `1px solid ${ac}55` : `1px solid ${ac}22`,
                background: density === key ? `${ac}0d` : "transparent",
                fontFamily: FONT_MONO,
              }}
            >
              {cfg.label}
            </motion.button>
          ))}
        </div>
        <span className="text-[9px] opacity-20" style={{ color: ac }}>
          <Icon name="arrowUp" size={10} decorative /><Icon name="arrowDown" size={10} decorative /> zoom
        </span>
      </div>

      {/* FASE C.2.2 — Render por salas (era groups). Cada sala: header + masonry propio. */}
      {eraGroups.map((group) => (
        <div key={group.eraId} className="flex flex-col gap-2">
          {group.isSinEra ? (
            <SinEraDivider accentColor={ac} count={group.eraEntries.length} />
          ) : (
            <EraSectionHeader
              era={group.era}
              eraEntries={group.eraEntries}
              dateRange={group.dateRange}
              vibeCount={group.vibeCount}
              accentColor={ac}
            />
          )}
          {(() => {
            const cols = buildMasonryColumns(group.eraEntries, config.columns);
            return (
              <div style={{ display: "flex", gap: `${config.gap}px` }}>
                {cols.map((colItems, colIdx) => (
                  <div key={colIdx} style={{ flex: 1, display: "flex", flexDirection: "column", gap: `${config.gap}px`, minWidth: config.minCol }}>
                    {colItems.map((entry, itemIdx) => {
                      // startIndex acumulado → stagger delay global, no se resetea entre salas
                      const idx = group.startIndex + itemIdx * config.columns + colIdx;
                      return (
                        <WallItem
                          key={entry.id}
                          entry={entry}
                          era={group.era}
                          density={density}
                          index={idx}
                          accentColor={ac}
                          onLongPress={(e) => {
                            setPreviewEntry(e);
                            setPreviewPos({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
                          }}
                          onTap={(e) => {
                            const i = entries.findIndex((en) => en.id === e.id);
                            if (i >= 0) onOpenLightbox?.(entries, i);
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ))}

      {!entries.length && (
        <p className="text-xs opacity-30 text-center py-4" style={{ color: ac }}>
          Sin entradas{filterCategory && filterCategory !== "all" ? ` en ${CAT_LABEL[filterCategory]}` : ""}
        </p>
      )}

      <AnimatePresence>
        {previewEntry && (
          <LongPressPreview
            entry={previewEntry}
            era={eras.find(e => e.id === previewEntry.era_id)}
            position={previewPos}
            accentColor={ac}
            onClose={() => setPreviewEntry(null)}
          />
        )}
      </AnimatePresence>

      {/* FASE C.1: ZoomModal eliminado — sustituido por EntryLightbox vía onOpenLightbox */}
    </div>
  );
}
