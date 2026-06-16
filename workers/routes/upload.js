// ============================================================
//  EL BÚNKER — workers/routes/upload.js
//  POST /api/upload + PUT /api/upload/:key (auth required, S113-W)
// ============================================================

import { VALID_UPLOAD_PREFIXES } from "../config.js";
import { json, err } from "../utils/response.js";

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
    const safeFilename = body.filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, ".")
      .slice(0, 200);
    const r2_key = `${body.prefix}/${crypto.randomUUID()}_${safeFilename}`;
    const fileId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO files (id, entry_id, track_id, r2_key, r2_bucket, prefix, filename, mime_type, size_bytes, uploaded_by)
       VALUES (?1,?2,?3,?4,'el-bunker-music',?5,?6,?7,?8,?9)`
    ).bind(fileId, body.entry_id || null, body.track_id || null, r2_key,
           body.prefix, safeFilename, body.mime_type || null, body.size_bytes || null, userId).run();
    return json({ r2_key, file_id: fileId }, 201);
  }

  // PUT /api/upload/:key — subir binario a R2
  if (method === "PUT" && path.startsWith("/api/upload/")) {
    const r2_key = decodeURIComponent(path.split("/api/upload/")[1]);
    if (!r2_key) return err("r2_key required", 400);
    if (!VALID_UPLOAD_PREFIXES.some(p => r2_key.startsWith(p + "/"))) {
      return err("Forbidden — invalid r2_key prefix", 403);
    }
    const data = await request.arrayBuffer();
    await env.BUNKER.put(r2_key, data, {
      httpMetadata: { contentType: request.headers.get("Content-Type") || "application/octet-stream" },
    });
    return json({ ok: true, r2_key, size: data.byteLength }, 201);
  }

  return err("Method not allowed", 405);
}
