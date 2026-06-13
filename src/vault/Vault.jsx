// ============================================================
//  EL BÚNKER — Vault.jsx
//  Sistema de Eras · Glassmorphism Slider + Widgets
//  Stack: React + Tailwind CSS + Framer Motion
// ============================================================

import { useState, useRef, useEffect } from "react";
import { useVault } from "../core/VaultContext";
import { usePlayer } from "../core/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import AddEntryForm from "./AddEntryForm";
import VaultGallery from "./VaultGallery";
import { entryCreated } from "../core/StatsEngine";

// ─── CONSTANTS ───────────────────────────────────────────────
const DEFAULT_ADVENTURE_DATE = new Date(Date.now() - 500 * 86400000).toISOString();
const DEMO_ERAS = [
  { id: "demo-1", _index: 0, name: "ORIGEN",       description: "El inicio de todo. Días de descubrimiento.",           start_date: new Date(Date.now() - 365*2*86400000).toISOString(), color: ACID,   cover_image: null },
  { id: "demo-2", _index: 1, name: "TORMENTA",      description: "Cuando todo cambió. Caos y belleza entrelazados.",    start_date: new Date(Date.now() - 200*86400000).toISOString(),  color: PURPLE, cover_image: null },
  { id: "demo-3", _index: 2, name: "RENACIMIENTO",  description: "Construyendo algo nuevo desde las cenizas.",          start_date: new Date(Date.now() - 80*86400000).toISOString(),   color: "#ff6b35", cover_image: null },
];

// ─── DESIGN TOKENS ───────────────────────────────────────────
const ACID        = "#bfff00";
const PURPLE      = "#bf00ff";
const GLASS_BG    = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const FONT_MONO   = "'JetBrains Mono', 'Courier New', monospace";

// ─── HELPERS ─────────────────────────────────────────────────

/** Returns { years, months, days } since a given ISO date string */
const timeSince = (isoDate) => {
  if (!isoDate) return { years: 0, months: 0, days: 0, totalDays: 0 };
  const start = new Date(isoDate);
  const now   = new Date();
  let years   = now.getFullYear() - start.getFullYear();
  let months  = now.getMonth()    - start.getMonth();
  let days    = now.getDate()     - start.getDate();
  if (days   < 0) { months--; days   += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--;  months += 12; }
  const totalDays = Math.floor((now - start) / 86400000);
  return { years, months, days, totalDays };
};

/** Returns time remaining until a future ISO date */
const timeUntil = (isoDate) => {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  const now    = new Date();
  const diff   = target - now;
  if (diff <= 0) return { unlocked: true };
  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { unlocked: false, days, hours, minutes };
};

/** Months since a given ISO date */
const monthsSince = (isoDate) => {
  if (!isoDate) return 0;
  const start = new Date(isoDate);
  const now   = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
};

// ─── ADVENTURE COUNTER ───────────────────────────────────────
/**
 * AdventureCounter
 * Reads adventures_start_date from the DB and animates day/month/year counters.
 */
const AdventureCounter = ({ startDate }) => {
  const time   = timeSince(startDate);
  const digits = String(time.totalDays).padStart(4, "0").split("");

  return (
    <motion.div
      className="relative rounded-sm overflow-hidden p-5"
      style={{
        background: GLASS_BG,
        border: `1px solid ${GLASS_BORDER}`,
        fontFamily: FONT_MONO,
      }}
    >

      {/* Label */}
      <p className="text-xs tracking-[0.35em] uppercase mb-3 opacity-40" style={{ color: ACID }}>
        ◈ AVENTURA EN CURSO
      </p>

      {/* Ticker */}
      <div className="flex items-end gap-1 mb-3">
        {digits.map((d, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="text-4xl font-bold tabular-nums leading-none"
            style={{
              color: ACID,
              textShadow: `0 0 20px ${ACID}88`,
              fontFeatureSettings: "'tnum'",
            }}
          >
            {d}
          </motion.span>
        ))}
        <span className="text-xs ml-2 mb-1 opacity-50 tracking-widest uppercase" style={{ color: ACID }}>
          días
        </span>
      </div>

      {/* Sub-breakdown */}
      <div className="flex gap-4 text-xs opacity-40" style={{ color: ACID }}>
        <span>{time.years}Y</span>
        <span className="opacity-30">·</span>
        <span>{time.months}M</span>
        <span className="opacity-30">·</span>
        <span>{time.days}D</span>
      </div>
    </motion.div>
  );
};

// ─── HEARTBEAT WIDGET ────────────────────────────────────────
/**
 * HeartbeatWidget
 *
 * "Safe" state  (heartbeat < 18 months ago) → slow, calm pulse, acid green
 * "At-risk" state (>18 months) → fast, erratic pulse, red + warning glyph
 */
const HeartbeatWidget = ({ lastHeartbeat }) => {
  const monthsAgo = monthsSince(lastHeartbeat);
  const atRisk    = monthsAgo >= 18;
  const color     = atRisk ? "#ff3b3b" : ACID;

  // Beat speed: 1.2s (safe) → 0.35s (at-risk)
  const beatDuration = atRisk
    ? 0.35
    : Math.max(1.2, 1.2 - (monthsAgo / 18) * 0.85);

  return (
    <motion.div
      className="relative rounded-sm overflow-hidden p-5 flex flex-col items-center justify-center gap-3"
      style={{
        background: GLASS_BG,
        border: `1px solid ${atRisk ? "rgba(255,59,59,0.25)" : GLASS_BORDER}`,
        fontFamily: FONT_MONO,
        minHeight: 140,
      }}
    >

      {/* Heart SVG */}
      <motion.div
        animate={{
          scale:  atRisk ? [1, 1.35, 1, 1.3, 1] : [1, 1.18, 1],
          filter: [
            `drop-shadow(0 0 4px ${color}44)`,
            `drop-shadow(0 0 16px ${color})`,
            `drop-shadow(0 0 4px ${color}44)`,
          ],
        }}
        transition={{
          duration: beatDuration,
          repeat: Infinity,
          ease:   atRisk ? "easeInOut" : "easeOut",
          times:  atRisk ? [0, 0.2, 0.4, 0.6, 1] : [0, 0.3, 1],
        }}
      >
        <svg width="36" height="32" viewBox="0 0 36 32" fill="none">
          <path
            d="M18 30C18 30 2 20 2 10C2 5.58172 5.58172 2 10 2C13.1379 2 15.8938 3.73517 17.4 6.30556C17.5882 6.62685 17.7657 6.92685 18 7.20556C18.2343 6.92685 18.4118 6.62685 18.6 6.30556C20.1062 3.73517 22.8621 2 26 2C30.4183 2 34 5.58172 34 10C34 20 18 30 18 30Z"
            fill={color}
            opacity="0.9"
          />
        </svg>
      </motion.div>

      {/* Status label */}
      <div className="text-center">
        <p
          className="text-xs tracking-[0.3em] uppercase font-bold"
          style={{ color, textShadow: `0 0 8px ${color}66` }}
        >
          {atRisk ? "⚠ EN RIESGO" : "● SEGURO"}
        </p>
        {atRisk && (
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-xs mt-1 opacity-60"
            style={{ color }}
          >
            {monthsAgo}M sin actividad
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

// ─── TIME CAPSULE ────────────────────────────────────────────
/**
 * TimeCapsule
 * Locked: shows countdown. Unlocked: shows glitch-reveal animation.
 */
const TimeCapsule = ({ title, unlockDate, content, eraColor: _eraColor = PURPLE }) => {
  const countdown = timeUntil(unlockDate);
  const isLocked  = countdown && !countdown.unlocked;

  return (
    <motion.div
      className="relative rounded-sm overflow-hidden p-4"
      style={{
        background: isLocked
          ? `rgba(191,0,255,0.04)`
          : `rgba(191,255,0,0.04)`,
        border: `1px solid ${isLocked ? "rgba(191,0,255,0.2)" : GLASS_BORDER}`,
        fontFamily: FONT_MONO,
      }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs tracking-[0.3em] uppercase font-bold"
          style={{ color: isLocked ? PURPLE : ACID }}
        >
          {isLocked ? "⧖" : "◈"} {title}
        </p>
        {isLocked && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs"
            style={{ color: PURPLE }}
          >
            BLOQUEADO
          </motion.div>
        )}
      </div>

      {/* Countdown OR Content */}
      {isLocked ? (
        <div className="text-center py-2">
          <div className="flex justify-center gap-3 mb-2">
            {[
              { val: countdown.days,    label: "D" },
              { val: countdown.hours,   label: "H" },
              { val: countdown.minutes, label: "M" },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div
                  className="text-2xl font-bold tabular-nums"
                  style={{
                    color: PURPLE,
                    textShadow: `0 0 16px ${PURPLE}88`,
                  }}
                >
                  {String(val).padStart(2, "0")}
                </div>
                <div className="text-xs opacity-30" style={{ color: PURPLE }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          {/* Lock icon decoration */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-3xl"
            style={{ color: PURPLE }}
          >
            ⌁
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-sm opacity-70"
          style={{ color: ACID }}
        >
          {content}
        </motion.div>
      )}
    </motion.div>
  );
};

// ─── ERA CARD ────────────────────────────────────────────────
/**
 * EraCard — Individual card in the horizontal slider.
 * Glassmorphism + colored accent border based on era.color.
 */
const EraCard = ({ era, isActive, onClick }) => {
  const time = timeSince(era.start_date);

  return (
    <motion.div
      onClick={onClick}
      className="relative flex-shrink-0 cursor-pointer rounded-sm overflow-hidden"
      style={{
        width: isActive ? 280 : 220,
        height: isActive ? 200 : 160,
        background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${isActive ? era.color ?? ACID : "rgba(255,255,255,0.06)"}`,
        boxShadow: isActive
          ? `0 0 30px ${era.color ?? ACID}22, inset 0 0 30px ${era.color ?? ACID}08`
          : "none",
        fontFamily: FONT_MONO,
        transition: "width 0.4s ease, height 0.4s ease",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Corner brackets with era color */}

      {/* Cover image or gradient placeholder */}
      {era.cover_image ? (
        <img
          src={era.cover_image}
          alt={era.name}
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, ${era.color ?? ACID} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        {/* Top: Era index */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs tracking-[0.3em] uppercase opacity-40"
            style={{ color: era.color ?? ACID }}
          >
            ERA_{String(era._index ?? 0).padStart(2, "0")}
          </span>
          {isActive && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xs"
              style={{ color: era.color ?? ACID }}
            >
              ◈ ACTIVA
            </motion.span>
          )}
        </div>

        {/* Middle: Name */}
        <div>
          <h3
            className="text-base font-bold tracking-wide leading-tight mb-1 truncate"
            style={{
              color: era.color ?? ACID,
              textShadow: `0 0 12px ${era.color ?? ACID}66`,
            }}
          >
            {era.name}
          </h3>
          {isActive && era.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="text-xs line-clamp-2 leading-relaxed"
              style={{ color: era.color ?? ACID }}
            >
              {era.description}
            </motion.p>
          )}
        </div>

        {/* Bottom: Metadata */}
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-30 tracking-wider" style={{ color: era.color ?? ACID }}>
            {new Date(era.start_date).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toUpperCase()}
          </span>
          <span className="text-xs opacity-40" style={{ color: era.color ?? ACID }}>
            {time.totalDays}D
          </span>
        </div>
      </div>

      {/* Active glow bottom border */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: era.color ?? ACID, boxShadow: `0 0 8px ${era.color ?? ACID}` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

// ─── ERA DETAIL PANEL ────────────────────────────────────────
const EraDetailPanel = ({ era, entries = [], onEditEntry, onDeleteEntry }) => {
  const eraEntries = entries.filter((e) => e.era_id === era.id && !e.is_deleted);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={era.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative rounded-sm overflow-hidden p-5"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
          border: `1px solid ${era.color ?? ACID}22`,
          fontFamily: FONT_MONO,
        }}
      >

        {/* Stats row */}
        <div className="flex gap-6 mb-5 pt-1">
          {[
            { label: "ENTRADAS", val: eraEntries.length },
            { label: "FOTOS",    val: eraEntries.filter((e) => e.type === "photo").length },
            { label: "NOTAS",    val: eraEntries.filter((e) => e.type === "note").length },
            { label: "HITOS",    val: eraEntries.filter((e) => e.type === "milestone").length },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p
                className="text-xl font-bold"
                style={{ color: era.color ?? ACID, textShadow: `0 0 12px ${era.color ?? ACID}66` }}
              >
                {val}
              </p>
              <p className="text-xs opacity-30 tracking-widest uppercase" style={{ color: era.color ?? ACID }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Recent entries preview */}
        <div className="space-y-2">
          {eraEntries.slice(0, 3).map((entry) => (
            <motion.div
              key={entry.id}
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 py-2 border-b opacity-60 hover:opacity-100 transition-opacity cursor-pointer group"
              style={{ borderColor: `${era.color ?? ACID}14` }}
            >
              <span style={{ color: era.color ?? ACID }}>
                {entry.type === "photo" ? "◎" : entry.type === "milestone" ? "◈" : "◉"}
              </span>
              <span
                className="text-xs tracking-wide truncate flex-1"
                style={{ color: era.color ?? ACID }}
                onClick={() => onEditEntry?.(entry)}
              >
                {entry.title ?? entry.content?.body?.slice(0, 40) ?? "—"}
              </span>
              <span className="text-xs opacity-40" style={{ color: era.color ?? ACID }}>
                {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
              </span>
              {/* S65: Botones editar/eliminar */}
              <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEditEntry?.(entry); }}
                  className="text-xs px-1 hover:scale-110 transition-transform"
                  style={{ color: era.color ?? ACID }}
                  title="Editar entrada"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteEntry?.(entry.id); }}
                  className="text-xs px-1 hover:scale-110 transition-transform"
                  style={{ color: "#ff3b3b" }}
                  title="Eliminar entrada"
                >
                  ✕
                </button>
              </span>
            </motion.div>
          ))}

          {eraEntries.length === 0 && (
            <p className="text-xs opacity-20 text-center py-3 tracking-widest uppercase" style={{ color: era.color ?? ACID }}>
              — sin entradas aún —
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── VAULT MAIN COMPONENT ────────────────────────────────────
/**
 * Vault
 *
 * Props:
 *   db               — VaultDB object (from fetchData)
 *   onAddEra         — () => void
 *   onOpenEra        — (era) => void
 */
const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

export default function Vault({ db = null, jwtToken = null, onAddEra = () => {}, onOpenEra = () => {} }) {
  const [activeEraId, setActiveEraId] = useState(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showAddEra, setShowAddEra] = useState(false);
  const [newEraName, setNewEraName] = useState("");
  const [newEraColor, setNewEraColor] = useState(ACID);
  const [addingEra, setAddingEra] = useState(false);
  const { user, patchDb, updateEntry, deleteEntry } = useVault();
  // G3: usar trackVibe accent en lugar de ACID fijo
  const { trackVibe, resolveVibeAccent } = usePlayer();
  const accent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;
  const entries = db?.entries ?? [];
  const eras_arr = (db?.eras ?? []).map((era, i) => ({ ...era, _index: i }));
  const [exporting, setExporting] = useState(false);

  // G2: crear era vía Worker API
  const handleAddEra = async () => {
    if (!newEraName.trim() || !jwtToken) return;
    setAddingEra(true);
    try {
      const res = await fetch(`${API_BASE}/api/eras`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ name: newEraName.trim(), color: newEraColor }),
      });
      if (!res.ok) throw new Error(`create era: ${res.status}`);
      const created = await res.json();
      // Optimistic: añadir al state local
      setNewEraName("");
      setShowAddEra(false);
      // Actualizar estado local (G2)
      patchDb((prev) => ({
        ...prev,
        eras: [...(prev.eras || []), created]
      }));
      // Disparamos onAddEra para que el parent refresque si quiere
      onAddEra(created);
    } catch (e) {
      console.warn("[Vault] addEra failed:", e);
      alert("Error al crear la era. Reintenta.");
    } finally {
      setAddingEra(false);
    }
  };

  const handleAddEntry = async (entryData) => {
    const newEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      from_user: user?.id ?? "user",
      created_at: new Date().toISOString(),
      is_deleted: false,
    };
    await patchDb((prev) => ({
      ...prev,
      entries: [...(prev.entries ?? []), newEntry],
    }));
    // Emitir evento de entrada creada
    entryCreated(newEntry.id, newEntry.type, newEntry.title);
    setShowAddEntry(false);
  };

  // S65: editar entrada existente vía Worker API
  const handleEditEntry = async (entryId, patch) => {
    try {
      await updateEntry(entryId, patch);
      setEditingEntry(null);
    } catch (e) {
      console.warn("[Vault] updateEntry failed:", e);
      alert("Error al actualizar la entrada. Reintenta.");
    }
  };

  // S65: eliminar entrada vía Worker API
  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("¿Eliminar esta entrada? Se marcará como eliminada.")) return;
    try {
      await deleteEntry(entryId);
    } catch (e) {
      console.warn("[Vault] deleteEntry failed:", e);
      alert("Error al eliminar la entrada. Reintenta.");
    }
  };

   const handleExport = () => {
     if (!db) return;
     setExporting(true);
     try {
       const filename = `el_bunker_backup_${new Date().toISOString().slice(0, 10)}.json`;
       const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
       const url  = URL.createObjectURL(blob);
       const a    = document.createElement("a");
       a.href     = url;
       a.download = filename;
       a.click();
       URL.revokeObjectURL(url);
     } finally {
       setExporting(false);
     }
   };
  const sliderRef  = useRef(null);
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const scrollLeft = useRef(0);

  // Auto-select first era on mount only
  useEffect(() => {
    if (eras_arr.length > 0 && !activeEraId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveEraId(eras_arr[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eras_arr.length]);

  // S65: bloquear scroll del body cuando el modal de edición está abierto
  useEffect(() => {
    if (editingEntry) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [editingEntry]);

  // ── Drag-to-scroll on desktop ─────────────────────────────
  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current     = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
    sliderRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x    = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.4;
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (sliderRef.current) sliderRef.current.style.cursor = "grab";
  };

  // ── Demo data if DB is null ───────────────────────────────
  const displayEras = eras_arr.length > 0 ? eras_arr : DEMO_ERAS;

  const activeDisplayEra = displayEras.find((e) => e.id === activeEraId) ?? displayEras[0];

  return (
    <div
      className="flex flex-col gap-6 px-4 py-6 max-w-md mx-auto"
      style={{ fontFamily: FONT_MONO }}
    >

      {/* ══ SECTION 1: Widgets Row ══════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 gap-3"
      >
        <AdventureCounter startDate={db?.adventures_start_date ?? DEFAULT_ADVENTURE_DATE} />
        <HeartbeatWidget  lastHeartbeat={db?.heartbeat ?? new Date().toISOString()} />
      </motion.div>

      {/* ══ SECTION 2: Eras Slider ══════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span style={{ color: accent }}>◈</span>
            <h2
              className="text-xs tracking-[0.35em] uppercase font-bold"
              style={{ color: accent }}
            >
              ERAS
            </h2>
            <span
              className="text-xs opacity-40 ml-1 tabular-nums"
              style={{ color: accent }}
            >
              [{String(displayEras.length).padStart(2, "0")}]
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddEra(p => !p)}
            className="text-xs tracking-widest uppercase px-3 py-1 rounded-sm transition-all"
            style={{
              color: showAddEra ? `${accent}44` : accent,
              border: `1px solid ${showAddEra ? `${accent}22` : `${accent}44`}`,
              background: showAddEra ? `${accent}04` : `${accent}08`,
            }}
          >
            {showAddEra ? "CANCELAR" : "+ ERA"}
          </motion.button>
        </div>

        {/* G2: Formulario inline para crear era */}
        <AnimatePresence>
          {showAddEra && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 p-3 mb-3 rounded-sm"
                style={{ background: `${accent}06`, border: `1px solid ${accent}22` }}>
                <input
                  value={newEraName}
                  onChange={e => setNewEraName(e.target.value)}
                  placeholder="NOMBRE DE LA ERA"
                  className="bg-transparent text-sm p-2 outline-none"
                  style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newEraColor}
                    onChange={e => setNewEraColor(e.target.value)}
                    className="w-8 h-8 cursor-pointer rounded-sm"
                    style={{ border: `1px solid ${accent}44`, background: "transparent" }}
                  />
                  <span className="text-xs opacity-40" style={{ color: accent, fontFamily: FONT_MONO }}>
                    COLOR
                  </span>
                  <div className="flex-1" />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddEra}
                    disabled={addingEra || !newEraName.trim()}
                    className="text-xs tracking-widest uppercase px-3 py-1.5 rounded-sm"
                    style={{
                      color: accent,
                      border: `1px solid ${accent}44`,
                      fontFamily: FONT_MONO,
                      opacity: (addingEra || !newEraName.trim()) ? 0.4 : 1,
                    }}
                  >
                    {addingEra ? "CREANDO..." : "CREAR ERA"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizontal Slider */}
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto pb-3 select-none"
          style={{
            cursor: "grab",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {displayEras.map((era) => (
            <EraCard
              key={era.id}
              era={era}
              isActive={era.id === (activeEraId ?? displayEras[0]?.id)}
              onClick={() => {
                setActiveEraId(era.id);
                onOpenEra(era);
              }}
            />
          ))}
        </div>

        {/* Hide scrollbar via inline style */}
        <style>{`.vault-slider::-webkit-scrollbar { display: none; }`}</style>
      </motion.section>

      {/* ══ SECTION 3: Active Era Detail ════════════════════════ */}
      {activeDisplayEra && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span style={{ color: activeDisplayEra.color ?? ACID }}>◉</span>
              <h2
                className="text-xs tracking-[0.35em] uppercase font-bold"
                style={{ color: activeDisplayEra.color ?? ACID }}
              >
                {activeDisplayEra.name}
              </h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddEntry(prev => !prev)}
              className="text-xs tracking-widest uppercase px-3 py-1 rounded-sm"
              style={{
                color: showAddEntry ? `${accent}44` : accent,
                border: `1px solid ${showAddEntry ? `${accent}22` : `${accent}44`}`,
              }}
            >
              {showAddEntry ? "CANCELAR" : "+ ENTRADA"}
            </motion.button>
          </div>
          {showAddEntry && (
            <AddEntryForm
              eras={displayEras}
              onAdd={handleAddEntry}
              onCancel={() => setShowAddEntry(false)}
            />
          )}
          <EraDetailPanel
            era={activeDisplayEra}
            entries={entries}
            onEditEntry={setEditingEntry}
            onDeleteEntry={handleDeleteEntry}
          />
          {/* S65: Modal de edición */}
          <AnimatePresence>
            {editingEntry && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
                style={{ background: "rgba(0,0,0,0.85)" }}
                onClick={() => setEditingEntry(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddEntryForm
                    eras={displayEras}
                    entry={editingEntry}
                    onUpdate={handleEditEntry}
                    onCancel={() => setEditingEntry(null)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Galería de la Era activa */}
          <div className="mt-4">
            <VaultGallery
              entries={entries.filter(e => e.era_id === activeDisplayEra.id && !e.is_deleted)}
              eras={displayEras}
              jwtToken={jwtToken}
            />
          </div>
        </motion.section>
      )}

      {/* ══ SECTION 5: System Status ═════════════════════════════ */}
       <motion.footer
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ duration: 0.5, delay: 0.5 }}
     className="flex items-center justify-between pt-2 pb-4 px-1"
   >
     <span className="text-xs opacity-20 tracking-widest uppercase" style={{ color: accent }}>
       THE_VAULT v1.0
     </span>
     <div className="flex items-center gap-3">
       {user?.role === "admin" && (
         <motion.button
           whileTap={{ scale: 0.95 }}
           onClick={handleExport}
           disabled={exporting || !db}
           className="text-xs tracking-widest uppercase px-3 py-1 rounded-sm"
           style={{
             color: accent,
             border: `1px solid ${accent}33`,
             background: `${accent}08`,
             fontFamily: FONT_MONO,
             opacity: (exporting || !db) ? 0.4 : 1,
           }}
         >
           {exporting ? "EXPORTANDO..." : "↓ BACKUP JSON"}
         </motion.button>
       )}
       <motion.span
         animate={{ opacity: [0.15, 0.4, 0.15] }}
         transition={{ duration: 3, repeat: Infinity }}
         className="text-xs tracking-widest uppercase"
         style={{ color: accent }}
       >
         ◈ ENCRYPTED
       </motion.span>
     </div>
   </motion.footer>
    </div>
  );
}

// ─── NAMED EXPORTS ───────────────────────────────────────────
export { AdventureCounter, HeartbeatWidget, TimeCapsule, EraCard };
