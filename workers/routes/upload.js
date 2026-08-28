// ============================================================
//  EL BÚNKER — workers/routes/upload.js
//  POST /api/upload + PUT /api/upload/:key (auth required, S113-W)
//  Hardening: límite de tamaño (100MB), reserva de track previa
//  para música (FK files.track_id → tracks.id) y Content-Length
//  verificado contra el binario recibido.
// ============================================================

import { VALID_UPLOAD_PREFIXES } from "../config.js";
import { json, err } from "../utils/response.js";
import { canManageOwned } from "../utils/authorization.js";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export default async function handleUpload(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // POST /api/upload — generar pre-signed key
  if (method === "POST" && path === "/api/upload") {
    const body = await request.json().catch(() => null);
    if (!body?.prefix || !body?.filename) return err("prefix and filename required", 400);
    if (!VALID_UPLOAD_PREFIXES.includes(body.prefix)) {
      return err(`Invalid prefix. Valid: ${VALID_UPLOAD_PREFIXES.join(", ")}`, 400);
    }
    // La música exige un track ya creado: files.track_id tiene FK a tracks.id
    // y el flujo canónico (useMusicActions) crea el track antes de subir.
    if (body.prefix === "music" && !body.track_id) {
      return err("music uploads require an existing track reservation", 400);
    }
    if (
      body.size_bytes != null &&
      (!Number.isSafeInteger(body.size_bytes) || body.size_bytes < 0 || body.size_bytes > MAX_UPLOAD_BYTES)
    ) {
      return err("Invalid or oversized upload", 413);
    }
    if (body.track_id) {
      const track = await env.DB.prepare(
        "SELECT id, added_by FROM tracks WHERE id = ?1 AND is_deleted = 0"
      ).bind(body.track_id).first();
      if (!track || !canManageOwned(userId, track.added_by)) {
        return err("Track not found or forbidden", 403);
      }
    }
    const safeFilename = body.filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, ".")
      .slice(0, 200);
    const r2_key = `${body.prefix}/${crypto.randomUUID()}_${safeFilename}`;
    const fileId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO files (id, entry_id, track_id, r2_key, r2_bucket, prefix, filename, mime_type, size_bytes, uploaded_by)
       VALUES (?1,?2,?3,?4,'el-bunker-music',?5,?6,?7,?8,?9)`
    ).bind(
      fileId, body.entry_id || null, body.track_id || null, r2_key,
      body.prefix, safeFilename, body.mime_type || null, body.size_bytes || null, userId
    ).run();
    return json({ r2_key, file_id: fileId }, 201);
  }

  // DELETE /api/upload/:key — rollback de una reserva de upload
  // Se usa cuando crear la entidad posterior (por ejemplo, un track) falla.
  if (method === "DELETE" && path.startsWith("/api/upload/")) {
    const r2_key = decodeURIComponent(path.split("/api/upload/")[1]);
    if (!r2_key) return err("r2_key required", 400);
    if (!VALID_UPLOAD_PREFIXES.some(p => r2_key.startsWith(`${p}/`))) {
      return err("Forbidden — invalid r2_key prefix", 403);
    }
    const fileId = url.searchParams.get("file_id");
    const file = await env.DB.prepare(
      `SELECT id FROM files WHERE r2_key = ?1 AND uploaded_by = ?2${fileId ? " AND id = ?3" : ""}`
    ).bind(...(fileId ? [r2_key, userId, fileId] : [r2_key, userId])).first();
    if (!file) return err("Upload reservation not found", 404);
    await env.BUNKER.delete(r2_key);
    await env.DB.prepare("DELETE FROM files WHERE id = ?1").bind(file.id).run();
    return json({ ok: true, r2_key, file_id: file.id });
  }

  // PUT /api/upload/:key — subir binario a R2
  if (method === "PUT" && path.startsWith("/api/upload/")) {
    const r2_key = decodeURIComponent(path.split("/api/upload/")[1]);
    if (!r2_key) return err("r2_key required", 400);
    if (!VALID_UPLOAD_PREFIXES.some(p => r2_key.startsWith(`${p}/`))) {
      return err("Forbidden — invalid r2_key prefix", 403);
    }
    const reservation = await env.DB.prepare(
      "SELECT id FROM files WHERE r2_key = ?1 AND uploaded_by = ?2"
    ).bind(r2_key, userId).first();
    if (!reservation) return err("Upload reservation not found", 404);
    // Content-Length obligatorio y dentro del límite: sin cabecera (o con una
    // fuera de rango) se rechaza antes de leer el binario.
    const contentLengthHeader = request.headers.get("Content-Length");
    const contentLength = contentLengthHeader == null ? NaN : Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_UPLOAD_BYTES) {
      return err("Content-Length required or upload oversized", 413);
    }
    const data = await request.arrayBuffer();
    if (data.byteLength !== contentLength) {
      return err("Content-Length mismatch", 400);
    }
    await env.BUNKER.put(r2_key, data, {
      httpMetadata: { contentType: request.headers.get("Content-Type") || "application/octet-stream" },
    });
    return json({ ok: true, r2_key, size: data.byteLength }, 201);
  }

  return err("Method not allowed", 405);
}
