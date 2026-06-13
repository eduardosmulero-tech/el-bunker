// ============================================================
//  EL BÚNKER — VaultGallery.jsx
//  Galería del VAULT: 6 modos (ADR-021)
//  WALL · CINEMA · MAP · DIALOGUE · REEL · EXHIBITION
//  S59-S63, S72-S73, S84-S85 · Fases 2-6
//  Renderiza imágenes reales desde entry.content.images
// ============================================================
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";

const MODES = [
  { id: "wall",       icon: "⊞", label: "WALL" },
  { id: "cinema",     icon: "▶", label: "CINEMA" },
  { id: "map",        icon: "◉", label: "MAP" },
  { id: "dialogue",   icon: "♥", label: "DIALOGUE" },
  { id: "exhibition", icon: "◆", label: "EXHIBITION" },
  { id: "reel",       icon: "◎", label: "REEL" },
];

const DENSITY = { compact: "80px", normal: "120px", expanded: "180px" };

const R2_PUBLIC_BASE = "https://el-bunker-api.thebunker-admin.workers.dev";

/** Resuelve la URL de una imagen desde el contenido de la entrada */
const getImageUrl = (entry) => {
  const images = entry.content?.images;
  if (!images?.length) return null;
  const img = images[0];
  if (img.r2_key) return `${R2_PUBLIC_BASE}/${img.r2_key}`;
  if (img.dataUrl) return img.dataUrl;
  return null;
};

export default function VaultGallery({ entries = [], eras = [], jwtToken: _jwtToken = null, onOpenEntry }) {
  const [mode, setMode] = useState("wall");
  const [density, setDensity] = useState("normal");
  const [currentIdx, setCurrentIdx] = useState(0);

  const photoEntries = useMemo(() =>
    entries.filter(e => e.type === "photo" && !e.is_deleted),
    [entries]
  );

  const renderWall = () => (
    <div className="flex flex-col gap-3">
      {/* Density control */}
      <div className="flex gap-1">
        {Object.keys(DENSITY).map(d => (
          <button key={d} onClick={() => setDensity(d)}
            className={`text-xs px-2 py-1 uppercase ${density === d ? "" : "opacity-30"}`}
            style={{ color: ACID, border: density === d ? `1px solid ${ACID}44` : `1px solid transparent`, fontFamily: FONT_MONO }}>
            {d}
          </button>
        ))}
      </div>

      {/* Masonry grid con imágenes reales */}
      <div className="columns-2 gap-2" style={{ columnWidth: DENSITY[density] }}>
        {photoEntries.map((entry, i) => {
          const era = eras.find(e => e.id === entry.era_id);
          const imgUrl = getImageUrl(entry);
          return (
            <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => onOpenEntry?.(entry)}
              className="mb-2 cursor-pointer relative overflow-hidden rounded-sm"
              style={{ background: era?.color ? `${era.color}22` : GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={entry.title || ""}
                  className="w-full object-cover"
                  style={{ minHeight: density === "compact" ? 80 : density === "expanded" ? 200 : 140 }}
                  loading="lazy"
                />
              ) : (
                <div className="aspect-square flex items-center justify-center text-4xl opacity-30" style={{ color: ACID }}>📷</div>
              )}
              {entry.title && (
                <div className="absolute bottom-0 left-0 right-0 p-1 text-xs truncate" style={{ background: "rgba(0,0,0,0.7)", color: ACID, fontFamily: FONT_MONO }}>
                  {entry.title}
                </div>
              )}
              {era && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: era.color }} />
              )}
            </motion.div>
          );
        })}
      </div>
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
    </div>
  );
}
