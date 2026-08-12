// ============================================================
//  EL BÚNKER — TagManager.jsx
//  Gestión de tags personalizables (VB11/VB17).
//  Tags guardados en music_lab.tags en Drive (schema 5.0.0).
// ============================================================

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID } from "../tokens";
import { ColorPicker } from "../core/ColorPicker";
import { useToast } from "../core/ToastContext";
import { Icon, UserGlyph } from "../core/ui";

const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";
const GLASS_BG     = "rgba(191,255,0,0.03)";

const emptyForm = () => ({ label: "", icon: "", color: "#00ffcc" });

export const TagManager = ({ tags = [], tracks = [], onAdd, onUpdate, onDelete, onReorder, onFilterByTag }) => {
  const [showForm,      setShowForm]      = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [form,          setForm]          = useState(emptyForm);
  const { toast } = useToast();
  const dragIdx = useRef(null);

  const showToast = (msg) => toast({ msg, duration: 2500 });

  const isValid = form.label.trim() && form.icon.trim() && /^#[0-9a-fA-F]{6}$/.test(form.color);

  const openForm = () => { setShowForm(true); setEditingId(null); setForm(emptyForm()); };
  const handleCancel = () => { setForm(emptyForm()); setEditingId(null); setShowForm(false); };

  const handleSubmit = async () => {
    if (!isValid) return;
    if (editingId) {
      await onUpdate?.(editingId, { label: form.label.trim(), icon: form.icon.trim(), color: form.color });
      showToast("TAG ACTUALIZADO");
    } else {
      await onAdd?.({ label: form.label.trim(), icon: form.icon.trim(), color: form.color });
      showToast("TAG CREADO");
    }
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (tag) => {
    setForm({ label: tag.label, icon: tag.icon, color: tag.color });
    setEditingId(tag.id);
    setShowForm(true);
  };

  const handleDelete = (tag) => {
    const inUse = tracks.filter((t) => t.tag === tag.id || (t.tags ?? []).includes(tag.id)).length;
    if (inUse > 0) {
      showToast(`NO SE PUEDE ELIMINAR — ${inUse} TRACK${inUse > 1 ? "S" : ""} LO USAN`);
      return;
    }
    onDelete?.(tag.id);
    showToast("TAG ELIMINADO");
  };

  // ── Drag reorder ────────────────────────────────────────────
  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver  = (e) => { e.preventDefault(); };
  const handleDragDrop  = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...tags];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = null;
    onReorder?.(next);
  };

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: FONT_MONO }}>

      {null}

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: ACID }}>
          <Icon name="tag" size={14} decorative /> TAGS [{String(tags.length).padStart(2, "0")}]
        </span>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => { if (showForm && !editingId) { handleCancel(); } else { openForm(); } }}
          className="w-11 h-11 flex items-center justify-center rounded-sm text-sm"
          style={{ color: ACID, border: `1px solid ${showForm && !editingId ? ACID + "66" : ACID + "33"}`,
            background: showForm && !editingId ? `${ACID}15` : `${ACID}06` }}>
          {showForm && !editingId ? <Icon name="close" size={14} decorative /> : <Icon name="plus" size={14} decorative />}
        </motion.button>
      </div>

      {/* Formulario crear/editar */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3 p-3 rounded-sm"
            style={{ background: `${ACID}04`, border: `1px solid ${ACID}22` }}>
            <p className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: ACID }}>
              <Icon name={editingId ? "edit" : "plus"} size={14} decorative /> {editingId ? "EDITAR TAG" : "NUEVO TAG"}
            </p>

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID }}>Nombre</span>
              <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="mi tag"
                style={{ background: `${ACID}06`, border: `1px solid ${ACID}33`, borderRadius: 2,
                  color: ACID, fontSize: 11, padding: "12px 12px", fontFamily: FONT_MONO,
                  letterSpacing: "0.15em", outline: "none" }} />
            </div>

            {/* Icono — input directo */}
            <div className="flex flex-col gap-1">
              <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID }}>Icono (emoji)</span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 20, color: form.color, lineHeight: 1, minWidth: 28, textAlign: "center" }}>
                  <UserGlyph glyph={form.icon} size={20} decorative />
                </span>
                <input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="archive"
                  maxLength={4}
                  style={{ flex: 1, background: `${ACID}06`, border: `1px solid ${ACID}33`, borderRadius: 2,
                    color: ACID, fontSize: 18, padding: "12px 12px", fontFamily: FONT_MONO,
                    letterSpacing: "0.1em", outline: "none", textAlign: "center" }} />
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1">
              <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID }}>Color</span>
              <ColorPicker value={form.color} onChange={(c) => setForm((p) => ({ ...p, color: c }))} />
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-2 rounded-sm"
              style={{ background: `${form.color}08`, border: `1px solid ${form.color}33` }}>                <UserGlyph glyph={form.icon} size={16} decorative />
              <span className="text-xs font-bold tracking-widest" style={{ color: form.color }}>
                {form.label || "PREVIEW"}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-sm ml-auto"
                style={{ color: form.color, background: `${form.color}15`, border: `1px solid ${form.color}33` }}>
                <UserGlyph glyph={form.icon} size={14} decorative />
              </span>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={!isValid}
                style={{ flex: 1, padding: "14px 0", background: isValid ? `${ACID}18` : `${ACID}06`,
                  border: `1px solid ${isValid ? ACID + "55" : ACID + "22"}`,
                  color: isValid ? ACID : `${ACID}44`, fontSize: 10, letterSpacing: "0.2em",
                  borderRadius: 2, cursor: isValid ? "pointer" : "not-allowed", fontFamily: FONT_MONO }}>
                {editingId ? "GUARDAR" : "CREAR TAG"}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleCancel}
                style={{ padding: "14px 16px", background: "transparent", border: `1px solid ${ACID}22`,
                  color: `${ACID}55`, fontSize: 10, borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                CANCELAR
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de tags */}
      <div className="flex flex-col gap-2">
        {tags.length === 0 ? (
          <p className="text-xs opacity-20 tracking-widest text-center py-4 uppercase" style={{ color: ACID }}>
            — sin tags —
          </p>
        ) : (
          tags.map((tag, i) => {
            const inUse = tracks.filter((t) => t.tag === tag.id || (t.tags ?? []).includes(tag.id)).length;
            const isSystem = tag.created_by === "system";
            return (
              <div key={tag.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={() => handleDragDrop(i)}
                className="flex items-center gap-3 p-3 rounded-sm"
                style={{ background: GLASS_BG, border: `1px solid ${tag.color}22`,
                  fontFamily: FONT_MONO, cursor: "grab" }}>
                <Icon name="more" size={13} decorative className="flex-shrink-0" />
                <UserGlyph glyph={tag.icon} size={18} label={tag.label} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold tracking-widest" style={{ color: tag.color }}>{tag.label}</p>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => onFilterByTag?.(tag.id)}
                    style={{ background: "none", border: "none", padding: "12px 8px", cursor: onFilterByTag ? "pointer" : "default",
                      color: `${ACID}40`, fontSize: 12, letterSpacing: "0.15em", fontFamily: FONT_MONO }}>
                    {inUse} track{inUse !== 1 ? "s" : ""}{isSystem ? " · sistema" : ""}
                    {onFilterByTag && inUse > 0 && <><span className="ml-1"><Icon name="arrowRight" size={11} decorative /></span></>}
                  </motion.button>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 2, background: tag.color, flexShrink: 0,
                  border: `1px solid ${tag.color}88` }} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleEdit(tag)}
                    style={{ color: ACID, background: `${ACID}0a`, border: `1px solid ${ACID}22`,
                      borderRadius: 2, fontSize: 12, padding: "12px 14px", fontFamily: FONT_MONO, flexShrink: 0 }}>
                    <Icon name="edit" size={14} decorative />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(tag)}
                    style={{ color: inUse > 0 ? "#ff444466" : "#ff4444",
                      background: "#ff444408", border: "1px solid #ff444422",
                      borderRadius: 2, fontSize: 12, padding: "12px 14px", fontFamily: FONT_MONO, flexShrink: 0,
                      cursor: inUse > 0 ? "not-allowed" : "pointer" }}>
                    <Icon name="close" size={14} decorative />
                  </motion.button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
