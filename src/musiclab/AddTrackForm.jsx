import { useState } from "react";
import { motion } from "framer-motion";
import { ACID } from "../layout/Layout";

const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

export const AddTrackForm = ({ onAdd, onClose, initialData = null, VIBE_TAGS }) => {
  const [form, setForm] = useState(
    initialData
      ? {
          title:  initialData.title  ?? "",
          artist: initialData.artist ?? "",
          note:   initialData.note   ?? "",
          vibe:   initialData.vibe   ?? "gaming",
        }
      : { title: "", artist: "", note: "", vibe: "gaming" }
  );

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...initialData, ...form });
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
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }} className="relative p-4 rounded-sm"
      style={{ background: GLASS_BG, border: `1px solid ${ACID}22`, fontFamily: FONT_MONO }}
    >
      <p className="text-xs tracking-[0.3em] uppercase font-bold mb-4" style={{ color: ACID }}>
        {initialData ? "✎ EDITAR TRACK" : "◈ AÑADIR TRACK"}
      </p>

      {!initialData && (
        <div
          className="mb-4 px-3 py-2 rounded-sm text-xs leading-relaxed"
          style={{
            background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.3)",
            color: "#ffcc00", fontFamily: FONT_MONO, letterSpacing: "0.05em",
          }}
        >
          ⚠ UPLOAD DESHABILITADO — Las subidas estarán disponibles en M2 (Cloudflare R2).
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <label style={labelStyle}>Título *</label>
          <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="Nombre del track..." />
        </div>
        <div>
          <label style={labelStyle}>Artista</label>
          <input style={inputStyle} value={form.artist} onChange={set("artist")} placeholder="Nombre del artista..." />
        </div>
        <div>
          <label style={labelStyle}>Nota</label>
          <input style={inputStyle} value={form.note} onChange={set("note")} placeholder="¿Por qué este track?" />
        </div>
        <div>
          <label style={labelStyle}>Vibe</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {VIBE_TAGS.filter((v) => v.id !== "all").map((vibe) => (
              <motion.button
                key={vibe.id} whileTap={{ scale: 0.9 }}
                onClick={() => setForm((p) => ({ ...p, vibe: vibe.id }))}
                className="text-xs px-2 py-1 rounded-sm tracking-wider uppercase"
                style={{
                  color: vibe.color,
                  background: form.vibe === vibe.id ? `${vibe.color}20` : "transparent",
                  border: `1px solid ${form.vibe === vibe.id ? vibe.color + "55" : vibe.color + "22"}`,
                }}
              >
                {vibe.icon} {vibe.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <motion.button
          whileTap={initialData ? { scale: 0.95 } : {}}
          onClick={initialData ? submit : undefined}
          disabled={!initialData}
          className="flex-1 py-2 text-xs tracking-widest uppercase font-bold rounded-sm"
          style={{
            background:  initialData ? `${ACID}18` : "rgba(255,255,255,0.04)",
            border:      `1px solid ${initialData ? ACID + "44" : "rgba(255,255,255,0.1)"}`,
            color:       initialData ? ACID : "rgba(255,255,255,0.2)",
            textShadow:  initialData ? `0 0 8px ${ACID}66` : "none",
            cursor:      initialData ? "pointer" : "not-allowed",
          }}
        >
          {initialData ? "✎ GUARDAR" : "+ AÑADIR"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }} onClick={onClose}
          className="px-4 py-2 text-xs tracking-widest uppercase rounded-sm opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: ACID, border: `1px solid ${ACID}22` }}
        >
          CANCELAR
        </motion.button>
      </div>
    </motion.div>
  );
};