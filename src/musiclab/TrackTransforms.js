// Pure track-list transformations used by MusicLab.
// No React, persistence, network, or audio dependencies.

export const TRACK_SORT_OPTIONS = Object.freeze([
  { id: "alpha", label: "A-Z", icon: "arrowUp" },
  { id: "artist", label: "ARTISTA", icon: "circle" },
  { id: "vibe", label: "VIBE", icon: "target" },
  { id: "plays", label: "PLAYS", icon: "play" },
  { id: "recent", label: "RECIENTE", icon: "timer" },
]);

const text = (value) => String(value ?? "");

export function sortTracks(tracks = [], sortId = "alpha") {
  const result = [...tracks];
  switch (sortId) {
    case "artist":
      return result.sort((a, b) => text(a.artist).localeCompare(text(b.artist)));
    case "vibe":
      return result.sort((a, b) => {
        const vibeOrder = text(a.tag ?? a.vibe).localeCompare(text(b.tag ?? b.vibe));
        return vibeOrder || text(a.title).localeCompare(text(b.title));
      });
    case "plays":
      return result.sort((a, b) => (b.play_count ?? 0) - (a.play_count ?? 0));
    case "recent":
      return result.sort((a, b) => {
        const dateA = new Date(a.last_played ?? a.added_at ?? 0).getTime();
        const dateB = new Date(b.last_played ?? b.added_at ?? 0).getTime();
        return dateB - dateA;
      });
    case "alpha":
    default:
      return result.sort((a, b) => text(a.title).localeCompare(text(b.title)));
  }
}
