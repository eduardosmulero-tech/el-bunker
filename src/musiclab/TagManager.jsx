// ============================================================
//  EL BÚNKER — TagManager.jsx
//  Gestión de tags personalizables (VB11/VB17).
//  Tags guardados en music_lab.tags en Drive (schema 5.0.0).
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE } from "../layout/Layout";

const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";
const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";

const PALETTE = [
  "#00ffcc", "#aaff44", "#ff6b35", "#bf00ff",
  "#ff2d55", "#00b4ff", "#ffcc00", "#ff69b4",
  "#7fff00", "#ff4500", "#1effbc", "#c77dff",
];

const ColorPicker = ({ value, onChange }) => {
  const [custom, setCustom] = useState(value ?? "#00ffcc");

  const handleCustom = (hex) => {
    setCustom(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((c) => (
          <motion.button key={c} whileTap={{ scale: 0.85 }}
            onClick={() => { setCustom(c); onChange(c); }}
            style={{
              width: 24, height: 24, borderRadius: 2, background: c, flexShrink: 0,
              border: value === c ? `2px solid #fff` : `1px solid ${c}55`,
              boxShadow: value === c ? `0 0 8px ${c}` : "none",
            }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div style={{ width: 24, height: 24, borderRadius: 2, background: custom, border: `1px solid ${custom}88`, flexShrink: 0 }} />
        <input
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          style={{ flex: 1, background: `${ACID}06`, border: `1px solid ${ACID}33`, borderRadius: 2,
            color: ACID, fontSize: 11, padding: "5px 10px", fontFamily: FONT_MONO,
            letterSpacing: "0.15em", outline: "none" }}
        />
      </div>
    </div>
  );
};

const EMPTY_FORM = { label: "", icon: "", color: "#00ffcc" };

export const TagManager = ({ tags = [], tracks = [], onAdd, onUpdate, onDelete, onReorder, onFilterByTag }) => {
  const [showForm,      setShowForm]      = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [form,          setForm]          = useState(emptyForm);
  const [toast,         setToast]         = useState(null);
  const [showIconPicker,setShowIconPicker]= useState(false);
  const dragIdx = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

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

      {/* IconPicker bottom sheet */}
      {showIconPicker && (
        <IconPicker
          value={form.icon}
          color={form.color}
          onSelect={(ic) => setForm((p) => ({ ...p, icon: ic }))}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: "fixed", bottom: 90, left: 16, right: 16, background: `${ACID}18`,
              border: `1px solid ${ACID}55`, color: ACID, fontFamily: FONT_MONO, fontSize: 11,
              letterSpacing: "0.25em", padding: "8px 20px", borderRadius: 2, zIndex: 9999, textAlign: "center" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: ACID }}>
          ◈ TAGS [{String(tags.length).padStart(2, "0")}]
        </span>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => { if (showForm && !editingId) { handleCancel(); } else { openForm(); } }}
          className="w-8 h-8 flex items-center justify-center rounded-sm text-sm"
          style={{ color: ACID, border: `1px solid ${showForm && !editingId ? ACID + "66" : ACID + "33"}`,
            background: showForm && !editingId ? `${ACID}15` : `${ACID}06` }}>
          {showForm && !editingId ? "✕" : "+"}
        </motion.button>
      </div>

      {/* Formulario crear/editar */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3 p-3 rounded-sm"
            style={{ background: `${ACID}04`, border: `1px solid ${ACID}22` }}>
            <p className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: ACID }}>
              {editingId ? "✎ EDITAR TAG" : "+ NUEVO TAG"}
            </p>

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID }}>Nombre</span>
              <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="mi tag"
                style={{ background: `${ACID}06`, border: `1px solid ${ACID}33`, borderRadius: 2,
                  color: ACID, fontSize: 11, padding: "7px 12px", fontFamily: FONT_MONO,
                  letterSpacing: "0.15em", outline: "none" }} />
            </div>

            {/* Icono — botón que abre bottom sheet */}
            <div className="flex flex-col gap-1">
              <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID }}>Icono</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowIconPicker(true)}
                style={{ display: "flex", alignItems: "center", gap: 10, background: `${ACID}06`,
                  border: `1px solid ${ACID}33`, borderRadius: 2, padding: "7px 12px",
                  cursor: "pointer", fontFamily: FONT_MONO, textAlign: "left" }}>
                <span style={{ fontSize: 20, color: form.color, lineHeight: 1, minWidth: 24 }}>
                  {form.icon || "◈"}
                </span>
                <span style={{ color: `${ACID}44`, fontSize: 10, letterSpacing: "0.15em" }}>
                  {form.icon ? "CAMBIAR ICONO" : "ELEGIR ICONO →"}
                </span>
              </motion.button>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1">
              <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID }}>Color</span>
              <ColorPicker value={form.color} onChange={(c) => setForm((p) => ({ ...p, color: c }))} />
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-2 rounded-sm"
              style={{ background: `${form.color}08`, border: `1px solid ${form.color}33` }}>
              <span style={{ color: form.color, fontSize: 16 }}>{form.icon || "◈"}</span>
              <span className="text-xs font-bold tracking-widest" style={{ color: form.color }}>
                {form.label || "PREVIEW"}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-sm ml-auto"
                style={{ color: form.color, background: `${form.color}15`, border: `1px solid ${form.color}33` }}>
                {form.icon || "◈"}
              </span>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={!isValid}
                style={{ flex: 1, padding: "7px 0", background: isValid ? `${ACID}18` : `${ACID}06`,
                  border: `1px solid ${isValid ? ACID + "55" : ACID + "22"}`,
                  color: isValid ? ACID : `${ACID}44`, fontSize: 10, letterSpacing: "0.2em",
                  borderRadius: 2, cursor: isValid ? "pointer" : "not-allowed", fontFamily: FONT_MONO }}>
                {editingId ? "GUARDAR" : "CREAR TAG"}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleCancel}
                style={{ padding: "7px 16px", background: "transparent", border: `1px solid ${ACID}22`,
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
                <span style={{ color: `${ACID}25`, fontSize: 11, flexShrink: 0 }}>⠿</span>
                <span style={{ color: tag.color, fontSize: 18, flexShrink: 0 }}>{tag.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold tracking-widest" style={{ color: tag.color }}>{tag.label}</p>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => onFilterByTag?.(tag.id)}
                    style={{ background: "none", border: "none", padding: 0, cursor: onFilterByTag ? "pointer" : "default",
                      color: `${ACID}40`, fontSize: 10, letterSpacing: "0.15em", fontFamily: FONT_MONO }}>
                    {inUse} track{inUse !== 1 ? "s" : ""}{isSystem ? " · sistema" : ""}
                    {onFilterByTag && inUse > 0 ? " →" : ""}
                  </motion.button>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 2, background: tag.color, flexShrink: 0,
                  border: `1px solid ${tag.color}88` }} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleEdit(tag)}
                  style={{ color: ACID, background: `${ACID}0a`, border: `1px solid ${ACID}22`,
                    borderRadius: 2, fontSize: 11, padding: "4px 8px", fontFamily: FONT_MONO, flexShrink: 0 }}>
                  ✎
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(tag)}
                  style={{ color: inUse > 0 ? "#ff444466" : "#ff4444",
                    background: "#ff444408", border: "1px solid #ff444422",
                    borderRadius: 2, fontSize: 11, padding: "4px 8px", fontFamily: FONT_MONO, flexShrink: 0,
                    cursor: inUse > 0 ? "not-allowed" : "pointer" }}>
                  ✕
                </motion.button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
