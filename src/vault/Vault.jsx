// ============================================================
//  EL BÚNKER — Vault.jsx
//  Sistema de Eras · Glassmorphism Slider + Widgets
//  Stack: React + Tailwind CSS + Framer Motion
// ============================================================

import { useState, useRef, useEffect, useMemo, lazy, Suspense } from "react";
import { ConfirmDialog, Icon, Skeleton } from "../core/ui";
import { useVault } from "../core/VaultContext";
import { usePlayer } from "../core/PlayerContext";
import { workerClient } from "../core/WorkerClient";
import { motion, AnimatePresence } from "framer-motion";
import AddEntryForm from "./AddEntryForm";
import { SECCIONES, SECCION_LABEL, seccionDeEntrada, MODES, monthsSince, timeSince, timeUntil } from "./VaultHelpers";
import { ColorPicker } from "../core/ColorPicker";
import { ACID, PURPLE, GLASS_BG, GLASS_BORDER, FONT_MONO } from "../tokens";
import ChunkErrorBoundary from "../core/ChunkErrorBoundary";
import { Button } from "../core/ui";
import { useToast } from "../core/ToastContext";
import { useSecondLevelNav } from "../layout/Layout";

// Code splitting: VaultGallery (el componente más pesado, incluye leaflet) se carga lazy
const VaultGallery = lazy(() => import("./VaultGallery"));
// ADR-033: LUGARES es mapa — el MapView (Leaflet) se carga bajo demanda también
const LugaresMap = lazy(() => import("./VaultGallery").then((m) => ({ default: m.MapView })));

// ─── CONSTANTS ───────────────────────────────────────────────
// Sin fecha en la BD no hay contador: un contador inventado es un dato falso en pantalla.
// (merge A5 + fix fecha iteracion 2, 12-ago: AdventureCounter recibe db?.adventures_start_date
// y con null/undefined muestra ceros — nunca fabrica una fecha.)

// FASE C.2.1 (veredicto V1 Fable S147): fallback demo de eras eliminado, estado vacío elegante.

// ─── ADVENTURE COUNTER ───────────────────────────────────────
/**
 * AdventureCounter
 * Reads adventures_start_date from the DB and animates day/month/year counters.
 */
const AdventureCounter = ({ startDate, accentColor = ACID }) => {
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

      {/* Label — G3: vibe-aware */}
      <p className="text-xs tracking-[0.35em] uppercase mb-3 opacity-40" style={{ color: accentColor }}>
        <Icon name="archive" size={14} decorative /> AVENTURA EN CURSO
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
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}88`,
              fontFeatureSettings: "'tnum'",
            }}
          >
            {d}
          </motion.span>
        ))}
        <span className="text-xs ml-2 mb-1 opacity-50 tracking-widest uppercase" style={{ color: accentColor }}>
          días
        </span>
      </div>

      {/* Sub-breakdown */}
      <div className="flex gap-4 text-xs opacity-40" style={{ color: accentColor }}>
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
          <Icon name={atRisk ? "alert" : "circle"} size={14} decorative /> {atRisk ? "EN RIESGO" : "SEGURO"}
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
          <Icon name={isLocked ? "timer" : "archive"} size={14} decorative /> {title}
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
              <Icon name="archive" size={14} decorative /> ACTIVA
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
// ELIMINADO en ADR-033: la columna de 20rem muere; sus datos (días, entradas,
// fotos) pasan a la cabecera de era como cifras (punto 7 del encargo).

// ─── VISTAS DE SECCIÓN (ADR-033) ─────────────────────────────
// Cada sección tiene SU forma de mirar; ese es el punto del rediseño.
// Estado vacío: secciones vacías pero USABLES, con microcopy es-ES en voz
// activa que invita a crear la primera entrada (coordinador, 14-ago).

/** Estado vacío usable de una sección sin contenido. */
const SeccionVacia = ({ seccionLabel, microcopy, accent, onCreate }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center gap-4 py-14 px-4 text-center rounded-sm"
    style={{ border: `1px dashed ${accent}22`, fontFamily: FONT_MONO }}
  >
    <p className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: accent }}>
      {seccionLabel}
    </p>
    <p className="text-xs leading-relaxed max-w-sm" style={{ color: `${accent}88` }}>
      {microcopy}
    </p>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onCreate}
      className="text-xs tracking-widest uppercase px-4 py-2.5 min-h-[44px]"
      style={{ color: accent, border: `1px solid ${accent}44`, fontFamily: FONT_MONO }}
    >
      + PRIMERA ENTRADA
    </motion.button>
  </motion.div>
);

/** PALABRAS — lectura a 76ch (régimen de lectura de ADR-029 §5). */
const PalabrasView = ({ entries = [], accent, onEdit, onDelete, onCreate }) => {
  if (!entries.length) {
    return (
      <SeccionVacia
        seccionLabel="PALABRAS"
        microcopy="Todavía no hay palabras en esta era. Escribe la primera carta o nota."
        accent={accent}
        onCreate={onCreate}
      />
    );
  }
  return (
    <div className="w-full flex flex-col gap-6" style={{ maxWidth: "76ch", fontFamily: FONT_MONO }}>
      {entries.map((entry) => (
        <motion.article
          key={entry.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 pb-4"
          style={{ borderBottom: `1px solid ${accent}14` }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-bold tracking-wide" style={{ color: accent }}>
              {entry.title || "SIN TÍTULO"}
            </h3>
            <span className="text-[9px] opacity-30 flex-shrink-0">
              {new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}
            </span>
          </div>
          {typeof entry.content?.text === "string" && (
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: `${accent}99` }}>
              {entry.content.text}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onEdit?.(entry)}
              className="text-[9px] px-2 py-2 min-h-[44px] tracking-widest uppercase opacity-40 hover:opacity-100"
              style={{ color: accent }}
            >
              <Icon name="edit" size={12} decorative /> EDITAR
            </button>
            <button
              onClick={() => onDelete?.(entry.id)}
              className="text-[9px] px-2 py-2 min-h-[44px] tracking-widest uppercase opacity-40 hover:opacity-100"
              style={{ color: "#ff3b3b" }}
            >
              <Icon name="close" size={12} decorative /> ELIMINAR
            </button>
          </div>
        </motion.article>
      ))}
    </div>
  );
};

/** LISTAS — tabla (L-5: densidad con columnas, no espacio muerto). */
const ListasView = ({ entries = [], accent, onEdit, onDelete, onCreate }) => {
  if (!entries.length) {
    return (
      <SeccionVacia
        seccionLabel="LISTAS"
        microcopy="Todavía no hay listas en esta era. Crea la primera: pelis, libros, recetas…"
        accent={accent}
        onCreate={onCreate}
      />
    );
  }
  return (
    <div className="w-full overflow-x-auto" style={{ fontFamily: FONT_MONO }}>
      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${accent}33` }}>
            {["TÍTULO", "TIPO", "FECHA", "PUNTUACIÓN", ""].map((h) => (
              <th key={h} className="text-left px-2 py-2 uppercase tracking-widest opacity-40 font-normal" style={{ color: accent }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} style={{ borderBottom: `1px solid ${accent}10` }}>
              <td className="px-2 py-3">
                <button
                  onClick={() => onEdit?.(entry)}
                  className="text-left hover:underline"
                  style={{ color: accent }}
                >
                  {entry.title || "SIN TÍTULO"}
                </button>
              </td>
              <td className="px-2 py-3 opacity-50">{entry.type}</td>
              <td className="px-2 py-3 opacity-40">
                {new Date(entry.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="px-2 py-3 opacity-50">{entry.content?.rating ?? "—"}</td>
              <td className="px-2 py-3 text-right">
                <button
                  onClick={() => onDelete?.(entry.id)}
                  className="px-2 py-2 min-h-[44px] opacity-40 hover:opacity-100"
                  style={{ color: "#ff3b3b" }}
                  aria-label="Eliminar entrada"
                >
                  <Icon name="close" size={12} decorative />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── VAULT MAIN COMPONENT ────────────────────────────────────
/**
 * Vault
 *
 * Props:
 *   db               — VaultDB object (from fetchData)
 *   onAddEra         — () => void
 */
export default function Vault({ db = null, onAddEra = () => {} }) {
  const [activeEraId, setActiveEraId] = useState(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState(null);
  const [showAddEra, setShowAddEra] = useState(false);
  const [newEraName, setNewEraName] = useState("");
  const [newEraColor, setNewEraColor] = useState(ACID);
  const [addingEra, setAddingEra] = useState(false);
  const { user, patchDb, updateEntry, deleteEntry } = useVault();
  // G3: usar trackVibe accent en lugar de ACID fijo
  const { trackVibe, resolveVibeAccent } = usePlayer();
  const accent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;
  // ADR-033: la sección activa es el segundo nivel del raíl (estado real elevado
  // a Layout). En el lienzo se lee y se escribe el mismo estado — un solo mecanismo.
  const { secondLevel, setSecondLevel } = useSecondLevelNav();
  const seccionActiva = secondLevel.vault ?? "memoria";
  const setSeccion = (seccionId) => setSecondLevel("vault", seccionId);
  // X-5: los 6 modos de galería viven en la cabecera del lienzo, SOLO en MEMORIA.
  const [galeriaMode, setGaleriaMode] = useState("wall");
  const entries = useMemo(() => db?.entries ?? [], [db?.entries]);
  // S100 — Búsqueda por texto en título y contenido
  const [searchQuery, setSearchQuery] = useState("");
  // ADR-033: el filtro maestro es la SECCIÓN (derivada del type AL LEER), no la
  // categoría muerta. La búsqueda de texto sigue como filtro secundario.
  const filteredEntries = useMemo(() => {
    let active = entries.filter(e => !e.is_deleted);
    active = active.filter((e) => seccionDeEntrada(e) === seccionActiva);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      active = active.filter((e) =>
        (e.title ?? "").toLowerCase().includes(q) ||
        (typeof e.content?.text === "string" ? e.content.text : "").toLowerCase().includes(q)
      );
    }
    return active;
  }, [entries, seccionActiva, searchQuery]);
  const eras_arr = (db?.eras ?? []).map((era, i) => ({ ...era, _index: i }));
  const [exporting, setExporting] = useState(false);
  // Toast state — usado por handleDeleteEntry (reemplaza alert) y otros catch.
  // Mismo patrón que MusicLab: vibe-aware accent, fixed bottom, setTimeout 2500ms.
  const { toast } = useToast();

  // G2: crear era vía Worker API
  const handleAddEra = async () => {
    if (!newEraName.trim() || !workerClient.hasToken()) return;
    setAddingEra(true);
    try {
      const created = await workerClient.post('/api/eras', { name: newEraName.trim(), color: newEraColor });
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
      toast({ msg: "NO SE PUDO CREAR LA ERA", duration: 2500 })
    } finally {
      setAddingEra(false);
    }
  };

  const handleAddEntry = async (entryData) => {
    if (!workerClient.hasToken()) {
      throw new Error("No hay una sesión persistente disponible para guardar la entrada.");
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const created = await workerClient.post("/api/entries", {
      ...entryData,
      id,
      from_user: user?.id ?? "user",
      created_at: createdAt,
    });
    const newEntry = {
      ...entryData,
      ...created,
      id: created.id ?? id,
      from_user: created.from_user ?? user?.id ?? "user",
      from: created.from ?? created.from_user ?? user?.id ?? "user",
      to: created.to ?? created.to_user ?? entryData.to_user ?? "both",
      created_at: created.created_at ?? createdAt,
      is_deleted: false,
      content: typeof created.content === "string"
        ? (() => { try { return JSON.parse(created.content); } catch { return created.content; } })()
        : created.content,
    };
    await patchDb((prev) => ({
      ...prev,
      entries: [...(prev.entries ?? []), newEntry],
    }));
    // El Worker ya registra `entry_created` dentro del POST transaccional.
    setShowAddEntry(false);
  };

  // S65: editar entrada existente vía Worker API
  const handleEditEntry = async (entryId, patch) => {
    try {
      await updateEntry(entryId, patch);
      setEditingEntry(null);
    } catch (e) {
      console.warn("[Vault] updateEntry failed:", e);
      toast({ msg: "NO SE PUDO ACTUALIZAR LA ENTRADA", duration: 2500 })
    }
  };

  // S65: eliminar entrada vía Worker API
  const handleDeleteEntry = async () => {
    const entryId = pendingDeleteEntryId;
    setPendingDeleteEntryId(null);
    if (!entryId) return;
    try {
      await deleteEntry(entryId);
    } catch (e) {
      console.warn("[Vault] deleteEntry failed:", e);
      toast({ msg: "NO SE PUDO ELIMINAR", duration: 2500 });
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

  // FASE C.2.1: sin fallback de eras demo. eras_arr vacío → estado vacío elegante downstream.
  const displayEras = eras_arr;

  const activeDisplayEra = displayEras.find((e) => e.id === activeEraId) ?? displayEras[0];

  // ADR-033: cifras de la cabecera (absorben AVENTURA EN CURSO y SEGURO) y
  // entradas de la sección activa dentro de la era — todo dato real, sin inventar.
  const eraEntries = activeDisplayEra
    ? entries.filter((e) => !e.is_deleted && e.era_id === activeDisplayEra.id)
    : [];
  const diasAventura = timeSince(db?.adventures_start_date).totalDays;
  const mesesSeguro = monthsSince(db?.heartbeat ?? new Date().toISOString());
  const enRiesgo = mesesSeguro >= 18;
  const fotosEra = eraEntries.filter((e) => e.type === "photo" || e.content?.images?.length).length;
  const eraSectionEntries = activeDisplayEra
    ? filteredEntries.filter((e) => e.era_id === activeDisplayEra.id)
    : [];

  return (
    <>
      <ConfirmDialog
        open={Boolean(pendingDeleteEntryId)}
        title="Eliminar entrada"
        message="La entrada se marcará como eliminada y dejará de aparecer en la vista normal."
        confirmLabel="ELIMINAR"
        onClose={() => setPendingDeleteEntryId(null)}
        onConfirm={handleDeleteEntry}
        accentColor="#ff3b3b"
      />
    <div
      className="flex flex-col gap-6 px-4 py-6 w-full"
      style={{ fontFamily: FONT_MONO }}
    >

      {/* ══ CABECERA DE ERA (punto 7): nombre + cifras que absorben
            AVENTURA EN CURSO y SEGURO + acciones. Un solo punto de corte: 1280. */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="target" size={14} decorative />
            <h2
              className="text-xs tracking-[0.35em] uppercase font-bold truncate"
              style={{ color: activeDisplayEra?.color ?? accent }}
            >
              {activeDisplayEra?.name ?? "SIN ERA"}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddEntry(true)}
              disabled={!activeDisplayEra}
              className="text-xs tracking-widest uppercase px-3 py-2.5 rounded-sm"
              style={{
                color: showAddEntry ? `${accent}44` : accent,
                border: `1px solid ${showAddEntry ? `${accent}22` : `${accent}44`}`,
                opacity: activeDisplayEra ? 1 : 0.4,
              }}
            >
              + ENTRADA
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddEra(p => !p)}
              className="text-xs tracking-widest uppercase px-3 py-2.5 rounded-sm transition-all"
              style={{
                color: showAddEra ? `${accent}44` : accent,
                border: `1px solid ${showAddEra ? `${accent}22` : `${accent}44`}`,
                background: showAddEra ? `${accent}04` : `${accent}08`,
              }}
            >
              {showAddEra ? "CANCELAR" : "+ ERA"}
            </motion.button>
          </div>
        </div>
        {/* Cifras reales: días de aventura · entradas · fotos · estado seguro */}
        <div className="flex items-center gap-3 px-1 text-xs opacity-40" style={{ color: accent }}>
          <span className="tabular-nums">{diasAventura} días</span>
          <span style={{ color: `${accent}22` }}>·</span>
          <span className="tabular-nums">{eraEntries.length} entradas</span>
          <span style={{ color: `${accent}22` }}>·</span>
          <span className="tabular-nums">{fotosEra} fotos</span>
          <span style={{ color: `${accent}22` }}>·</span>
          <span style={{ color: enRiesgo ? "#ff3b3b" : accent }}>
            <Icon name={enRiesgo ? "alert" : "circle"} size={12} decorative /> {enRiesgo ? `EN RIESGO ${mesesSeguro}M` : "SEGURO"}
          </span>
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
              <div className="flex flex-col gap-2 p-3 mt-3 rounded-sm"
                style={{ background: `${accent}06`, border: `1px solid ${accent}22` }}>
                <input
                  value={newEraName}
                  onChange={e => setNewEraName(e.target.value)}
                  placeholder="NOMBRE DE LA ERA"
                  className="bg-transparent text-sm p-3 min-h-[44px] outline-none"
                  style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }}
                />
                {/* Phase 2.2: ColorPicker unificado con el de tags — paleta 12 colores + custom hex + preview */}
                <ColorPicker value={newEraColor} onChange={setNewEraColor} accentColor={accent} />
                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleAddEra}
                    disabled={addingEra || !newEraName.trim()}
                    loading={addingEra}
                    accentColor={accent}
                    size="sm"
                  >
                    CREAR ERA
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ══ SECTION 2: Eras — fila con wrap por encima de 1280 (punto 7),
            carrusel intacto por debajo (L-1: no cambia un pixel). ══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Icon name="archive" size={14} decorative />
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
        </div>

        {/* Eras: wrap en escritorio, carrusel en móvil */}
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto pb-3 select-none xl:flex-wrap xl:overflow-visible"
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
              }}
            />
          ))}
        </div>

        {/* Hide scrollbar via inline style */}
        <style>{`.vault-slider::-webkit-scrollbar { display: none; }`}</style>
      </motion.section>

      {/* ══ SECCIONES (ADR-033): en móvil (<1280) el lienzo pinta el selector;
            en escritorio manda el raíl (L-2) — mismo estado, un solo mecanismo. ══ */}
      <nav className="flex gap-1 overflow-x-auto xl:hidden" aria-label="Secciones de VAULT">
        {SECCIONES.map((s) => {
          const activa = seccionActiva === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeccion(s.id)}
              aria-current={activa ? "page" : undefined}
              className={`text-xs px-3 py-2.5 uppercase whitespace-nowrap ${activa ? "" : "opacity-30"}`}
              style={{ color: accent, borderBottom: activa ? `1px solid ${accent}` : "1px solid transparent", fontFamily: FONT_MONO }}
            >
              <Icon name={s.icon} size={14} decorative /> {s.label}
            </button>
          );
        })}
      </nav>

      {/* ══ FLUJO DE AÑADIR / EDITAR (L-4): el lienzo ES el formulario, con el
            marco intacto. Crear y editar comparten camino y ancho (60-76ch). ══ */}
      {(showAddEntry || editingEntry) && activeDisplayEra && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col gap-4"
        >
          <button
            type="button"
            onClick={() => { setShowAddEntry(false); setEditingEntry(null); }}
            className="text-xs tracking-widest uppercase self-start px-2 py-2 min-h-[44px] opacity-50"
            style={{ color: accent, fontFamily: FONT_MONO }}
          >
            <Icon name="arrowLeft" size={14} decorative /> VOLVER A {SECCION_LABEL[seccionActiva] ?? seccionActiva.toUpperCase()}
          </button>
          <AddEntryForm
            section={seccionActiva}
            sectionLabel={SECCION_LABEL[seccionActiva] ?? seccionActiva.toUpperCase()}
            eraName={activeDisplayEra?.name}
            eras={displayEras}
            entry={editingEntry}
            onAdd={handleAddEntry}
            onUpdate={handleEditEntry}
            onCancel={() => { setShowAddEntry(false); setEditingEntry(null); }}
          />
        </motion.section>
      )}

      {/* ══ CONTENIDO DE LA SECCIÓN ACTIVA ═════════════════════ */}
      {!(showAddEntry || editingEntry) && activeDisplayEra && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* X-5: los 6 modos de galería viven en la cabecera del lienzo,
               SOLO dentro de MEMORIA. No van al raíl. */}
          {seccionActiva === "memoria" && (
            <nav className="flex gap-1 overflow-x-auto mb-3" aria-label="Modos de galería">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setGaleriaMode(m.id)}
                  className={`text-xs px-3 py-2.5 uppercase whitespace-nowrap ${galeriaMode === m.id ? "" : "opacity-30"}`}
                  style={{ color: accent, borderBottom: galeriaMode === m.id ? `1px solid ${accent}` : "1px solid transparent", fontFamily: FONT_MONO }}
                >
                  <Icon name={m.icon} size={14} decorative /> {m.label}
                </button>
              ))}
            </nav>
          )}

          {/* S100 — Búsqueda por texto (filtro del lienzo, L-3) */}
          <div className="px-1 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR…"
              className="bg-transparent text-xs p-3 min-h-[44px] w-full outline-none"
              style={{ color: accent, border: `1px solid ${accent}22`, fontFamily: FONT_MONO }}
            />
          </div>

          {/* El contenido de la sección activa, a ancho completo */}
          {seccionActiva === "memoria" && (
            <div className="w-full">
              <ChunkErrorBoundary>
                <Suspense fallback={<Skeleton.VaultGallery />}>
                  <VaultGallery
                    entries={eraSectionEntries}
                    eras={displayEras}
                    mode={galeriaMode}
                    setMode={setGaleriaMode}
                    onEditEntry={setEditingEntry}
                    onDeleteEntry={(entryId) => setPendingDeleteEntryId(entryId)}
                  />
                </Suspense>
              </ChunkErrorBoundary>
            </div>
          )}

          {seccionActiva === "palabras" && (
            <PalabrasView
              entries={eraSectionEntries}
              accent={accent}
              onEdit={setEditingEntry}
              onDelete={(entryId) => setPendingDeleteEntryId(entryId)}
              onCreate={() => setShowAddEntry(true)}
            />
          )}

          {seccionActiva === "lugares" && (
            eraSectionEntries.length === 0 ? (
              <SeccionVacia
                seccionLabel="LUGARES"
                microcopy="Todavía no hay lugares en esta era. Marca el primero."
                accent={accent}
                onCreate={() => setShowAddEntry(true)}
              />
            ) : (
              <div className="w-full">
                <ChunkErrorBoundary>
                  <Suspense fallback={<Skeleton.VaultGallery />}>
                    <LugaresMap entries={eraSectionEntries} eras={displayEras} />
                  </Suspense>
                </ChunkErrorBoundary>
              </div>
            )
          )}

          {seccionActiva === "listas" && (
            <ListasView
              entries={eraSectionEntries}
              accent={accent}
              onEdit={setEditingEntry}
              onDelete={(entryId) => setPendingDeleteEntryId(entryId)}
              onCreate={() => setShowAddEntry(true)}
            />
          )}
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
           className="text-xs tracking-widest uppercase px-3 py-2.5 rounded-sm"
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
       ><Icon name="lock" size={14} decorative /> ENCRYPTED
       </motion.span>
     </div>
   </motion.footer>
   </div>
   </>
  );
}

// ─── NAMED EXPORTS ───────────────────────────────────────────
export { AdventureCounter, HeartbeatWidget, TimeCapsule, EraCard };
