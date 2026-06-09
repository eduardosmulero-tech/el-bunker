// ============================================================
//  EL BÚNKER — AddEntryForm.jsx
//  Formulario polimórfico: note, photo, milestone, letter
//  Con subida real de fotos a R2 vía FileUploadService
//  S59 · Fase 2 — VAULT núcleo
// ============================================================
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ACID, FONT_MONO, GLASS_BG, GLASS_BORDER, VIBE_TAGS } from "../tokens";

const ENTRY_TYPES = [
  { id: "note",      icon: "✎", label: "NOTA" },
  { id: "photo",     icon: "📷", label: "FOTO" },
  { id: "milestone", icon: "◆", label: "HITO" },
  { id: "letter",    icon: "♥", label: "CARTA" },
];

export default function AddEntryForm({ eras = [], onAdd, onCancel }) {
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [eraId, setEraId] = useState(eras[0]?.id ?? null);
  const [toUser, setToUser] = useState("both");
  const [tags, setTags] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    // Preview local
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!text.trim() && !title.trim() && !photoFile) return;
    setIsSubmitting(true);
    try {
      const entryData = {
        type,
        title,
        content: { text, images: [] },
        era_id: eraId,
        to_user: toUser,
        tags,
      };
      // Si es foto y hay archivo, subir a R2
      if (type === "photo" && photoFile) {
        try {
          const { uploadFile } = await import("../core/FileUploadService");
          const { r2_key } = await uploadFile(photoFile, "vault/photos");
          entryData.content = { text, images: [{ r2_key, filename: photoFile.name }] };
        } catch {
          console.warn("[AddEntryForm] Upload a R2 falló, guardando preview local");
          entryData.content = { text, images: [{ dataUrl: photoPreview, filename: photoFile.name }] };
        }
      }
      await onAdd?.(entryData);
      setTitle(""); setText(""); setPhotoFile(null); setPhotoPreview(null);
      setTags([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 p-4 max-w-md mx-auto" style={{ fontFamily: FONT_MONO, background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
      {/* Tipo */}
      <div className="flex gap-2">
        {ENTRY_TYPES.map(t => (
          <button key={t.id} onClick={() => setType(t.id)}
            className={`text-sm px-3 py-2 ${type === t.id ? "" : "opacity-30"}`}
            style={{ color: type === t.id ? ACID : `${ACID}88`, borderBottom: type === t.id ? `1px solid ${ACID}` : "none", fontFamily: FONT_MONO }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Campos */}
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO"
        className="bg-transparent text-sm p-2 outline-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />

      {type === "photo" ? (
        <>
          {/* File input oculto */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
            onChange={handlePhotoSelect} className="hidden" />
          {/* Botón de selección */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative flex flex-col items-center justify-center p-6 cursor-pointer rounded-sm"
            style={{ border: `1px dashed ${ACID}44`, minHeight: 160, background: photoPreview ? "transparent" : `${ACID}04` }}>
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="max-h-40 object-contain rounded-sm" />
            ) : (
              <>
                <span className="text-3xl mb-2 opacity-40" style={{ color: ACID }}>📷</span>
                <p className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID, fontFamily: FONT_MONO }}>
                  TAP PARA SELECCIONAR FOTO
                </p>
              </>
            )}
          </div>
          {photoFile && (
            <p className="text-xs opacity-40 truncate" style={{ color: ACID, fontFamily: FONT_MONO }}>
              {photoFile.name} ({(photoFile.size / 1024).toFixed(1)}KB)
            </p>
          )}
        </>
      ) : (
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder={type === "letter" ? "Querido..." : "Escribe aquí..."} rows={4}
          className="bg-transparent text-sm p-2 outline-none resize-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />
      )}

      {/* Era + Destinatario */}
      <div className="flex gap-2">
        <select value={eraId || ""} onChange={e => setEraId(e.target.value || null)}
          className="bg-transparent text-xs p-2 flex-1" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}>
          <option value="" style={{ background: "#050505" }}>Sin Era</option>
          {eras.map(e => <option key={e.id} value={e.id} style={{ background: "#050505" }}>{e.name}</option>)}
        </select>
        <select value={toUser} onChange={e => setToUser(e.target.value)}
          className="bg-transparent text-xs p-2" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}>
          <option value="both" style={{ background: "#050505" }}>PARA AMBOS</option>
          <option value="edu" style={{ background: "#050505" }}>PARA EDU</option>
          <option value="david" style={{ background: "#050505" }}>PARA DAVID</option>
        </select>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {VIBE_TAGS.filter(t => t.namespace === "vault" || !t.namespace).map(tag => (
          <button key={tag.id} onClick={() => setTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
            className="text-xs px-2 py-1"
            style={{
              color: tags.includes(tag.id) ? (tag.palette?.accent ?? tag.seedColor ?? ACID) : `${ACID}44`,
              border: `1px solid ${tags.includes(tag.id) ? (tag.palette?.accent ?? tag.seedColor ?? ACID) : `${ACID}22`}`,
              fontFamily: FONT_MONO,
            }}>
            {tag.icon} {tag.label}
          </button>
        ))}
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={isSubmitting}
          className="text-xs tracking-[0.2em] uppercase p-2 flex-1" style={{ color: ACID, border: `1px solid ${ACID}44`, fontFamily: FONT_MONO }}>
          {isSubmitting ? "GUARDANDO..." : type === "photo" ? "SUBIR FOTO" : "GUARDAR"}
        </motion.button>
        {onCancel && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={onCancel}
            className="text-xs tracking-[0.2em] uppercase p-2 opacity-40" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}>
            CANCELAR
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
