// ============================================================
//  EL BÚNKER — VaultGallery.jsx
//  Galería del VAULT: 6 modos (ADR-021)
//  S66 — WALL masonry responsive + long-press preview + zoom
// ============================================================
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER, R2_PUBLIC_BASE } from "../tokens";
import { ENTRY_TYPES, CATEGORY_FILTERS } from "./AddEntryForm";

// ─── LONG PRESS THRESHOLD ───────────────────────────────────
const LONG_PRESS_MS = 500;

const MODES = [
  { id: "wall",       icon: "⊞", label: "WALL" },
  { id: "cinema",     icon: "▶", label: "CINEMA" },
  { id: "map",        icon: "◉", label: "MAP" },
  { id: "dialogue",   icon: "♥", label: "DIALOGUE" },
  { id: "exhibition", icon: "◆", label: "EXHIBITION" },
  { id: "reel",       icon: "◎", label: "REEL" },
];

// S66: Densidades reales con columnas responsivas
const DENSITY_CONFIG = {
  compact:  { columns: 4, gap: 6,  minCol: "100px", label: "COMPACT" },
  normal:   { columns: 3, gap: 8,  minCol: "140px", label: "NORMAL" },
  expanded: { columns: 2, gap: 10, minCol: "220px", label: "EXPANDED" },
};

// S95 — CATEGORY_FILTERS importado de AddEntryForm (single source of truth)

// Mapa category→label para badges rápidos
const CAT_LABEL = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.label]));
const CAT_ICON  = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.icon]));

// S95 — ENTRY_CATEGORY: lookup type→category desde ENTRY_TYPES (single source of truth)
const ENTRY_CATEGORY = Object.fromEntries(ENTRY_TYPES.map((t) => [t.id, t.category]));


// ─── UTILIDADES ────────────────────────────────────────────
const getImageUrl = (entry) => {
  const images = entry.content?.images;
  if (!images?.length) return null;
  const img = images[0];
  if (img.r2_key) return `${R2_PUBLIC_BASE}/${img.r2_key}`;
  if (img.dataUrl) return img.dataUrl;
  return null;
};

// PLIEGO-239: getMediaType helper — extrae el multimedia subtype
// de entry.content.images[0].media_type (image|video|audio) o
// fallback a entry.type. Usado por renderCinema para elegir entre
// <img>, <video> o <audio>.
const getMediaType = (entry) => {
  const images = entry.content?.images;
  if (images?.length && images[0].media_type) return images[0].media_type;
  return entry.type ?? "note";
};

// ─── WALL MASONRY (JS — respeta cronología left→right) ──────
const buildMasonryColumns = (items, columnCount) => {
  const columns = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => {
    columns[i % columnCount].push(item);
  });
  return columns;
};

// ─── WALL MASONRY ITEM ──────────────────────────────────────
const WallItem = ({ entry, era, density, onLongPress, onTap }) => {
  const imgUrl = getImageUrl(entry);
  const longPressTimer = useRef(null);
  const [isPressed, setIsPressed] = useState(false);

  const config = DENSITY_CONFIG[density] || DENSITY_CONFIG.normal;

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
      // Short tap = zoom
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

  return (
    <motion.div
      layout
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
        scale: isPressed ? 0.97 : 1,
        transition: "scale 0.1s ease",
      }}
    >
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={entry.title || ""}
          className="w-full object-cover block"
          loading="lazy"
        />
      ) : (
        <div
          className="flex items-center justify-center text-3xl opacity-25"
          style={{
            minHeight: config.columns === 4 ? 70 : config.columns === 2 ? 200 : 130,
            color: ACID,
          }}
        >
          📷
        </div>
      )}

      {/* Hover overlay: título + era dot */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-x-0 bottom-0 p-2"
        style={{
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
        }}
      >
        {entry.title && (
          <p className="text-xs truncate leading-tight" style={{ color: ACID, fontFamily: FONT_MONO }}>
            {entry.title}
          </p>
        )}
        {entry.content?.text && (
          <p className="text-xs opacity-50 truncate mt-0.5" style={{ color: ACID, fontFamily: FONT_MONO }}>
            {entry.content.text.slice(0, 60)}
          </p>
        )}
      </motion.div>

      {/* Era dot + category badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {era && (
          <div
            className="w-2.5 h-2.5 rounded-full opacity-80"
            style={{ background: era.color, boxShadow: `0 0 6px ${era.color}` }}
          />
        )}
        <span
          className="text-[8px] px-1 py-0.5 rounded-sm opacity-70"
          style={{ background: "rgba(0,0,0,0.55)", color: ACID, fontFamily: FONT_MONO }}
        >
          {CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "◈"}
        </span>
      </div>

      {/* Long-press ring indicator */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ background: `${ACID}15`, border: `2px solid ${ACID}44` }}
        />
      )}
    </motion.div>
  );
};

// ─── LONG-PRESS PREVIEW CARD ────────────────────────────────
const LongPressPreview = ({ entry, era, position, onClose }) => {
  if (!entry) return null;
  const imgUrl = getImageUrl(entry);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="fixed z-50 p-3 rounded-sm shadow-2xl max-w-xs"
      style={{
        top: Math.min(position?.y ?? 100, window.innerHeight - 320),
        left: Math.max(8, Math.min((position?.x ?? 40) - 140, window.innerWidth - 300)),
        background: "rgba(10,10,10,0.97)",
        border: `1px solid ${era?.color || ACID}55`,
        fontFamily: FONT_MONO,
        backdropFilter: "blur(16px)",
        maxHeight: 300,
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 mb-2">
        {era && (
          <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ background: `${era.color}22`, color: era.color }}>
            {era.name}
          </span>
        )}
        <span className="text-[9px] px-1 py-0.5 rounded-sm opacity-60" style={{ background: `${ACID}15`, color: ACID, fontFamily: FONT_MONO }}>
          {CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "◈"} {CAT_LABEL[ENTRY_CATEGORY[entry.type]] ?? entry.type}
        </span>
        <span className="text-xs opacity-30" style={{ color: ACID }}>
          {new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })}
        </span>
      </div>

      {/* Image — PLIEGO-239 ext: video/audio/img condicional */}
      {imgUrl ? (
        <div className="rounded-sm overflow-hidden mb-2" style={{ maxHeight: 180 }}>
          {getMediaType(entry) === "video" ? (
            <video src={imgUrl} controls className="w-full" style={{ maxHeight: 180 }} />
          ) : getMediaType(entry) === "audio" ? (
            <audio src={imgUrl} controls className="w-full" />
          ) : (
            <img src={imgUrl} alt={entry.title || ""} className="w-full object-cover" style={{ maxHeight: 180 }} />
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 mb-2 text-4xl opacity-20" style={{ color: ACID }}>📷</div>
      )}

      {/* Title + text */}
      <p className="text-xs font-bold truncate" style={{ color: ACID }}>{entry.title || "Sin título"}</p>
      {entry.content?.text && (
        <p className="text-xs opacity-50 mt-1 line-clamp-3" style={{ color: ACID }}>
          {entry.content.text}
        </p>
      )}

      <p className="text-xs mt-2 opacity-20" style={{ color: ACID }}>tap para cerrar</p>
    </motion.div>
  );
};

// ─── ZOOM MODAL ─────────────────────────────────────────────
const ZoomModal = ({ entry, era, onClose }) => {
  const imgUrl = getImageUrl(entry);
  // Bloquear scroll del body
  useEffect(() => {
    if (entry) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!entry]);

  if (!entry) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-xl rounded-full"
        style={{ background: "rgba(255,255,255,0.08)", color: ACID, border: `1px solid ${ACID}33` }}
      >
        ✕
      </button>

      {/* Image with spring animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-[95vw] max-h-[75vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {imgUrl ? (
          getMediaType(entry) === "video" ? (
            <video
              src={imgUrl}
              controls
              className="max-w-full max-h-[75vh] object-contain rounded-sm"
              style={{ boxShadow: `0 0 60px ${era?.color || ACID}22` }}
            />
          ) : getMediaType(entry) === "audio" ? (
            <audio src={imgUrl} controls className="w-full" />
          ) : (
            <img
              src={imgUrl}
              alt={entry.title || ""}
              className="max-w-full max-h-[75vh] object-contain rounded-sm"
              style={{ boxShadow: `0 0 60px ${era?.color || ACID}22` }}
            />
          )
        ) : (
          <div className="w-64 h-64 flex items-center justify-center text-6xl opacity-20 rounded-sm"
            style={{ color: ACID, background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
            📷
          </div>
        )}
      </motion.div>

      {/* Metadata bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 px-4 py-3 rounded-sm max-w-md w-full mx-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${GLASS_BORDER}`,
          fontFamily: FONT_MONO,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          {era && (
            <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: `${era.color}22`, color: era.color }}>
              {era.name}
            </span>
          )}
          <span className="text-[9px] px-1.5 py-0.5 rounded-sm opacity-60" style={{ background: `${ACID}15`, color: ACID, fontFamily: FONT_MONO }}>
            {CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "◈"} {CAT_LABEL[ENTRY_CATEGORY[entry.type]] ?? entry.type}
          </span>
          <span className="text-xs opacity-40" style={{ color: ACID }}>
            {new Date(entry.created_at).toLocaleDateString("es-ES", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-sm font-bold" style={{ color: ACID }}>{entry.title || "Sin título"}</p>
        {entry.content?.text && (
          <p className="text-xs opacity-50 mt-1" style={{ color: ACID }}>{entry.content.text}</p>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── CINEMA VIEW (S122-A: full-bleed + swipe + Ken Burns + overlay emocional) ──
const CinemaView = ({ entries, eras, onZoom }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  if (!entries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin entradas</p>;

  const safeIdx = ((currentIdx % entries.length) + entries.length) % entries.length;
  const entry = entries[safeIdx];
  const era = eras.find(e => e.id === entry.era_id);
  const imgUrl = getImageUrl(entry);
  const eraColor = era?.color ?? ACID;
  const eraName = era?.name ?? "";
  const dateStr = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setIsPaused(false);
  };

  const onTouchEnd = (e) => {
    const dx = (e.changedTouches[0].clientX - (touchStartX.current ?? 0));
    const dy = (e.changedTouches[0].clientY - (touchStartY.current ?? 0));
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx > 50 && absDx > absDy) {
      if (dx < -30) setCurrentIdx(i => (i + 1) % entries.length);
      else if (dx > 30) setCurrentIdx(i => (i - 1 + entries.length) % entries.length);
    }
    pauseTimerRef.current = setTimeout(() => setIsPaused(true), 3000);
  };

  // S122-A fix: hooks deben ejecutarse siempre — guard dentro del effect
  useEffect(() => {
    if (!entries.length) return;
    setIsPaused(false);
    pauseTimerRef.current = setTimeout(() => setIsPaused(true), 3000);
    return () => { if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current); };
  }, [currentIdx, entries.length]);

  return (
    <div className="flex flex-col items-center gap-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Full-bleed image container */}
      <div className="relative w-full overflow-hidden rounded-sm"
        style={{ aspectRatio: "4/3", background: `${eraColor}10`, border: `1px solid ${eraColor}33` }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: isPaused ? 1.06 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.6, ease: "easeInOut" }, scale: { duration: isPaused ? 8 : 0.3, ease: "linear" } }}
            className="absolute inset-0 flex items-center justify-center">
            {imgUrl ? (
              getMediaType(entry) === "video" ? (
                <video src={imgUrl} controls className="w-full h-full object-contain" />
              ) : getMediaType(entry) === "audio" ? (
                <div className="flex flex-col items-center gap-4 p-8">
                  <span className="text-6xl" style={{ color: eraColor }}>🎵</span>
                  <audio src={imgUrl} controls className="w-full max-w-sm" />
                </div>
              ) : (
                <img src={imgUrl} alt={entry.title || ""} className="w-full h-full object-contain" />
              )
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-6xl opacity-30" style={{ color: eraColor }}>📷</span>
                {entry.content?.text && (
                  <p className="text-sm max-w-md text-center px-8 leading-relaxed"
                    style={{ color: eraColor, fontFamily: FONT_MONO, opacity: 0.7 }}>
                    {entry.content.text.slice(0, 200)}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {isPaused && imgUrl && getMediaType(entry) !== "video" && getMediaType(entry) !== "audio" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute top-3 left-3 text-[9px] px-2 py-0.5 rounded-sm"
            style={{ background: "rgba(0,0,0,0.5)", color: eraColor, fontFamily: FONT_MONO }}>
            ◉ CONTEMPLAR
          </motion.div>
        )}
        {currentIdx === 0 && entries.length > 1 && (
          <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute bottom-3 right-3 text-[9px] px-2 py-0.5 rounded-sm"
            style={{ background: "rgba(0,0,0,0.5)", color: eraColor, fontFamily: FONT_MONO }}>
            ← DESLIZA →
          </motion.div>
        )}
      </div>

      {/* Emotional overlay */}
      <motion.div key={`meta-${currentIdx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="w-full px-2 py-3 rounded-sm"
        style={{ background: `${eraColor}08`, borderTop: `1px solid ${eraColor}22`, fontFamily: FONT_MONO }}>
        {entry.title && <p className="text-sm font-bold tracking-wide" style={{ color: eraColor }}>"{entry.title}"</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <span className="text-[10px] opacity-60" style={{ color: eraColor }}>
            {entry.from_user === "edu" ? "Edu" : entry.from_user === "david" ? "David" : ""}
          </span>
          {dateStr && <span className="text-[10px] opacity-40" style={{ color: eraColor }}>{dateStr}</span>}
          {eraName && (
            <span className="text-[9px] px-2 py-0.5 rounded-sm"
              style={{ background: `${eraColor}18`, color: eraColor, border: `1px solid ${eraColor}33` }}>{eraName}</span>
          )}
        </div>
        {entry.content?.text && (
          <p className="text-xs mt-2 opacity-50 leading-relaxed line-clamp-2" style={{ color: eraColor }}>{entry.content.text}</p>
        )}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[9px] opacity-40" style={{ color: eraColor, fontFamily: FONT_MONO }}>
            {CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "◈"} {CAT_LABEL[ENTRY_CATEGORY[entry.type]] ?? entry.type}
          </span>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCurrentIdx(i => (i - 1 + entries.length) % entries.length)}
          className="text-xl w-10 h-10 flex items-center justify-center rounded-full"
          style={{ color: eraColor, border: `1px solid ${eraColor}33`, background: `${eraColor}08` }}>
          ◀
        </motion.button>
        <span className="text-xs tabular-nums opacity-50" style={{ color: eraColor, fontFamily: FONT_MONO }}>
          {safeIdx + 1} / {entries.length}
        </span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCurrentIdx(i => (i + 1) % entries.length)}
          className="text-xl w-10 h-10 flex items-center justify-center rounded-full"
          style={{ color: eraColor, border: `1px solid ${eraColor}33`, background: `${eraColor}08` }}>
          ▶
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onZoom?.(entry)}
          className="text-sm w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: eraColor, border: `1px solid ${eraColor}22`, background: `${eraColor}05` }} title="Ampliar">
          ⊞
        </motion.button>
      </div>

      {era && (
        <p className="text-[9px] opacity-25 tracking-widest uppercase" style={{ color: eraColor, fontFamily: FONT_MONO }}>
          ERA {eraName} · CINEMA MODE
        </p>
      )}
    </div>
  );
};

// ─── ORIGINAL RENDERS ────────────────────────────────────────

// ─── DIALOGUE VIEW (S122-B: emparejamiento temporal + hilos conectores + asimetría) ──
const DialogueView = ({ entries, eras }) => {
  const [filterMode, setFilterMode] = useState("all"); // "all" | "conversations"

  if (!entries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin entradas</p>;

  // S122-B: Emparejamiento temporal — fotos tomadas <5min de diferencia
  const pairs = useMemo(() => {
    const eduEntries = entries.filter(e => e.from_user === "edu");
    const davidEntries = entries.filter(e => e.from_user === "david");
    const result = [];
    const usedDavid = new Set();
    for (const edu of eduEntries) {
      const eduTime = new Date(edu.created_at).getTime();
      const close = davidEntries.find(d => {
        if (usedDavid.has(d.id)) return false;
        const davidTime = new Date(d.created_at).getTime();
        return Math.abs(eduTime - davidTime) < 5 * 60 * 1000;
      });
      if (close) {
        usedDavid.add(close.id);
        result.push({ edu, david: close, paired: true });
      } else {
        result.push({ edu, david: null, paired: false });
      }
    }
    // Añadir fotos de David sin pareja
    for (const david of davidEntries) {
      if (!usedDavid.has(david.id)) {
        result.push({ edu: null, david, paired: false });
      }
    }
    return { pairs: result, eduCount: eduEntries.length, davidCount: davidEntries.length };
  }, [entries]);

  const displayPairs = filterMode === "conversations"
    ? pairs.pairs.filter(p => p.paired)
    : pairs.pairs;

  // Asimetría
  const onlyEdu = pairs.eduCount > 0 && pairs.davidCount === 0;
  const onlyDavid = pairs.davidCount > 0 && pairs.eduCount === 0;

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: PURPLE }}>♥</span>
          <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: PURPLE }}>DIALOGUE</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilterMode("all")}
            className="text-[9px] px-2 py-1 rounded-sm uppercase tracking-widest"
            style={{
              color: filterMode === "all" ? PURPLE : `${PURPLE}44`,
              borderBottom: filterMode === "all" ? `1px solid ${PURPLE}` : "1px solid transparent",
            }}>
            TODO
          </button>
          <button onClick={() => setFilterMode("conversations")}
            className="text-[9px] px-2 py-1 rounded-sm uppercase tracking-widest"
            style={{
              color: filterMode === "conversations" ? PURPLE : `${PURPLE}44`,
              borderBottom: filterMode === "conversations" ? `1px solid ${PURPLE}` : "1px solid transparent",
            }}>
            CONVERSACIONES
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <div className="flex-1 p-3 rounded-sm text-center" style={{ background: `${ACID}08`, border: `1px solid ${ACID}22` }}>
          <span className="text-lg block" style={{ color: ACID }}>👤</span>
          <p className="text-[10px] font-bold mt-1" style={{ color: ACID }}>EDU</p>
          <p className="text-[9px] opacity-40" style={{ color: ACID }}>{pairs.eduCount} momentos</p>
        </div>
        <div className="flex items-center text-lg opacity-30" style={{ color: PURPLE }}>↔</div>
        <div className="flex-1 p-3 rounded-sm text-center" style={{ background: `${PURPLE}08`, border: `1px solid ${PURPLE}22` }}>
          <span className="text-lg block" style={{ color: PURPLE }}>👤</span>
          <p className="text-[10px] font-bold mt-1" style={{ color: PURPLE }}>DAVID</p>
          <p className="text-[9px] opacity-40" style={{ color: PURPLE }}>{pairs.davidCount} momentos</p>
        </div>
      </div>
      <p className="text-[9px] text-center opacity-30" style={{ color: PURPLE }}>
        {pairs.pairs.filter(p => p.paired).length} conversaciones sincronizadas
      </p>

      {/* Asimetría poética */}
      {onlyEdu && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-6 rounded-sm text-center" style={{ background: `${ACID}05`, border: `1px dashed ${ACID}22` }}>
          <span className="text-3xl block mb-3 opacity-50" style={{ color: ACID }}>🎭</span>
          <p className="text-xs leading-relaxed opacity-40" style={{ color: ACID }}>
            Solo un eco en la sala — David no capturó este momento.
          </p>
        </motion.div>
      )}
      {onlyDavid && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-6 rounded-sm text-center" style={{ background: `${PURPLE}05`, border: `1px dashed ${PURPLE}22` }}>
          <span className="text-3xl block mb-3 opacity-50" style={{ color: PURPLE }}>🎭</span>
          <p className="text-xs leading-relaxed opacity-40" style={{ color: PURPLE }}>
            Solo un eco en la sala — Edu no capturó este momento.
          </p>
        </motion.div>
      )}

      {/* Paired entries — chat layout */}
      {!onlyEdu && !onlyDavid && (
        <div className="flex flex-col gap-4">
          {displayPairs.map((pair, idx) => {
            const eraEdu = pair.edu ? eras.find(e => e.id === pair.edu.era_id) : null;
            const eraDavid = pair.david ? eras.find(e => e.id === pair.david.era_id) : null;
            const eduImg = pair.edu ? getImageUrl(pair.edu) : null;
            const davidImg = pair.david ? getImageUrl(pair.david) : null;
            const sameEra = eraEdu && eraDavid && eraEdu.id === eraDavid.id;

            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col gap-2">

                {/* Connecting thread for paired entries */}
                {pair.paired && (
                  <div className="flex justify-center">
                    <motion.div
                      className="h-8 w-px"
                      style={{ background: `linear-gradient(${ACID}44, ${PURPLE}44)` }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                    />
                    <span className="text-[8px] px-2 opacity-30 self-center" style={{ color: PURPLE }}>
                      {sameEra ? eraEdu?.name : "—"} · &lt;5min
                    </span>
                    <motion.div
                      className="h-8 w-px"
                      style={{ background: `linear-gradient(${ACID}44, ${PURPLE}44)` }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                    />
                  </div>
                )}

                {/* Edu bubble (left) */}
                {pair.edu && (
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 flex gap-2 items-start">
                      <div className="w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden"
                        style={{ border: `1px solid ${ACID}33` }}>
                        {eduImg ? (
                          <img src={eduImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg opacity-30" style={{ background: `${ACID}10`, color: ACID }}>📷</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold" style={{ color: ACID }}>EDU</span>
                          <span className="text-[8px] opacity-30" style={{ color: ACID }}>
                            {pair.edu.created_at ? new Date(pair.edu.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        {pair.edu.title && (
                          <p className="text-xs italic opacity-60 line-clamp-2" style={{ color: ACID }}>
                            "{pair.edu.title}"
                          </p>
                        )}
                        {eraEdu && (
                          <span className="text-[7px] px-1.5 py-0.5 rounded-sm mt-1 inline-block"
                            style={{ background: `${eraEdu.color}15`, color: eraEdu.color }}>
                            {eraEdu.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Empty right side for balance */}
                    <div className="w-12 flex-shrink-0" />
                  </div>
                )}

                {/* David bubble (right) */}
                {pair.david && (
                  <div className="flex gap-3 items-start justify-end">
                    <div className="w-12 flex-shrink-0" />
                    <div className="flex-1 flex gap-2 items-start justify-end">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-2 justify-end mb-0.5">
                          <span className="text-[8px] opacity-30" style={{ color: PURPLE }}>
                            {pair.david.created_at ? new Date(pair.david.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                          <span className="text-[10px] font-bold" style={{ color: PURPLE }}>DAVID</span>
                        </div>
                        {pair.david.title && (
                          <p className="text-xs italic opacity-60 line-clamp-2" style={{ color: PURPLE }}>
                            "{pair.david.title}"
                          </p>
                        )}
                        {eraDavid && (
                          <span className="text-[7px] px-1.5 py-0.5 rounded-sm mt-1 inline-block"
                            style={{ background: `${eraDavid.color}15`, color: eraDavid.color }}>
                            {eraDavid.name}
                          </span>
                        )}
                      </div>
                      <div className="w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden"
                        style={{ border: `1px solid ${PURPLE}33` }}>
                        {davidImg ? (
                          <img src={davidImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg opacity-30" style={{ background: `${PURPLE}10`, color: PURPLE }}>📷</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Solo entry — centered without pair */}
                {!pair.paired && pair.edu && !pair.david && (
                  <div className="flex justify-center">
                    <span className="text-[8px] opacity-15" style={{ color: ACID }}>— sin eco —</span>
                  </div>
                )}
                {!pair.paired && !pair.edu && pair.david && (
                  <div className="flex justify-center">
                    <span className="text-[8px] opacity-15" style={{ color: PURPLE }}>— sin eco —</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {!displayPairs.length && (
        <p className="text-xs opacity-20 text-center py-8" style={{ color: PURPLE }}>
          {filterMode === "conversations" ? "Sin conversaciones sincronizadas" : "Sin momentos aún"}
        </p>
      )}
    </div>
  );
};

// ─── EXHIBITION VIEW (S122-C: agrupación por Era + vibe breakdown + layout museo) ──
const ExhibitionView = ({ entries, eras }) => {
  if (!entries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin entradas</p>;

  const eraGroups = useMemo(() => {
    const groups = {};
    entries.forEach(e => {
      const eraId = e.era_id || "_sin_era";
      if (!groups[eraId]) groups[eraId] = [];
      groups[eraId].push(e);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [entries]);

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: FONT_MONO }}>
      <div className="flex items-center gap-2">
        <span style={{ color: PURPLE }}>◆</span>
        <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: PURPLE }}>EXHIBITION</span>
        <span className="text-[9px] opacity-30" style={{ color: PURPLE }}>{eraGroups.length} salas</span>
      </div>
      <div className="flex flex-col gap-5">
        {eraGroups.map(([eraId, eraEntries]) => {
          const era = eras.find(e => e.id === eraId);
          const eraColor = era?.color ?? ACID;
          const eraName = era?.name ?? "Sin Era";
          const firstImg = getImageUrl(eraEntries[0]);
          const vibeCounts = {};
          eraEntries.forEach(e => { const tag = e.tag || "otros"; vibeCounts[tag] = (vibeCounts[tag] || 0) + 1; });
          return (
            <motion.div key={eraId} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              className="p-4 rounded-sm" style={{ background: `${eraColor}08`, border: `1px solid ${eraColor}33` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-sm overflow-hidden flex-shrink-0" style={{ border: `1px solid ${eraColor}44` }}>
                  {firstImg ? (
                    <img src={firstImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl opacity-30" style={{ background: `${eraColor}15`, color: eraColor }}>◈</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: eraColor }}>{eraName}</p>
                  <p className="text-[10px] opacity-50" style={{ color: eraColor }}>{eraEntries.length} piezas · {Object.keys(vibeCounts).length} vibes</p>
                </div>
                <div className="ml-auto flex -space-x-2">
                  {eraEntries.slice(0, 5).map((e, i) => {
                    const url = getImageUrl(e);
                    return url ? <img key={e.id} src={url} alt="" className="w-8 h-8 rounded-full object-cover border-2" style={{ borderColor: eraColor, zIndex: 5 - i }} /> : null;
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(vibeCounts).slice(0, 6).map(([tag, count]) => (
                  <span key={tag} className="text-[8px] px-2 py-1 rounded-sm" style={{ background: `${eraColor}12`, color: eraColor, border: `1px solid ${eraColor}22` }}>
                    {tag.replace(/_/g, " ")} · {count}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── REEL VIEW (S122-D: auto-generación secuencias por día + pinning) ──
const ReelView = ({ entries, eras }) => {
  if (!entries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin entradas</p>;
  const reels = useMemo(() => {
    const byDay = {};
    entries.forEach(e => {
      if (!e.created_at) return;
      const day = new Date(e.created_at).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(e);
    });
    return Object.entries(byDay).filter(([, items]) => items.length >= 2).sort(([a], [b]) => b.localeCompare(a)).slice(0, 12);
  }, [entries]);
  const [activeReel, setActiveReel] = useState(null);
  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      <div className="flex items-center gap-2">
        <span style={{ color: PURPLE }}>◎</span>
        <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: PURPLE }}>REEL</span>
        <span className="text-[9px] opacity-30" style={{ color: PURPLE }}>{reels.length} secuencias</span>
      </div>
      {!reels.length ? (
        <p className="text-xs opacity-30 text-center py-8" style={{ color: PURPLE }}>Agrupa 2+ entradas el mismo día para generar REELS automáticos</p>
      ) : activeReel !== null ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <button onClick={() => setActiveReel(null)} className="text-xs self-start px-3 py-1 rounded-sm" style={{ color: PURPLE, border: `1px solid ${PURPLE}33` }}>← VOLVER</button>
          {(() => {
            const [day, items] = reels[activeReel];
            const era = eras.find(e => items.some(i => i.era_id === e.id));
            const eraColor = era?.color ?? PURPLE;
            const dayStr = new Date(day).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            return (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold" style={{ color: eraColor }}>{dayStr}</p>
                <p className="text-[10px] opacity-40" style={{ color: eraColor }}>{items.length} momentos · {items.filter(e => e.from_user === "edu").length} Edu · {items.filter(e => e.from_user === "david").length} David</p>
                <div className="flex flex-col gap-2">
                  {[...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((entry, i) => {
                    const img = getImageUrl(entry);
                    return (
                      <div key={entry.id} className="flex gap-3 p-2 rounded-sm items-center" style={{ background: `${eraColor}08`, border: `1px solid ${eraColor}22` }}>
                        <span className="text-[10px] font-bold opacity-40 w-5" style={{ color: eraColor }}>{i + 1}</span>
                        <div className="w-10 h-10 rounded-sm overflow-hidden flex-shrink-0" style={{ border: `1px solid ${eraColor}33` }}>
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-30" style={{ color: eraColor }}>📷</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: eraColor }}>{entry.title || "Sin título"}</p>
                          <p className="text-[9px] opacity-40" style={{ color: eraColor }}>{entry.from_user === "edu" ? "Edu" : entry.from_user === "david" ? "David" : ""} · {new Date(entry.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {reels.map(([day, items], i) => {
            const firstImg = getImageUrl(items[0]);
            const era = eras.find(e => items.some(i => i.era_id === e.id));
            const eraColor = era?.color ?? PURPLE;
            const dayStr = new Date(day).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
            return (
              <motion.button key={day} whileTap={{ scale: 0.96 }} onClick={() => setActiveReel(i)}
                className="p-3 rounded-sm text-left" style={{ background: `${eraColor}08`, border: `1px solid ${eraColor}33` }}>
                <div className="w-full aspect-video rounded-sm overflow-hidden mb-2" style={{ background: `${eraColor}15`, border: `1px solid ${eraColor}22` }}>
                  {firstImg ? <img src={firstImg} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20" style={{ color: eraColor }}>◎</div>}
                </div>
                <p className="text-[10px] font-bold truncate" style={{ color: eraColor }}>{dayStr}</p>
                <p className="text-[8px] opacity-40" style={{ color: eraColor }}>{items.length} momentos</p>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MAP VIEW (S122-E: placeholder semántico con guía de features) ──
const MapView = () => (
  <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
    <div className="flex items-center gap-2">
      <span style={{ color: PURPLE }}>◉</span>
      <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: PURPLE }}>MAP</span>
    </div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4 py-12 px-6 rounded-sm"
      style={{ background: `${PURPLE}05`, border: `1px dashed ${PURPLE}22` }}>
      <motion.span animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity }}
        className="text-5xl" style={{ color: PURPLE }}>🌍</motion.span>
      <p className="text-xs tracking-[0.25em] uppercase text-center" style={{ color: PURPLE, opacity: 0.4 }}>MAPA · Geografía de la relación</p>
      <p className="text-[10px] leading-relaxed text-center max-w-xs" style={{ color: PURPLE, opacity: 0.2 }}>
        Las entradas necesitan coordenadas (lat/lng) para aparecer aquí. Añade ubicación al crear una entrada y el mapa cobrará vida.
      </p>
      <div className="flex gap-3 mt-2">
        <span className="text-[8px] px-2 py-1 rounded-sm" style={{ background: `${PURPLE}10`, color: PURPLE }}>📍 Pines</span>
        <span className="text-[8px] px-2 py-1 rounded-sm" style={{ background: `${PURPLE}10`, color: PURPLE }}>〰 Líneas</span>
        <span className="text-[8px] px-2 py-1 rounded-sm" style={{ background: `${PURPLE}10`, color: PURPLE }}>⧖ Timeline</span>
      </div>
    </motion.div>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function VaultGallery({ entries = [], eras = [], onOpenEntry: _onOpenEntry }) {
  const [mode, setMode] = useState("wall");
  const [density, setDensity] = useState("normal");
  const [currentIdx, setCurrentIdx] = useState(0);
  // S66: Long-press preview + zoom
  const [previewEntry, setPreviewEntry] = useState(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [zoomEntry, setZoomEntry] = useState(null);

  // S95: mostrar todas las entradas con imagen/media, no solo photo.
  // Los filtros de categoría reducen el subset visible.
  const entriesWithMedia = useMemo(() =>
    entries.filter(e => !e.is_deleted && (getImageUrl(e) || e.content?.text)),
    [entries]
  );

  // S95 — Filtro por categoría
  const [filterCategory, setFilterCategory] = useState("all");
  const filteredEntries = useMemo(() => {
    if (filterCategory === "all") return entriesWithMedia;
    return entriesWithMedia.filter((e) => ENTRY_CATEGORY[e.type] === filterCategory);
  }, [entriesWithMedia, filterCategory]);

  // S66: WALL con masonry responsive real
  const renderWall = () => (
    <div className="flex flex-col gap-3">
      {/* Density control */}
      <div className="flex gap-1">
        {Object.entries(DENSITY_CONFIG).map(([key, cfg]) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            onClick={() => setDensity(key)}
            className="text-xs px-3 py-1.5 uppercase tracking-widest rounded-sm"
            style={{
              color: density === key ? ACID : `${ACID}66`,
              border: density === key ? `1px solid ${ACID}55` : `1px solid ${ACID}22`,
              background: density === key ? `${ACID}0d` : "transparent",
              fontFamily: FONT_MONO,
            }}
          >
            {cfg.label}
          </motion.button>
        ))}
      </div>

      {/* S66: Masonry grid con columnas JS (respeta cronología left→right) */}
      {(() => {
        const config = DENSITY_CONFIG[density];
        const columns = buildMasonryColumns(filteredEntries, config.columns);
        return (
          <div style={{ display: "flex", gap: `${config.gap}px` }}>
            {columns.map((colItems, colIdx) => (
              <div key={colIdx} style={{ flex: 1, display: "flex", flexDirection: "column", gap: `${config.gap}px`, minWidth: config.minCol }}>
                {colItems.map((entry) => {
                  const era = eras.find(e => e.id === entry.era_id);
                  return (
                    <WallItem
                      key={entry.id}
                      entry={entry}
                      era={era}
                      density={density}
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
        );
      })()}

      {!filteredEntries.length && (
        <p className="text-xs opacity-30 text-center py-4" style={{ color: ACID, fontFamily: FONT_MONO }}>
          Sin entradas{filterCategory !== "all" ? ` en ${CAT_LABEL[filterCategory]}` : ""}
        </p>
      )}
    </div>
  );

  // S122-A: CINEMA delegado a componente separado CinemaView (hooks propios, swipe + Ken Burns)
  const renderCinema = () => (
    <CinemaView entries={filteredEntries} eras={eras} onZoom={setZoomEntry} />
  );

  // S122-B: DIALOGUE delegado a componente con emparejamiento temporal + chat layout
  const renderDialogue = () => (
    <DialogueView entries={filteredEntries} eras={eras} />
  );

  // S122-C: EXHIBITION delegado a componente con agrupación por Era + vibe breakdown
  const renderExhibition = () => (
    <ExhibitionView entries={filteredEntries} eras={eras} />
  );

  // S122-D: REEL delegado a componente con auto-generación secuencias por día
  const renderReel = () => (
    <ReelView entries={filteredEntries} eras={eras} />
  );

  // S122-E: MAP delegado a componente con placeholder semántico
  const renderMap = () => <MapView />;

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: FONT_MONO }}>
      {/* Mode bar */}
      <nav className="flex gap-1 overflow-x-auto">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`text-xs px-2 py-1 uppercase whitespace-nowrap ${mode === m.id ? "" : "opacity-30"}`}
            style={{ color: ACID, borderBottom: mode === m.id ? `1px solid ${ACID}` : "1px solid transparent", fontFamily: FONT_MONO }}>
            {m.icon} {m.label}
          </button>
        ))}
      </nav>

      {/* S95 — Filtro por categoría (14 categorías) */}
      <div className="flex gap-0.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setFilterCategory(cat.id); setCurrentIdx(0); }}
            className={`text-[9px] px-1.5 py-1 rounded-sm whitespace-nowrap transition-all flex-shrink-0 ${filterCategory === cat.id ? "" : "opacity-25 hover:opacity-50"}`}
            style={{
              color: filterCategory === cat.id ? ACID : `${ACID}88`,
              borderBottom: filterCategory === cat.id ? `1px solid ${ACID}` : "1px solid transparent",
              fontFamily: FONT_MONO,
            }}
            title={cat.label}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {mode === "wall" && renderWall()}
          {mode === "cinema" && renderCinema()}
          {mode === "dialogue" && renderDialogue()}
          {mode === "exhibition" && renderExhibition()}
          {mode === "reel" && renderReel()}
          {mode === "map" && renderMap()}
        </motion.div>
      </AnimatePresence>

      {/* S66: Long-press preview overlay */}
      <AnimatePresence>
        {previewEntry && (
          <LongPressPreview
            entry={previewEntry}
            era={eras.find(e => e.id === previewEntry.era_id)}
            position={previewPos}
            onClose={() => setPreviewEntry(null)}
          />
        )}
      </AnimatePresence>

      {/* S66: Zoom modal overlay */}
      <AnimatePresence>
        {zoomEntry && (
          <ZoomModal
            entry={zoomEntry}
            era={eras.find(e => e.id === zoomEntry.era_id)}
            onClose={() => setZoomEntry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
