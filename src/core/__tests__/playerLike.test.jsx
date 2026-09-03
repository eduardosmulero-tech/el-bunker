// @vitest-environment jsdom
// t_like-unificado: tests del like real compartido dock/deck (playerLike.js).
// Cubre: toggle puro, persistencia por usuario en localStorage, aislamiento por
// usuario, noop sin userId y tolerancia a JSON corrupto.
import { describe, expect, it, beforeEach } from "vitest";
import { likedKeyFor, readLikedIds, writeLikedIds, toggleLikedId } from "../playerLike";

describe("playerLike", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("likedKeyFor: clave por usuario, null sin userId", () => {
    expect(likedKeyFor("edu")).toBe("el_bunker_liked_edu");
    expect(likedKeyFor(null)).toBe(null);
    expect(likedKeyFor(undefined)).toBe(null);
  });

  it("toggleLikedId añade y quita, devolviendo el nuevo estado y sin mutar el Set", () => {
    const initial = new Set();
    const { next, nowLiked } = toggleLikedId(initial, "trk-1");
    expect(nowLiked).toBe(true);
    expect(next.has("trk-1")).toBe(true);
    expect(initial.has("trk-1")).toBe(false); // inmutabilidad: el Set original intacto

    const { next: next2, nowLiked: nowLiked2 } = toggleLikedId(next, "trk-1");
    expect(nowLiked2).toBe(false);
    expect(next2.has("trk-1")).toBe(false);
  });

  it("toggleLikedId sin trackId es noop honesto (nowLiked false)", () => {
    const { next, nowLiked } = toggleLikedId(new Set(["a"]), null);
    expect(nowLiked).toBe(false);
    expect(next.has("a")).toBe(true);
  });

  it("round-trip de persistencia: write → read devuelve los mismos ids", () => {
    const ids = new Set(["trk-1", "trk-2"]);
    writeLikedIds("edu", ids);
    expect(readLikedIds("edu")).toEqual(ids);
  });

  it("dado otro userId, lee su propia lista (aislamiento por usuario)", () => {
    writeLikedIds("david", new Set(["trk-9"]));
    expect(readLikedIds("edu").has("trk-9")).toBe(false);
    expect(readLikedIds("david").has("trk-9")).toBe(true);
  });

  it("writeLikedIds sin userId es noop (no lanza, no persiste)", () => {
    expect(() => writeLikedIds(null, new Set(["trk-1"]))).not.toThrow();
    expect(localStorage.getItem("el_bunker_liked_null")).toBe(null);
  });

  it("readLikedIds tolera JSON corrupto", () => {
    localStorage.setItem("el_bunker_liked_edu", "{corrupto");
    expect(readLikedIds("edu").size).toBe(0);
  });

  it("readLikedIds tolera JSON válido que no es array", () => {
    localStorage.setItem("el_bunker_liked_edu", JSON.stringify({ no: "es array" }));
    expect(readLikedIds("edu").size).toBe(0);
  });
});
