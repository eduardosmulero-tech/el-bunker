// ============================================================
//  EL BÚNKER — FileUploadService.js
//  Subida de archivos a R2 vía Worker (ADR-022)
//  S115-D3: migrado a WorkerClient (token via singleton)
// ============================================================

import { workerClient } from "./WorkerClient";

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
  const uploadRes = await workerClient.fetch(`/api/upload/${encodeURIComponent(r2_key)}`, {
    method: "PUT",
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
  // S115-D3: usa el mismo API_BASE que WorkerClient
  return `${import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev"}/${r2_key}`;
}

/**
 * VALID_PREFIXES
 * Prefijos permitidos para upload (ADR-022).
 */
export const VALID_PREFIXES = ["music", "vault/photos", "vault/videos", "vault/docs", "vault/audio"];

export default { uploadFile, getStreamUrl, setUploadToken, VALID_PREFIXES };
