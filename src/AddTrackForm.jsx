import { useState } from "react";
import { motion } from "framer-motion";
import { ACID } from "./Layout";

const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

export const AddTrackForm = ({ onAdd, onClose, initialData = null, VIBE_TAGS }) => {
  const [form, setForm] = useState(initialData
    ? { title: initialData.title ?? "", artist: initialData.artist ?? "", url: initialData.url ?? "", note: initialData.note ?? "", vibe: initialData.vibe ?? "gaming" }
    : { title: "", artist: "", url: "", note: "", vibe: "gaming" }
  );

  const set    = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: uuid(), era_id: null, added_at: new Date().toISOString() });
  };

  const inputStyle = {
    background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: ACID,
    fontFamily: FONT_MONO, fontSize: 11, outline: "none", width: "100%",
    padding: "6px 10px", borderRadius: 2, caretColor: ACID,
  };
  const labelStyle = {
    color: `${ACID}55`, fontSize: 10, fontFamily: FONT_MONO,
    letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 4,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }} className="relative p-4 rounded-sm"
      style={{ background: GLASS_BG, border: `1px solid ${ACID}22`, fontFamily: FONT_MONO }}>
      <p className="text-xs tracking-[0.3em] uppercase font-bold mb-4" style={{ color: ACID }}>
        {initialData ? "✎ EDITAR TRACK" : "◈ AÑADIR TRACK"}
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="Track title..." />
        </div>
        <div>
          <label style={labelStyle}>Artist</label>
          <input style={inputStyle} value={form.artist} onChange={set("artist")} placeholder="Artist name..." />
        </div>
        <div>
          <label style={labelStyle}>URL (YouTube / Spotify)</label>
          <input style={inputStyle} value={form.url} onChange={set("url")} placeholder="https://..." />
        </div>
        <div>
          <label style={labelStyle}>Note</label>
          <input style={inputStyle} value={form.note} onChange={set("note")} placeholder="Why this track?" />
        </div>
        <div>
          <label style={labelStyle}>Vibe</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {VIBE_TAGS.filter((v) => v.id !== "all").map((vibe) => (
              <motion.button key={vibe.id} whileTap={{ scale: 0.9 }}
                onClick={() => setForm((p) => ({ ...p, vibe: vibe.id }))}
                className="text-xs px-2 py-1 rounded-sm tracking-wider uppercase"
                style={{ color: vibe.color,
                  background: form.vibe === vibe.id ? `${vibe.color}20` : "transparent",
                  border: `1px solid ${form.vibe === vibe.id ? vibe.color + "55" : vibe.color + "22"}` }}>
                {vibe.icon} {vibe.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={submit}
          className="flex-1 py-2 text-xs tracking-widest uppercase font-bold rounded-sm"
          style={{ background: `${ACID}18`, border: `1px solid ${ACID}44`, color: ACID, textShadow: `0 0 8px ${ACID}66` }}>
          + ADD
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
          className="px-4 py-2 text-xs tracking-widest uppercase rounded-sm opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: ACID, border: `1px solid ${ACID}22` }}>
          CANCEL
        </motion.button>
      </div>
    </motion.div>
  );
};