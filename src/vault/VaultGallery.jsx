// ============================================================
//  EL BÚNKER — VaultGallery.jsx
//  Galería del VAULT: 6 modos (ADR-021)
//  Fase 1 — WALL delegado a WallView.jsx (virtualizado + pinch + badges)
// ============================================================
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, R2_PUBLIC_BASE } from "../tokens";
import { usePlayer } from "../core/PlayerContext"; // VB9: vibe accent propagation
import WallView from "./WallView"; // Fase 1: WALL virtualizado

// S130-A — MAP mode: Leaflet real + clustering + CartoDB Dark tiles (Sub-fase 1)
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { ENTRY_TYPES, CATEGORY_FILTERS } from "./AddEntryForm";

// ─── MODES ──────────────────────────────────────────────────
const MODES = [
  { id: "wall",       icon: "⊞", label: "WALL" },
  { id: "cinema",     icon: "▶", label: "CINEMA" },
  { id: "map",        icon: "◉", label: "MAP" },
  { id: "dialogue",   icon: "♥", label: "DIALOGUE" },
  { id: "exhibition", icon: "◆", label: "EXHIBITION" },
  { id: "reel",       icon: "◎", label: "REEL" },
];

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
const getMediaType = (entry) => {
  const images = entry.content?.images;
  if (images?.length && images[0].media_type) return images[0].media_type;
  return entry.type ?? "note";
};

// ─── CINEMA VIEW (S122-A: full-bleed + swipe + Ken Burns + overlay emocional) ──
const CinemaView = ({ entries, eras, onZoom }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

    // Fase 2: ambient music toggle
  const [ambientOn, setAmbientOn] = useState(false);

  // S122-A fix: hooks deben ejecutarse siempre — antes del early return
  useEffect(() => {
    if (!entries.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPaused(false);
    pauseTimerRef.current = setTimeout(() => setIsPaused(true), 3000);
    return () => { if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current); };
  }, [currentIdx, entries.length]);

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
                <img src={imgUrl} alt={entry.title || ""} className="w-full h-full object-contain" loading="lazy" decoding="async" />
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

      {/* Navigation + ambient music toggle */}
      <div className="flex items-center gap-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCurrentIdx(i => (i - 1 + entries.length) % entries.length)}
          className="text-xl w-11 h-11 flex items-center justify-center rounded-full"
          style={{ color: eraColor, border: `1px solid ${eraColor}33`, background: `${eraColor}08` }}>
          ◀
        </motion.button>
        <span className="text-xs tabular-nums opacity-50" style={{ color: eraColor, fontFamily: FONT_MONO }}>
          {safeIdx + 1} / {entries.length}
        </span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCurrentIdx(i => (i + 1) % entries.length)}
          className="text-xl w-11 h-11 flex items-center justify-center rounded-full"
          style={{ color: eraColor, border: `1px solid ${eraColor}33`, background: `${eraColor}08` }}>
          ▶
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onZoom?.(entry)}
          className="text-sm w-11 h-11 flex items-center justify-center rounded-full"
          style={{ color: eraColor, border: `1px solid ${eraColor}22`, background: `${eraColor}05` }} title="Ampliar">
          ⊞
        </motion.button>
        {/* Fase 2: Ambient music toggle */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setAmbientOn(!ambientOn)}
          className="text-sm min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
          style={{ color: ambientOn ? eraColor : `${eraColor}44`, border: `1px solid ${ambientOn ? eraColor : `${eraColor}22`}`, background: ambientOn ? `${eraColor}12` : "transparent" }} title={ambientOn ? "Ambient ON" : "Ambient OFF"}>
          {ambientOn ? "♫" : "♪"}
        </motion.button>
      </div>

      {ambientOn && era && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] opacity-20 italic" style={{ color: eraColor, fontFamily: FONT_MONO }}>
          ♫ Música ambiente de {eraName} — próximamente
        </motion.p>
      )}

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

  if (!entries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin entradas</p>;

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
            className="text-xs px-3 py-2 rounded-sm uppercase tracking-widest"
            style={{
              color: filterMode === "all" ? PURPLE : `${PURPLE}44`,
              borderBottom: filterMode === "all" ? `1px solid ${PURPLE}` : "1px solid transparent",
            }}>
            TODO
          </button>
          <button onClick={() => setFilterMode("conversations")}
            className="text-xs px-3 py-2 rounded-sm uppercase tracking-widest"
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
                          <img src={eduImg} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
                          <img src={davidImg} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
  const eraGroups = useMemo(() => {
    const groups = {};
    entries.forEach(e => {
      const eraId = e.era_id || "_sin_era";
      if (!groups[eraId]) groups[eraId] = [];
      groups[eraId].push(e);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [entries]);

  if (!entries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin entradas</p>;

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
                    <img src={firstImg} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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

  if (!entries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin entradas</p>;

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
          <button onClick={() => setActiveReel(null)} className="text-xs self-start px-3 py-2.5 rounded-sm" style={{ color: PURPLE, border: `1px solid ${PURPLE}33` }}>← VOLVER</button>
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

// ─── MAP VIEW (S130-A + Fase 2: capas Era/Año + distancias + carrusel popup) ──
// S130-A: Leaflet defaultIcon fix — workaround estándar para bundlers (Vite/Webpack rompen el path relativo por defecto)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Fase 2: calcular distancia (Haversine) entre dos puntos en km
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Fase 2: calcular distancia total entre pines consecutivos ordenados cronológicamente
const calcTotalDistance = (entries) => {
  if (entries.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < entries.length; i++) {
    total += haversineKm(entries[i - 1].lat, entries[i - 1].lng, entries[i].lat, entries[i].lng);
  }
  return total;
};

// S130-A: divIcon helper — círculo coloreado por Era con glow búnker (no usa PNG default)
const makePinIcon = (color) => L.divIcon({
  className: "bunker-pin",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 8px ${color}cc,0 0 16px ${color}55;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

// S130-A: 9 entries demo hardcoded (Madrid + 5 ciudades España + Lisboa + París + Roma). Sub-fase 4 las reemplaza por geocoder real.
const DEMO_ENTRIES_GEO = [
  { id: "demo-m1",  title: "Atocha al atardecer",   era_id: 1, era_name: "RUTINA",      color: "#bfff00", type: "place",  lat: 40.4068, lng: -3.6903,  date: "2024-03-15T19:30:00Z", from_user: "edu"   },
  { id: "demo-m2",  title: "Cena en Malasaña",      era_id: 1, era_name: "RUTINA",      color: "#bfff00", type: "place",  lat: 40.4258, lng: -3.7058,  date: "2024-05-22T22:00:00Z", from_user: "david" },
  { id: "demo-bcn", title: "Búnker del Carmel",     era_id: 2, era_name: "VIAJE",       color: "#ff8c42", type: "travel", lat: 41.4178, lng:  2.1525,  date: "2024-07-08T20:15:00Z", from_user: "edu"   },
  { id: "demo-gr",  title: "Alhambra",             era_id: 2, era_name: "VIAJE",       color: "#ff8c42", type: "travel", lat: 37.1761, lng: -3.5881,  date: "2023-11-12T11:00:00Z", from_user: "david" },
  { id: "demo-sv",  title: "Plaza de España",       era_id: 2, era_name: "VIAJE",       color: "#ff8c42", type: "travel", lat: 37.3773, lng: -5.9869,  date: "2024-04-01T16:30:00Z", from_user: "edu"   },
  { id: "demo-vlc", title: "Ciudad de las Artes",  era_id: 2, era_name: "VIAJE",       color: "#ff8c42", type: "place",  lat: 39.4549, lng: -0.3517,  date: "2023-06-20T13:45:00Z", from_user: "david" },
  { id: "demo-lis", title: "Alfama al amanecer",    era_id: 2, era_name: "VIAJE",       color: "#ff8c42", type: "travel", lat: 38.7113, lng: -9.1305,  date: "2024-09-14T08:00:00Z", from_user: "edu"   },
  { id: "demo-par", title: "Sena en Nochevieja",    era_id: 3, era_name: "CELEBRACIÓN", color: "#a96fff", type: "travel", lat: 48.8589, lng:  2.2935,  date: "2023-12-31T23:55:00Z", from_user: "edu"   },
  { id: "demo-rm",  title: "Fontana di Trevi",      era_id: 3, era_name: "CELEBRACIÓN", color: "#a96fff", type: "travel", lat: 41.9009, lng: 12.4833,  date: "2024-02-18T18:00:00Z", from_user: "david" },
];

// S130-A: Auto-fit bounds a todos los pines (sin esto mapa arranca en Madrid center y hay que panear)
// lives at module scope porque useMap requiere contexto de MapContainer (no funciona dentro del JSX conditional de MapView)
const FitBoundsToMarkers = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions);
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [map, positions]);
  return null;
};

// S130-B: Polylines animados entre entries de la misma Era (viaje visual)
const JourneyPolylines = ({ geocoded }) => {
  const eraRoutes = useMemo(() => {
    const groups = {};
    geocoded.forEach((e) => {
      const key = e.era_id ?? "none";
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.values(groups)
      .filter((g) => g.length >= 2)
      .map((g) => g.sort((a, b) => new Date(a.date) - new Date(b.date)));
  }, [geocoded]);

  if (!eraRoutes.length) return null;

  return (
    <>
      <style>{`
        @keyframes bunkerDashMove { to { stroke-dashoffset: -16; } }
        .bunker-polyline { animation: bunkerDashMove 1.5s linear infinite; }
      `}</style>
      {eraRoutes.map((group) => {
        const positions = group.map((e) => [e.lat, e.lng]);
        const color = group[0].color ?? PURPLE;
        return (
          <Polyline
            key={`route-${group[0].era_id ?? "none"}`}
            positions={positions}
            pathOptions={{
              color,
              opacity: 0.6,
              weight: 2,
              dashArray: "8, 8",
              className: "bunker-polyline",
            }}
          />
        );
      })}
    </>
  );
};

// S130-C: formatear fecha para slider compacto
const fmtSliderDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" });
};

// S130-D: normaliza entries desde formato legacy (flat lat/lng) y nuevo (content.lat/lng)
const normalizeEntry = (e, eras) => {
  const era = eras.find((er) => er.id === e.era_id);
  return {
    ...e,
    lat: e.lat ?? e.content?.lat,
    lng: e.lng ?? e.content?.lng,
    era_name: e.era_name ?? era?.name ?? "—",
    color: e.color ?? era?.color ?? PURPLE,
    date: e.date ?? e.content?.event_date ?? e.created_at,
    from_user: e.from_user ?? e.from ?? "—",
  };
};

// S130-A: MapView real con capas (Fase 2). Si `entries` prop viene vacío, usa DEMO_ENTRIES_GEO hardcoded.
const MapView = ({ entries = DEMO_ENTRIES_GEO, eras = [] }) => {
  const normalized = useMemo(() => entries.map((e) => normalizeEntry(e, eras)), [entries, eras]);
  const geocoded = useMemo(
    () => normalized.filter((e) => typeof e.lat === "number" && typeof e.lng === "number"),
    [normalized]
  );
  // Fase 2: capas — filter by Era or year
  const [mapLayer, setMapLayer] = useState("all"); // "all" | era_id | year
  const layerFiltered = useMemo(() => {
    if (mapLayer === "all") return geocoded;
    if (/^\d{4}$/.test(mapLayer)) return geocoded.filter((e) => new Date(e.date).getFullYear().toString() === mapLayer);
    return geocoded.filter((e) => (e.era_id ?? "none").toString() === mapLayer);
  }, [geocoded, mapLayer]);

  // Fase 2: capas disponibles (Eras + años únicos)
  const layerOptions = useMemo(() => {
    const eraSet = new Map();
    const yearSet = new Set();
    geocoded.forEach((e) => {
      if (e.era_id) eraSet.set(e.era_id.toString(), e.era_name ?? e.era_id);
      const y = new Date(e.date).getFullYear();
      if (!isNaN(y)) yearSet.add(y.toString());
    });
    return {
      eras: Array.from(eraSet.entries()).map(([id, name]) => ({ id, label: name, icon: "🏛️" })),
      years: Array.from(yearSet).sort().reverse().map((y) => ({ id: y, label: y, icon: "📅" })),
    };
  }, [geocoded]);

  // Fase 2: distancia total del viaje visible
  const totalKm = useMemo(() => calcTotalDistance(layerFiltered), [layerFiltered]);
  // era breakdown
  const eraBreakdown = useMemo(
    () => Object.values(layerFiltered.reduce((acc, e) => { acc[e.era_name ?? "—"] = (acc[e.era_name ?? "—"] || 0) + 1; return acc; }, {})),
    [layerFiltered]
  );
  const dateRange = useMemo(() => {
    const dates = layerFiltered.map((e) => new Date(e.date).getTime()).filter((t) => !isNaN(t));
    if (!dates.length) return null;
    return { min: Math.min(...dates), max: Math.max(...dates) };
  }, [layerFiltered]);
  const [dateMin, setDateMin] = useState(null);
  const [dateMax, setDateMax] = useState(null);
  useEffect(() => {
    if (dateRange) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDateMin((p) => p ?? dateRange.min);
      setDateMax((p) => p ?? dateRange.max);
    }
  }, [dateRange]);
  const filteredByDate = useMemo(() => {
    if (!dateRange || !dateMin || !dateMax) return layerFiltered;
    return layerFiltered.filter((e) => {
      const t = new Date(e.date).getTime();
      return t >= dateMin && t <= dateMax;
    });
  }, [layerFiltered, dateMin, dateMax, dateRange]);
  const filteredPositions = useMemo(() => filteredByDate.map((e) => [e.lat, e.lng]), [filteredByDate]);

  return (
    <div className="flex flex-col gap-2" style={{ fontFamily: FONT_MONO }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ color: PURPLE }}>◉</span>
        <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: PURPLE }}>MAP</span>
        <span className="text-[9px] opacity-30" style={{ color: PURPLE }}>
          {filteredByDate.length}/{geocoded.length} pines · {eraBreakdown.length} eras
        </span>
        {totalKm > 0 && (
          <span className="text-[9px] opacity-30" style={{ color: PURPLE }}>
            · {totalKm < 1 ? `${(totalKm * 1000).toFixed(0)}m` : `${totalKm.toFixed(0)}km`}
          </span>
        )}
        <span className="text-[9px] opacity-20 ml-auto" style={{ color: PURPLE }}>
          CARTO DARK · OSM
        </span>
      </div>

      {/* Fase 2: Capas — toggle Eras + Años */}
      {(layerOptions.eras.length > 1 || layerOptions.years.length > 0) && (
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setMapLayer("all")}
            className={`text-[9px] px-2 py-1.5 rounded-sm whitespace-nowrap ${mapLayer === "all" ? "" : "opacity-30"}`}
            style={{ color: PURPLE, borderBottom: mapLayer === "all" ? `1px solid ${PURPLE}` : "1px solid transparent" }}>
            🌍 TODOS
          </button>
          {layerOptions.eras.map((era) => (
            <button key={era.id} onClick={() => setMapLayer(era.id)}
              className={`text-[9px] px-2 py-1.5 rounded-sm whitespace-nowrap ${mapLayer === era.id ? "" : "opacity-30"}`}
              style={{ color: PURPLE, borderBottom: mapLayer === era.id ? `1px solid ${PURPLE}` : "1px solid transparent" }}>
              {era.icon} {era.label}
            </button>
          ))}
          {layerOptions.years.map((y) => (
            <button key={y.id} onClick={() => setMapLayer(y.id)}
              className={`text-[9px] px-2 py-1.5 rounded-sm whitespace-nowrap ${mapLayer === y.id ? "" : "opacity-30"}`}
              style={{ color: PURPLE, borderBottom: mapLayer === y.id ? `1px solid ${PURPLE}` : "1px solid transparent" }}>
              {y.icon} {y.label}
            </button>
          ))}
        </div>
      )}

      {/* S130-C: slider temporal dual-range */}
      {dateRange && dateMin !== null && dateMax !== null && (
        <div className="flex items-center gap-2 px-1 pb-1">
          <span className="text-[7px] opacity-40 w-[52px] text-right shrink-0 leading-tight" style={{ color: PURPLE }}>
            {fmtSliderDate(dateMin)}
          </span>
          <div className="relative flex-1 h-11 py-3">
            <input type="range" min={dateRange.min} max={dateRange.max} value={dateMin}
              onChange={(e) => setDateMin(Math.min(Number(e.target.value), dateMax))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 pointer-events-auto"
              style={{ accentColor: PURPLE, margin: 0 }} />
            <input type="range" min={dateRange.min} max={dateRange.max} value={dateMax}
              onChange={(e) => setDateMax(Math.max(Number(e.target.value), dateMin))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 pointer-events-auto"
              style={{ accentColor: PURPLE, margin: 0 }} />
            {/* Track visual personalizado */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full" style={{ background: `${PURPLE}15` }}>
              <div className="absolute h-full rounded-full" style={{
                left: `${((dateMin - dateRange.min) / (dateRange.max - dateRange.min)) * 100}%`,
                right: `${100 - ((dateMax - dateRange.min) / (dateRange.max - dateRange.min)) * 100}%`,
                background: PURPLE,
                opacity: 0.5,
              }} />
            </div>
          </div>
          <span className="text-[7px] opacity-40 w-[52px] shrink-0 leading-tight" style={{ color: PURPLE }}>
            {fmtSliderDate(dateMax)}
          </span>
        </div>
      )}

      {geocoded.length === 0 ? (
        // Fallback elegante (idéntico al placeholder S122-E, preservado para entries sin coords)
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-12 px-6 rounded-sm"
          style={{ background: `${PURPLE}05`, border: `1px dashed ${PURPLE}22` }}>
          <motion.span animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl" style={{ color: PURPLE }}>🌍</motion.span>
          <p className="text-xs tracking-[0.25em] uppercase text-center" style={{ color: PURPLE, opacity: 0.4 }}>MAPA · Geografía de la relación</p>
          <p className="text-[10px] leading-relaxed text-center max-w-xs" style={{ color: PURPLE, opacity: 0.2 }}>
            Las entradas necesitan coordenadas para aparecer aquí. Usa el buscador de ubicaciones al crear o editar una entrada, o introduce lat/lng manualmente.
          </p>
          <div className="flex gap-3 mt-2">
            <span className="text-[8px] px-2 py-1 rounded-sm" style={{ background: `${PURPLE}10`, color: PURPLE }}>📍 Geocoder</span>
            <span className="text-[8px] px-2 py-1 rounded-sm" style={{ background: `${PURPLE}10`, color: PURPLE }}>〰 Polylines</span>
            <span className="text-[8px] px-2 py-1 rounded-sm" style={{ background: `${PURPLE}10`, color: PURPLE }}>⧖ Slider temp.</span>
          </div>
        </motion.div>
      ) : filteredByDate.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-sm"
          style={{ background: `${PURPLE}05`, border: `1px dashed ${PURPLE}22` }}>
          <span className="text-3xl" style={{ color: PURPLE, opacity: 0.4 }}>⧖</span>
          <p className="text-xs tracking-[0.2em] uppercase text-center" style={{ color: PURPLE, opacity: 0.4 }}>Sin pines en este rango</p>
          <p className="text-[9px] text-center max-w-xs" style={{ color: PURPLE, opacity: 0.2 }}>
            Ajusta el slider temporal para ver más entradas en el mapa.
          </p>
        </motion.div>
      ) : (
        <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${PURPLE}33`, height: "70vh", minHeight: 480 }}>
          <MapContainer
            center={[40.4168, -3.7038]} // Madrid centro (fallback initial center)
            zoom={4}
            scrollWheelZoom
            style={{ height: "100%", width: "100%", background: "#1a1a1a" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains={["a", "b", "c", "d"]}
              maxZoom={20}
            />
            <FitBoundsToMarkers positions={filteredPositions} />
            <JourneyPolylines geocoded={filteredByDate} />
            <MarkerClusterGroup chunkedLoading>
              {filteredByDate.map((e) => (
                <Marker key={e.id} position={[e.lat, e.lng]} icon={makePinIcon(e.color ?? PURPLE)}>
                  <Popup>
                    <div style={{ fontFamily: FONT_MONO, minWidth: 180 }}>
                      <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 4 }}>
                        {(e.era_name ?? "—").toUpperCase()} · {e.from_user === "edu" ? "EDU" : e.from_user === "david" ? "DAVID" : ""}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 4 }}>
                        {e.title}
                      </div>
                      {e.date && (
                        <div style={{ fontSize: 9, opacity: 0.5, color: "#000" }}>
                          {new Date(e.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      )}
                      <div style={{ fontSize: 8, opacity: 0.4, marginTop: 4, color: "#000" }}>
                        {CAT_ICON[ENTRY_CATEGORY[e.type]] ?? "◈"} {CAT_LABEL[ENTRY_CATEGORY[e.type]] ?? e.type}
                      </div>
                      {/* Fase 6: foto thumbnail en popup si tiene imagen */}
                      {(e.content?.images?.[0]?.r2_key || e.content?.images?.[0]?.dataUrl) && (
                        <div style={{ marginTop: 6, borderRadius: 4, overflow: "hidden", maxHeight: 120 }}>
                          <img
                            src={e.content.images[0].r2_key ? `${R2_PUBLIC_BASE}/${e.content.images[0].r2_key}` : e.content.images[0].dataUrl}
                            alt={e.title || ""}
                            style={{ width: "100%", height: "auto", maxHeight: 120, objectFit: "cover", display: "block" }}
                            loading="lazy"
                          />
                        </div>
                      )}
                      {typeof e.lat === "number" && (
                        <div style={{ fontSize: 7, opacity: 0.3, marginTop: 2, color: "#000" }}>
                          {e.lat.toFixed(4)}, {e.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      )}

      {geocoded.length > 0 && (
        <p className="text-[9px] text-center opacity-25 mt-1" style={{ color: PURPLE }}>
          S130-D · Sub-fase 4 · geocoder + entries reales · slider temporal · polylines · {filteredByDate.length}/{geocoded.length} pines
        </p>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function VaultGallery({ entries = [], eras = [], onOpenEntry: _onOpenEntry }) {
  const [mode, setMode] = useState("wall");
  const [density, setDensity] = useState("normal");
  const [, setCurrentIdx] = useState(0);

  // VB9: vibe accent from current track — propagates to mode bar, category filter, etc.
  const { trackVibe, resolveVibeAccent } = usePlayer();
  const vibeAccent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;

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

  // Fase 1: WALL delegado a WallView.jsx (virtualización + pinch zoom + badges + stagger)
  const renderWall = () => (
    <WallView
      entries={filteredEntries}
      eras={eras}
      density={density}
      setDensity={setDensity}
      filterCategory={filterCategory}
      accentColor={vibeAccent}
    />
  );

  // S122-A: CINEMA delegado a componente separado CinemaView (hooks propios, swipe + Ken Burns)
  const renderCinema = () => (
    <CinemaView entries={filteredEntries} eras={eras} />
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

  // S130-D: MAP con entries reales. MapView normaliza lat/lng desde content.* (backward compat con DEMO_ENTRIES_GEO).
  const renderMap = () => <MapView entries={filteredEntries} eras={eras} />;

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: FONT_MONO }}>
      {/* Fase 4: Live Sync indicator placeholder */}
      <div className="text-[8px] text-center opacity-10 tracking-[0.4em] uppercase" style={{ color: PURPLE, fontFamily: FONT_MONO }}>
        LIVE SYNC · próximamente
      </div>
      {/* Mode bar — VB9: vibe-reactive accent */}
      <nav className="flex gap-1 overflow-x-auto">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`text-xs px-3 py-2.5 uppercase whitespace-nowrap ${mode === m.id ? "" : "opacity-30"}`}
            style={{ color: vibeAccent, borderBottom: mode === m.id ? `1px solid ${vibeAccent}` : "1px solid transparent", fontFamily: FONT_MONO }}>
            {m.icon} {m.label}
          </button>
        ))}
      </nav>

      {/* S95 — Filtro por categoría (14 categorías) — VB9: vibe-reactive */}
      <div className="flex gap-0.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setFilterCategory(cat.id); setCurrentIdx(0); }}
            className={`text-xs px-2.5 py-2 rounded-sm whitespace-nowrap transition-all flex-shrink-0 ${filterCategory === cat.id ? "" : "opacity-25 hover:opacity-50"}`}
            style={{
              color: filterCategory === cat.id ? vibeAccent : `${vibeAccent}88`,
              borderBottom: filterCategory === cat.id ? `1px solid ${vibeAccent}` : "1px solid transparent",
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

      {/* Fase 1: Preview + Zoom now handled inside WallView.jsx */}
    </div>
  );
}
