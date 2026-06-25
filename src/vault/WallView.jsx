// ============================================================
//  EL BÚNKER — WallView.jsx
//  Fase 1: WALL virtualizado con IntersectionObserver +
//  pinch-to-zoom densidad + badges contexto + stagger animations
//  VB9: vibe-accent propagation via accentColor prop
// ============================================================
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER, R2_PUBLIC_BASE } from "../tokens";
import { ENTRY_TYPES, CATEGORY_FILTERS } from "./AddEntryForm";

// ─── CONSTANTS ──────────────────────────────────────────────
const LONG_PRESS_MS = 500;
const PINCH_THRESHOLD = 60;
const OBSERVER_MARGIN = "400px";

const CAT_LABEL = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.label]));
const CAT_ICON  = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.icon]));
const ENTRY_CATEGORY = Object.fromEntries(ENTRY_TYPES.map((t) => [t.id, t.category]));

const DENSITY_CONFIG = {
  compact:  { columns: 4, gap: 6,  minCol: "100px", label: "COMPACT", intrinsicH: 120 },
  normal:   { columns: 3, gap: 8,  minCol: "140px", label: "NORMAL",  intrinsicH: 180 },
  expanded: { columns: 2, gap: 10, minCol: "220px", label: "EXPANDED", intrinsicH: 280 },
};

const DENSITY_ORDER = ["compact", "normal", "expanded"];

// ─── UTILITIES ──────────────────────────────────────────────
const getImageUrl = (entry) => {
  const images = entry.content?.images;
  if (!images?.length) return null;
  const img = images[0];
  if (img.r2_key) return `${R2_PUBLIC_BASE}/${img.r2_key}`;
  if (img.dataUrl) return img.dataUrl;
  return null;
};

const buildMasonryColumns = (items, columnCount) => {
  const columns = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => {
    columns[i % columnCount].push(item);
  });
  return columns;
};

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
              📷
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-x-0 bottom-0 p-2"
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
          >
            {entry.title && (
              <p className="text-xs truncate leading-tight" style={{ color: ac, fontFamily: FONT_MONO }}>
                {entry.title}
              </p>
            )}
            {entry.content?.text && (
              <p className="text-xs opacity-50 truncate mt-0.5" style={{ color: ac, fontFamily: FONT_MONO }}>
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
              {CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "◈"}
            </span>
          </div>

          {entry.is_capsule_locked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              <span className="text-lg" style={{ color: ac, opacity: 0.6 }}>⧖</span>
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
          {CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "◈"} {CAT_LABEL[ENTRY_CATEGORY[entry.type]] ?? entry.type}
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
        <div className="flex items-center justify-center h-24 mb-2 text-4xl opacity-20" style={{ color: ac }}>📷</div>
      )}

      <p className="text-xs font-bold truncate" style={{ color: ac }}>{entry.title || "Sin título"}</p>
      {entry.content?.text && (
        <p className="text-xs opacity-50 mt-1 line-clamp-3" style={{ color: ac }}>{entry.content.text}</p>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {timeStr && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-sm opacity-40" style={{ color: ac, border: `1px solid ${ac}22` }}>
            ☀ {timeStr}
          </span>
        )}
        {entry.content?.location_name && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-sm opacity-40" style={{ color: ac, border: `1px solid ${ac}22` }}>
            📍 {entry.content.location_name}
          </span>
        )}
      </div>

      <p className="text-xs mt-2 opacity-20" style={{ color: ac }}>tap para cerrar</p>
    </motion.div>
  );
};

// ─── ZOOM MODAL (enhanced Fase 1.6) ─────────────────────────
const ZoomModal = ({ entry, era, onClose, accentColor = ACID }) => {
  const imgUrl = getImageUrl(entry);
  const ac = accentColor;

  useEffect(() => {
    if (entry) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!entry]);

  if (!entry) return null;

  const whoColor = entry.from_user === "edu" ? ac : entry.from_user === "david" ? PURPLE : `${ac}66`;
  const whoName = entry.from_user === "edu" ? "Edu" : entry.from_user === "david" ? "David" : "";
  const dateStr = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center text-xl rounded-full"
        style={{ background: "rgba(255,255,255,0.08)", color: ac, border: `1px solid ${ac}33` }}
      >
        ✕
      </button>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-[95vw] max-h-[65vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={entry.title || ""}
            className="max-w-full max-h-[65vh] object-contain rounded-sm"
            style={{ boxShadow: `0 0 60px ${era?.color || ac}22` }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center text-6xl opacity-20 rounded-sm"
            style={{ color: ac, background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
            📷
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-3 px-4 py-3 rounded-sm max-w-md w-full mx-4"
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-2">
          {whoName && (
            <span className="text-xs px-2 py-0.5 rounded-sm font-bold" style={{ background: `${whoColor}22`, color: whoColor }}>
              {whoName}
            </span>
          )}
          {era && (
            <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: `${era.color}22`, color: era.color }}>
              {era.name}
            </span>
          )}
          <span className="text-[9px] px-1.5 py-0.5 rounded-sm opacity-60" style={{ background: `${ac}15`, color: ac }}>
            {CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "◈"} {CAT_LABEL[ENTRY_CATEGORY[entry.type]] ?? entry.type}
          </span>
          <span className="text-xs opacity-40 ml-auto" style={{ color: ac }}>{dateStr}</span>
        </div>

        <p className="text-sm font-bold" style={{ color: ac }}>{entry.title || "Sin título"}</p>
        {entry.content?.text && (
          <p className="text-xs opacity-50 mt-1 leading-relaxed" style={{ color: ac }}>{entry.content.text}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.content?.location_name && (
            <span className="text-[9px] px-2 py-0.5 rounded-sm opacity-50" style={{ color: era?.color || ac, background: `${era?.color || ac}10` }}>
              📍 {entry.content.location_name}
            </span>
          )}
          {entry.content?.event_date && (
            <span className="text-[9px] px-2 py-0.5 rounded-sm opacity-50" style={{ color: era?.color || ac, background: `${era?.color || ac}10` }}>
              📅 {new Date(entry.content.event_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>

        <p className="text-[9px] mt-3 opacity-15 text-center" style={{ color: ac }}>
          tap fuera para cerrar · desliza para siguiente
        </p>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN WALL VIEW EXPORT ──────────────────────────────────
export default function WallView({ entries = [], eras = [], density, setDensity, filterCategory, accentColor = ACID }) {
  const [previewEntry, setPreviewEntry] = useState(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [zoomEntry, setZoomEntry] = useState(null);

  const containerRef = useRef(null);
  const pinchRef = useRef({ startDist: 0, initialDensity: density });
  const ac = accentColor;

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
  const columns = useMemo(() => buildMasonryColumns(entries, config.columns), [entries, config.columns]);

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
          pinch ↕ zoom
        </span>
      </div>

      <div style={{ display: "flex", gap: `${config.gap}px` }}>
        {columns.map((colItems, colIdx) => (
          <div key={colIdx} style={{ flex: 1, display: "flex", flexDirection: "column", gap: `${config.gap}px`, minWidth: config.minCol }}>
            {colItems.map((entry, itemIdx) => {
              const globalIdx = itemIdx * config.columns + colIdx;
              const era = eras.find(e => e.id === entry.era_id);
              return (
                <WallItem
                  key={entry.id}
                  entry={entry}
                  era={era}
                  density={density}
                  index={globalIdx}
                  accentColor={ac}
                  onLongPress={(e) => {
                    setPreviewEntry(e);
                    setPreviewPos({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
                  }}
                  onTap={(e) => setZoomEntry(e)}
                />
              );
            })}
          </div>
        ))}
      </div>

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

      <AnimatePresence>
        {zoomEntry && (
          <ZoomModal
            entry={zoomEntry}
            era={eras.find(e => e.id === zoomEntry.era_id)}
            accentColor={ac}
            onClose={() => setZoomEntry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
