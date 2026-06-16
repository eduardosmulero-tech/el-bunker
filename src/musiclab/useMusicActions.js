// EL BUNKER - useMusicActions.js
// Hook de mutaciones de DB para MusicLab — S111 FIX · S115-D3 WorkerClient
// PATRÓN: Worker API (D1) primero → patchDb en success → throw en failure.
import { useVault } from "../core/VaultContext";
import { dropSent } from "../core/StatsEngine";
import { workerClient } from "../core/WorkerClient";

export function useMusicActions() {
  // S115-D3: jwtToken ya no se necesita — WorkerClient maneja auth
  const { patchDb, user } = useVault();
  const userId = user?.id ?? null;

  // ─── onAddTrack — POST /api/tracks ────────────────────────
  const onAddTrack = async (trackData) => {
    if (!workerClient.hasToken()) {
      console.warn("[Búnker] onAddTrack sin jwtToken — local-only");
      await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, tracks: [...(prev.music_lab?.tracks ?? []), trackData] } }));
      return trackData;
    }
    try {
      const created = await workerClient.post(`/api/tracks`, {
        id: trackData.id || crypto.randomUUID(),
        title: trackData.title,
        artist: trackData.artist ?? "",
        note: trackData.note ?? "",
        tag_id: trackData.tag ?? trackData.vibe ?? trackData.tag_id ?? null,
        added_by: userId,
        created_at: trackData.added_at || new Date().toISOString(),
      });
      // CRÍTICO: D1 devuelve tag_id, frontend lee t.tag. Merge para que `tag` siempre exista.
      const normalized = {
        ...trackData,
        ...created,
        tag: created.tag_id ?? trackData.tag ?? trackData.vibe,
      };
      await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, tracks: [...(prev.music_lab?.tracks ?? []), normalized] } }));
      return normalized;
    } catch (err) {
      console.warn("[Búnker] addTrack falló:", err);
      throw err;
    }
  };

  // ─── onDeleteTrack — DELETE /api/tracks/:id (soft delete) ──
  const onDeleteTrack = async (trackId) => {
    if (!workerClient.hasToken()) {
      console.warn("[Búnker] onDeleteTrack sin jwtToken — local-only");
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          tracks: (prev.music_lab?.tracks ?? []).map((t) =>
            t.id === trackId
              ? { ...t, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }
              : t
          ),
        },
      }));
      return { ok: true, id: trackId };
    }      try {
      await workerClient.del(`/api/tracks/${trackId}`);
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          tracks: (prev.music_lab?.tracks ?? []).map((t) =>
            t.id === trackId
              ? { ...t, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }
              : t
          ),
        },
      }));
      return { ok: true, id: trackId };
    } catch (err) {
      console.warn("[Búnker] deleteTrack falló:", err);
      throw err;
    }
  };

  // ─── onEditTrack — PATCH /api/tracks/:id (S111 FIX + S115-D3) ────
  const onEditTrack = async (updatedTrack) => {
    if (!workerClient.hasToken()) {
      console.warn("[Búnker] onEditTrack sin jwtToken — local-only");
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          tracks: (prev.music_lab?.tracks ?? []).map((t) =>
            t.id === updatedTrack.id ? { ...t, ...updatedTrack } : t
          ),
        },
      }));
      return updatedTrack;
    }
    try {
      const body = { ...updatedTrack };
      if (body.tag !== undefined || body.vibe !== undefined) {
        body.tag_id = body.tag || body.vibe || null;
        delete body.tag;
        delete body.vibe;
      }
      const ALLOWED = new Set([
        "era_id", "title", "artist", "tag_id", "r2_key", "format", "note",
        "duration", "thumbnail", "drive_file_id", "color", "play_count", "last_played",
      ]);
      for (const k of Object.keys(body)) {
        if (!ALLOWED.has(k)) delete body[k];
      }
      await workerClient.patch(`/api/tracks/${updatedTrack.id}`, body);
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          tracks: (prev.music_lab?.tracks ?? []).map((t) =>
            t.id === updatedTrack.id
              ? { ...t, ...updatedTrack, updated_at: new Date().toISOString() }
              : t
          ),
        },
      }));
      return updatedTrack;
    } catch (err) {
      console.warn("[Búnker] editTrack falló:", err);
      throw err;
    }
  };

  // ─── onAddDrop — POST /api/drops ───────────────────────────
  const onAddDrop = async (dropData) => {
    if (!workerClient.hasToken()) {
      console.warn("[Búnker] onAddDrop sin jwtToken — local-only");
      await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, drops: [...(prev.music_lab?.drops ?? []), dropData] } }));
    } else {
      try {
        const created = await workerClient.post(`/api/drops`, {
          id: dropData.id || crypto.randomUUID(),
          track_id: dropData.track_id,
          from_user: dropData.from || userId,
          to_user: dropData.to,
          memory: dropData.memory ?? "",
          mood: dropData.mood ?? "",
          era_id: dropData.era_id || null,
          drop_date: dropData.drop_date || new Date().toISOString(),
          created_at: dropData.created_at || new Date().toISOString(),
        });
        const mapped = {
          ...created,
          from: created.from_user || created.from,
          to: created.to_user || created.to,
        };
        await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, drops: [...(prev.music_lab?.drops ?? []), mapped] } }));
      } catch (err) {
        console.warn("[Búnker] addDrop falló:", err);
        throw err;
      }
    }
    const toUser = dropData.to === "david" ? "david" : "edu";
    dropSent(dropData.track_id, toUser);
  };

  // ─── onMarkDropSeen — PATCH /api/drops/:id ──
  const onMarkDropSeen = async (dropId) => {
    if (!workerClient.hasToken()) {
      console.warn("[Búnker] onMarkDropSeen sin jwtToken — local-only");
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          drops: (prev.music_lab?.drops ?? []).map((d) =>
            d.id === dropId ? { ...d, seen: true } : d
          ),
        },
      }));
      return { ok: true, id: dropId };
    }
    try {
      await workerClient.patch(`/api/drops/${dropId}`, { seen: 1 });
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          drops: (prev.music_lab?.drops ?? []).map((d) =>
            d.id === dropId ? { ...d, seen: true } : d
          ),
        },
      }));
      return { ok: true, id: dropId };
    } catch (err) {
      console.warn("[Búnker] markDropSeen falló:", err);
      throw err;
    }
  };

  return { onAddTrack, onDeleteTrack, onEditTrack, onAddDrop, onMarkDropSeen };
}