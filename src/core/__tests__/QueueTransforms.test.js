// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { enforceQueueLimit, fisherYatesInPlace } from "../QueueTransforms.js";

const tracks = (count, manual = false) => (
  Array.from({ length: count }, (_, index) => ({ id: `${manual ? "m" : "c"}-${index}`, _manual: manual }))
);

describe("QueueTransforms", () => {
  it("preserves short queues and returns the same reference", () => {
    const queue = tracks(3);
    expect(enforceQueueLimit(queue, 5)).toBe(queue);
  });

  it("keeps manual tracks and trims the oldest context tracks", () => {
    const queue = [...tracks(4), ...tracks(3, true)];
    expect(enforceQueueLimit(queue, 5).map((track) => track.id)).toEqual([
      "c-0", "c-1", "m-0", "m-1", "m-2",
    ]);
  });

  it("keeps only the newest manual tracks when manuals exceed the limit", () => {
    expect(enforceQueueLimit(tracks(4, true), 2).map((track) => track.id)).toEqual(["m-2", "m-3"]);
  });

  it("shuffles in place using Fisher-Yates and remains deterministic under mocked random", () => {
    const queue = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      expect(fisherYatesInPlace(queue)).toBe(queue);
      expect(queue.map((track) => track.id)).toEqual(["b", "c", "a"]);
    } finally {
      random.mockRestore();
    }
  });
});
