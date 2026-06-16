// ============================================================
//  EL BÚNKER — workers/routes/queue.js
//  GET/PUT /api/queue/:userId (auth required, cross-user validation S113-W)
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleQueue(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  const queueUser = path.split("/")[3];
  if (!queueUser) return err("user id required in path", 400);

  // Cross-user protection (S113-W V2)
  if (queueUser !== userId) return err("Forbidden — can only access own queue", 403);

  // GET /api/queue/:userId
  if (method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM queue_items WHERE user_id = ?1 ORDER BY position"
    ).bind(queueUser).all();
    return json(results.map(r => ({ ...r, _manual: !!r.is_manual })));
  }

  // PUT /api/queue/:userId
  if (method === "PUT") {
    const body = await request.json().catch(() => null);
    if (!body) return err("Invalid JSON body", 400);
    const items = body.items || (body.track_ids || []).map(tid => ({ track_id: tid, is_manual: 1 }));
    await env.DB.prepare("DELETE FROM queue_items WHERE user_id = ?1").bind(queueUser).run();
    if (items.length) {
      const stmt = env.DB.prepare(
        "INSERT INTO queue_items (user_id, track_id, position, is_manual, context_name) VALUES (?1,?2,?3,?4,?5)"
      );
      await env.DB.batch(items.map((item, i) =>
        stmt.bind(queueUser, item.track_id, i, item.is_manual ? 1 : 0, body.context_name || null)
      ));
    }
    return json({ ok: true, count: items.length });
  }

  return err("Method not allowed", 405);
}
