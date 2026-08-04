// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sortTracks } from "../TrackTransforms.js";

const tracks = [
  { id: "b", title: "Beta", artist: "Zed", tag: "calm", play_count: 2, added_at: "2026-08-02T00:00:00Z" },
  { id: "a", title: "Alpha", artist: "Ada", tag: "loud", play_count: 7, added_at: "2026-08-01T00:00:00Z" },
  { id: "c", title: "Gamma", artist: "Mia", tag: "calm", play_count: 1, added_at: "2026-08-03T00:00:00Z" },
];

describe("sortTracks", () => {
  it("does not mutate the source list and sorts alphabetically by default", () => {
    expect(sortTracks(tracks).map((track) => track.id)).toEqual(["a", "b", "c"]);
    expect(tracks.map((track) => track.id)).toEqual(["b", "a", "c"]);
  });

  it("supports artist, vibe, plays and recent orderings", () => {
    expect(sortTracks(tracks, "artist").map((track) => track.id)).toEqual(["a", "c", "b"]);
    expect(sortTracks(tracks, "vibe").map((track) => track.id)).toEqual(["b", "c", "a"]);
    expect(sortTracks(tracks, "plays").map((track) => track.id)).toEqual(["a", "b", "c"]);
    expect(sortTracks(tracks, "recent").map((track) => track.id)).toEqual(["c", "b", "a"]);
  });

  it("falls back to alphabetical ordering for unknown modes", () => {
    expect(sortTracks(tracks, "unknown").map((track) => track.id)).toEqual(["a", "b", "c"]);
  });
});
