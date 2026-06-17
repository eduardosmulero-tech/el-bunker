// ============================================================
//  EL BÚNKER — AddEntryForm.jsx
//  Formulario polimórfico: note, photo, milestone, letter
//  + Fase 8.1 — Categoría 1 MULTIMEDIA (5 sub-tipos)
//  Con subida real de archivos a R2 vía FileUploadService
//  S59 · Fase 2 — VAULT núcleo · S81 · Fase 8.1
// ============================================================
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ACID, FONT_MONO, GLASS_BG, GLASS_BORDER, VIBE_TAGS, R2_PUBLIC_BASE } from "../tokens";
import { uploadFile } from "../core/FileUploadService";
import LocationSearch from "./LocationSearch";

// Fase 8.3 — Taxonomía completa 14 categorías (docs/spec/taxonomia_vault.md)
// Cada tipo: { id, category, icon, label, accept?, capture? }
// Tipos con `accept` → file upload (multimedia/docs). Resto → textarea.

// Fase 8.4 — Campos extra por categoría (S94). Cada key → campo en content JSON.
// Exportado para Vault.jsx (S98) — render enriquecido de badges en EraDetailPanel
// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORY_EXTRA_FIELDS = {
  "4": [  // Geografía
    { key: "location", label: "LUGAR", type: "text", placeholder: "Nombre del lugar…" },
    { key: "event_date", label: "FECHA", type: "date" },
  ],
  "5": [  // Línea temporal — fecha es obligatoria conceptualmente
    { key: "event_date", label: "FECHA", type: "date" },
  ],
  "6": [  // Listas y colecciones
    { key: "rating", label: "PUNTUACIÓN", type: "select", options: ["—","5 ★","4 ★","3 ★","2 ★","1 ★"] },
    { key: "url", label: "ENLACE", type: "url", placeholder: "https://…" },
  ],
  "7": [  // Comunicación y crecimiento
    { key: "mood", label: "ESTADO", type: "select", options: ["—","😊 Genial","🙂 Bien","😐 Neutral","🙁 Regular","😞 Mal"] },
  ],
  "8": [  // Conocimiento externo
    { key: "url", label: "ENLACE", type: "url", placeholder: "https://…" },
  ],
  "10": [ // Finanzas
    { key: "amount", label: "CANTIDAD (€)", type: "number", placeholder: "0.00" },
  ],
  "11": [ // Rituales y tradiciones
    { key: "event_date", label: "FECHA", type: "date" },
  ],
};

// Placeholder contextual por tipo
const PLACEHOLDER_BY_TYPE = {
  letter: "Querido…",
  gratitude: "Hoy agradezco…",
  dream_log: "Anoche soñé que…",
  inside_joke: "El origen de este inside joke…",
  nickname: "Te empecé a llamar así porque…",
  open_when: "Abrir cuando…",
  decision_log: "Decidimos que… porque…",
  conflict_log: "Qué pasó, cómo lo arreglamos…",
  rel_checkin: "¿Cómo estamos? …",
  quote: "«…» — …",
  review: "Qué pedimos, qué tal estuvo…",
};
// Exportado para VaultGallery + Vault (S95/S96) — single source of truth de categorías
// eslint-disable-next-line react-refresh/only-export-components
export const ENTRY_TYPES = [
  // ── 1. MULTIMEDIA ──────────────────────────────────────────
  { id: "photo",      category: "1",  icon: "📷", label: "FOTOS",      accept: "image/*",             capture: "environment" },
  { id: "video",      category: "1",  icon: "🎬", label: "VÍDEOS",     accept: "video/*",             capture: "environment" },
  { id: "audio",      category: "1",  icon: "🎙", label: "AUDIO",      accept: "audio/*",             capture: null },
  { id: "gif",        category: "1",  icon: "🎞", label: "GIFs/MEMES", accept: "image/gif,image/webp", capture: null },
  { id: "screenshot", category: "1",  icon: "📱", label: "CAPTURAS",   accept: "image/*",             capture: null },
  // ── 2. ESCRITURA ÍNTIMA ────────────────────────────────────
  { id: "note",            category: "2",  icon: "✎",  label: "NOTA RÁPIDA" },
  { id: "letter",          category: "2",  icon: "♥",  label: "CARTAS" },
  { id: "open_when",       category: "2",  icon: "⏳", label: "ABRIR CUANDO…" },
  { id: "shared_diary",    category: "2",  icon: "📖", label: "DIARIO COMPARTIDO" },
  { id: "personal_diary",  category: "2",  icon: "🔒", label: "DIARIO PERSONAL" },
  { id: "gratitude",       category: "2",  icon: "🙏", label: "GRATITUD DIARIA" },
  { id: "dream_log",       category: "2",  icon: "🌙", label: "REGISTRO DE SUEÑOS" },
  { id: "inside_joke",     category: "2",  icon: "😂", label: "INSIDE JOKES" },
  { id: "nickname",        category: "2",  icon: "🏷",  label: "GLOSARIO DE APODOS" },
  // ── 3. DOCUMENTOS PERSONALES ───────────────────────────────
  { id: "legal_doc",       category: "3",  icon: "⚖",  label: "LEGALES",        accept: "*/*" },
  { id: "medical_doc",     category: "3",  icon: "🏥", label: "MÉDICOS",         accept: "*/*" },
  { id: "financial_doc",   category: "3",  icon: "💰", label: "FINANCIEROS",     accept: "*/*" },
  { id: "professional_doc",category: "3",  icon: "💼", label: "PROFESIONALES",   accept: "*/*" },
  { id: "education_doc",   category: "3",  icon: "🎓", label: "EDUCACIÓN",       accept: "*/*" },
  { id: "backup_2fa",      category: "3",  icon: "🔐", label: "BACKUP 2FA" },
  { id: "if_i_die",        category: "3",  icon: "📜", label: "POR SI ME PASA ALGO" },
  // ── 4. GEOGRAFÍA DE LA RELACIÓN ────────────────────────────
  { id: "place",           category: "4",  icon: "📍", label: "LUGARES NUESTROS" },
  { id: "travel",          category: "4",  icon: "✈",  label: "VIAJES" },
  { id: "wishlist_place",  category: "4",  icon: "🗺",  label: "SITIOS POR VISITAR" },
  { id: "checkin",         category: "4",  icon: "📍", label: "CHECK-INS",       accept: "image/*" },
  { id: "review",          category: "4",  icon: "⭐",  label: "RESEÑAS DE PAREJA" },
  // ── 5. LÍNEA TEMPORAL ──────────────────────────────────────
  { id: "milestone",         category: "5",  icon: "◆",  label: "HITOS RELACIÓN" },
  { id: "personal_milestone",category: "5",  icon: "◇",  label: "HITOS PERSONALES" },
  { id: "on_this_day",       category: "5",  icon: "🔁", label: "UN DÍA COMO HOY" },
  { id: "countdown",         category: "5",  icon: "⏱",  label: "CUENTA ATRÁS" },
  { id: "future_plan",       category: "5",  icon: "🔮", label: "PROYECCIÓN FUTURA" },
  { id: "mood_tracker",      category: "5",  icon: "📊", label: "LÍNEA EMOCIONAL" },
  // ── 6. LISTAS Y COLECCIONES ────────────────────────────────
  { id: "movies",     category: "6",  icon: "🎬", label: "PELIS / SERIES" },
  { id: "books",      category: "6",  icon: "📚", label: "LIBROS" },
  { id: "recipes",    category: "6",  icon: "🍳", label: "RECETAS" },
  { id: "bucket_list",category: "6",  icon: "🪣", label: "BUCKET LIST" },
  { id: "gift_ideas", category: "6",  icon: "🎁", label: "IDEAS DE REGALO" },
  { id: "expenses",   category: "6",  icon: "🧾", label: "GASTOS COMPARTIDOS" },
  { id: "inventory",  category: "6",  icon: "📦", label: "INVENTARIO DE CASA" },
  { id: "pets_plants",category: "6",  icon: "🌿", label: "PLANTAS / MASCOTAS" },
  // ── 7. COMUNICACIÓN Y CRECIMIENTO ──────────────────────────
  { id: "decision_log",     category: "7",  icon: "📋", label: "REGISTRO DE DECISIONES" },
  { id: "conflict_log",     category: "7",  icon: "🕊",  label: "RESOLUCIÓN DE CONFLICTOS" },
  { id: "therapy_notes",    category: "7",  icon: "🧠", label: "NOTAS DE TERAPIA" },
  { id: "rel_checkin",      category: "7",  icon: "💚", label: "CHECK-IN DE RELACIÓN" },
  { id: "values",           category: "7",  icon: "🧭", label: "VALORES ALINEADOS" },
  { id: "love_languages",   category: "7",  icon: "💝", label: "LOVE LANGUAGES" },
  // ── 8. CONOCIMIENTO EXTERNO ────────────────────────────────
  { id: "link",         category: "8",  icon: "🔗", label: "ENLACES ÚTILES" },
  { id: "article",      category: "8",  icon: "📄", label: "ARTÍCULOS" },
  { id: "podcast",      category: "8",  icon: "🎧", label: "PODCASTS / EPISODIOS" },
  { id: "quote",        category: "8",  icon: "💬", label: "CITAS QUE RESONARON" },
  { id: "skill",        category: "8",  icon: "🛠",  label: "SKILLS POR APRENDER" },
  // ── 9. IDENTIDAD CREATIVA ──────────────────────────────────
  { id: "moodboard",   category: "9",  icon: "🎨", label: "MOODBOARDS",    accept: "image/*" },
  { id: "color_palette",category: "9",  icon: "🌈", label: "PALETAS DE COLOR" },
  { id: "playlist_story",category: "9",  icon: "🎵", label: "PLAYLISTS CON HISTORIA" },
  { id: "photo_album",  category: "9",  icon: "🖼",  label: "ÁLBUMES NARRADOS", accept: "image/*" },
  // ── 10. FINANZAS DE PAREJA ─────────────────────────────────
  { id: "budget",           category: "10", icon: "💵", label: "PRESUPUESTO COMPARTIDO" },
  { id: "savings_goal",     category: "10", icon: "🎯", label: "METAS DE AHORRO" },
  { id: "subscriptions",    category: "10", icon: "📆", label: "SUSCRIPCIONES" },
  { id: "big_purchase",     category: "10", icon: "🛒", label: "COMPRAS GRANDES" },
  // ── 11. RITUALES Y TRADICIONES ─────────────────────────────
  { id: "ritual",        category: "11", icon: "🕯",  label: "RITUALES NUESTROS" },
  { id: "tradition",     category: "11", icon: "🎉", label: "TRADICIONES INVENTADAS" },
  { id: "anniversary",   category: "11", icon: "💍", label: "PLANES DE ANIVERSARIO" },
  { id: "holiday",       category: "11", icon: "🎄", label: "VACACIONES / FIESTAS" },
  // ── 12. SEGURIDAD Y LEGADO ─────────────────────────────────
  { id: "emergency_contact",category: "12", icon: "🆘", label: "CONTACTOS EMERGENCIA" },
  { id: "digital_will",     category: "12", icon: "📝", label: "VOLUNTADES DIGITALES" },
  { id: "safe_box",         category: "12", icon: "🔏", label: "CAJA FUERTE DIGITAL" },
  { id: "recovery_keys",    category: "12", icon: "🔑", label: "LLAVES DE RECUPERACIÓN" },
  // ── 13. DATOS Y ESTADÍSTICAS ───────────────────────────────
  { id: "year_summary",  category: "13", icon: "📊", label: "RESUMEN ANUAL" },
  { id: "streak",        category: "13", icon: "🔥", label: "RACHAS" },
  { id: "heat_map",      category: "13", icon: "🌡",  label: "MAPA DE CALOR EMOCIONAL" },
  { id: "rel_stats",     category: "13", icon: "📈", label: "STATS DE LA RELACIÓN" },
  // ── 14. INTEGRACIONES FUTURAS ──────────────────────────────
  { id: "import_photos",  category: "14", icon: "🖼",  label: "IMPORT GOOGLE PHOTOS" },
  { id: "import_spotify", category: "14", icon: "🎵", label: "IMPORT SPOTIFY" },
  { id: "import_calendar",category: "14", icon: "📅", label: "IMPORT CALENDARIO" },
  { id: "email_forward",  category: "14", icon: "📧", label: "EMAIL FORWARD" },
];

// Conjuntos rápidos para ramas de render condicional
const FILE_UPLOAD_TYPES = new Set(ENTRY_TYPES.filter((t) => t.accept).map((t) => t.id));
const ALL_CATEGORIES = [...new Set(ENTRY_TYPES.map((t) => t.category))].sort((a, b) => parseInt(a) - parseInt(b));

// S96 — Filtro de categorías (exportado para Vault.jsx + VaultGallery.jsx)
// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORY_FILTERS = [
  { id: "all",  icon: "◈", label: "TODO" },
  { id: "1",    icon: "📷", label: "MULTIMEDIA" },
  { id: "2",    icon: "✎",  label: "ESCRITURA" },
  { id: "3",    icon: "📄", label: "DOCUMENTOS" },
  { id: "4",    icon: "📍", label: "GEOGRAFÍA" },
  { id: "5",    icon: "⏳", label: "TEMPORAL" },
  { id: "6",    icon: "📋", label: "LISTAS" },
  { id: "7",    icon: "💚", label: "COMUNICACIÓN" },
  { id: "8",    icon: "🔗", label: "CONOCIMIENTO" },
  { id: "9",    icon: "🎨", label: "CREATIVO" },
  { id: "10",   icon: "💰", label: "FINANZAS" },
  { id: "11",   icon: "🕯",  label: "RITUALES" },
  { id: "12",   icon: "🔐", label: "SEGURIDAD" },
  { id: "13",   icon: "📊", label: "DATOS" },
  { id: "14",   icon: "🔄", label: "INTEGRACIÓN" },
];

const CATEGORY_LABELS = {
  "1":  "1 · MULTIMEDIA",
  "2":  "2 · ESCRITURA ÍNTIMA",
  "3":  "3 · DOCUMENTOS",
  "4":  "4 · GEOGRAFÍA",
  "5":  "5 · LÍNEA TEMPORAL",
  "6":  "6 · LISTAS Y COLECCIONES",
  "7":  "7 · COMUNICACIÓN",
  "8":  "8 · CONOCIMIENTO EXTERNO",
  "9":  "9 · IDENTIDAD CREATIVA",
  "10": "10 · FINANZAS",
  "11": "11 · RITUALES",
  "12": "12 · SEGURIDAD",
  "13": "13 · DATOS",
  "14": "14 · INTEGRACIONES",
};

// Subcarpeta R2 — multimedia tiene subcarpetas dedicadas, el resto va a vault/files
const getUploadFolder = (type) => {
  const map = {
    photo: "vault/photos", video: "vault/videos", audio: "vault/audio",
    gif: "vault/gifs", screenshot: "vault/screenshots",
  };
  return map[type] ?? "vault/files";
};

// Sub-componente: grupo de botones de tipo por categoría (14 categorías)
// headerOpacity baja con el número de categoría para dar jerarquía visual.
function TypeGroup({ category, currentType, onSelect }) {
  const types = ENTRY_TYPES.filter((t) => t.category === category);
  if (!types.length) return null;
  const catNum = parseInt(category);
  const headerOpacity = Math.max(0.12, 0.45 - catNum * 0.02);
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[9px] tracking-[0.25em] uppercase px-1"
        style={{ color: ACID, fontFamily: FONT_MONO, opacity: headerOpacity }}
      >
        {CATEGORY_LABELS[category] ?? category}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`text-xs px-3 py-2.5 min-h-[11px] transition-all ${currentType === t.id ? "" : "opacity-25 hover:opacity-50"}`}
            style={{
              color: currentType === t.id ? ACID : `${ACID}88`,
              borderBottom: currentType === t.id ? `1px solid ${ACID}` : "1px solid transparent",
              fontFamily: FONT_MONO,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    if (img.r2_key) return `${R2_PUBLIC_BASE}/${img.r2_key}`;
    return null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // S130-D: coordenadas de ubicación (geocoder + manual)
  const [locationLat, setLocationLat] = useState(entry?.content?.lat ?? null);
  const [locationLng, setLocationLng] = useState(entry?.content?.lng ?? null);
  const [locationName, setLocationName] = useState(entry?.content?.place_name ?? entry?.content?.location ?? "");
  const fileInputRef = useRef(null);
    // Fase 8.1 — Meta del tipo actual (evita 4× O(n) lookups en el render)
  const currentMeta = ENTRY_TYPES.find((t) => t.id === type);
  const currentCategory = currentMeta?.category;
  const extraFields = CATEGORY_EXTRA_FIELDS[currentCategory] ?? [];

  // Fase 8.4 — Estado de campos extra. Se inicializan desde entry.content si existe.
  const [extraValues, setExtraValues] = useState(() => {
    const vals = {};
    for (const f of extraFields) {
      vals[f.key] = entry?.content?.[f.key] ?? "";
    }
    return vals;
  });

  // Reset extra values cuando cambia la categoría.
  // La inicialización desde entry.content solo ocurre al montar (entry es estable).
  useEffect(() => {
    const vals = {};
    for (const f of extraFields) {
      vals[f.key] = entry?.content?.[f.key] ?? "";
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset de categoría es intencional
    setExtraValues(vals);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entry y extraFields son estables
  }, [currentCategory]);

  const setExtraValue = (key, value) => {
    setExtraValues((prev) => ({ ...prev, [key]: value }));
  };

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
      // Fase 8.4 — Merge campos extra en content JSON
      const extraContent = {};
      for (const f of extraFields) {
        const val = extraValues[f.key];
        if (val !== "" && val !== "—") extraContent[f.key] = val;
      }
      // S130-D: incluir coordenadas y nombre del lugar en content
      if (locationLat != null && locationLng != null) {
        extraContent.lat = locationLat;
        extraContent.lng = locationLng;
        if (locationName) extraContent.place_name = locationName;
      }
      const entryData = {
        type,
        title,
        content: { text: isEditing && !text.trim() ? (entry?.content?.text ?? "") : text, images: entry?.content?.images ?? [], ...extraContent },
        era_id: eraId,
        to_user: toUser,
        tags,
      };
      // Si es tipo con upload y hay archivo nuevo, subir a R2
      if (FILE_UPLOAD_TYPES.has(type) && photoFile) {
        const folder = getUploadFolder(type);
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
      setTags([]); setExtraValues({});
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
      {/* Tipo — Fase 8.3: 14 categorías dinámicas desde ENTRY_TYPES */}
      <div className="flex flex-col gap-2.5 max-h-[40vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {ALL_CATEGORIES.map((cat) => (
          <TypeGroup
            key={cat}
            category={cat}
            currentType={type}
            onSelect={setType}
          />
        ))}
      </div>

      {/* Fase 8.4 — Campos extra por categoría (fecha, url, rating, etc.) */}
      {extraFields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extraFields.map((f) => {
            if (f.type === "select") {
              return (
                <select
                  key={f.key}
                  value={extraValues[f.key] || ""}
                  onChange={(e) => setExtraValue(f.key, e.target.value)}
                  className="bg-transparent text-xs p-3 min-h-[44px] flex-1 min-w-[100px]"
                  style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}
                >
                  {(f.options ?? []).map((opt) => (
                    <option key={opt} value={opt === "—" ? "" : opt} style={{ background: "#050505" }}>{opt}</option>
                  ))}
                </select>
              );
            }
            return (
              <input
                key={f.key}
                type={f.type}
                value={extraValues[f.key] || ""}
                onChange={(e) => setExtraValue(f.key, e.target.value)}
                placeholder={f.placeholder ?? f.label}
                className="bg-transparent text-xs p-3 min-h-[44px] flex-1 min-w-[100px] outline-none"
                style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}
              />
            );
          })}
        </div>
      )}

      {/* Campos */}
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO"
        className="bg-transparent text-sm p-3 min-h-[44px] outline-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />

      {FILE_UPLOAD_TYPES.has(type) ? (
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
          placeholder={PLACEHOLDER_BY_TYPE[type] ?? "Escribe aquí…"} rows={4}
          className="bg-transparent text-sm p-2 outline-none resize-none" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }} />
      )}

      {/* Era + Destinatario */}
      <div className="flex gap-2">
        <select value={eraId || ""} onChange={e => setEraId(e.target.value || null)}
          className="bg-transparent text-xs p-3 min-h-[44px] flex-1" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}>
          <option value="" style={{ background: "#050505" }}>Sin Era</option>
          {eras.map(e => <option key={e.id} value={e.id} style={{ background: "#050505" }}>{e.name}</option>)}
        </select>
        <select value={toUser} onChange={e => setToUser(e.target.value)}
          className="bg-transparent text-xs p-3 min-h-[44px]" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}>
          <option value="both" style={{ background: "#050505" }}>PARA AMBOS</option>
          <option value="edu" style={{ background: "#050505" }}>PARA EDU</option>
          <option value="david" style={{ background: "#050505" }}>PARA DAVID</option>
        </select>
      </div>

      {/* S130-D: ubicación con geocoder */}
      <LocationSearch
        value={locationName}
        lat={locationLat}
        lng={locationLng}
        onSelect={({ place_name, lat, lng }) => {
          setLocationName(place_name);
          setLocationLat(lat);
          setLocationLng(lng);
          setExtraValue("location", place_name);
        }}
        onClear={() => {
          setLocationName("");
          setLocationLat(null);
          setLocationLng(null);
        }}
      />

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {VIBE_TAGS.filter(t => t.namespace === "vault" || !t.namespace).map(tag => (
          <button key={tag.id} onClick={() => setTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
            className="text-xs px-3 py-2.5"
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
          className="text-xs tracking-[0.2em] uppercase p-3 min-h-[44px] flex-1" style={{ color: ACID, border: `1px solid ${ACID}44`, fontFamily: FONT_MONO }}>
          {isSubmitting ? "GUARDANDO..." : isEditing ? "ACTUALIZAR" : FILE_UPLOAD_TYPES.has(type) ? `SUBIR ${currentMeta?.label ?? "ARCHIVO"}` : "GUARDAR"}
        </motion.button>
        {onCancel && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={onCancel}
            className="text-xs tracking-[0.2em] uppercase p-3 min-h-[44px] opacity-40" style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}>
            CANCELAR
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
