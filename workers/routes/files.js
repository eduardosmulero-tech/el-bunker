// ============================================================
//  EL BÚNKER — workers/routes/files.js
//  GET /api/files — metadata de archivos en R2
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleFiles(request, env, url, userId) {
  if (request.method !== "GET") return err("Method not allowed", 405);
  if (!userId) return err("Unauthorized", 401);

  const entry = url.searchParams.get("entry_id");
  const prefix = url.searchParams.get("prefix");
  const track = url.searchParams.get("track_id");

  let q = "SELECT * FROM files WHERE 1=1";
  const binds = [];
  if (entry) { q += " AND entry_id = ?1"; binds.push(entry); }
  if (prefix) { q += ` AND prefix = ?${binds.length + 1}`; binds.push(prefix); }
  if (track) { q += ` AND track_id = ?${binds.length + 1}`; binds.push(track); }
  q += " ORDER BY created_at DESC LIMIT 200";

  const { results } = binds.length
    ? await env.DB.prepare(q).bind(...binds).all()
    : await env.DB.prepare(q).all();

  return json(results);
}
