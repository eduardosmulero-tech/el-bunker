// ============================================================
//  EL BÚNKER — FileUploadService.js
//  Subida de archivos a R2 vía Worker (ADR-022)
//  S115-D3: migrado a WorkerClient (token via singleton)
// ============================================================

import { workerClient } from "./WorkerClient";
import { R2_PUBLIC_BASE } from "../tokens";

/** @deprecated S115-D3: token ahora via workerClient singleton. Se mantiene por compatibilidad. */
export function setUploadToken(token) {
  workerClient.setToken(token);
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
  if (!workerClient.hasToken()) throw new Error("FileUploadService: token JWT no configurado");

  if (!navigator.onLine) {
    throw new Error("Sin conexión — el archivo se subirá cuando vuelvas a estar online.");
  }

  // Paso 1: obtener r2_key via WorkerClient
  const { r2_key, file_id } = await workerClient.post(`/api/upload`, {
    prefix,
    filename: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    ...metadata,
  });

  // Paso 2: subir el binario directamente via fetch (necesita PUT sin Content-Type: application/json)
  try {
    const uploadRes = await workerClient.fetch(`/api/upload/${encodeURIComponent(r2_key)}`, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!uploadRes.ok) {
      throw new Error(`Binary upload failed: ${uploadRes.status}`);
    }
  } catch (error) {
    await removeUploadedFile({ r2_key, file_id }).catch((cleanupError) => {
      console.warn("[FileUploadService] rollback de reserva falló:", cleanupError);
    });
    throw error;
  }

  return { r2_key, file_id };
}

/**
 * Removes an upload reservation and its R2 object after a later operation fails.
 * This is intentionally best-effort: the original error remains the one exposed
 * to the caller, while the Worker performs the authenticated cleanup.
 */
export async function removeUploadedFile({ r2_key, file_id } = {}) {
  if (!r2_key || !workerClient.hasToken()) return;
  const key = encodeURIComponent(r2_key);
  await workerClient.del(`/api/upload/${key}${file_id ? `?file_id=${encodeURIComponent(file_id)}` : ""}`);
}

/**
 * getStreamUrl(r2_key)
 * URL pública para streaming de audio desde R2.
 * @param {string} r2_key
 * @returns {string}
 */
export function getStreamUrl(r2_key) {
  if (!r2_key) return null;
  return `${R2_PUBLIC_BASE}/${r2_key}`;
}

/**
 * VALID_PREFIXES
 * Prefijos permitidos para upload (ADR-022).
 */
export const VALID_PREFIXES = ["music", "vault/photos", "vault/videos", "vault/docs", "vault/audio"];

export default { uploadFile, removeUploadedFile, getStreamUrl, setUploadToken, VALID_PREFIXES };
