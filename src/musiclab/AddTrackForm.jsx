import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ACID } from "../tokens";
// S90 EC-TR6: extraer metadatos ID3 al seleccionar MP3
import jsmediatags from "jsmediatags";

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
          tag:    initialData.tag ?? initialData.vibe ?? "",
        }
      : { title: "", artist: "", note: "", tag: "" }
  );
  // S90 EC-TR6: estado para el archivo MP3 seleccionado y flag de ID3 leído
  const [selectedFile, setSelectedFile] = useState(null);
  const [readingId3, setReadingId3] = useState(false);
  const fileInputRef = useRef(null);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = () => {
    if (!form.title.trim() || !form.tag) return;
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
        {/* S90 EC-TR6: File input para MP3 con extracción ID3 */}
        {!initialData && (
          <div>
            <label style={labelStyle}>Archivo MP3</label>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-3 py-2 rounded-sm"
                style={{
                  color: selectedFile ? ACID : `${ACID}55`,
                  border: `1px solid ${selectedFile ? ACID + "44" : ACID + "22"}`,
                  background: selectedFile ? `${ACID}08` : "transparent",
                  fontFamily: FONT_MONO,
                }}
              >
                {selectedFile ? selectedFile.name : "SELECCIONAR MP3..."}
              </motion.button>
              {readingId3 && (
                <span className="text-xs opacity-40" style={{ color: ACID }}>LEYENDO ID3...</span>
              )}
              {selectedFile && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-xs px-2 py-2 rounded-sm"
                  style={{ color: "#ff4444", border: "1px solid #ff444433", background: "#ff444408", fontFamily: FONT_MONO }}
                >
                  ✕
                </motion.button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedFile(file);
                setReadingId3(true);
                // Extraer ID3 tags
                jsmediatags.read(file, {
                  onSuccess: (tag) => {
                    const tags = tag.tags;
                    setForm((p) => ({
                      ...p,
                      title: p.title || tags.title || "",
                      artist: p.artist || tags.artist || "",
                    }));
                    setReadingId3(false);
                  },
                  onError: () => {
                    console.warn("[AddTrackForm] ID3 read failed for", file.name);
                    setReadingId3(false);
                  },
                });
              }}
            />
          </div>
        )}
        <div>
          <label style={labelStyle}>Vibe <span style={{ color: "#ff4444", marginLeft: 2 }}>*</span></label>
          <div className="flex flex-wrap gap-2 mt-1">
            {VIBE_TAGS.filter((v) => v.id !== "all").map((vibe) => (
              <motion.button
                key={vibe.id} whileTap={{ scale: 0.9 }}
                onClick={() => setForm((p) => ({ ...p, tag: vibe.id }))}
                className="text-xs px-2 py-1 rounded-sm tracking-wider uppercase"
                style={{
                  color: vibe.color,
                  background: form.tag === vibe.id ? `${vibe.color}20` : "transparent",
                  border: `1px solid ${form.tag === vibe.id ? vibe.color + "55" : vibe.color + "22"}`,
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
          whileTap={form.tag ? { scale: 0.95 } : {}}
          onClick={form.tag ? submit : undefined}
          disabled={!form.tag}
          className="flex-1 py-2 text-xs tracking-widest uppercase font-bold rounded-sm"
          style={{
            background:  form.tag ? `${ACID}18` : "rgba(255,255,255,0.04)",
            border:      `1px solid ${form.tag ? ACID + "44" : "rgba(255,255,255,0.1)"}`,
            color:       form.tag ? ACID : "rgba(255,255,255,0.2)",
            textShadow:  form.tag ? `0 0 8px ${ACID}66` : "none",
            cursor:      form.tag ? "pointer" : "not-allowed",
          }}
        >
          {initialData ? "✎ GUARDAR" : (selectedFile ? "+ AÑADIR CON MP3" : "+ AÑADIR")}
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