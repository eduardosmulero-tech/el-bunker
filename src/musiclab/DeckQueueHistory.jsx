// ============================================================
//  EL BÚNKER — DeckQueueHistory.jsx
//  Panel COLA / HISTORIAL del deck de escritorio (port fastpotify
//  queue.rs + history.rs: cola y recientes como superficie de
//  primera clase, no un sub-tab escondido).
//
//  Reglas respetadas:
//   - Un solo <audio>: las acciones mutan PlayerContext, nunca tocan el motor.
//   - Mismo contrato de cola que el móvil: _manual, MAX_QUEUE_SIZE, undo.
//   - El historial respeta el umbral honesto de escucha (playerMath).
// ============================================================
import { motion } from "framer-motion";
import { usePlayer } from "../core/PlayerContext";
import { reorderQueueByIds } from "../core/QueueTransforms.js";
import { Icon } from "../core/ui";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

export function DeckQueueHistory({ accentColor, mode, onClose, onJump }) {
  const {
    localQueue,
    setLocalQueue,
    removeFromQueue,
    playTrack,
    activeTrack,
    playHistory,
    setPlayHistory,
    queueContextName,
  } = usePlayer();

  if (!mode) return null;

  const queueTracks = localQueue.filter((t) => t.id !== activeTrack?.id);

  const jump = (track) => {
    playTrack?.(track);
    onJump?.(track);
  };

  const moveTrack = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= queueTracks.length) return;
    const fromId = queueTracks[index]?.id;
    const toId = queueTracks[target]?.id;
    if (!fromId || !toId) return;
    const snapshot = [...localQueue];
    // Invariante canónica de cola (Q1/Q8): activo al head y grupos manual/contexto
    // sin entremezclar — misma transformación que el drag&drop de MusicLab.
    // Antes este panel reconstruía la cola ad-hoc: podía poner un track de
    // playlist delante del manual más antiguo y cambiar quién era "next".
    const reordered = reorderQueueByIds(localQueue, fromId, toId, activeTrack?.id);
    if (reordered === localQueue) return; // no-op protegido (mismo grupo, etc.)
    setLocalQueue(reordered);
    // S85d Q17: undo disponible — mismo evento que consume MusicLab para el toast DESHACER.
    window.dispatchEvent(new CustomEvent("bunker_cola_reordered", { detail: { snapshot } }));
  };

  const removeTrack = (trackId) => removeFromQueue?.(trackId);

  const clearHistory = () => setPlayHistory?.([]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22 }}
      role="complementary"
      aria-label={mode === "queue" ? "Cola de reproducción" : "Historial de escucha"}
      className="w-full lg:w-[320px] flex-none rounded-sm overflow-hidden flex flex-col"
      style={{ fontFamily: FONT_MONO, color: accentColor, border: `1px solid ${accentColor}44`, background: "rgba(5,5,5,0.85)", maxHeight: 520 }}
    >
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${accentColor}2e`, background: `linear-gradient(90deg, ${accentColor}16, transparent)` }}>
        <div className="flex items-center gap-2 min-w-0">
          <Icon name={mode === "queue" ? "menu" : "clock"} size={14} decorative />
          <h3 className="text-[11px] tracking-[0.25em] uppercase font-bold truncate">
            {mode === "queue" ? "COLA" : "HISTORIAL"}
            {mode === "queue" && queueContextName ? <span className="ml-2 text-[9px] opacity-50 normal-case tracking-widest">· {queueContextName}</span> : null}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-none">
          {mode === "queue" && queueTracks.length > 0 && (
            <button
              type="button"
              onClick={() => setLocalQueue((q) => q.filter((t) => t._manual))}
              className="text-[9px] tracking-widest uppercase px-2 py-1 rounded-sm"
              title="Vaciar contexto de playlist (mantiene cola manual)"
              style={{ color: `${accentColor}cc`, border: `1px solid ${accentColor}33` }}
            >
              VACIAR
            </button>
          )}
          {mode === "history" && playHistory.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-[9px] tracking-widest uppercase px-2 py-1 rounded-sm"
              title="Vaciar historial de sesión"
              style={{ color: `${accentColor}cc`, border: `1px solid ${accentColor}33` }}
            >
              VACIAR
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Cerrar panel" className="p-1" style={{ color: `${accentColor}88` }}>
            <Icon name="close" size={14} decorative />
          </button>
        </div>
      </header>

      <div className="overflow-y-auto flex-1 min-h-0">
        {mode === "queue" && queueTracks.length === 0 && (
          <p className="px-4 py-6 text-center text-[10px] tracking-widest uppercase opacity-40">
            La cola está vacía
          </p>
        )}
        {mode === "queue" && queueTracks.map((track, index) => (
          <div key={`${track.id}-${index}`} className="group flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${accentColor}14` }}>
            <div className="flex flex-col items-center flex-none">
              <button type="button" onClick={() => moveTrack(index, -1)} disabled={index === 0} aria-label="Subir en cola" className="leading-none disabled:opacity-20" style={{ color: accentColor }}>
                <Icon name="chevronUp" size={12} decorative />
              </button>
              <button type="button" onClick={() => moveTrack(index, 1)} disabled={index === queueTracks.length - 1} aria-label="Bajar en cola" className="leading-none disabled:opacity-20" style={{ color: accentColor }}>
                <Icon name="chevronDown" size={12} decorative />
              </button>
            </div>
            <button type="button" onClick={() => jump(track)} className="flex-1 min-w-0 text-left" title={track.title}>
              <span className="block text-[11px] truncate" style={{ color: track._manual ? accentColor : `${accentColor}cc` }}>{track.title || "Sin título"}</span>
              <span className="block text-[9px] opacity-45 truncate">{track.artist || "—"}{track._manual ? " · MANUAL" : ""}</span>
            </button>
            <button type="button" onClick={() => removeTrack(track.id)} aria-label={`Quitar ${track.title} de la cola`} className="opacity-0 group-hover:opacity-100 flex-none p-1" style={{ color: "#ff2d55" }}>
              <Icon name="close" size={12} decorative />
            </button>
          </div>
        ))}

        {mode === "history" && playHistory.length === 0 && (
          <p className="px-4 py-6 text-center text-[10px] tracking-widest uppercase opacity-40">
            Sin escuchas aún en esta sesión
          </p>
        )}
        {mode === "history" && playHistory.slice().reverse().map((track, index) => (
          <button
            key={`${track.id}-${index}`}
            type="button"
            onClick={() => jump(track)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5"
            style={{ borderBottom: `1px solid ${accentColor}14` }}
            title={track.title}
          >
            <Icon name="clock" size={11} decorative />
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] truncate" style={{ color: accentColor }}>{track.title || "Sin título"}</span>
              <span className="block text-[9px] opacity-45 truncate">{track.artist || "—"}</span>
            </span>
          </button>
        ))}
      </div>
    </motion.aside>
  );
}

export default DeckQueueHistory;
