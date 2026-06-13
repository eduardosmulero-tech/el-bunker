// ============================================================
//  EL BÚNKER — VaultGallery.jsx
//  Galería del VAULT: 6 modos (ADR-021)
//  S66 — WALL masonry responsive + long-press preview + zoom
// ============================================================
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";

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

const R2_PUBLIC_BASE = "https://el-bunker-api.thebunker-admin.workers.dev";

const getImageUrl = (entry) => {
  const images = entry.content?.images;
  if (!images?.length) return null;
  const img = images[0];
  if (img.r2_key) return `${R2_PUBLIC_BASE}/${img.r2_key}`;
  if (img.dataUrl) return img.dataUrl;
  return null;
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

      {/* Era dot */}
      {era && (
        <div
          className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full opacity-80"
          style={{ background: era.color, boxShadow: `0 0 6px ${era.color}` }}
        />
      )}

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
        <span className="text-xs opacity-30" style={{ color: ACID }}>
          {new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })}
        </span>
      </div>

      {/* Image */}
      {imgUrl ? (
        <div className="rounded-sm overflow-hidden mb-2" style={{ maxHeight: 180 }}>
          <img src={imgUrl} alt={entry.title || ""} className="w-full object-cover" style={{ maxHeight: 180 }} />
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
          <img
            src={imgUrl}
            alt={entry.title || ""}
            className="max-w-full max-h-[75vh] object-contain rounded-sm"
            style={{ boxShadow: `0 0 60px ${era?.color || ACID}22` }}
          />
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

// ═══════════════════════════════════════════════════════════════
//  VAULT GALLERY MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function VaultGallery({ entries = [], eras = [], jwtToken: _jwtToken = null, onOpenEntry: _onOpenEntry }) {
  const [mode, setMode] = useState("wall");
  const [density, setDensity] = useState("normal");
  const [currentIdx, setCurrentIdx] = useState(0);
  // S66: Long-press preview + zoom
  const [previewEntry, setPreviewEntry] = useState(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [zoomEntry, setZoomEntry] = useState(null);

  const photoEntries = useMemo(() =>
    entries.filter(e => e.type === "photo" && !e.is_deleted),
    [entries]
  );

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

      {/* S66: Masonry grid con CSS columns responsive */}
      <motion.div
        layout
        style={{
          columnCount: DENSITY_CONFIG[density].columns,
          columnGap: `${DENSITY_CONFIG[density].gap}px`,
        }}
        className="[&>*]:break-inside-avoid"
      >
        {photoEntries.map((entry) => {
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
      </motion.div>

      {!photoEntries.length && (
        <p className="text-xs opacity-30 text-center py-4" style={{ color: ACID, fontFamily: FONT_MONO }}>
          Sin fotos en esta era
        </p>
      )}
    </div>
  );

  const renderCinema = () => {
    if (!photoEntries.length) return <p className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>Sin fotos</p>;
    const entry = photoEntries[currentIdx % photoEntries.length];
    const imgUrl = getImageUrl(entry);
    return (
      <div className="flex flex-col items-center gap-3">
        <motion.div key={currentIdx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full aspect-video flex items-center justify-center overflow-hidden rounded-sm"
          style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
          {imgUrl ? (
            <img src={imgUrl} alt={entry.title || ""} className="w-full h-full object-contain" />
          ) : (
            <span className="text-6xl opacity-30" style={{ color: ACID }}>📷</span>
          )}
        </motion.div>
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: ACID, fontFamily: FONT_MONO }}>{entry.title || "Sin título"}</p>
        <p className="text-xs opacity-40" style={{ color: ACID, fontFamily: FONT_MONO }}>{entry.content?.text || ""}</p>
        <div className="flex gap-4">
          <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} className="text-xl" style={{ color: ACID }}>◀</button>
          <span className="text-xs flex items-center opacity-40" style={{ color: ACID, fontFamily: FONT_MONO }}>
            {currentIdx + 1}/{photoEntries.length}
          </span>
          <button onClick={() => setCurrentIdx(i => i + 1)} className="text-xl" style={{ color: ACID }}>▶</button>
        </div>
      </div>
    );
  };

  const renderDialogue = () => {
    const eduPhotos = photoEntries.filter(e => e.from_user === "edu");
    const davidPhotos = photoEntries.filter(e => e.from_user === "david");
    return (
      <div className="flex flex-col gap-3" style={{ fontFamily: FONT_MONO }}>
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: PURPLE }}>♥ DIALOGUE · Perspectiva dual</p>
        <div className="flex gap-1">
          <div className="flex-1 p-4 text-center text-xs" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: ACID }}>
            EDU<br /><span className="opacity-30">{eduPhotos.length} fotos</span>
          </div>
          <div className="text-2xl flex items-center opacity-30" style={{ color: ACID }}>↔</div>
          <div className="flex-1 p-4 text-center text-xs" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: ACID }}>
            DAVID<br /><span className="opacity-30">{davidPhotos.length} fotos</span>
          </div>
        </div>
        {/* Miniaturas intercaladas */}
        <div className="flex flex-col gap-2">
          {eduPhotos.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2" style={{ background: `${ACID}08`, border: `1px solid ${GLASS_BORDER}` }}>
              <span className="text-xs font-bold" style={{ color: ACID }}>EDU</span>
              {getImageUrl(e) ? (
                <img src={getImageUrl(e)} alt="" className="w-10 h-10 object-cover rounded-sm" />
              ) : (
                <span className="text-lg opacity-30">📷</span>
              )}
              <span className="text-xs truncate opacity-50" style={{ color: ACID }}>{e.title}</span>
            </div>
          ))}
          {davidPhotos.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2" style={{ background: `${PURPLE}08`, border: `1px solid ${PURPLE}33` }}>
              <span className="text-xs font-bold" style={{ color: PURPLE }}>DAVID</span>
              {getImageUrl(e) ? (
                <img src={getImageUrl(e)} alt="" className="w-10 h-10 object-cover rounded-sm" />
              ) : (
                <span className="text-lg opacity-30">📷</span>
              )}
              <span className="text-xs truncate opacity-50" style={{ color: PURPLE }}>{e.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExhibition = () => (
    <div className="flex flex-col gap-2" style={{ fontFamily: FONT_MONO }}>
      <p className="text-xs tracking-[0.3em] uppercase" style={{ color: PURPLE }}>◆ EXHIBITION · Por eras</p>
      <div className="flex flex-wrap gap-2">
        {eras.map(era => {
          const eraEntries = photoEntries.filter(e => e.era_id === era.id);
          const firstImg = eraEntries[0] ? getImageUrl(eraEntries[0]) : null;
          return (
            <div key={era.id} className="p-3 text-xs" style={{ background: `${era.color}11`, border: `1px solid ${era.color}44` }}>
              {firstImg && (
                <img src={firstImg} alt="" className="w-full h-16 object-cover rounded-sm mb-1" />
              )}
              <span style={{ color: era.color }}>{era.name}</span>
              <span className="opacity-30 ml-2" style={{ color: ACID }}>
                {eraEntries.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderReel = () => (
    <div className="flex flex-col gap-3" style={{ fontFamily: FONT_MONO }}>
      <p className="text-xs tracking-[0.3em] uppercase" style={{ color: PURPLE }}>◎ REEL · Secuencias</p>
      <div className="flex overflow-x-auto gap-2 pb-2">
        {photoEntries.slice(0, 8).map((e, i) => {
          const imgUrl = getImageUrl(e);
          return (
            <div key={e.id} className="flex-shrink-0 w-24 h-24 flex items-center justify-center overflow-hidden rounded-sm"
              style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              {imgUrl ? (
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="opacity-30 text-2xl">📷{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

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

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {mode === "wall" && renderWall()}
          {mode === "cinema" && renderCinema()}
          {mode === "dialogue" && renderDialogue()}
          {mode === "exhibition" && renderExhibition()}
          {mode === "reel" && renderReel()}
          {mode === "map" && (
            <p className="text-xs opacity-30 text-center py-8" style={{ color: ACID, fontFamily: FONT_MONO }}>
              ◉ MAP · Próximamente — requiere coordenadas en entries
            </p>
          )}
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
