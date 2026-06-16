// ============================================================
//  EL BÚNKER — PageWrappers.jsx (S116-L2)
//  Wrappers para las 3 pestañas: VAULT · MUSIC LAB · CAPSULES
// ============================================================
import { lazy, Suspense } from "react";

import { useVault } from "../core/VaultContext";
import { useMusicActions } from "../musiclab/useMusicActions";
import { usePlayer } from "../core/PlayerContext";
import Vault from "../vault/Vault";
import ChunkErrorBoundary from "../core/ChunkErrorBoundary";
import { workerClient } from "../core/WorkerClient";
import { PageLoader } from "./BootScreen";

// Code splitting: lazy-load los dos módulos más pesados
const MusicLab = lazy(() => import("../musiclab/MusicLab"));
const Capsules = lazy(() => import("../capsules/Capsules"));

// ─── VAULT PAGE ────────────────────────────────────────────
export const VaultPage = () => {
  const { db, patchDb } = useVault();
  return (
    <Vault
      db={db}
      onAddEra={async (_created) => {
        if (!workerClient.hasToken()) return;
        try {
          const freshEras = await workerClient.get("/api/eras");
          patchDb((prev) => ({ ...prev, eras: freshEras }));
        } catch (e) {
          console.warn("[App] onAddEra refresh failed:", e);
        }
      }}
      onOpenEra={(era) => {
        console.log("[App] Opening era:", era.name);
      }}
    />
  );
};

// ─── MUSIC LAB PAGE ────────────────────────────────────────
export const MusicPage = () => {
  const { db, user, setMasterVolume, patchDb } = useVault();
  const { onAddTrack, onDeleteTrack, onEditTrack, onAddDrop, onMarkDropSeen } = useMusicActions();

  const handleAddTag = async (tagData) => {
    const newTag = {
      ...tagData,
      id: crypto.randomUUID(),
      created_by: user?.id ?? "user",
      created_at: new Date().toISOString(),
    };
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tags: [...(prev.music_lab?.tags ?? []), newTag],
      },
    }));
    if (workerClient.hasToken()) {
      try { await workerClient.post("/api/tags", { label: tagData.label, icon: tagData.icon, color: tagData.color, namespace: tagData.namespace || "music", id: newTag.id }); }
      catch (e) { console.warn("[App] tag D1 sync (create) failed:", e); }
    }
  };

  const handleUpdateTag = async (tagId, updates) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tags: (prev.music_lab?.tags ?? []).map((t) =>
          t.id === tagId ? { ...t, ...updates } : t
        ),
      },
    }));
    if (workerClient.hasToken()) {
      try { await workerClient.patch(`/api/tags/${tagId}`, updates); }
      catch (e) { console.warn("[App] tag D1 sync (update) failed:", e); }
    }
  };

  const handleDeleteTag = async (tagId) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tags: (prev.music_lab?.tags ?? []).filter((t) => t.id !== tagId),
      },
    }));
    if (workerClient.hasToken()) {
      try { await workerClient.del(`/api/tags/${tagId}`); }
      catch (e) { console.warn("[App] tag D1 sync (delete) failed:", e); }
    }
  };

  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <MusicLab
          db={db}
          userId={user?.id ?? null}
          onAddTrack={onAddTrack}
          onAddDrop={onAddDrop}
          onDeleteTrack={onDeleteTrack}
          onEditTrack={onEditTrack}
          onMasterVolumeChange={setMasterVolume}
          onMarkDropSeen={onMarkDropSeen}
          patchDb={patchDb}
          onAddTag={handleAddTag}
          onUpdateTag={handleUpdateTag}
          onDeleteTag={handleDeleteTag}
        />
      </Suspense>
    </ChunkErrorBoundary>
  );
};

// ─── CAPSULES PAGE ─────────────────────────────────────────
export const CapsulesPage = () => {
  const { db, user, masterVolume, setMasterVolume } = useVault();
  const { activeTrack } = usePlayer();
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Capsules
          db={db}
          userId={user?.id ?? null}
          activeTrack={activeTrack}
          masterVolume={masterVolume}
          onVolumeChange={setMasterVolume}
        />
      </Suspense>
    </ChunkErrorBoundary>
  );
};
