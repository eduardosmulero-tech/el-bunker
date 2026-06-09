// ============================================================
//  EL BÚNKER — TimeCapsules.jsx
//  Cápsulas de tiempo: crear, sellar, desbloquear (ADR-020)
//  S68 · Fase 3 — CAPSULES núcleo
// ============================================================
import { useState } from "react";
import { motion } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";

export default function TimeCapsules({ userId, capsules = [] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unlockAt, setUnlockAt] = useState("");

  const now = new Date();
  const locked = capsules.filter(c => !c.is_unlocked && new Date(c.unlock_at) > now);
  const unlocked = capsules.filter(c => c.is_unlocked || new Date(c.unlock_at) <= now);

  const handleCreate = () => {
    if (!title || !unlockAt) return;
    // TODO: POST /api/entries o endpoint específico de capsules
    console.log("[TimeCapsules] Crear:", { title, description, unlock_at: unlockAt, created_by: userId });
    setTitle(""); setDescription(""); setUnlockAt("");
  };

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* Formulario rápido */}
      <div className="flex flex-col gap-2 p-3" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO DE LA CÁPSULA"
          className="bg-transparent text-xs p-2 outline-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción"
          className="bg-transparent text-xs p-2 outline-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />
        <input type="datetime-local" value={unlockAt} onChange={e => setUnlockAt(e.target.value)}
          className="bg-transparent text-xs p-2 outline-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleCreate}
          className="text-xs tracking-[0.2em] uppercase p-2" style={{ color: ACID, border: `1px solid ${ACID}44`, fontFamily: FONT_MONO }}>
          SELLAR CÁPSULA 🔮
        </motion.button>
      </div>

      {/* Capsulas bloqueadas */}
      {locked.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs tracking-[0.3em] uppercase" style={{ color: PURPLE }}>🔒 BLOQUEADAS</h3>
          {locked.map(c => (
            <div key={c.id} className="p-3 text-xs" style={{ background: GLASS_BG, border: `1px solid ${PURPLE}33` }}>
              <span style={{ color: PURPLE }}>{c.title}</span>
              <span className="opacity-40 ml-2" style={{ color: ACID }}>— abre {new Date(c.unlock_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Capsulas desbloqueadas */}
      {unlocked.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs tracking-[0.3em] uppercase" style={{ color: ACID }}>🔓 DESBLOQUEADAS</h3>
          {unlocked.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-3 text-xs" style={{ background: GLASS_BG, border: `1px solid ${ACID}44` }}>
              <span style={{ color: ACID }}>{c.title}</span>
              <p className="opacity-40 mt-1" style={{ color: ACID }}>{c.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
