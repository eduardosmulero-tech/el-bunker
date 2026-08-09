// @vitest-environment node
import { describe, expect, it } from "vitest";
import { advanceSyncCursor } from "../SyncTransforms.js";

describe("advanceSyncCursor", () => {
  it("advances for created and joined responses", () => {
    const timestamp = "2026-08-08T12:00:00.000Z";
    const cursor = advanceSyncCursor(0, { action: "created", updated_at: timestamp });
    expect(cursor).toBe(new Date(timestamp).getTime());
    expect(advanceSyncCursor(cursor, { action: "joined", updated_at: "2026-08-08T12:00:01.000Z" }))
      .toBe(new Date("2026-08-08T12:00:01.000Z").getTime());
  });

  it("does not move backwards or advance on unchanged responses", () => {
    const cursor = new Date("2026-08-08T12:00:02.000Z").getTime();
    expect(advanceSyncCursor(cursor, { updated_at: "2026-08-08T12:00:01.000Z" })).toBe(cursor);
    expect(advanceSyncCursor(cursor, { unchanged: true, updated_at: "2026-08-08T12:00:03.000Z" })).toBe(cursor);
  });
});
