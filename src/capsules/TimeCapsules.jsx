// ============================================================
//  EL BÚNKER — TimeCapsules.jsx
//  Cápsulas de tiempo: crear, sellar, desbloquear (ADR-020)
//  S74 — Selector contenido entries+playlists, snapshot, animación apertura
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";
import { workerClient } from "../core/WorkerClient";
import { useToast } from "../core/ToastContext";
import { Icon } from "../core/ui";

// S74: Opening animation component for unlocked capsules
const CapsuleReveal = ({ capsule, onClose, accentColor = ACID }) => {
  const accent = accentColor ?? ACID;
  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ background: "rgba(0,0,0,0.93)" }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      exit={{ scale: 0.5, opacity: 0, rotateY: -90 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.8 }}
      className="p-6 rounded-sm max-w-sm w-full mx-4 text-center"
      style={{ background: "rgba(10,10,10,0.97)", border: `1px solid ${PURPLE}44` }}
      onClick={e => e.stopPropagation()}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        className="text-5xl mb-4"
      >
        <Icon name="sparkles" size={42} label="Cápsula abierta" />
      </motion.div>
      <p className="text-lg font-bold mb-2" style={{ color: PURPLE, fontFamily: FONT_MONO }}>
        {capsule.title}
      </p>
      <p className="text-sm opacity-60 mb-3" style={{ color: accent, fontFamily: FONT_MONO }}>
        {capsule.description || "Tu cápsula se ha abierto."}
      </p>
      <p className="text-xs opacity-30" style={{ color: accent, fontFamily: FONT_MONO }}>
        Sellada {capsule.created_at ? new Date(capsule.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : ""}
      </p>
      {capsule.content_snapshot && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: `${PURPLE}22` }}>
          <p className="text-xs opacity-40" style={{ color: accent, fontFamily: FONT_MONO }}>
            {capsule.entry_ids?.length || 0} entradas · {capsule.playlist_ids?.length || 0} playlists
          </p>
        </div>
      )}
    </motion.div>
  </motion.div>
  );
};

export default function TimeCapsules({ capsules: initialCapsules = [], entries = [], playlists = [], accentColor = ACID }) {
  const accent = accentColor ?? ACID;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [capsules, setCapsules] = useState(initialCapsules);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  // S74: Content selector
  const [selectedEntryIds, setSelectedEntryIds] = useState([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState([]);
  const [showContentPicker, setShowContentPicker] = useState(false);
  // S74: Opening animation
  const [openingCapsule, setOpeningCapsule] = useState(null);
  const { toast } = useToast();

  // S115-D3: WorkerClient maneja auth — sin prop-drilling de token
  useEffect(() => {
    if (!workerClient.hasToken()) return;
    workerClient.get('/api/time_capsules')
      .then(data => setCapsules(data))
      .catch(err => {
        console.warn("[TimeCapsules] fetch:", err);
        toast({ msg: "NO SE PUDIERON CARGAR CÁPSULAS", duration: 3500 });
      });
  }, [toast]);

  const now = new Date();
  const locked = capsules.filter(c => !c.is_unlocked && new Date(c.unlock_at) > now);
  const unlocked = capsules.filter(c => c.is_unlocked || new Date(c.unlock_at) <= now);

  // S74: Available entries for selection (recent 20)
  const availableEntries = useMemo(() =>
    (entries || []).filter(e => !e.is_deleted).slice(0, 20),
    [entries]
  );
  const availablePlaylists = useMemo(() =>
    (playlists || []).slice(0, 10),
    [playlists]
  );

  const handleCreate = async () => {
    if (!title || !unlockAt) return;
    setIsCreating(true);
    setError(null);
    try {
      const body = {
        title,
        description,
        unlock_at: new Date(unlockAt).toISOString(),
        entry_ids: selectedEntryIds,
        playlist_ids: selectedPlaylistIds,
      };
      const created = await workerClient.post('/api/time_capsules', body);
      setCapsules(prev => [created, ...prev]);
      setTitle(""); setDescription(""); setUnlockAt("");
      setSelectedEntryIds([]); setSelectedPlaylistIds([]);
    } catch (e) {
      setError(e.message);
      // S85d: toast feedback para creación fallida
        toast({ msg: `ERROR AL CREAR: ${e.message?.slice(0, 32) ?? ""}`, duration: 3500 });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* Formulario */}
      <div className="flex flex-col gap-2 p-3" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO DE LA CÁPSULA"
          className="bg-transparent text-xs p-3 min-h-[44px] outline-none" style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción"
          className="bg-transparent text-xs p-3 min-h-[44px] outline-none" style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }} />
        <input type="datetime-local" value={unlockAt} onChange={e => setUnlockAt(e.target.value)}
          className="bg-transparent text-xs p-3 min-h-[44px] outline-none" style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }} />

        {/* S74: Content picker toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowContentPicker(p => !p)}
          className="text-xs p-3 min-h-[44px] text-left"
          style={{ color: accent, border: `1px solid ${accent}22`, fontFamily: FONT_MONO, background: showContentPicker ? `${accent}08` : "transparent" }}
        >
          <Icon name="archive" size={14} label="Contenido" /> {selectedEntryIds.length + selectedPlaylistIds.length > 0
            ? `${selectedEntryIds.length} entradas + ${selectedPlaylistIds.length} playlists`
            : "Seleccionar contenido (opcional)"}
        </motion.button>

        {/* S74: Content picker panel */}
        <AnimatePresence>
          {showContentPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-1">
                {availableEntries.length > 0 && (
                  <>
                    <p className="text-xs opacity-30" style={{ color: accent }}>ENTRADAS</p>
                    <div className="flex flex-wrap gap-1">
                      {availableEntries.map(e => {
                        const sel = selectedEntryIds.includes(e.id);
                        return (
                          <button key={e.id} onClick={() => setSelectedEntryIds(prev => sel ? prev.filter(id => id !== e.id) : [...prev, e.id])}
                            className="text-xs px-3 py-2.5 min-h-[44px] rounded-sm"
                            style={{ color: sel ? accent : `${accent}44`, border: `1px solid ${sel ? accent : `${accent}18`}`, background: sel ? `${accent}0d` : "transparent" }}>
                            {sel && <Icon name="check" size={13} decorative />}{e.title?.slice(0, 18) || e.id?.slice(0, 8)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                {availablePlaylists.length > 0 && (
                  <>
                    <p className="text-xs opacity-30 mt-1" style={{ color: accent }}>PLAYLISTS</p>
                    <div className="flex flex-wrap gap-1">
                      {availablePlaylists.map(p => {
                        const sel = selectedPlaylistIds.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => setSelectedPlaylistIds(prev => sel ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                            className="text-xs px-3 py-2.5 min-h-[44px] rounded-sm"
                            style={{ color: sel ? PURPLE : `${PURPLE}44`, border: `1px solid ${sel ? PURPLE : `${PURPLE}18`}`, background: sel ? `${PURPLE}0d` : "transparent" }}>
                            {sel && <Icon name="check" size={13} decorative />}{p.name?.slice(0, 18) || p.id?.slice(0, 8)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button whileTap={{ scale: 0.95 }} onClick={handleCreate} disabled={isCreating || !title || !unlockAt}
          className="text-xs tracking-[0.2em] uppercase p-3 min-h-[44px]" style={{ color: accent, border: `1px solid ${accent}44`, fontFamily: FONT_MONO, opacity: isCreating ? 0.5 : 1 }}>
          {isCreating ? "SELLANDO..." : "SELLAR CÁPSULA"}
        </motion.button>
        {error && (
          <p className="text-xs opacity-60" style={{ color: "#ff3b3b" }}>{error}</p>
        )}
      </div>

      {/* Capsulas bloqueadas */}
      {locked.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs tracking-[0.3em] uppercase flex items-center gap-2" style={{ color: PURPLE }}><Icon name="lock" size={14} label="Bloqueadas" /> BLOQUEADAS</h3>
          {locked.map(c => (
            <div key={c.id} className="p-3 text-xs" style={{ background: GLASS_BG, border: `1px solid ${PURPLE}33` }}>
              <span style={{ color: PURPLE }}>{c.title}</span>
              <span className="opacity-40 ml-2" style={{ color: accent }}>— abre {new Date(c.unlock_at).toLocaleDateString()}</span>
              {((c.content_counts?.entries || c.entry_ids?.length || 0) + (c.content_counts?.playlists || c.playlist_ids?.length || 0)) > 0 && (
                <span className="opacity-20 ml-2" style={{ color: accent }}>
                  ({c.content_counts?.entries ?? c.entry_ids?.length ?? 0}E + {c.content_counts?.playlists ?? c.playlist_ids?.length ?? 0}P)
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Capsulas desbloqueadas */}
      {unlocked.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs tracking-[0.3em] uppercase flex items-center gap-2" style={{ color: accent }}><Icon name="unlock" size={14} label="Desbloqueadas" /> DESBLOQUEADAS</h3>
          {unlocked.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-3 text-xs cursor-pointer hover:scale-[1.01] transition-transform"
              style={{ background: GLASS_BG, border: `1px solid ${accent}44` }}
              onClick={() => setOpeningCapsule(c)}
            >
              <span style={{ color: accent }}>{c.title}</span>
              <p className="opacity-40 mt-1" style={{ color: accent }}>{c.description}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* S74: Capsule opening animation */}
      <AnimatePresence>
        {openingCapsule && (
          <CapsuleReveal capsule={openingCapsule} onClose={() => setOpeningCapsule(null)} accentColor={accent} />
        )}
      </AnimatePresence>
    </div>
      {null}
  </>);
}
