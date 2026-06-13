// EL BUNKER - useMusicActions.js
// Hook de mutaciones de DB para MusicLab
import { useVault } from "../core/VaultContext";
import { dropSent } from "../core/StatsEngine";

export function useMusicActions() {
  const { patchDb } = useVault();

  const onAddTrack = async (trackData) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tracks: [...(prev.music_lab?.tracks ?? []), trackData],
      },
    }));
  };

  const onDeleteTrack = async (trackId) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tracks: (prev.music_lab?.tracks ?? []).filter((t) => t.id !== trackId),
      },
    }));
  };

  const onEditTrack = async (updatedTrack) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tracks: (prev.music_lab?.tracks ?? []).map((t) =>
          t.id === updatedTrack.id ? { ...t, ...updatedTrack } : t
        ),
      },
    }));
  };

  const onAddDrop = async (dropData) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        drops: [...(prev.music_lab?.drops ?? []), dropData],
      },
    }));
    // Emitir evento de drop al StatsEngine
    const toUser = dropData.to === "david" ? "david" : "edu";
    dropSent(dropData.track_id, toUser);
  };

  const onMarkDropSeen = async (dropId) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        drops: (prev.music_lab?.drops ?? []).map((d) =>
          d.id === dropId ? { ...d, seen: true } : d
        ),
      },
    }));
  };

  return { onAddTrack, onDeleteTrack, onEditTrack, onAddDrop, onMarkDropSeen };
}