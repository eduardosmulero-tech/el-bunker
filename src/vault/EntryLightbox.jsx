// ============================================================
//  EL BÚNKER — EntryLightbox.jsx
//  FASE C.1: Lightbox unificado para todos los modos de galería
//  Portal full-bleed, swipe horizontal, pinch-zoom, metadata overlay
//  vía createPortal → libre de CRT (decisión 2, S145)
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO } from "../tokens";
import { Icon } from "../core/ui";
import { CATEGORY_FILTERS } from "./AddEntryForm";
import { ENTRY_CATEGORY, getImageUrl, getMediaType } from "./VaultHelpers";

// ─── CONSTANTS ──────────────────────────────────────────────
const SWIPE_THRESHOLD = 60;
const CLOSE_VELOCITY = 400;
const ZOOM_IN_SCALE = 2.5;
const MAX_SCALE = 4;
const MIN_SCALE = 1;

const CAT_LABEL = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.label]));
const CAT_ICON = Object.fromEntries(CATEGORY_FILTERS.map((c) => [c.id, c.icon]));

// ─── UTIL ────────────────────────────────────────────────────
const getDistance = (t1, t2) => {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function EntryLightbox({ entries = [], startIndex = 0, onClose, eras = [], accentColor = ACID }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [direction, setDirection] = useState(0);
  const [scale, setScale] = useState(MIN_SCALE);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const pinchRef = useRef({ startDist: 0, startScale: 1 });
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const panBase = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  const entry = entries[currentIndex];
  const total = entries.length;
  const ac = accentColor;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reset zoom/pan when changing entries (batched in React 18)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setScale(MIN_SCALE);
    setPanOffset({ x: 0, y: 0 });
    setIsZoomed(false);
  }, [currentIndex]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { onClose?.(); return; }
      if (e.key === "ArrowLeft" && currentIndex > 0) { setDirection(-1); setCurrentIndex(i => i - 1); }
      if (e.key === "ArrowRight" && currentIndex < total - 1) { setDirection(1); setCurrentIndex(i => i + 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, total, onClose]);

  const goNext = useCallback(() => {
    if (currentIndex >= total - 1) return;
    setDirection(1);
    setCurrentIndex(i => i + 1);
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const onTouchStartHandler = useCallback((e) => {
    if (isClosing) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };

    if (e.touches.length === 2) {
      pinchRef.current = { startDist: getDistance(e.touches[0], e.touches[1]), startScale: scale };
      panBase.current = { x: panOffset.x, y: panOffset.y };
    }

    // Save pan base for single-finger drags when zoomed
    if (e.touches.length === 1 && isZoomed) {
      panBase.current = { x: panOffset.x, y: panOffset.y };
    }

    // FIX minor (auditoría S148): double-tap solo en single-finger. Antes
    // lastTap se actualizaba en TODO touchstart (incluido 2-dedos pinch),
    // causando zoom toggle espurio tras un pinch seguido de tap simple <300ms.
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (isZoomed) {
          setScale(MIN_SCALE);
          setPanOffset({ x: 0, y: 0 });
          setIsZoomed(false);
        } else {
          setScale(ZOOM_IN_SCALE);
          setIsZoomed(true);
        }
      }
      lastTap.current = now;
    }
  }, [scale, isZoomed, isClosing, panOffset]);

  const onTouchMoveHandler = useCallback((e) => {
    if (isClosing) return;
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      const delta = dist - pinchRef.current.startDist;
      if (Math.abs(delta) > 5) {
        const newScale = clamp(pinchRef.current.startScale * (dist / pinchRef.current.startDist), MIN_SCALE, MAX_SCALE);
        setScale(newScale);
        setIsZoomed(newScale > MIN_SCALE + 0.05);
      }
    } else if (e.touches.length === 1 && isZoomed) {
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;
      setPanOffset({ x: panBase.current.x + dx, y: panBase.current.y + dy });
    }
  }, [isZoomed, isClosing]);

  const onTouchEndHandler = useCallback((e) => {
    if (isClosing) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStart.current.x) - touchStart.current.x;
    const dy = (e.changedTouches[0]?.clientY ?? touchStart.current.y) - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;
    const velocity = dt > 0 ? Math.abs(dx) / (dt / 1000) : 0;

    if (isZoomed) return;

    if (dx < -SWIPE_THRESHOLD || (dx < -30 && velocity > CLOSE_VELOCITY)) { goNext(); }
    else if (dx > SWIPE_THRESHOLD || (dx > 30 && velocity > CLOSE_VELOCITY)) { goPrev(); }
    else if (dy > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.5) {
      setIsClosing(true);
      setTimeout(() => onClose?.(), 300);
    }
  }, [goNext, goPrev, onClose, isZoomed, isClosing]);

  // BUG #1 FIX (auditoría S148): guard ANTES de cualquier acceso a entry.* —
  // getImageUrl(entry) hace entry.content?.images y crashea con TypeError si
  // entry es undefined (pantalla blanca). Antes el guard estaba 5 líneas más abajo.
  if (!entry) return null;

  // REVIEW FIX: hoist para evitar llamar getMediaType dos veces en el ternario.
  const mediaType = getMediaType(entry);
  const era = eras.find(e => e.id === entry.era_id);
  const eraColor = era?.color ?? ac;
  const imgUrl = getImageUrl(entry);
  const whoName = entry.from_user === "edu" ? "Edu" : entry.from_user === "david" ? "David" : "";
  const whoColor = entry.from_user === "edu" ? ac : entry.from_user === "david" ? PURPLE : `${ac}66`;
  const dateStr = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 flex flex-col"
      style={{
        zIndex: 100,
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        fontFamily: FONT_MONO,
        touchAction: "none",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (isZoomed) { setScale(MIN_SCALE); setPanOffset({ x: 0, y: 0 }); setIsZoomed(false); }
          else { onClose?.(); }
        }
      }}
    >
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 pointer-events-none"
        style={{ background: "linear-gradient(rgba(0,0,0,0.6), transparent)" }}>
        {total > 1 ? (
          <span className="text-xs tabular-nums tracking-wider pointer-events-auto" style={{ color: ac, opacity: 0.6 }}>
            {currentIndex + 1} / {total}
          </span>
        ) : <span />}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xl rounded-full pointer-events-auto"
          style={{ color: ac, background: "rgba(255,255,255,0.06)", border: `1px solid ${ac}22` }}
        >
          <Icon name="close" size={18} label="Cerrar" />
        </motion.button>
      </div>

      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -80 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* BUG #2 FIX (auditoría S148): scale/pan en div plano interior.
                framer-motion posee `transform` cuando anima x (slide), y
                sobrescribe cualquier style.transform inline. Sin esta
                separación, pinch-zoom (scale) y pan (translate) actualizan
                state pero NO se pintan — feature core de FASE C.1 rota en móvil. */}
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`,
                transformOrigin: "center center",
              }}
            >
              {/* BUG #4 FIX (auditoría S148): rama <video> para entries de vídeo.
                  Antes siempre renderizaba <img src="...mp4"> (roto). Espejo
                  de CinemaView: video → <video controls>, audio → placeholder. */}
              {imgUrl ? (
                mediaType === "video" ? (
                  <video
                    src={imgUrl}
                    controls
                    muted
                    onPlay={(event) => { event.currentTarget.muted = true; event.currentTarget.volume = 0; }}
                    onVolumeChange={(event) => { event.currentTarget.muted = true; event.currentTarget.volume = 0; }}
                    className="max-w-full max-h-full object-contain select-none"
                    style={{ maxWidth: "95vw", maxHeight: "90vh", boxShadow: `0 0 80px ${eraColor}15` }}
                  />
                ) : mediaType === "audio" ? (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <Icon name="music" size={54} label="Audio" />
                    <p className="text-xs text-center opacity-50" style={{ color: eraColor, fontFamily: FONT_MONO }}>
                      AUDIO · Reproducir en Music Lab
                    </p>
                    {entry.content?.text && (
                      <p className="text-xs italic opacity-30 text-center max-w-xs" style={{ color: eraColor }}>
                        "{entry.content.text.slice(0, 120)}"
                      </p>
                    )}
                  </div>
                ) : (
                  <img
                    src={imgUrl}
                    alt={entry.title || ""}
                    className="max-w-full max-h-full object-contain select-none"
                    draggable={false}
                    style={{ maxWidth: "95vw", maxHeight: "90vh", boxShadow: `0 0 80px ${eraColor}15` }}
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Icon name="camera" size={54} label="Sin imagen" />
                  {entry.content?.text && (
                    <p className="text-sm max-w-md text-center px-8 leading-relaxed" style={{ color: eraColor, opacity: 0.6 }}>
                      {entry.content.text.slice(0, 400)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {total > 1 && !isZoomed && (
          <>
            {currentIndex > 0 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center text-lg rounded-full"
                style={{ color: ac, background: "rgba(0,0,0,0.4)", border: `1px solid ${ac}22` }}
              ><Icon name="arrowLeft" size={18} label="Anterior" /></motion.button>
            )}
            {currentIndex < total - 1 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center text-lg rounded-full"
                style={{ color: ac, background: "rgba(0,0,0,0.4)", border: `1px solid ${ac}22` }}
              ><Icon name="arrowRight" size={18} label="Siguiente" /></motion.button>
            )}
          </>
        )}

        {isZoomed && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
            <span className="text-[10px] px-3 py-1.5 rounded-sm" style={{ color: ac, background: "rgba(0,0,0,0.5)", border: `1px solid ${ac}33` }}>
              {Math.round(scale * 100)}% · desliza para mover · doble tap para restaurar
            </span>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-4"
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {whoName && (
              <span className="text-xs px-2 py-0.5 rounded-sm font-bold" style={{ background: `${whoColor}22`, color: whoColor }}>{whoName}</span>
            )}
            {era && (
              <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: `${eraColor}22`, color: eraColor }}>{era.name}</span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded-sm opacity-60" style={{ background: `${ac}15`, color: ac }}>
              <Icon name={CAT_ICON[ENTRY_CATEGORY[entry.type]] ?? "archive"} size={12} decorative /> {CAT_LABEL[ENTRY_CATEGORY[entry.type]] ?? entry.type}
            </span>
            {dateStr && <span className="text-[9px] opacity-35 ml-auto" style={{ color: ac }}>{dateStr}</span>}
          </div>
          {entry.title && <p className="text-sm font-bold mb-1" style={{ color: ac }}>"{entry.title}"</p>}
          {entry.content?.text && (
            <p className="text-xs opacity-55 leading-relaxed line-clamp-4" style={{ color: ac }}>{entry.content.text}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {entry.content?.location_name && (
              <span className="text-[9px] px-2 py-0.5 rounded-sm opacity-45" style={{ color: eraColor, background: `${eraColor}10`, border: `1px solid ${eraColor}18` }}>
                📍 {entry.content.location_name}
              </span>
            )}
            {entry.content?.event_date && (
              <span className="text-[9px] px-2 py-0.5 rounded-sm opacity-45" style={{ color: eraColor, background: `${eraColor}10`, border: `1px solid ${eraColor}18` }}>
                <Icon name="calendar" size={12} decorative /> {new Date(entry.content.event_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
          <p className="text-[9px] mt-3 opacity-15 text-center" style={{ color: ac }}>
            tap para cerrar · desliza para navegar · doble tap zoom · pellizca
          </p>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
