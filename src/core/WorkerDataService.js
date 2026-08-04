// ============================================================
//  EL BÚNKER — WorkerDataService.js
//  D1/R2 read boundary: fetch and normalize the Vault database.
//  No React state, auth orchestration, or UI dependencies.
// ============================================================

const safeParse = (value) => {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
};

const rejectWithLabel = (label) => (error) => (
  Promise.reject(`${label}: ${error.message}`)
);

export async function buildDbFromWorker(worker, defaultAdventureDate) {
  if (!worker?.hasToken?.()) return null;

  try {
    const [entries, eras, tracks, tags, playlists, drops, files] = await Promise.all([
      worker.get("/api/entries").catch(rejectWithLabel("entries")),
      worker.get("/api/eras").catch(rejectWithLabel("eras")),
      worker.get("/api/tracks").catch(rejectWithLabel("tracks")),
      worker.get("/api/tags").catch(rejectWithLabel("tags")),
      worker.get("/api/playlists").catch(rejectWithLabel("playlists")),
      worker.get("/api/drops").catch(rejectWithLabel("drops")),
      worker.get("/api/files").catch((error) => {
        console.warn("[Búnker] /api/files failed (non-fatal):", error);
        return [];
      }),
    ]);
    const appConfig = await worker.get("/api/config").catch(() => null);
    const realAdventureDate = appConfig?.adventures_start_date || defaultAdventureDate;
    const parsedEntries = (entries || []).map((entry) => ({
      ...entry,
      content: safeParse(entry.content),
      from: entry.from_user || entry.from,
      to: entry.to_user || entry.to,
    }));

    return {
      entries: parsedEntries,
      eras: eras || [],
      music_lab: {
        tracks: tracks || [],
        tags: tags || [],
        playlists: playlists || [],
        drops: (drops || []).map((drop) => ({
          ...drop,
          from: drop.from_user || drop.from,
          to: drop.to_user || drop.to,
        })),
      },
      files: files || [],
      libraries: [],
      schema_version: "5.0.0",
      heartbeat: new Date().toISOString(),
      adventures_start_date: realAdventureDate,
    };
  } catch (error) {
    console.warn("[Búnker] Worker DB build failed:", error);
    return null;
  }
}

export { safeParse };
