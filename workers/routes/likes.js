// ============================================================
//  EL BÚNKER — workers/routes/likes.js
//  GET/PUT /api/likes/:userId (auth required, cross-user validation
//  patrón S113-W igual que queue.js)
//  t_like-sync: persistencia multi-dispositivo de likes de tracks.
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleLikes(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  const likesUser = path.split("/")[3];
  if (!likesUser) return err("user id required in path", 400);

  // Cross-user protection (S113-W)
  if (likesUser !== userId) return err("Forbidden — can only access own likes", 403);

  // GET /api/likes/:userId → { liked_track_ids: [...] }
  if (method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT track_id FROM track_likes WHERE user_id = ?1 ORDER BY created_at DESC",
    ).bind(likesUser).all();
    return json({ liked_track_ids: results.map((r) => r.track_id) });
  }

  // PUT /api/likes/:userId  body: { liked_track_ids: [...] }
  // Reemplazo completo (mismo contrato que la cola): el cliente es la fuente
  // de verdad de la sesión; el set es pequeño (biblioteca privada).
  if (method === "PUT") {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.liked_track_ids)) {
      return err("liked_track_ids array required", 400);
    }
    // Dedup + cap defensivo (la biblioteca es privada; 10k es holgado)
    const ids = [...new Set(body.liked_track_ids.filter((id) => typeof id === "string" && id.length > 0))].slice(0, 10000);
    await env.DB.prepare("DELETE FROM track_likes WHERE user_id = ?1").bind(likesUser).run();
    if (ids.length) {
      const stmt = env.DB.prepare(
        "INSERT INTO track_likes (user_id, track_id) VALUES (?1, ?2)",
      );
      await env.DB.batch(ids.map((trackId) => stmt.bind(likesUser, trackId)));
    }
    return json({ ok: true, count: ids.length });
  }

  return err("Method not allowed", 405);
}
