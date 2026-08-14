import { R2_PUBLIC_BASE } from "../tokens";
import { ENTRY_TYPES } from "./AddEntryForm";

export const ENTRY_CATEGORY = Object.fromEntries(ENTRY_TYPES.map((type) => [type.id, type.category]));

// ─── SECCIONES DE VAULT (ADR-033) ──────────────────────────────
// Cuatro secciones + CAJA FUERTE aparte. Las eras engloban todo; la sección
// elige qué se ve dentro de la era (diseño §4.0).
export const SECCIONES = [
  { id: "memoria", label: "MEMORIA", icon: "camera" },
  { id: "palabras", label: "PALABRAS", icon: "edit" },
  { id: "lugares", label: "LUGARES", icon: "map" },
  { id: "listas", label: "LISTAS", icon: "document" },
];

export const SECCION_LABEL = Object.fromEntries(SECCIONES.map((s) => [s.id, s.label]));
export const SECCION_ICON = Object.fromEntries(SECCIONES.map((s) => [s.id, s.icon]));

// Mapeo explícito, no heurístico (diseño §4.0, ADR-033): categoría -> sección.
// 1 -> MEMORIA · 2 -> PALABRAS · 4 -> LUGARES · 6 -> LISTAS · 3 y 12 -> CAJA FUERTE.
// El mapeo se hace AL LEER: prohibido cualquier UPDATE masivo del campo type.
const SECCION_POR_CATEGORIA = {
  "1": "memoria",
  "2": "palabras",
  "4": "lugares",
  "6": "listas",
  "3": "cajafuerte",
  "12": "cajafuerte",
};

/** Sección de una entrada, derivada de su type AL LEER. null = sin sección. */
export const seccionDeEntrada = (entry) => {
  if (!entry?.type) return null;
  const cat = ENTRY_CATEGORY[entry.type];
  return cat ? SECCION_POR_CATEGORIA[cat] ?? null : null;
};

// ─── MODOS DE GALERÍA (ADR-021) ─────────────────────────────
// X-5 (firmado con ADR-033): los 6 modos viven en la cabecera del lienzo,
// SOLO dentro de MEMORIA. Viven aquí (sin leaflet) para que Vault.jsx los
// pinte sin cargar la galería lazy, y VaultGallery los consume desde aquí.
export const MODES = [
  { id: "wall",       icon: "grid",    label: "WALL" },
  { id: "cinema",     icon: "play",    label: "CINEMA" },
  { id: "map",        icon: "map",     label: "MAP" },
  { id: "dialogue",   icon: "heart",   label: "DIALOGUE" },
  { id: "exhibition", icon: "star",    label: "EXHIBITION" },
  { id: "reel",       icon: "circle",  label: "REEL" },
];

export const timeSince = (isoDate, now = new Date()) => {
  if (!isoDate) return { years: 0, months: 0, days: 0, totalDays: 0 };
  const start = new Date(isoDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(now.getTime())) return { years: 0, months: 0, days: 0, totalDays: 0 };
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years, months, days, totalDays: Math.floor((now - start) / 86400000) };
};

export const timeUntil = (isoDate, now = new Date()) => {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime()) || Number.isNaN(now.getTime())) return null;
  const diff = target - now;
  if (diff <= 0) return { unlocked: true };
  return { unlocked: false, days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000) };
};

export const monthsSince = (isoDate, now = new Date()) => {
  if (!isoDate) return 0;
  const start = new Date(isoDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(now.getTime())) return 0;
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
};

export const getImageUrl = (entry) => {
  const images = entry?.content?.images;
  if (!images?.length) return null;
  const image = images[0];
  if (image.url) return image.url;
  if (image.r2_key) return image.r2_key.startsWith("http") ? image.r2_key : `${R2_PUBLIC_BASE}/${image.r2_key}`;
  if (image.dataUrl) return image.dataUrl;
  return null;
};

export const getMediaType = (entry) => {
  const images = entry?.content?.images;
  if (images?.length && images[0].media_type) return images[0].media_type;
  return entry?.type ?? "note";
};

// ─── MODO VISITA (A5) ─────────────────────────────────────────
// En modo visita (claim `visit:true`) el Worker vacía lo clasificado y lo
// devuelve en la forma canónica del diseño §3: { id, classified: true,
// blurhash, fecha, era }. Estos helpers normalizan esa forma para que el
// resto de la UI no tenga que saber si la entrada vino saneada o completa.
export const isClassified = (entry) => Boolean(entry?.classified === true);

/** id de era: forma completa (era_id) o saneada (era, A3). */
export const resolveEraId = (entry) => entry?.era_id ?? entry?.era ?? null;

/** fecha canónica: created_at normal, fecha en la forma saneada (A3). */
export const resolveEntryDate = (entry) => entry?.created_at ?? entry?.fecha ?? null;
