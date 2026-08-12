// @vitest-environment node
// A4 — Filtrado del feed (Timeline/RECAP) en modo visita (ADR-029, diseño §6).
// El feed se alimenta de events (ADR-019): GET /api/events alimenta el Timeline
// y GET /api/stats/recap el RECAP (verificado en código, no supuesto).
// Con visit:true en el JWT, una entry clasificada no aparece con título en el
// feed; sin el claim, las respuestas son idénticas a hoy (regresión cero).
import { describe, expect, it } from "vitest";
import handleEvents from "../events.js";
import handleStats from "../stats.js";
import { signJWT } from "../../utils/auth.js";

const DEV_SECRET = "dev-secret-change-me";

async function visitToken(claims = {}) {
  return signJWT({ sub: "edu", email: "edu@test.dev", method: "google", ...claims }, DEV_SECRET);
}

function request(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return new Request(`https://bunker.test${path}`, { method: "GET", headers });
}

function urlFor(path) {
  return new URL(`https://bunker.test${path}`);
}

// ── Mock de DB: responde por tipo de consulta SQL ──────────────────
// Soporta el SELECT de /api/events, las 4 queries de /api/stats/recap
// y la consulta a classified_items de loadClassifiedIds.
function makeDb({ events = [], tracks = [], users = [], classifiedByType = {} }) {
  const calls = [];
  const db = {
    calls,
    prepare(sql) {
      const stmt = {
        sql,
        bindings: [],
        bind(...bindings) {
          this.bindings = bindings;
          calls.push({ sql, bindings });
          return this;
        },
        async all() {
          // A4: classified_items — bind(itemType, ...ids)
          if (sql.includes("FROM classified_items")) {
            const itemType = this.bindings[0];
            const ids = new Set(this.bindings.slice(1));
            const matches = (classifiedByType[itemType] || []).filter((id) => ids.has(id));
            return { results: matches.map((item_id) => ({ item_id })) };
          }
          // stats Q2: top track (event_type = 'track_play' por entity_id)
          if (sql.includes("JOIN tracks")) {
            const byTrack = new Map();
            for (const ev of events) {
              if (ev.event_type !== "track_play" || !ev.entity_id) continue;
              byTrack.set(ev.entity_id, (byTrack.get(ev.entity_id) || 0) + 1);
            }
            const top = [...byTrack.entries()].sort((a, b) => b[1] - a[1])[0];
            if (!top) return { results: [] };
            const track = tracks.find((t) => t.id === top[0]);
            return {
              results: [{ id: top[0], plays: top[1], title: track?.title ?? null, artist: track?.artist ?? null }],
            };
          }
          // stats Q4: top user
          if (sql.includes("GROUP BY e.user_id")) {
            const byUser = new Map();
            for (const ev of events) byUser.set(ev.user_id, (byUser.get(ev.user_id) || 0) + 1);
            const top = [...byUser.entries()].sort((a, b) => b[1] - a[1])[0];
            if (!top) return { results: [] };
            const user = users.find((u) => u.id === top[0]);
            return { results: [{ id: top[0], events: top[1], name: user?.name ?? top[0] }] };
          }
          // stats Q3: top day
          if (sql.includes("GROUP BY date(created_at)")) {
            const byDay = new Map();
            for (const ev of events) {
              const day = ev.created_at?.slice(0, 10) || "unknown";
              byDay.set(day, (byDay.get(day) || 0) + 1);
            }
            const top = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
            return { results: top ? [{ date: top[0], count: top[1] }] : [] };
          }
          // stats Q1: totales
          if (sql.includes("SUM(CASE")) {
            const total = events.length;
            const plays = events.filter((e) => e.event_type === "track_play").length;
            const drops = events.filter((e) => e.event_type === "drop_sent").length;
            const created = events.filter((e) => e.event_type === "entry_created").length;
            const completed = events.filter((e) => e.event_type === "smoke_session_completed").length;
            const uniqueDays = new Set(events.map((e) => e.created_at?.slice(0, 10))).size;
            return { results: [{ total, unique_days: uniqueDays, plays, drops, created, completed }] };
          }
          // /api/events (Timeline)
          if (sql.includes("FROM events")) return { results: events };
          return { results: [] };
        },
        async first() {
          const { results } = await this.all();
          return results[0] ?? null;
        },
        async run() {
          return { meta: { changes: 1 } };
        },
      };
      return stmt;
    },
  };
  return db;
}

// ── Datos de ejemplo ────────────────────────────────────────────────
const EV_CLASIFIED_ENTRY = {
  id: "ev-1", event_type: "entry_created", user_id: "edu",
  entity_type: "entry", entity_id: "e-clas",
  payload: JSON.stringify({ type: "photo", title: "Recuerdo secreto" }),
  created_at: "2026-02-01T10:00:00.000Z",
};
const EV_PLAIN_ENTRY = {
  id: "ev-2", event_type: "entry_created", user_id: "edu",
  entity_type: "entry", entity_id: "e-plain",
  payload: JSON.stringify({ type: "note", title: "Nota normal" }),
  created_at: "2026-02-02T10:00:00.000Z",
};
const EV_CLASIFIED_TRACK_PLAY = {
  id: "ev-3", event_type: "track_play", user_id: "edu",
  entity_type: "track", entity_id: "t-clas",
  payload: JSON.stringify({ title: "Nuestra canción" }),
  created_at: "2026-02-03T10:00:00.000Z",
};
const EV_CLASIFIED_DROP = {
  id: "ev-4", event_type: "drop_sent", user_id: "edu",
  entity_type: "drop", entity_id: "d-clas",
  payload: JSON.stringify({ to_user: "david", track_id: "t-clas" }),
  created_at: "2026-02-04T10:00:00.000Z",
};
const EV_CLASIFIED_PLAYLIST = {
  id: "ev-5", event_type: "playlist_created", user_id: "edu",
  entity_type: "playlist", entity_id: "p-clas",
  payload: JSON.stringify({ name: "Lista íntima" }),
  created_at: "2026-02-05T10:00:00.000Z",
};
const EV_SMOKE = {
  id: "ev-6", event_type: "smoke_session_completed", user_id: "edu",
  entity_type: "smoke_session", entity_id: "s-1",
  payload: JSON.stringify({ duration: 300, vibe: "calma" }),
  created_at: "2026-02-06T10:00:00.000Z",
};

const FEED_EVENTS = [EV_CLASIFIED_ENTRY, EV_PLAIN_ENTRY, EV_CLASIFIED_TRACK_PLAY, EV_CLASIFIED_DROP, EV_CLASIFIED_PLAYLIST, EV_SMOKE];

const TRACK_CLASIFIED = { id: "t-clas", title: "Nuestra canción", artist: "Edu" };
const TRACK_PLAIN = { id: "t-plain", title: "Canción normal", artist: "David" };
const USER_EDU = { id: "edu", name: "Edu" };

// ── /api/events (Timeline) ─────────────────────────────────────────
describe("A4 /api/events en modo visita (Timeline)", () => {
  it("con visit:true, una entry clasificada no aparece con título en el feed; la no clasificada intacta", async () => {
    const db = makeDb({
      events: FEED_EVENTS,
      classifiedByType: { entry: ["e-clas"], track: ["t-clas"], drop: ["d-clas"], playlist: ["p-clas"] },
    });
    const response = await handleEvents(
      request("/api/events?limit=100", await visitToken({ visit: true })),
      { DB: db },
      urlFor("/api/events?limit=100"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(6); // el feed se ve lleno (§6), no desaparece nada

    const clasifiedEntry = body.find((e) => e.id === "ev-1");
    expect(JSON.parse(clasifiedEntry.payload)).toEqual({ type: "photo" });
    expect(JSON.stringify(body)).not.toMatch(/Recuerdo secreto/);

    const plainEntry = body.find((e) => e.id === "ev-2");
    expect(JSON.parse(plainEntry.payload)).toEqual({ type: "note", title: "Nota normal" });

    const clasifiedTrack = body.find((e) => e.id === "ev-3");
    expect(JSON.parse(clasifiedTrack.payload)).toEqual({});
    expect(JSON.stringify(body)).not.toMatch(/Nuestra canción/);

    const clasifiedDrop = body.find((e) => e.id === "ev-4");
    expect(JSON.parse(clasifiedDrop.payload)).toEqual({ track_id: "t-clas" });

    const clasifiedPlaylist = body.find((e) => e.id === "ev-5");
    expect(JSON.parse(clasifiedPlaylist.payload)).toEqual({});
    expect(JSON.stringify(body)).not.toMatch(/Lista íntima/);

    // No clasificable no se toca
    const smoke = body.find((e) => e.id === "ev-6");
    expect(smoke.payload).toBe(EV_SMOKE.payload);
  });

  it("sin el claim, el feed es idéntico a hoy (regresión cero)", async () => {
    const db = makeDb({
      events: FEED_EVENTS,
      classifiedByType: { entry: ["e-clas"], track: ["t-clas"], drop: ["d-clas"], playlist: ["p-clas"] },
    });
    const response = await handleEvents(
      request("/api/events?limit=100", await visitToken()),
      { DB: db },
      urlFor("/api/events?limit=100"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(6);
    expect(JSON.stringify(body)).toMatch(/Recuerdo secreto/);
    expect(JSON.stringify(body)).toMatch(/Nuestra canción/);
    expect(JSON.stringify(body)).toMatch(/Lista íntima/);
    // Sin modo visita no se consulta classified_items.
    expect(db.calls.some((c) => c.sql.includes("FROM classified_items"))).toBe(false);
  });
});

// ── /api/stats/recap (RECAP) ───────────────────────────────────────
describe("A4 /api/stats/recap en modo visita (RECAP)", () => {
  const RECAP_EVENTS = [
    { id: "r-1", event_type: "track_play", user_id: "edu", entity_type: "track", entity_id: "t-clas", payload: "{}", created_at: "2026-02-01T10:00:00.000Z" },
    { id: "r-2", event_type: "track_play", user_id: "edu", entity_type: "track", entity_id: "t-clas", payload: "{}", created_at: "2026-02-02T10:00:00.000Z" },
    { id: "r-3", event_type: "track_play", user_id: "edu", entity_type: "track", entity_id: "t-clas", payload: "{}", created_at: "2026-02-03T10:00:00.000Z" },
    { id: "r-4", event_type: "track_play", user_id: "edu", entity_type: "track", entity_id: "t-plain", payload: "{}", created_at: "2026-02-04T10:00:00.000Z" },
    { id: "r-5", event_type: "entry_created", user_id: "edu", entity_type: "entry", entity_id: "e-clas", payload: '{"type":"photo","title":"Recuerdo secreto"}', created_at: "2026-02-05T10:00:00.000Z" },
  ];

  it("con visit:true, el top track clasificado no revela título (topTrack null); los contadores no mienten", async () => {
    const db = makeDb({
      events: RECAP_EVENTS,
      tracks: [TRACK_CLASIFIED, TRACK_PLAIN],
      users: [USER_EDU],
      classifiedByType: { track: ["t-clas"], entry: ["e-clas"] },
    });
    const since = "2026-02-01T00:00:00.000Z", until = "2026-03-01T00:00:00.000Z";
    const response = await handleStats(
      request(`/api/stats/recap?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`, await visitToken({ visit: true })),
      { DB: db },
      urlFor(`/api/stats/recap?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.topTrack).toBeNull();
    expect(body.plays).toBe(4); // los recuentos no mienten a la baja (§6)
    expect(body.total).toBe(5);
    expect(JSON.stringify(body)).not.toMatch(/Nuestra canción/);
  });

  it("sin el claim, el top track aparece igual que hoy (regresión cero)", async () => {
    const db = makeDb({
      events: RECAP_EVENTS,
      tracks: [TRACK_CLASIFIED, TRACK_PLAIN],
      users: [USER_EDU],
      classifiedByType: { track: ["t-clas"], entry: ["e-clas"] },
    });
    const since = "2026-02-01T00:00:00.000Z", until = "2026-03-01T00:00:00.000Z";
    const response = await handleStats(
      request(`/api/stats/recap?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`, await visitToken()),
      { DB: db },
      urlFor(`/api/stats/recap?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.topTrack).toEqual({ id: "t-clas", title: "Nuestra canción", artist: "Edu", plays: 3 });
    expect(db.calls.some((c) => c.sql.includes("FROM classified_items"))).toBe(false);
  });

  it("con visit:true pero el top track no clasificado, el título sigue apareciendo", async () => {
    const db = makeDb({
      events: RECAP_EVENTS,
      tracks: [TRACK_CLASIFIED, TRACK_PLAIN],
      users: [USER_EDU],
      classifiedByType: { entry: ["e-clas"] }, // t-clas NO clasificado aquí
    });
    const since = "2026-02-01T00:00:00.000Z", until = "2026-03-01T00:00:00.000Z";
    const response = await handleStats(
      request(`/api/stats/recap?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`, await visitToken({ visit: true })),
      { DB: db },
      urlFor(`/api/stats/recap?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.topTrack).toEqual({ id: "t-clas", title: "Nuestra canción", artist: "Edu", plays: 3 });
  });
});