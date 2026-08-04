// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  EVENT_TYPES,
  USER_IDS,
  cleanString,
  isValidEventType,
  isValidUserId,
} from "../validation.js";

describe("validation helpers", () => {
  it("cleanString trims and enforces max length", () => {
    expect(cleanString("  hola  ")).toBe("hola");
    expect(cleanString("")).toBeNull();
    expect(cleanString("   ")).toBeNull();
    expect(cleanString(42)).toBeNull();
    expect(cleanString(null)).toBeNull();
    expect(cleanString("a".repeat(201), 200)).toBeNull();
    expect(cleanString("a".repeat(200), 200)).toBe("a".repeat(200));
  });

  it("isValidEventType accepts known app events and rejects others", () => {
    expect(isValidEventType("track_play")).toBe(true);
    expect(isValidEventType("entry_created")).toBe(true);
    expect(isValidEventType("smoke_session_started")).toBe(true);
    expect(isValidEventType("auth_login")).toBe(true);
    expect(isValidEventType("totally_unknown_event")).toBe(false);
    expect(isValidEventType("")).toBe(false);
    expect(isValidEventType(null)).toBe(false);
    expect(isValidEventType(123)).toBe(false);
  });

  it("EVENT_TYPES covers every event emitted by workers and frontend", () => {
    // workers/routes: bind directo + emitEvent
    for (const t of [
      "capsule_created", "capsule_unlocked", "drop_deleted", "drop_sent",
      "entry_created", "entry_deleted", "entry_updated", "era_created",
      "era_deleted", "era_updated", "playlist_created", "playlist_deleted",
      "playlist_track_removed", "playlist_tracks_reordered", "playlists_reordered",
      "tag_created", "tag_deleted", "shared_session_started",
      "shared_session_joined", "shared_session_left", "track_created",
      "track_deleted", "auth_login",
    ]) {
      expect(EVENT_TYPES.has(t), t).toBe(true);
    }
    // src/core/StatsEngine.js + src/smoke/SmokeSession.jsx
    for (const t of [
      "track_play", "track_pause", "track_skip", "smoke_session_completed",
      "smoke_session_started",
    ]) {
      expect(EVENT_TYPES.has(t), t).toBe(true);
    }
  });

  it("isValidUserId matches the D1 users table", () => {
    expect(USER_IDS.has("admin")).toBe(true);
    expect(USER_IDS.has("edu")).toBe(true);
    expect(USER_IDS.has("david")).toBe(true);
    expect(isValidUserId("admin")).toBe(true);
    expect(isValidUserId("hacker")).toBe(false);
    expect(isValidUserId("")).toBe(false);
    expect(isValidUserId(null)).toBe(false);
  });
});
