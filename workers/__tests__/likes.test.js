// @vitest-environment node
// t_like-sync — tests de la ruta /api/likes/:userId.
// Cubre: 401 sin auth, 403 cross-user, 400 body inválido y round-trip
// GET/PUT contra un mock mínimo de D1 (mismo estilo que router-contract).
import { describe, expect, it, vi } from "vitest";
import handleLikes from "../routes/likes.js";

// Mock mínimo de D1: captura el estado de track_likes en memoria.
// batch() vive en la DB (como D1 real); cada statement guarda sus args en bind().
function makeEnv() {
  const rows = []; // { user_id, track_id, created_at }
  const env = {
    DB: {
      prepare: vi.fn((sql) => ({
        bind: vi.fn((...args) => ({
          sql,
          args,
          all: async () => {
            if (sql.includes("SELECT track_id FROM track_likes")) {
              const uid = args[0];
              return { results: rows.filter((r) => r.user_id === uid).map((r) => ({ track_id: r.track_id })) };
            }
            return { results: [] };
          },
          run: async () => {
            if (sql.startsWith("DELETE FROM track_likes")) {
              const uid = args[0];
              for (let i = rows.length - 1; i >= 0; i -= 1) {
                if (rows[i].user_id === uid) rows.splice(i, 1);
              }
            }
            return { success: true };
          },
        })),
      })),
      batch: vi.fn(async (statements) => {
        for (const st of statements) {
          if (st.sql?.includes("INSERT INTO track_likes")) {
            const [uid, trackId] = st.args ?? [];
            rows.push({ user_id: uid, track_id: trackId, created_at: "now" });
          }
        }
        return { success: true };
      }),
    },
  };
  return { env, rows };
}

const url = (uid) => new URL(`https://el-bunker-api.test/api/likes/${uid}`);

describe("t_like-sync — /api/likes/:userId", () => {
  it("401 sin usuario autenticado", async () => {
    const { env } = makeEnv();
    const res = await handleLikes(new Request(url("edu")), env, url("edu"), null);
    expect(res.status).toBe(401);
  });

  it("403 al acceder a los likes de otro usuario", async () => {
    const { env } = makeEnv();
    const res = await handleLikes(new Request(url("david")), env, url("david"), "edu");
    expect(res.status).toBe(403);
  });

  it("400 si falta el user id en el path", async () => {
    const { env } = makeEnv();
    const res = await handleLikes(new Request(new URL("https://x.test/api/likes/")), env, new URL("https://x.test/api/likes/"), "edu");
    expect(res.status).toBe(400);
  });

  it("400 con body inválido en PUT", async () => {
    const { env } = makeEnv();
    const req = new Request(url("edu"), { method: "PUT", body: JSON.stringify({ no: "array" }), headers: { "Content-Type": "application/json" } });
    const res = await handleLikes(req, env, url("edu"), "edu");
    expect(res.status).toBe(400);
  });

  it("round-trip: PUT guarda y GET devuelve los mismos ids", async () => {
    const { env } = makeEnv();
    const req = new Request(url("edu"), { method: "PUT", body: JSON.stringify({ liked_track_ids: ["trk-1", "trk-2"] }), headers: { "Content-Type": "application/json" } });
    const put = await handleLikes(req, env, url("edu"), "edu");
    expect(put.status).toBe(200);
    const putBody = await put.json();
    expect(putBody.count).toBe(2);

    const get = await handleLikes(new Request(url("edu")), env, url("edu"), "edu");
    expect(get.status).toBe(200);
    const body = await get.json();
    expect(body.liked_track_ids.sort()).toEqual(["trk-1", "trk-2"]);
  });

  it("PUT deduplica ids repetidos", async () => {
    const { env } = makeEnv();
    const req = new Request(url("edu"), { method: "PUT", body: JSON.stringify({ liked_track_ids: ["trk-1", "trk-1", "trk-2"] }), headers: { "Content-Type": "application/json" } });
    const res = await handleLikes(req, env, url("edu"), "edu");
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it("PUT con lista vacía deja cero filas (unlike total)", async () => {
    const { env, rows } = makeEnv();
    const req = new Request(url("edu"), { method: "PUT", body: JSON.stringify({ liked_track_ids: [] }), headers: { "Content-Type": "application/json" } });
    await handleLikes(req, env, url("edu"), "edu");
    expect(rows.filter((r) => r.user_id === "edu")).toHaveLength(0);
  });

  it("405 en método no soportado", async () => {
    const { env } = makeEnv();
    const res = await handleLikes(new Request(url("edu"), { method: "DELETE" }), env, url("edu"), "edu");
    expect(res.status).toBe(405);
  });
});
