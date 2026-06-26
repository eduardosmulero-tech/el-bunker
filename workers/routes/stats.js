// ============================================================
//  EL BÚNKER — workers/routes/stats.js
//  STAT-M9: agregaciones server-side sobre tabla events (ADR-019)
//  GET /api/stats/recap?since=<ISO>&until=<ISO>
//  Devuelve shape idéntico al `stats` que Recaps.jsx consumía client-side.
//  Auth requerida por el dispatcher (stat-m9 requiere JWT válido).
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleStats(_request, env, url, _userId) {
  const path = url.pathname;
  const method = _request.method;

  // Único endpoint hoy: GET /api/stats/recap
  if (!(method === "GET" && path === "/api/stats/recap")) {
    return err("Not found", 404);
  }

  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  if (!since || !until) return err("Missing since/until parameters", 400);
  const sinceDate = new Date(since);
  const untilDate = new Date(until);
  if (isNaN(sinceDate.getTime()) || isNaN(untilDate.getTime())) {
    return err("Invalid since/until format (expected ISO datetime)", 400);
  }
  if (sinceDate > untilDate) return err("Invalid range: since > until", 400);

  // ─── Q1: totales + unique_days ─────────────────────────────
  // STAT-M9: usa idx_events_type_created (event_type + created_at) y idx_events_created
  const totalsRow = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       COUNT(DISTINCT date(created_at)) AS unique_days,
       SUM(CASE WHEN event_type = 'track_play'               THEN 1 ELSE 0 END) AS plays,
       SUM(CASE WHEN event_type = 'drop_sent'                THEN 1 ELSE 0 END) AS drops,
       SUM(CASE WHEN event_type = 'entry_created'            THEN 1 ELSE 0 END) AS created,
       SUM(CASE WHEN event_type = 'smoke_session_completed'  THEN 1 ELSE 0 END) AS completed
     FROM events
     WHERE created_at BETWEEN ?1 AND ?2`
  ).bind(since, until).first();

  // ─── Q2: top track con JOIN a tracks (título + artista) ───
  // STAT-M9: visible UX win — antes Recaps mostraba id.slice(0,20)
  const topTrackRow = await env.DB.prepare(
    `SELECT e.entity_id AS id,
            COUNT(*)     AS plays,
            t.title      AS title,
            t.artist     AS artist
     FROM events e
     LEFT JOIN tracks t ON t.id = e.entity_id
     WHERE e.event_type = 'track_play'
       AND e.created_at BETWEEN ?1 AND ?2
       AND e.entity_id IS NOT NULL
     GROUP BY e.entity_id
     ORDER BY plays DESC
     LIMIT 1`
  ).bind(since, until).first();

  // ─── Q3: top day (fecha con más eventos del periodo) ──────
  const topDayRow = await env.DB.prepare(
    `SELECT date(created_at) AS date, COUNT(*) AS count
     FROM events
     WHERE created_at BETWEEN ?1 AND ?2
     GROUP BY date(created_at)
     ORDER BY count DESC
     LIMIT 1`
  ).bind(since, until).first();

  // ─── Q4: top user con JOIN a users (nombre legible) ───────
  const topUserRow = await env.DB.prepare(
    `SELECT e.user_id AS id,
            COUNT(*)   AS events,
            COALESCE(u.name, e.user_id) AS name
     FROM events e
     LEFT JOIN users u ON u.id = e.user_id
     WHERE e.created_at BETWEEN ?1 AND ?2
     GROUP BY e.user_id
     ORDER BY events DESC
     LIMIT 1`
  ).bind(since, until).first();

  // ─── Respuesta: shape 1:1 con el `stats` de Recaps.jsx ────
  // (más campos title/artist/name para que la UI muestre info legible)
  const total = totalsRow?.total ?? 0;
  const body = {
    total,
    plays:    totalsRow?.plays    ?? 0,
    drops:    totalsRow?.drops    ?? 0,
    created:  totalsRow?.created  ?? 0,
    completed: totalsRow?.completed ?? 0,
    uniqueDays: totalsRow?.unique_days ?? 0,
    topDay: topDayRow
      ? { date: topDayRow.date, count: topDayRow.count }
      : null,
    topTrack: topTrackRow
      ? {
          id: topTrackRow.id,
          title: topTrackRow.title || "(sin título)",
          artist: topTrackRow.artist || "",
          plays: topTrackRow.plays,
        }
      : null,
    topUser: topUserRow
      ? { id: topUserRow.id, name: topUserRow.name, events: topUserRow.events }
      : null,
    period: { since, until },
  };

  // Cache-Control privado 60s: evita recalcular al cambiar de sub-tab rapidamente
  return json(body, 200, { "Cache-Control": "public, max-age=60" });
}
