import { R2_PUBLIC_BASE } from "../tokens";
import { ENTRY_TYPES } from "./AddEntryForm";

export const ENTRY_CATEGORY = Object.fromEntries(ENTRY_TYPES.map((type) => [type.id, type.category]));

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
