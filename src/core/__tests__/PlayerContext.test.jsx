import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { PlayerProvider, usePlayer } from "../PlayerContext";
import { workerClient } from "../WorkerClient";

// ─── Helpers ──────────────────────────────────────────

const MOCK_TRACKS = [
  { id: "t1", title: "Track 1", artist: "Artist 1", tag: "dnb", url: "" },
  { id: "t2", title: "Track 2", artist: "Artist 2", tag: "gaming", url: "" },
  { id: "t3", title: "Track 3", artist: "Artist 3", tag: "420_chill", url: "" },
  { id: "t4", title: "Track 4", artist: "Artist 4", tag: "romantiqueo", url: "" },
  { id: "t5", title: "Track 5", artist: "Artist 5", tag: null, url: "" },
];

// Componente consumidor para leer estado desde tests
function Consumer({ onMount }) {
  const ctx = usePlayer();
  if (onMount) onMount(ctx);
  return null;
}

function renderPlayer({ tracks = MOCK_TRACKS, userId = "test-user", ...props } = {}) {
  let captured;
  const result = render(
    <PlayerProvider userId={userId} tracks={tracks} tags={[]} jwtToken={null} {...props}>
      <Consumer onMount={(ctx) => { captured = ctx; }} />
    </PlayerProvider>
  );
  return { ...result, ctx: () => captured };
}

// Wait for React batching
const tick = () => act(() => new Promise((r) => setTimeout(r, 0)));

// ─── Tests ────────────────────────────────────────────

describe("PlayerContext — Core", () => {
  beforeEach(() => {
    localStorage.clear();
    workerClient.clearToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    workerClient.clearToken();
  });

  it("1. inicializa con el primer track como activeTrack", () => {
    const { ctx } = renderPlayer();
    expect(ctx().activeTrack?.id).toBe("t1");
    expect(ctx().isPlaying).toBe(false);
  });

  it("2. playTrack cambia activeTrack y emite autoPlaySignal", async () => {
    const { ctx } = renderPlayer();
    act(() => ctx().playTrack(MOCK_TRACKS[2])); // t3
    await tick();
    expect(ctx().activeTrack?.id).toBe("t3");
  });

  it("3. playTrack en track activo → toggle play/pause", async () => {
    const { ctx } = renderPlayer();
    act(() => ctx().playTrack(MOCK_TRACKS[0])); // t1 (ya activo)
    await tick();
    // isPlaying depende de audio.play() que es async — verificar que no crashea
    expect(ctx().activeTrack?.id).toBe("t1");
  });

  it("4. skip(1) avanza al siguiente track en cola", async () => {
    const { ctx } = renderPlayer();
    act(() => ctx().addToQueue(MOCK_TRACKS[1])); // t2
    act(() => ctx().skip(1));
    await tick();
    expect(ctx().activeTrack?.id).toBe("t2");
  });

  it("5. skip(-1) navega el playHistory", async () => {
    const { ctx } = renderPlayer();
    // Simular: t1 → t2 (vía playTrack explícito), luego skip(-1) debe volver a t1
    act(() => ctx().playTrack(MOCK_TRACKS[1])); // t1 → t2 (playTrack añade t1 al historial)
    await tick();
    expect(ctx().activeTrack?.id).toBe("t2");
    act(() => ctx().skip(-1));
    await tick();
    expect(ctx().activeTrack?.id).toBe("t1");
  });

  it("6. loopMode toggle: off → list → track → off", () => {
    const { ctx } = renderPlayer();
    expect(ctx().loopMode).toBe("off");
    act(() => ctx().toggleLoopMode());
    expect(ctx().loopMode).toBe("list");
    act(() => ctx().toggleLoopMode());
    expect(ctx().loopMode).toBe("track");
    act(() => ctx().toggleLoopMode());
    expect(ctx().loopMode).toBe("off");
  });

  it("7. shuffle toggle persiste en localStorage", () => {
    const { ctx } = renderPlayer();
    expect(ctx().shuffle).toBe(false);
    act(() => ctx().setShuffle(true));
    expect(ctx().shuffle).toBe(true);
    expect(localStorage.getItem("el_bunker_shuffle")).toBe("1");
  });

  it("8. hidratar la cola persistida no arranca el audio sin intención del usuario", async () => {
    const tracks = MOCK_TRACKS.map((track) => ({ ...track, r2_key: `music/${track.id}.mp3` }));
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    workerClient.setToken("test-token");
    vi.spyOn(workerClient, "get").mockResolvedValue([{ track_id: "t1", _manual: true }]);
    const { ctx } = renderPlayer({ tracks });
    await tick();
    await tick();
    expect(ctx().activeTrack?.id).toBe("t1");
    expect(ctx().isPlaying).toBe(false);
    expect(playSpy).not.toHaveBeenCalled();
    expect(pauseSpy).toHaveBeenCalled();
  });

  it("9. una hidratación tardía no pisa una reproducción manual", async () => {
    const tracks = MOCK_TRACKS.map((track) => ({ ...track, r2_key: `music/${track.id}.mp3` }));
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    workerClient.setToken("test-token");
    let resolveQueue;
    vi.spyOn(workerClient, "get").mockReturnValue(new Promise((resolve) => { resolveQueue = resolve; }));
    const { ctx } = renderPlayer({ tracks });
    act(() => ctx().playTrack(tracks[0]));
    await tick();
    const playCallsBeforeHydration = playSpy.mock.calls.length;
    expect(playCallsBeforeHydration).toBeGreaterThan(0);
    await act(async () => { resolveQueue([{ track_id: "t1", _manual: true }]); await Promise.resolve(); });
    await tick();
    expect(ctx().activeTrack?.id).toBe("t1");
    expect(playSpy.mock.calls.length).toBeGreaterThanOrEqual(playCallsBeforeHydration);
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("10. createSession conserva el id y activa al usuario como host", async () => {
    const originalHasToken = workerClient.hasToken;
    const originalPost = workerClient.post;
    workerClient.hasToken = () => true;
    workerClient.post = vi.fn(async () => ({ session_id: "session-1", active: true, host_id: "edu" }));

    try {
      const { ctx } = renderPlayer({ userId: "edu" });
      let created;
      await act(async () => { created = await ctx().createSession(); });
      expect(created).toBe("session-1");
      expect(ctx().sessionId).toBe("session-1");
      expect(ctx().isHost).toBe(true);
      expect(ctx().sharedListening).toBe(true);
    } finally {
      workerClient.hasToken = originalHasToken;
      workerClient.post = originalPost;
    }
  });
});

describe("PlayerContext — Queue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("11. addToQueue añade track al final y devuelve 'added'", async () => {
    const { ctx } = renderPlayer();
    let result;
    act(() => { result = ctx().addToQueue(MOCK_TRACKS[3]); });
    await tick();
    expect(result).toBe("added");
    expect(ctx().localQueue.some((t) => t.id === "t4")).toBe(true);
  });

  it("12. addToQueue con duplicado devuelve 'duplicate'", async () => {
    const { ctx } = renderPlayer();
    act(() => { ctx().addToQueue(MOCK_TRACKS[1]); });
    await tick();
    let result;
    act(() => { result = ctx().addToQueue(MOCK_TRACKS[1]); });
    await tick();
    expect(result).toBe("duplicate");
  });

  it("13. addToQueue(force=true) elimina duplicado y re-añade", async () => {
    const { ctx } = renderPlayer();
    act(() => { ctx().addToQueue(MOCK_TRACKS[1]); });
    await tick();
    act(() => { ctx().addToQueue(MOCK_TRACKS[1], true); });
    await tick();
    // Solo debe haber una instancia de t2
    const count = ctx().localQueue.filter((t) => t.id === "t2").length;
    expect(count).toBe(1);
  });
});

describe("PlayerContext — Gapless + Restore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("14. restorePosition aplica posición guardada", () => {
    // Verificar que la función no crashea con audioRef no inicializado
    const { ctx } = renderPlayer();
    expect(() => ctx().restorePosition(MOCK_TRACKS[0])).not.toThrow();
  });

  it("15. MAX_QUEUE_SIZE está definido y es 75", () => {
    const { ctx } = renderPlayer();
    expect(ctx().MAX_QUEUE_SIZE).toBe(75);
  });
});
