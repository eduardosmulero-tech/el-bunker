// @vitest-environment node
// A3 — Saneamiento server-side en modo visita (ADR-029, diseño §3/§6).
// Con el claim visit:true en el JWT, lo clasificado sale vaciado de las
// rutas del ámbito: sin r2_key, sin URL firmada, sin título ni nota.
// Sin el claim, las respuestas son idénticas a hoy (regresión cero).
import { describe, expect, it } from "vitest";
import handleEntries from "../entries.js";
import handleTracks from "../tracks.js";
import handleCapsules from "../capsules.js";
import handleDrops from "../drops.js";
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
function makeDb({ entries = [], files = [], tracks = [], capsules = [], capsuleItems = [], drops = [], classifiedByType = {} }) {
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
          // A3: classified_items — bind(itemType, ...ids)
          if (sql.includes("FROM classified_items")) {
            const itemType = this.bindings[0];
            const ids = new Set(this.bindings.slice(1));
            const matches = (classifiedByType[itemType] || []).filter((id) => ids.has(id));
            return { results: matches.map((item_id) => ({ item_id })) };
          }
          // A3: blurhash de files de entries (solo en modo visita)
          if (sql.includes("blurhash") && sql.includes("FROM files")) {
            const entryIds = new Set(this.bindings);
            return {
              results: files
                .filter((f) => entryIds.has(f.entry_id) && f.blurhash)
                .map((f) => ({ entry_id: f.entry_id, blurhash: f.blurhash })),
            };
          }
          if (sql.includes("FROM files")) {
            const entryIds = new Set(this.bindings);
            return { results: files.filter((f) => entryIds.has(f.entry_id)) };
          }
          if (sql.includes("FROM entry_tags")) return { results: [] };
          if (sql.includes("FROM tracks t")) return { results: tracks };
          if (sql.includes("FROM track_tags")) return { results: [] };
          if (sql.includes("FROM capsule_items")) return { results: capsuleItems };
          if (sql.includes("FROM time_capsules")) return { results: capsules };
          if (sql.includes("FROM drops")) return { results: drops };
          if (sql.includes("FROM entries")) return { results: entries };
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
    async batch(statements) {
      for (const s of statements) calls.push({ sql: s.sql, bindings: s.bindings });
      return { success: true };
    },
  };
  return db;
}

// ── Datos de ejemplo ────────────────────────────────────────────────
const ENTRY_CLASSIFIED = {
  id: "e-clas",
  era_id: "era-1",
  type: "photo",
  title: "Recuerdo secreto",
  content: JSON.stringify({ text: "nota privada", images: [] }),
  from_user: "edu",
  to_user: "both",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};
const ENTRY_PLAIN = {
  id: "e-plain",
  era_id: "era-2",
  type: "note",
  title: "Nota normal",
  content: JSON.stringify({ text: "cosas de la semana" }),
  from_user: "edu",
  to_user: "both",
  created_at: "2026-01-02T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};
const FILES = [
  { id: "f-clas", entry_id: "e-clas", r2_key: "vault/photos/clas.jpg", prefix: "vault/photos", filename: "clas.jpg", mime_type: "image/jpeg", size_bytes: 100, blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6." },
  { id: "f-plain", entry_id: "e-plain", r2_key: "vault/photos/plain.jpg", prefix: "vault/photos", filename: "plain.jpg", mime_type: "image/jpeg", size_bytes: 200 },
];

const TRACK_CLASSIFIED = {
  id: "t-clas",
  era_id: "era-1",
  title: "Nuestra canción",
  artist: "Edu",
  tag_id: "tag-1",
  r2_key: "music/clas.mp3",
  format: "mp3",
  note: "la que sonaba aquella noche",
  duration: 180,
  thumbnail: "music/clas.jpg",
  play_count: 3,
  created_at: "2026-01-01T00:00:00.000Z",
};
const TRACK_PLAIN = {
  id: "t-plain",
  era_id: "era-2",
  title: "Canción normal",
  artist: "David",
  tag_id: null,
  r2_key: "music/plain.mp3",
  format: "mp3",
  note: "",
  duration: 200,
  thumbnail: null,
  play_count: 0,
  created_at: "2026-01-02T00:00:00.000Z",
};

const CAPSULE_CLASSIFIED = {
  id: "c-clas",
  title: "Cápsula secreta",
  description: "para el futuro",
  unlock_at: "2020-01-01T00:00:00.000Z",
  created_by: "edu",
  is_unlocked: 1,
  created_at: "2026-01-01T00:00:00.000Z",
};
const CAPSULE_PLAIN = {
  id: "c-plain",
  title: "Cápsula normal",
  description: "una nota",
  unlock_at: "2030-01-01T00:00:00.000Z",
  created_by: "edu",
  is_unlocked: 0,
  created_at: "2026-01-02T00:00:00.000Z",
};
const CAPSULE_ITEMS = [
  { id: "ci-1", capsule_id: "c-clas", type: "entry_ref", content: JSON.stringify({ entry_id: "e-clas" }), sort_order: 0, created_by: "edu", created_at: "2026-01-01T00:00:00.000Z" },
];

const DROP_CLASSIFIED = {
  id: "d-clas",
  era_id: "era-1",
  track_id: "t-clas",
  from_user: "edu",
  to_user: "david",
  drop_date: "2026-01-01T00:00:00.000Z",
  memory: "mensaje íntimo",
  mood: "romantico",
  favorited: 0,
  created_at: "2026-01-01T00:00:00.000Z",
};
const DROP_PLAIN = {
  id: "d-plain",
  era_id: "era-2",
  track_id: null,
  from_user: "edu",
  to_user: "david",
  drop_date: "2026-01-02T00:00:00.000Z",
  memory: "un momento normal",
  mood: "alegre",
  favorited: 0,
  created_at: "2026-01-02T00:00:00.000Z",
};

// ── /api/entries ───────────────────────────────────────────────────
describe("A3 /api/entries en modo visita", () => {
  it("con visit:true, la entry clasificada sale vaciada (sin r2_key, URL firmada, título ni nota); la no clasificada intacta", async () => {
    const db = makeDb({
      entries: [ENTRY_CLASSIFIED, ENTRY_PLAIN],
      files: FILES,
      classifiedByType: { entry: ["e-clas"] },
    });
    const response = await handleEntries(
      request("/api/entries", await visitToken({ visit: true })),
      { DB: db },
      urlFor("/api/entries"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);

    const sanitized = body.find((e) => e.id === "e-clas");
    expect(sanitized).toEqual({
      id: "e-clas",
      classified: true,
      blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6.",
      fecha: "2026-01-01T00:00:00.000Z",
      era: "era-1",
    });
    expect(JSON.stringify(sanitized)).not.toMatch(/r2_key/);
    expect(JSON.stringify(sanitized)).not.toMatch(/url/);
    expect(JSON.stringify(sanitized)).not.toMatch(/title|título/);

    const plain = body.find((e) => e.id === "e-plain");
    expect(plain.title).toBe("Nota normal");
    expect(plain.files).toHaveLength(1);
    expect(plain.files[0].r2_key).toBe("vault/photos/plain.jpg");
  });

  it("con visit:true, el detalle de una entry clasificada sale vaciado", async () => {
    const db = makeDb({
      entries: [ENTRY_CLASSIFIED],
      files: FILES,
      classifiedByType: { entry: ["e-clas"] },
    });
    const response = await handleEntries(
      request("/api/entries/e-clas", await visitToken({ visit: true })),
      { DB: db },
      urlFor("/api/entries/e-clas"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      id: "e-clas",
      classified: true,
      blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6.",
      fecha: "2026-01-01T00:00:00.000Z",
      era: "era-1",
    });
  });

  it("sin el claim, la respuesta es idéntica a hoy (regresión cero)", async () => {
    const db = makeDb({
      entries: [ENTRY_CLASSIFIED, ENTRY_PLAIN],
      files: FILES,
      classifiedByType: { entry: ["e-clas"] },
    });
    const response = await handleEntries(
      request("/api/entries", await visitToken()),
      { DB: db },
      urlFor("/api/entries"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();

    const clas = body.find((e) => e.id === "e-clas");
    expect(clas.title).toBe("Recuerdo secreto");
    expect(JSON.parse(clas.content).text).toBe("nota privada");
    expect(clas.files[0].r2_key).toBe("vault/photos/clas.jpg");
    // Sin modo visita no se consulta classified_items ni blurhash.
    expect(db.calls.some((c) => c.sql.includes("FROM classified_items"))).toBe(false);
    expect(db.calls.some((c) => c.sql.includes("blurhash"))).toBe(false);
  });
});

// ── /api/tracks ────────────────────────────────────────────────────
describe("A3 /api/tracks en modo visita", () => {
  it("con visit:true, el track clasificado sale vaciado (sin r2_key, título ni nota); el no clasificado intacto", async () => {
    const db = makeDb({
      tracks: [TRACK_CLASSIFIED, TRACK_PLAIN],
      classifiedByType: { track: ["t-clas"] },
    });
    const response = await handleTracks(
      request("/api/tracks", await visitToken({ visit: true })),
      { DB: db },
      urlFor("/api/tracks"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);

    const sanitized = body.find((t) => t.id === "t-clas");
    expect(sanitized).toEqual({
      id: "t-clas",
      classified: true,
      blurhash: null,
      fecha: "2026-01-01T00:00:00.000Z",
      era: "era-1",
    });
    expect(JSON.stringify(sanitized)).not.toMatch(/r2_key|thumbnail|note|artist/);

    const plain = body.find((t) => t.id === "t-plain");
    expect(plain.title).toBe("Canción normal");
    expect(plain.r2_key).toBe("music/plain.mp3");
  });

  it("sin el claim, la respuesta es idéntica a hoy (regresión cero)", async () => {
    const db = makeDb({
      tracks: [TRACK_CLASSIFIED, TRACK_PLAIN],
      classifiedByType: { track: ["t-clas"] },
    });
    const response = await handleTracks(
      request("/api/tracks", await visitToken()),
      { DB: db },
      urlFor("/api/tracks"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    const clas = body.find((t) => t.id === "t-clas");
    expect(clas.title).toBe("Nuestra canción");
    expect(clas.r2_key).toBe("music/clas.mp3");
    expect(db.calls.some((c) => c.sql.includes("FROM classified_items"))).toBe(false);
  });
});

// ── /api/time_capsules ─────────────────────────────────────────────
describe("A3 /api/time_capsules en modo visita", () => {
  it("con visit:true, la cápsula clasificada sale vaciada (sin título ni contenido); la no clasificada intacta", async () => {
    const db = makeDb({
      capsules: [CAPSULE_CLASSIFIED, CAPSULE_PLAIN],
      capsuleItems: CAPSULE_ITEMS,
      classifiedByType: { capsule: ["c-clas"] },
    });
    const response = await handleCapsules(
      request("/api/time_capsules", await visitToken({ visit: true })),
      { DB: db },
      urlFor("/api/time_capsules"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);

    const sanitized = body.find((c) => c.id === "c-clas");
    expect(sanitized).toEqual({
      id: "c-clas",
      classified: true,
      blurhash: null,
      fecha: "2026-01-01T00:00:00.000Z",
      era: null,
      is_unlocked: true,
      unlock_at: "2020-01-01T00:00:00.000Z",
      content_counts: { entries: 1, playlists: 0 },
    });
    expect(JSON.stringify(sanitized)).not.toMatch(/title|description|capsule_items|entry_ids|content_snapshot/);

    const plain = body.find((c) => c.id === "c-plain");
    expect(plain.title).toBe("Cápsula normal");
    expect(plain.content_counts).toEqual({ entries: 0, playlists: 0 });
  });

  it("sin el claim, la respuesta es idéntica a hoy (regresión cero)", async () => {
    const db = makeDb({
      capsules: [CAPSULE_CLASSIFIED, CAPSULE_PLAIN],
      capsuleItems: CAPSULE_ITEMS,
      classifiedByType: { capsule: ["c-clas"] },
    });
    const response = await handleCapsules(
      request("/api/time_capsules", await visitToken()),
      { DB: db },
      urlFor("/api/time_capsules"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    const clas = body.find((c) => c.id === "c-clas");
    expect(clas.title).toBe("Cápsula secreta");
    expect(clas.entry_ids).toEqual(["e-clas"]);
    expect(db.calls.some((c) => c.sql.includes("FROM classified_items"))).toBe(false);
  });
});

// ── /api/drops ─────────────────────────────────────────────────────
describe("A3 /api/drops en modo visita", () => {
  it("con visit:true, el drop clasificado sale vaciado (sin nota ni destinatario); el no clasificado intacto", async () => {
    const db = makeDb({
      drops: [DROP_CLASSIFIED, DROP_PLAIN],
      classifiedByType: { drop: ["d-clas"] },
    });
    const response = await handleDrops(
      request("/api/drops", await visitToken({ visit: true })),
      { DB: db },
      urlFor("/api/drops"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);

    const sanitized = body.find((d) => d.id === "d-clas");
    expect(sanitized).toEqual({
      id: "d-clas",
      classified: true,
      blurhash: null,
      fecha: "2026-01-01T00:00:00.000Z",
      era: "era-1",
    });
    expect(JSON.stringify(sanitized)).not.toMatch(/memory|to_user|to|from/);

    const plain = body.find((d) => d.id === "d-plain");
    expect(plain.memory).toBe("un momento normal");
    expect(plain.to_user).toBe("david");
  });

  it("sin el claim, la respuesta es idéntica a hoy (regresión cero)", async () => {
    const db = makeDb({
      drops: [DROP_CLASSIFIED, DROP_PLAIN],
      classifiedByType: { drop: ["d-clas"] },
    });
    const response = await handleDrops(
      request("/api/drops", await visitToken()),
      { DB: db },
      urlFor("/api/drops"),
      "edu",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    const clas = body.find((d) => d.id === "d-clas");
    expect(clas.memory).toBe("mensaje íntimo");
    expect(clas.to_user).toBe("david");
    expect(db.calls.some((c) => c.sql.includes("FROM classified_items"))).toBe(false);
  });
});
