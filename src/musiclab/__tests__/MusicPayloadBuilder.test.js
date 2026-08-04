// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildEditPayload,
  normalizeNewTrack,
} from "../MusicPayloadBuilder.js";

describe("MusicPayloadBuilder", () => {
  it("maps tag/vibe to tag_id and removes non-API fields", () => {
    const result = buildEditPayload({
      id: "track-1",
      title: "Nuevo título",
      vibe: "chill",
      file: { name: "secret.mp3" },
      malicious_field: "ignored",
    });

    expect(result).toEqual({ title: "Nuevo título", tag_id: "chill" });
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("vibe");
    expect(result).not.toHaveProperty("file");
  });

  it("preserves the existing tag precedence for edits", () => {
    expect(buildEditPayload({ tag: "", vibe: "fallback" })).toEqual({ tag_id: "fallback" });
    expect(buildEditPayload({ tag: "primary", vibe: "fallback" })).toEqual({ tag_id: "primary" });
    expect(buildEditPayload({ tag: null })).toEqual({ tag_id: null });
  });

  it("normalizes a created track without retaining the File object", () => {
    const trackData = { title: "Nuevo", file: { name: "x.mp3" }, tag: "rock" };
    const created = { id: "track-1", tag_id: "rock" };
    const uploaded = { r2_key: "music/x.mp3" };

    expect(normalizeNewTrack(trackData, created, uploaded)).toEqual({
      title: "Nuevo",
      file: undefined,
      tag: "rock",
      id: "track-1",
      tag_id: "rock",
      r2_key: "music/x.mp3",
    });
  });

  it("prefers the server-created R2 key and falls back to the upload result", () => {
    expect(normalizeNewTrack({ tag: "a" }, { r2_key: "music/server.mp3" }, { r2_key: "music/upload.mp3" }).r2_key)
      .toBe("music/server.mp3");
    expect(normalizeNewTrack({}, {}, { r2_key: "music/upload.mp3" }).r2_key)
      .toBe("music/upload.mp3");
    expect(normalizeNewTrack({}, {}, null).r2_key).toBeNull();
    expect(normalizeNewTrack(null, null, null)).toEqual({
      file: undefined,
      r2_key: null,
      tag: undefined,
    });
  });
});
