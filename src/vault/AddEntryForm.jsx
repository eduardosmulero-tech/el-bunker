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
import { useVibeAccent } from "../core/useVibeAccent";
import { uploadFile } from "../core/FileUploadService";
import { Icon, Input } from "../core/ui";
import LocationSearch from "./LocationSearch";

// Fase 8.3 — Tipos por entrada (docs/spec/taxonomia_vault.md, histórico desde ADR-033).
// Cada tipo: { id, category, icon, label, accept?, capture? }
// Tipos con `accept` → file upload (multimedia/docs). Resto → textarea.
// ADR-033: el catálogo de 14 categorías deja de ser el eje del selector; las
// SECCIONES (MEMORIA/PALABRAS/LUGARES/LISTAS) eligen qué tipos se ofrecen al
// crear. ENTRY_TYPES se conserva como tabla de mapeo AL LEER (type -> categoría
// -> sección) — el campo type original no se toca nunca.

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
    { key: "rating", label: "PUNTUACIÓN", type: "select", options: ["—","5","4","3","2","1"] },
    { key: "url", label: "ENLACE", type: "url", placeholder: "https://…" },
  ],
  "7": [  // Comunicación y crecimiento
    { key: "mood", label: "ESTADO", type: "select", options: ["—","Genial","Bien","Neutral","Regular","Mal"] },
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
  { id: "photo",      category: "1",  icon: "camera", label: "FOTOS",      accept: "image/*",             capture: "environment" },
  { id: "video",      category: "1",  icon: "film", label: "VÍDEOS",     accept: "video/*",             capture: "environment" },
  { id: "audio",      category: "1",  icon: "mic", label: "AUDIO",      accept: "audio/*",             capture: null },
  { id: "gif",        category: "1",  icon: "film", label: "GIFs/MEMES", accept: "image/gif,image/webp", capture: null },
  { id: "screenshot", category: "1",  icon: "image", label: "CAPTURAS",   accept: "image/*",             capture: null },
  // ── 2. ESCRITURA ÍNTIMA ────────────────────────────────────
  { id: "note",            category: "2",  icon: "edit",  label: "NOTA RÁPIDA" },
  { id: "letter",          category: "2",  icon: "heart",  label: "CARTAS" },
  { id: "open_when",       category: "2",  icon: "timer", label: "ABRIR CUANDO…" },
  { id: "shared_diary",    category: "2",  icon: "book", label: "DIARIO COMPARTIDO" },
  { id: "personal_diary",  category: "2",  icon: "lock", label: "DIARIO PERSONAL" },
  { id: "gratitude",       category: "2",  icon: "heart", label: "GRATITUD DIARIA" },
  { id: "dream_log",       category: "2",  icon: "sparkles", label: "REGISTRO DE SUEÑOS" },
  { id: "inside_joke",     category: "2",  icon: "sparkles", label: "INSIDE JOKES" },
  { id: "nickname",        category: "2",  icon: "tag",  label: "GLOSARIO DE APODOS" },
  // ── 3. DOCUMENTOS PERSONALES ───────────────────────────────
  { id: "legal_doc",       category: "3",  icon: "document",  label: "LEGALES",        accept: "*/*" },
  { id: "medical_doc",     category: "3",  icon: "document", label: "MÉDICOS",         accept: "*/*" },
  { id: "financial_doc",   category: "3",  icon: "analytics", label: "FINANCIEROS",     accept: "*/*" },
  { id: "professional_doc",category: "3",  icon: "document", label: "PROFESIONALES",   accept: "*/*" },
  { id: "education_doc",   category: "3",  icon: "book", label: "EDUCACIÓN",       accept: "*/*" },
  { id: "backup_2fa",      category: "3",  icon: "shield", label: "BACKUP 2FA" },
  { id: "if_i_die",        category: "3",  icon: "document", label: "POR SI ME PASA ALGO" },
  // ── 4. GEOGRAFÍA DE LA RELACIÓN ────────────────────────────
  { id: "place",           category: "4",  icon: "map", label: "LUGARES NUESTROS" },
  { id: "travel",          category: "4",  icon: "compass",  label: "VIAJES" },
  { id: "wishlist_place",  category: "4",  icon: "map",  label: "SITIOS POR VISITAR" },
  { id: "checkin",         category: "4",  icon: "map", label: "CHECK-INS",       accept: "image/*" },
  { id: "review",          category: "4",  icon: "star",  label: "RESEÑAS DE PAREJA" },
  // ── 5. LÍNEA TEMPORAL ──────────────────────────────────────
  { id: "milestone",         category: "5",  icon: "star",  label: "HITOS RELACIÓN" },
  { id: "personal_milestone",category: "5",  icon: "star",  label: "HITOS PERSONALES" },
  { id: "on_this_day",       category: "5",  icon: "refresh", label: "UN DÍA COMO HOY" },
  { id: "countdown",         category: "5",  icon: "timer",  label: "CUENTA ATRÁS" },
  { id: "future_plan",       category: "5",  icon: "sparkles", label: "PROYECCIÓN FUTURA" },
  { id: "mood_tracker",      category: "5",  icon: "analytics", label: "LÍNEA EMOCIONAL" },
  // ── 6. LISTAS Y COLECCIONES ────────────────────────────────
  { id: "movies",     category: "6",  icon: "film", label: "PELIS / SERIES" },
  { id: "books",      category: "6",  icon: "book", label: "LIBROS" },
  { id: "recipes",    category: "6",  icon: "archive", label: "RECETAS" },
  { id: "bucket_list",category: "6",  icon: "archive", label: "BUCKET LIST" },
  { id: "gift_ideas", category: "6",  icon: "archive", label: "IDEAS DE REGALO" },
  { id: "expenses",   category: "6",  icon: "document", label: "GASTOS COMPARTIDOS" },
  { id: "inventory",  category: "6",  icon: "archive", label: "INVENTARIO DE CASA" },
  { id: "pets_plants",category: "6",  icon: "sparkles", label: "PLANTAS / MASCOTAS" },
  // ── 7. COMUNICACIÓN Y CRECIMIENTO ──────────────────────────
  { id: "decision_log",     category: "7",  icon: "document", label: "REGISTRO DE DECISIONES" },
  { id: "conflict_log",     category: "7",  icon: "heart",  label: "RESOLUCIÓN DE CONFLICTOS" },
  { id: "therapy_notes",    category: "7",  icon: "analytics", label: "NOTAS DE TERAPIA" },
  { id: "rel_checkin",      category: "7",  icon: "heart", label: "CHECK-IN DE RELACIÓN" },
  { id: "values",           category: "7",  icon: "compass", label: "VALORES ALINEADOS" },
  { id: "love_languages",   category: "7",  icon: "heart", label: "LOVE LANGUAGES" },
  // ── 8. CONOCIMIENTO EXTERNO ────────────────────────────────
  { id: "link",         category: "8",  icon: "send", label: "ENLACES ÚTILES" },
  { id: "article",      category: "8",  icon: "document", label: "ARTÍCULOS" },
  { id: "podcast",      category: "8",  icon: "music", label: "PODCASTS / EPISODIOS" },
  { id: "quote",        category: "8",  icon: "mail", label: "CITAS QUE RESONARON" },
  { id: "skill",        category: "8",  icon: "settings",  label: "SKILLS POR APRENDER" },
  // ── 9. IDENTIDAD CREATIVA ──────────────────────────────────
  { id: "moodboard",   category: "9",  icon: "sparkles", label: "MOODBOARDS",    accept: "image/*" },
  { id: "color_palette",category: "9",  icon: "sparkles", label: "PALETAS DE COLOR" },
  { id: "playlist_story",category: "9",  icon: "music", label: "PLAYLISTS CON HISTORIA" },
  { id: "photo_album",  category: "9",  icon: "image",  label: "ÁLBUMES NARRADOS", accept: "image/*" },
  // ── 10. FINANZAS DE PAREJA ─────────────────────────────────
  { id: "budget",           category: "10", icon: "analytics", label: "PRESUPUESTO COMPARTIDO" },
  { id: "savings_goal",     category: "10", icon: "target", label: "METAS DE AHORRO" },
  { id: "subscriptions",    category: "10", icon: "calendar", label: "SUSCRIPCIONES" },
  { id: "big_purchase",     category: "10", icon: "archive", label: "COMPRAS GRANDES" },
  // ── 11. RITUALES Y TRADICIONES ─────────────────────────────
  { id: "ritual",        category: "11", icon: "sparkles",  label: "RITUALES NUESTROS" },
  { id: "tradition",     category: "11", icon: "sparkles", label: "TRADICIONES INVENTADAS" },
  { id: "anniversary",   category: "11", icon: "heart", label: "PLANES DE ANIVERSARIO" },
  { id: "holiday",       category: "11", icon: "calendar", label: "VACACIONES / FIESTAS" },
  // ── 12. SEGURIDAD Y LEGADO ─────────────────────────────────
  { id: "emergency_contact",category: "12", icon: "alert", label: "CONTACTOS EMERGENCIA" },
  { id: "digital_will",     category: "12", icon: "edit", label: "VOLUNTADES DIGITALES" },
  { id: "safe_box",         category: "12", icon: "lock", label: "CAJA FUERTE DIGITAL" },
  { id: "recovery_keys",    category: "12", icon: "key", label: "LLAVES DE RECUPERACIÓN" },
  // ── 13. DATOS Y ESTADÍSTICAS ───────────────────────────────
  { id: "year_summary",  category: "13", icon: "analytics", label: "RESUMEN ANUAL" },
  { id: "streak",        category: "13", icon: "zap", label: "RACHAS" },
  { id: "heat_map",      category: "13", icon: "analytics",  label: "MAPA DE CALOR EMOCIONAL" },
  { id: "rel_stats",     category: "13", icon: "analytics", label: "STATS DE LA RELACIÓN" },
  // ── 14. INTEGRACIONES FUTURAS ──────────────────────────────
  { id: "import_photos",  category: "14", icon: "image",  label: "IMPORT GOOGLE PHOTOS" },
  { id: "import_spotify", category: "14", icon: "music", label: "IMPORT SPOTIFY" },
  { id: "import_calendar",category: "14", icon: "calendar", label: "IMPORT CALENDARIO" },
  { id: "email_forward",  category: "14", icon: "mail", label: "EMAIL FORWARD" },
];

// Conjuntos rápidos para ramas de render condicional
const FILE_UPLOAD_TYPES = new Set(ENTRY_TYPES.filter((t) => t.accept).map((t) => t.id));

// ADR-033 — Tipos ofertables al crear por sección, con el label de la pastilla (diseño §4.2):
// MEMORIA: foto, vídeo, audio, captura · PALABRAS: carta, nota, diario, abrir cuando…
// LUGARES: sitio, viaje · LISTAS: películas, libros, recetas, bucket list, ideas de regalo.
// eslint-disable-next-line react-refresh/only-export-components
export const SECCION_TIPOS = {
  memoria: [
    { id: "photo", label: "FOTO" },
    { id: "video", label: "VIDEO" },
    { id: "audio", label: "AUDIO" },
    { id: "screenshot", label: "CAPTURA" },
  ],
  palabras: [
    { id: "letter", label: "CARTA" },
    { id: "note", label: "NOTA" },
    { id: "shared_diary", label: "DIARIO" },
    { id: "open_when", label: "ABRIR CUANDO…" },
  ],
  lugares: [
    { id: "place", label: "SITIO" },
    { id: "travel", label: "VIAJE" },
  ],
  listas: [
    { id: "movies", label: "PELIS" },
    { id: "books", label: "LIBROS" },
    { id: "recipes", label: "RECETAS" },
    { id: "bucket_list", label: "BUCKET LIST" },
    { id: "gift_ideas", label: "IDEAS DE REGALO" },
  ],
};

/** Tipos de una sección; si el tipo actual (edición) no está, se antepone para no perderlo. */
// eslint-disable-next-line react-refresh/only-export-components
export const tiposDeSeccion = (seccion, currentType) => {
  const base = SECCION_TIPOS[seccion] ?? [];
  if (currentType && !base.some((t) => t.id === currentType)) {
    const meta = ENTRY_TYPES.find((t) => t.id === currentType);
    return [{ id: currentType, label: meta?.label ?? currentType.toUpperCase() }, ...base];
  }
  return base;
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
// ADR-033: ELIMINADO — la tira de 14 iconos muere; el selector de tipos lo
// ofrecen las SECCIONES (MEMORIA/PALABRAS/LUGARES/LISTAS), ver AddEntryForm.

const SELECT_ARROW_SVG = (c) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23${c.slice(1)}' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`;
const SELECT_STYLE = (color = ACID) => ({
  color, border: `1px solid ${color}33`, fontFamily: FONT_MONO,
  backgroundImage: SELECT_ARROW_SVG(color),
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
});

export default function AddEntryForm({ eras = [], entry = null, onAdd, onUpdate, onCancel, section = "memoria", eraName = "", sectionLabel = "MEMORIA" }) {
  const accentColor = useVibeAccent();
  const isEditing = !!entry;
  // ADR-033: el selector de tipos ofrece SOLO los de la sección activa. En
  // creación arranca abierto (fila de pastillas); al elegir se contrae a
  // 'FOTO · cambiar'. En edición el tipo ya existe → contraído desde el inicio.
  const [typePickerOpen, setTypePickerOpen] = useState(!isEditing);
  const [type, setType] = useState(entry?.type ?? null);
  const tipoOpciones = tiposDeSeccion(section, type);
  const tipoActual = tipoOpciones.find((t) => t.id === type) ?? tipoOpciones[0] ?? { id: null, label: "" };
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
    // FASE D.1: preferir img.url firmada si el servidor la inyectó.
    if (img.url) return img.url;
    if (img.r2_key) return img.r2_key.startsWith("http") ? img.r2_key : `${R2_PUBLIC_BASE}/${img.r2_key}`;
    return null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // S130-D: coordenadas de ubicación (geocoder + manual)
  const [locationLat, setLocationLat] = useState(entry?.content?.lat ?? null);
  const [locationLng, setLocationLng] = useState(entry?.content?.lng ?? null);
  const [locationName, setLocationName] = useState(entry?.content?.place_name ?? entry?.content?.location ?? "");
  const fileInputRef = useRef(null);

  // L-4: se sale con Escape o cancelar. El lienzo vuelve donde estaba.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && onCancel) {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);
    // Fase 8.1 — Meta del tipo actual (evita 4× O(n) lookups en el render)
  const currentMeta = ENTRY_TYPES.find((t) => t.id === (tipoActual?.id ?? type));
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
    if (!type || (!text.trim() && !title.trim() && !photoFile && !isEditing)) return;
    setSubmitError("");
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
    } catch (error) {
      // Preserve the draft and make a transient network/API failure visible in the form.
      console.warn("[AddEntryForm] No se pudo guardar la entrada:", error);
      setSubmitError(error?.message ?? "No se pudo guardar la entrada. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 p-4 w-full mx-auto"
      style={{
        fontFamily: FONT_MONO,
        background: GLASS_BG,
        border: `1px solid ${GLASS_BORDER}`,
        // L-4: el formulario ocupa el régimen de lectura de ADR-029 §5 (60-76ch)
        maxWidth: "76ch",
      }}>
      {/* Header del flujo — L-4: el lienzo es el formulario, con la sección y la era */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs tracking-[0.3em] uppercase opacity-50" style={{ color: accentColor, fontFamily: FONT_MONO }}>
          <Icon name={isEditing ? "edit" : "plus"} size={14} decorative /> {isEditing ? "EDITANDO" : "NUEVA"} ENTRADA EN {sectionLabel}{eraName ? ` · ${eraName}` : ""}
        </span>
        <span className="text-xs opacity-30" style={{ color: accentColor, fontFamily: FONT_MONO }}>
          {entry?.id?.slice(0, 8)}…
        </span>
      </div>
      {/* Selector de tipo — ADR-033: SOLO los tipos de la sección activa, fila de
          pastillas CON TEXTO de 44px. Al elegir se contrae a 'FOTO · cambiar'. */}
      {typePickerOpen ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de entrada">
          {tipoOpciones.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setType(t.id); setTypePickerOpen(false); }}
              className="text-xs tracking-widest uppercase px-4 transition-all"
              style={{
                minHeight: 44,
                minWidth: 44,
                color: type === t.id ? ACID : `${accentColor}88`,
                border: `1px solid ${type === t.id ? ACID : `${accentColor}33`}`,
                background: type === t.id ? `${accentColor}0d` : "transparent",
                fontFamily: FONT_MONO,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setTypePickerOpen(true)}
          className="text-xs tracking-widest uppercase self-start px-4 transition-all"
          style={{ minHeight: 44, color: accentColor, border: `1px solid ${accentColor}44`, fontFamily: FONT_MONO }}
        >
          {tipoActual.label} · cambiar
        </button>
      )}

      {/* El formulario del tipo elegido — L-4: queda como único elemento en el lienzo.
          En creación solo aparece tras elegir tipo; en edición el tipo ya existe. */}
      {type && (
      <>
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
                  className="bg-transparent text-xs p-3 min-h-[44px] flex-1 min-w-[100px] appearance-none"
                  style={SELECT_STYLE(ACID)}
                >
                  {(f.options ?? []).map((opt) => (
                    <option key={opt} value={opt === "—" ? "" : opt} style={{ background: "#050505" }}>{opt}</option>
                  ))}
                </select>
              );
            }
            return (
              <Input
                key={f.key}
                type={f.type}
                value={extraValues[f.key] || ""}
                onChange={(e) => setExtraValue(f.key, e.target.value)}
                placeholder={f.placeholder ?? f.label}
                className="flex-1 min-w-[100px]"
                accentColor={accentColor}
              />
            );
          })}
        </div>
      )}

      {/* Campos */}
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO" accentColor={accentColor} />

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
            style={{ border: `1px dashed ${accentColor}44`, minHeight: 160, background: photoPreview ? "transparent" : `${accentColor}04` }}>
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="max-h-40 object-contain rounded-sm" />
            ) : (
              <>
                <span className="text-3xl mb-2 opacity-40" style={{ color: accentColor }}>
                  <Icon name={currentMeta?.icon ?? "camera"} size={30} decorative />
                </span>
                <p className="text-xs opacity-40 tracking-widest uppercase" style={{ color: accentColor, fontFamily: FONT_MONO }}>
                  TAP PARA SELECCIONAR {currentMeta?.label ?? "ARCHIVO"}
                </p>
              </>
            )}
          </div>
          {photoFile && (
            <p className="text-xs opacity-40 truncate" style={{ color: accentColor, fontFamily: FONT_MONO }}>
              {photoFile.name} ({(photoFile.size / 1024).toFixed(1)}KB)
            </p>
          )}
        </>
      ) : (
        <Input multiline value={text} onChange={e => setText(e.target.value)}
          placeholder={PLACEHOLDER_BY_TYPE[type] ?? "Escribe aquí…"} accentColor={accentColor} />
      )}

      {/* Era + Destinatario */}
      <div className="flex gap-2">
        <select value={eraId || ""} onChange={e => setEraId(e.target.value || null)}
          className="bg-transparent text-xs p-3 min-h-[44px] flex-1 appearance-none"
          style={SELECT_STYLE(ACID)}>
          <option value="" style={{ background: "#050505" }}>Sin Era</option>
          {eras.map(e => <option key={e.id} value={e.id} style={{ background: "#050505" }}>{e.name}</option>)}
        </select>
        <select value={toUser} onChange={e => setToUser(e.target.value)}
          className="bg-transparent text-xs p-3 min-h-[44px] appearance-none"
          style={SELECT_STYLE(ACID)}>
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
              color: tags.includes(tag.id) ? (tag.palette?.accent ?? tag.seedColor ?? accentColor) : `${accentColor}44`,
              border: `1px solid ${tags.includes(tag.id) ? (tag.palette?.accent ?? tag.seedColor ?? accentColor) : `${accentColor}22`}`,
              fontFamily: FONT_MONO,
            }}>
            {tag.icon} {tag.label}
          </button>
        ))}
      </div>

      {submitError && (
        <p role="alert" className="text-xs leading-relaxed" style={{ color: "#ff6b6b", fontFamily: FONT_MONO }}>
          {submitError}
        </p>
      )}

      {/* Botones */}
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={isSubmitting}
          className="text-xs tracking-[0.2em] uppercase p-3 min-h-[44px] flex-1" style={{ color: accentColor, border: `1px solid ${accentColor}44`, fontFamily: FONT_MONO }}>
          {isSubmitting ? "GUARDANDO..." : isEditing ? "ACTUALIZAR" : FILE_UPLOAD_TYPES.has(type) ? `SUBIR ${currentMeta?.label ?? "ARCHIVO"}` : "GUARDAR"}
        </motion.button>
        {onCancel && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={onCancel}
            className="text-xs tracking-[0.2em] uppercase p-3 min-h-[44px] opacity-40" style={{ color: accentColor, border: `1px solid ${accentColor}33`, fontFamily: FONT_MONO }}>
            CANCELAR
          </motion.button>
        )}
      </div>
      </>
      )}
    </motion.div>
  );
}
