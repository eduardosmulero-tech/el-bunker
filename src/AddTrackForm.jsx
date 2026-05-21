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

const isPlaylistUrl = (url) =>
  /[?&]list=/.test(url) && !/[?&]v=/.test(url) && !/youtu\.be\//.test(url);

export const AddTrackForm = ({ onAdd, onClose, initialData = null, VIBE_TAGS, onUploadDrive }) => {
  const detectType = () => {
    if (!initialData) return "youtube";
    return initialData.type === "drive" ? "drive" : "youtube";
  };

  const [trackType, setTrackType] = useState(detectType);
  const [form, setForm] = useState(initialData
    ? { title: initialData.title ?? "", artist: initialData.artist ?? "", url: initialData.url ?? "", note: initialData.note ?? "", vibe: initialData.vibe ?? "gaming" }
    : { title: "", artist: "", url: "", note: "", vibe: "gaming" }
  );
  const [driveFile, setDriveFile] = useState(null);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = () => {
    if (trackType === "youtube") {
      if (isPlaylistUrl(form.url)) {
        alert("⚠ Esa URL es una playlist de YouTube, no una canción.\nCopia el enlace de un track individual.");
        return;
      }
      if (!form.title.trim()) return;
      onAdd(initialData
        ? { ...initialData, ...form, type: "youtube" }
        : { ...form, id: uuid(), type: "youtube", drive_file_id: null, youtube_url: form.url, era_id: null, added_at: new Date().toISOString() }
      );
    } else {
      if (!form.title.trim()) return;
      if (!initialData && !driveFile) { alert("Selecciona un archivo MP3."); return; }
      if (driveFile && onUploadDrive) {
        onUploadDrive({ file: driveFile, meta: { ...form, id: initialData?.id ?? uuid(), type: "drive", youtube_url: null, era_id: null, added_at: new Date().toISOString() } });
      } else if (initialData) {
        onAdd({ ...initialData, ...form, type: "drive" });
      }
    }
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

      {/* Selector de tipo — solo en modo añadir */}
      {!initialData && (
        <div className="flex gap-2 mb-4">
          {[{ id: "youtube", label: "▶ YouTube" }, { id: "drive", label: "⬆ Drive MP3" }].map((t) => (
            <motion.button key={t.id} whileTap={{ scale: 0.95 }}
              onClick={() => setTrackType(t.id)}
              className="flex-1 py-1.5 text-xs tracking-widest uppercase rounded-sm"
              style={{
                color: ACID,
                background: trackType === t.id ? `${ACID}18` : "transparent",
                border: `1px solid ${trackType === t.id ? ACID + "55" : ACID + "18"}`,
              }}>
              {t.label}
            </motion.button>
          ))}
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

        {trackType === "youtube" && (
          <div>
            <label style={labelStyle}>URL YouTube</label>
            <input style={inputStyle} value={form.url} onChange={set("url")} placeholder="https://youtube.com/watch?v=..." />
          </div>
        )}

        {trackType === "drive" && !initialData && (
          <div>
            <label style={labelStyle}>Archivo MP3</label>
            <input type="file" accept=".mp3,audio/mpeg"
              onChange={(e) => setDriveFile(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: "5px 10px", cursor: "pointer" }} />
            {driveFile && (
              <p className="text-xs mt-1 opacity-50" style={{ color: ACID }}>{driveFile.name}</p>
            )}
          </div>
        )}

        <div>
          <label style={labelStyle}>Nota</label>
          <input style={inputStyle} value={form.note} onChange={set("note")} placeholder="¿Por qué este track?" />
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
          {initialData ? "✎ GUARDAR" : "+ AÑADIR"}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
          className="px-4 py-2 text-xs tracking-widest uppercase rounded-sm opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: ACID, border: `1px solid ${ACID}22` }}>
          CANCELAR
        </motion.button>
      </div>
    </motion.div>
  );
};