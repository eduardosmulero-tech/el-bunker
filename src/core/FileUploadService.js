// ============================================================
//  EL BÚNKER — FileUploadService.js
//  Subida de archivos a R2 vía Worker (ADR-022)
//  Prefixes: music, vault/photos, vault/videos, vault/docs, vault/audio
//  S57 · Fase 1 — Infraestructura Cloudflare
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

/** @type {string|null} */
let _token = null;

export function setUploadToken(token) {
  _token = token;
}

/**
 * uploadFile(file, prefix, metadata)
 * Sube un archivo a R2 en dos pasos:
 * 1. POST /api/upload → obtiene r2_key
 * 2. PUT binario directo a R2 (via Worker proxy o directo según implementación)
 *
 * @param {File} file           — archivo a subir
 * @param {string} prefix       — music|vault/photos|vault/videos|vault/docs|vault/audio
 * @param {object} [metadata]   — { entry_id, track_id, ... } datos adicionales para files table
 * @returns {Promise<{r2_key: string, file_id: string}>}
 */
export async function uploadFile(file, prefix, metadata = {}) {
  if (!_token) throw new Error("FileUploadService: token JWT no configurado");

  // S102 — Detección offline: mensaje amigable en vez de error genérico
  if (!navigator.onLine) {
    throw new Error("Sin conexión — el archivo se subirá cuando vuelvas a estar online.");
  }

  // Paso 1: obtener r2_key
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${_token}`,
    },
    body: JSON.stringify({
      prefix,
      filename: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      ...metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Upload error: ${err.error || res.status}`);
  }

  const { r2_key, file_id } = await res.json();

  // Paso 2: subir el binario directamente al Worker
  const uploadRes = await fetch(`${API_BASE}/api/upload/${encodeURIComponent(r2_key)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${_token}` },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Binary upload failed: ${uploadRes.status}`);
  }

  return { r2_key, file_id };
}

/**
 * getStreamUrl(r2_key)
 * URL pública para streaming de audio desde R2.
 * @param {string} r2_key
 * @returns {string}
 */
export function getStreamUrl(r2_key) {
  if (!r2_key) return null;
  return `${API_BASE}/${r2_key}`;
}

/**
 * VALID_PREFIXES
 * Prefijos permitidos para upload (ADR-022).
 */
export const VALID_PREFIXES = ["music", "vault/photos", "vault/videos", "vault/docs", "vault/audio"];

export default { uploadFile, getStreamUrl, setUploadToken, VALID_PREFIXES };
