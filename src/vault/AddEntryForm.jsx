// ============================================================
//  EL BÚNKER — AddEntryForm.jsx
//  Formulario polimórfico: note, photo, milestone, letter
//  + Fase 8.1 — Categoría 1 MULTIMEDIA (5 sub-tipos)
//  Con subida real de archivos a R2 vía FileUploadService
//  S59 · Fase 2 — VAULT núcleo · S81 · Fase 8.1
// ============================================================
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ACID, FONT_MONO, GLASS_BG, GLASS_BORDER, VIBE_TAGS } from "../tokens";
import { uploadFile } from "../core/FileUploadService";

// Fase 8.1 — Categoría 1: MULTIMEDIA (taxonomía docs/spec/taxonomia_vault.md)
// 1.1 Fotos, 1.2 Vídeos, 1.3 Audio, 1.4 GIFs/Memes, 1.5 Capturas de pantalla
const ENTRY_TYPES = [
  // ── Categoría 1: MULTIMEDIA ────────────────────────────────
  { id: "photo",      category: "1", icon: "📷", label: "FOTOS",    accept: "image/*",             capture: "environment" },
  { id: "video",      category: "1", icon: "🎬", label: "VÍDEOS",   accept: "video/*",             capture: "environment" },
  { id: "audio",      category: "1", icon: "🎙", label: "AUDIO",    accept: "audio/*",             capture: null },
  { id: "gif",        category: "1", icon: "🎞", label: "GIF/MEME", accept: "image/gif,image/webp", capture: null },
  { id: "screenshot", category: "1", icon: "📱", label: "CAPTURAS", accept: "image/*",             capture: null },
  // ── Otros tipos existentes ────────────────────────────────
  { id: "note",       category: "x", icon: "✎", label: "NOTA" },
  { id: "milestone",  category: "x", icon: "◆", label: "HITO" },
  { id: "letter",     category: "x", icon: "♥", label: "CARTA" },
];

// Conjunto rápido de tipos multimedia (sirve para rama de upload + preview)
const MULTIMEDIA_TYPES = new Set(ENTRY_TYPES.filter((t) => t.category === "1").map((t) => t.id));

// Subcarpeta R2 por tipo de entrada multimedia
const UPLOAD_FOLDER_BY_TYPE = {
  photo:      "vault/photos",
  video:      "vault/videos",
  audio:      "vault/audio",
  gif:        "vault/gifs",
  screenshot: "vault/screenshots",
};

export default function AddEntryForm({ eras = [], entry = null, onAdd, onUpdate, onCancel }) {
  const isEditing = !!entry;
  const [type, setType] = useState(entry?.type ?? "note");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [text, setText] = useState(typeof entry?.content?.text === "string" ? entry.content.text : "");
  const [eraId, setEraId] = useState(entry?.era_id ?? eras[0]?.id ?? null);
  const [toUser, setToUser] = useState(entry?.to_user ?? entry?.to ?? "both");
  const [tags, setTags] = useState(entry?.tags?.map((t) => t.id) ?? entry?.tags ?? []);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(() => {
    // Pre-visualizar imagen existente si la entrada ya tiene una
    if (!entry?.content?.images?.length) return null;
    const img = entry.content.images[0];
    if (img.dataUrl) return img.dataUrl;
    if (img.r2_key) return `https://el-bunker-api.thebunker-admin.workers.dev/${img.r2_key}`;
    return null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  // Fase 8.1 — Meta del tipo actual (evita 4× O(n) lookups en el render)
  const currentMeta = ENTRY_TYPES.find((t) => t.id === type);

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
    if (!text.trim() && !title.trim() && !photoFile && !isEditing) return;
    setIsSubmitting(true);
    try {
      const entryData = {
        type,
        title,
        content: { text: isEditing && !text.trim() ? (entry?.content?.text ?? "") : text, images: entry?.content?.images ?? [] },
        era_id: eraId,
        to_user: toUser,
        tags,
      };
      // Si es tipo multimedia y hay archivo nuevo, subir a R2
      if (MULTIMEDIA_TYPES.has(type) && photoFile) {
        const folder = UPLOAD_FOLDER_BY_TYPE[type] ?? "vault/misc";
        try {
          const { r2_key } = await uploadFile(photoFile, folder);
          // 8.1 — fase mínima: guardamos todo en `images` (futuras iteraciones
          // discriminarán video/audio/gif con su propio shape en `content`).
          entryData.content = { text: entryData.content.text, images: [{ r2_key, filename: photoFile.name, media_type: type }] };
        } catch {
          console.warn("[AddEntryForm] Upload a R2 falló, guardando preview local");
          entryData.content = { text: entryData.content.text, images: [{ dataUrl: photoPreview, filename: photoFile.name, media_type: type }] };
        }
      }
      if (isEditing) {
        await onUpdate?.(entry.id, entryData);
      } else {
        await onAdd?.(entryData);
      }
      setTitle(""); setText(""); setPhotoFile(null); setPhotoPreview(null);
      setTags([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 p-4 max-w-md mx-auto" style={{ fontFamily: FONT_MONO, background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
      {/* Header con título de edición */}
      {isEditing && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs tracking-[0.3em] uppercase opacity-50" style={{ color: ACID, fontFamily: FONT_MONO }}>
            ✎ EDITANDO ENTRADA
          </span>
          <span className="text-xs opacity-30" style={{ color: ACID, fontFamily: FONT_MONO }}>
            {entry.id?.slice(0, 8)}…
          </span>
        </div>
      )}
      {/* Tipo — Fase 8.1: agrupado por categoría. Categoría 1 (MULTIMEDIA) primero. */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.3em] uppercase opacity-40 px-1" style={{ color: ACID, fontFamily: FONT_MONO }}>
            1 · MULTIMEDIA
          </span>
          <div className="flex flex-wrap gap-2">
            {ENTRY_TYPES.filter(t => t.category === "1").map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`text-xs px-3 py-2 ${type === t.id ? "" : "opacity-30"}`}
                style={{ color: type === t.id ? ACID : `${ACID}88`, borderBottom: type === t.id ? `1px solid ${ACID}` : "none", fontFamily: FONT_MONO }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.3em] uppercase opacity-30 px-1" style={{ color: ACID, fontFamily: FONT_MONO }}>
            OTROS
          </span>
          <div className="flex flex-wrap gap-2">
            {ENTRY_TYPES.filter(t => t.category === "x").map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`text-xs px-3 py-2 ${type === t.id ? "" : "opacity-30"}`}
                style={{ color: type === t.id ? ACID : `${ACID}88`, borderBottom: type === t.id ? `1px solid ${ACID}` : "none", fontFamily: FONT_MONO }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Campos */}
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO"
        className="bg-transparent text-sm p-2 outline-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />

      {MULTIMEDIA_TYPES.has(type) ? (
        <>
          {/* File input oculto — accept/capture dinámicos según sub-tipo (8.1) */}
          <input
            ref={fileInputRef}
            type="file"
            accept={currentMeta?.accept ?? "*/*"}
            capture={currentMeta?.capture}
            onChange={handlePhotoSelect}
            className="hidden"
          />
          {/* Botón de selección */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative flex flex-col items-center justify-center p-6 cursor-pointer rounded-sm"
            style={{ border: `1px dashed ${ACID}44`, minHeight: 160, background: photoPreview ? "transparent" : `${ACID}04` }}>
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="max-h-40 object-contain rounded-sm" />
            ) : (
              <>
                <span className="text-3xl mb-2 opacity-40" style={{ color: ACID }}>
                  {currentMeta?.icon ?? "📷"}
                </span>
                <p className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID, fontFamily: FONT_MONO }}>
                  TAP PARA SELECCIONAR {currentMeta?.label ?? "ARCHIVO"}
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
          {isSubmitting ? "GUARDANDO..." : isEditing ? "ACTUALIZAR" : MULTIMEDIA_TYPES.has(type) ? `SUBIR ${currentMeta?.label ?? "ARCHIVO"}` : "GUARDAR"}
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
