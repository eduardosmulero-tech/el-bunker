// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSensitiveR2Key,
  signR2Read,
  verifyR2Read,
} from "../r2-sign.js";
import handleR2 from "../../routes/r2.js";
import handleEntries from "../../routes/entries.js";

const ENV = { R2_SIGN_SECRET: "test-secret-for-r2-signing" };

afterEach(() => {
  vi.restoreAllMocks();
});

function req(path) {
  return new Request(`https://bunker.test${path}`, { method: "GET" });
}

describe("R2 sensitive key classification", () => {
  it("only marks docs and audio prefixes as sensitive", () => {
    expect(isSensitiveR2Key("vault/docs/private.pdf")).toBe(true);
    expect(isSensitiveR2Key("vault/audio/note.mp3")).toBe(true);
    expect(isSensitiveR2Key("vault/photos/photo.jpg")).toBe(false);
    expect(isSensitiveR2Key("music/song.mp3")).toBe(false);
    expect(isSensitiveR2Key("vault/docs")).toBe(false);
  });
});

describe("R2 HMAC read tokens", () => {
  it("signs and verifies the same key", async () => {
    const signed = await signR2Read("vault/docs/private.pdf", ENV);
    expect(signed).toMatchObject({ token: expect.any(String), expiresAt: expect.any(Number) });
    await expect(verifyR2Read("vault/docs/private.pdf", signed.token, ENV)).resolves.toBe(true);
  });

  it("rejects a token used for another key or altered signature", async () => {
    const signed = await signR2Read("vault/docs/private.pdf", ENV);
    const [expiry, signature] = signed.token.split(".");
    const altered = `${expiry}.${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`;
    await expect(verifyR2Read("vault/docs/other.pdf", signed.token, ENV)).resolves.toBe(false);
    await expect(verifyR2Read("vault/docs/private.pdf", altered, ENV)).resolves.toBe(false);
  });

  it("rejects expired and exactly-expired tokens", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const signed = await signR2Read("vault/audio/private.mp3", ENV);
    vi.spyOn(Date, "now").mockReturnValue(signed.expiresAt);
    await expect(verifyR2Read("vault/audio/private.mp3", signed.token, ENV)).resolves.toBe(false);
  });

  it("rejects malformed tokens and missing secrets", async () => {
    await expect(verifyR2Read("vault/docs/private.pdf", "bad-token", ENV)).resolves.toBe(false);
    await expect(signR2Read("vault/docs/private.pdf", {})).resolves.toBeNull();
    await expect(verifyR2Read("vault/docs/private.pdf", "bad-token", {})).resolves.toBe(false);
  });
});

describe("Entry image signing", () => {
  async function getEntryWithEnv(env, files = []) {
    const DB = {
      prepare(sql) {
        const stmt = {
          bind() { return stmt; },
          async first() {
            return sql.includes("SELECT * FROM entries")
              ? { id: "entry-1", content: JSON.stringify({ images: [{ r2_key: "vault/docs/private.pdf" }] }), is_deleted: 0 }
              : null;
          },
          async all() {
            return { results: sql.toLowerCase().includes("from files") ? files : [] };
          },
        };
        return stmt;
      },
    };
    const response = await handleEntries(
      req("/api/entries/entry-1"),
      { DB, ...env },
      new URL("https://bunker.test/api/entries/entry-1"),
      "edu",
    );
    expect(response.status).toBe(200);
    const entry = await response.json();
    entry.content = typeof entry.content === "string" ? JSON.parse(entry.content) : entry.content;
    return entry;
  }

  it("injects a verifiable URL for sensitive images", async () => {
    const entry = await getEntryWithEnv(ENV);
    const image = entry.content.images[0];
    const token = new URL(image.url).searchParams.get("t");
    expect(image.url).toContain("/vault/docs/private.pdf?t=");
    await expect(verifyR2Read(image.r2_key, token, ENV)).resolves.toBe(true);

    const withFile = await getEntryWithEnv(ENV, [{ id: "file-1", r2_key: "vault/docs/private.pdf", prefix: "vault/docs", url: "stale" }]);
    expect(withFile.files[0].url).toContain("/vault/docs/private.pdf?t=");
    await expect(verifyR2Read(withFile.files[0].r2_key, new URL(withFile.files[0].url).searchParams.get("t"), ENV)).resolves.toBe(true);
  });

  it("scrubs sensitive keys and stale URLs when the environment is not local and the secret is missing", async () => {
    const entry = await getEntryWithEnv(
      { ENVIRONMENT: "production" },
      [{ id: "file-1", r2_key: "vault/docs/private.pdf", prefix: "vault/docs", url: "stale" }],
    );
    expect(entry.content.images[0]).toEqual({ protected: true });
    expect(entry.files[0]).toEqual({ id: "file-1", prefix: "vault/docs", protected: true });

    const DB = {
      prepare(sql) {
        const stmt = {
          bind() { return stmt; },
          async first() { return sql.includes("SELECT * FROM entries") ? { id: "entry-1", content: "{}", is_deleted: 0 } : null; },
          async all() {
            const normalizedSql = sql.toLowerCase();
            if (normalizedSql.includes("select * from entries")) return { results: [{ id: "entry-1", content: "{}", is_deleted: 0 }] };
            if (normalizedSql.includes("from files")) return { results: [{ id: "file-1", entry_id: "entry-1", r2_key: "vault/docs/private.pdf", prefix: "vault/docs", url: "stale" }] };
            return { results: [] };
          },
        };
        return stmt;
      },
    };
    const response = await handleEntries(req("/api/entries"), { DB, ENVIRONMENT: "production" }, new URL("https://bunker.test/api/entries"), "edu");
    const listed = await response.json();
    expect(listed[0].files[0]).toEqual({ id: "file-1", prefix: "vault/docs", protected: true });
  });

  it("preserves unsigned sensitive keys only in explicit development", async () => {
    const entry = await getEntryWithEnv({ ENVIRONMENT: "development" });
    expect(entry.content.images[0]).toEqual({ r2_key: "vault/docs/private.pdf" });
    const withFile = await getEntryWithEnv({ ENVIRONMENT: "development" }, [{ id: "file-1", r2_key: "vault/docs/private.pdf", url: "legacy" }]);
    expect(withFile.files[0]).toEqual({ id: "file-1", r2_key: "vault/docs/private.pdf", url: "legacy" });
  });
});

describe("R2 route gate", () => {
  it("returns 404 and never reads R2 for an invalid sensitive token", async () => {
    const head = vi.fn();
    const response = await handleR2(req("/vault/docs/private.pdf?t=bad"), { ...ENV, BUNKER: { head } }, "/vault/docs/private.pdf");
    expect(response.status).toBe(404);
    expect(head).not.toHaveBeenCalled();
  });

  it("allows a valid signed token and preserves Range behavior", async () => {
    const signed = await signR2Read("vault/audio/private.mp3", ENV);
    const get = vi.fn(async () => ({
      body: new Response("abc").body,
      httpMetadata: { contentType: "audio/mpeg" },
    }));
    const response = await handleR2(
      new Request(`https://bunker.test/vault/audio/private.mp3?t=${encodeURIComponent(signed.token)}`, {
        headers: { Range: "bytes=0-2" },
      }),
      {
        ...ENV,
        BUNKER: {
          head: async () => ({ size: 3, httpMetadata: { contentType: "audio/mpeg" } }),
          get,
        },
      },
      "/vault/audio/private.mp3",
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 0-2/3");
    expect(get).toHaveBeenCalledWith("vault/audio/private.mp3", { range: { offset: 0, length: 3 } });
  });

  it("fails closed for sensitive keys in production without a secret", async () => {
    const head = vi.fn();
    const response = await handleR2(req("/vault/docs/private.pdf"), {
      ENVIRONMENT: "production",
      BUNKER: { head },
    }, "/vault/docs/private.pdf");
    expect(response.status).toBe(404);
    expect(head).not.toHaveBeenCalled();
  });

  it("fails closed when the environment is unspecified and no secret exists", async () => {
    const head = vi.fn();
    const response = await handleR2(req("/vault/docs/private.pdf"), {
      BUNKER: { head },
    }, "/vault/docs/private.pdf");
    expect(response.status).toBe(404);
    expect(head).not.toHaveBeenCalled();
  });

  it("fails closed for an unknown environment without a secret", async () => {
    const head = vi.fn();
    const response = await handleR2(req("/vault/docs/private.pdf"), {
      ENVIRONMENT: "staging",
      BUNKER: { head },
    }, "/vault/docs/private.pdf");
    expect(response.status).toBe(404);
    expect(head).not.toHaveBeenCalled();
  });

  it("keeps legacy public behavior when no signing secret is configured locally", async () => {
    const head = async () => ({ size: 1, httpMetadata: { contentType: "application/octet-stream" } });
    const response = await handleR2(req("/vault/docs/public.pdf"), {
      ENVIRONMENT: "development",
      BUNKER: {
        head,
        get: async () => ({ body: new Response("x").body, httpMetadata: {} }),
      },
    }, "/vault/docs/public.pdf");
    expect(response.status).toBe(200);
  });
});
