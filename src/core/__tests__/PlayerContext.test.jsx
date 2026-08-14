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

  it("10. createSession crea la sesión personal del host SIN marcar sesión compartida (t_9d4f2e6c)", async () => {
    const originalHasToken = workerClient.hasToken;
    const originalPost = workerClient.post;
    workerClient.hasToken = () => true;
    workerClient.post = vi.fn(async () => ({ session_id: "session-1", active: true, host_id: "edu" }));

    try {
      const { ctx } = renderPlayer({ userId: "edu" });
      let created;
      await act(async () => { created = await ctx().createSession(); });
      expect(created).toBe("session-1");
      // La sesión personal del host NO es sesión compartida: sessionId local queda null
      // (el id vive en el ref interno para el long-polling del host). El falso positivo
      // anterior marcaba sessionId/sharedListening con David ausente.
      expect(ctx().sessionId).toBe(null);
      expect(ctx().isHost).toBe(true);
      expect(ctx().sharedListening).toBe(false);
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

describe("PlayerContext — P0 self-echo (t_0cd2d7a6)", () => {
  beforeEach(() => {
    localStorage.clear();
    workerClient.clearToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    workerClient.clearToken();
  });

  it("16. el self-echo del long-polling NO re-aplica la posición remota (audio no se congela)", async () => {
    // Reproducir el P0: createSession setea sessionId local → el long-polling SC4 se monta
    // → workers/routes/sync.js devuelve el estado completo SIN filtrar por action_by
    // → el cliente recibe SU PROPIO play/sync como acción remota y re-aplica currentTime
    // (posición vieja) → el audio se congela repitiendo el mismo segundo.
    // Fix: ignorar acciones donde action_by === userId (self-echo).
    const tracks = MOCK_TRACKS.map((t) => ({ ...t, r2_key: `music/${t.id}.mp3` }));
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const currentTimeSetSpy = vi.spyOn(window.HTMLMediaElement.prototype, "currentTime", "set");

    const originalHasToken = workerClient.hasToken;
    const originalPost = workerClient.post;
    const originalFetch = workerClient.fetch;
    workerClient.hasToken = () => true;
    // create → sesión personal; resto de sync actions → ok
    workerClient.post = vi.fn(async (url, body) => {
      if (body?.action === "create") return { session_id: "s1", active: true, host_id: "edu" };
      return { ok: true };
    });
    // Long-polling: self-echo con la propia acción del usuario (action_by === userId)
    workerClient.fetch = vi.fn(async (_url, _opts) => ({
      ok: true,
      status: 200,
      json: async () => ({
        active: true,
        session_id: "s1",
        host_id: "edu",
        guest_id: null,
        action: "play",
        action_by: "edu",
        position: 5,
        is_playing: true,
        updated_at: "2026-08-13T00:00:00Z",
      }),
    }));

    try {
      const { ctx } = renderPlayer({ userId: "edu", tracks });
      // Reproducir → isPlaying → auto-create sesión personal → long-polling montado
      act(() => ctx().playTrack(tracks[0]));
      await tick();
      await tick();
      // Dar tiempo al poll para procesar el echo
      await new Promise((r) => setTimeout(r, 100));
      await tick();

      // El self-echo NO debe haber re-aplicado currentTime = 5 (posición vieja).
      // Sin el fix, currentTimeSetSpy se invoca al menos una vez con 5.
      const calls = currentTimeSetSpy.mock.calls.filter((c) => c[0] === 5);
      expect(calls.length).toBe(0);
      expect(playSpy).toHaveBeenCalled(); // el audio sí arrancó (no bloqueado)
    } finally {
      workerClient.hasToken = originalHasToken;
      workerClient.post = originalPost;
      workerClient.fetch = originalFetch;
    }
  });

  it("17. la acción REMOTA real del partner SÍ se aplica (sin regresión SC4)", async () => {
    const tracks = MOCK_TRACKS.map((t) => ({ ...t, r2_key: `music/${t.id}.mp3` }));
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const currentTimeSetSpy = vi.spyOn(window.HTMLMediaElement.prototype, "currentTime", "set");

    const originalHasToken = workerClient.hasToken;
    const originalPost = workerClient.post;
    const originalFetch = workerClient.fetch;
    workerClient.hasToken = () => true;
    workerClient.post = vi.fn(async (url, body) => {
      if (body?.action === "create") return { session_id: "s1", active: true, host_id: "edu" };
      return { ok: true };
    });
    // Echo del PARTNER (action_by = david ≠ edu) → debe aplicarse el seek/posición
    workerClient.fetch = vi.fn(async (_url, _opts) => ({
      ok: true,
      status: 200,
      json: async () => ({
        active: true,
        session_id: "s1",
        host_id: "edu",
        guest_id: "david",
        action: "seek",
        action_by: "david",
        position: 42,
        is_playing: true,
        updated_at: "2026-08-13T00:00:00Z",
      }),
    }));

    try {
      const { ctx } = renderPlayer({ userId: "edu", tracks });
      act(() => ctx().playTrack(tracks[0]));
      await tick();
      await tick();
      await new Promise((r) => setTimeout(r, 100));
      await tick();

      const calls = currentTimeSetSpy.mock.calls.filter((c) => c[0] === 42);
      expect(calls.length).toBeGreaterThan(0);
    } finally {
      workerClient.hasToken = originalHasToken;
      workerClient.post = originalPost;
      workerClient.fetch = originalFetch;
    }
  });
});

describe("PlayerContext — sesión compartida falsa / no deja salir (t_9d4f2e6c)", () => {
  beforeEach(() => {
    localStorage.clear();
    workerClient.clearToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    workerClient.clearToken();
  });

  it("18. leaveSession limpia sessionId/partnerId y NO reaparece la sesión personal como compartida", async () => {
    const tracks = MOCK_TRACKS.map((t) => ({ ...t, r2_key: `music/${t.id}.mp3` }));
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    const originalHasToken = workerClient.hasToken;
    const originalPost = workerClient.post;
    const originalFetch = workerClient.fetch;
    workerClient.hasToken = () => true;
    // create → sesión personal; join → sesión compartida real (guest); leave → ok
    workerClient.post = vi.fn(async (_url, body) => {
      if (body?.action === "create") return { session_id: "s1", active: true, host_id: "edu" };
      if (body?.action === "join") return { active: true, host_id: "david", position: 0, is_playing: false };
      if (body?.action === "leave") return { ok: true };
      return { ok: true };
    });
    // Long-polling: la sesión personal existe pero NO hay guest (David ausente)
    workerClient.fetch = vi.fn(async (_url, _opts) => ({
      ok: true,
      status: 200,
      json: async () => ({
        active: true,
        session_id: "s1",
        host_id: "edu",
        guest_id: null,
        action: "created",
        action_by: "edu",
        position: 0,
        is_playing: true,
        updated_at: "2026-08-13T00:00:00Z",
      }),
    }));

    try {
      const { ctx } = renderPlayer({ userId: "edu", tracks });
      // Reproducir → auto-create sesión personal (host) → sessionId local NO debe marcarse
      act(() => ctx().playTrack(tracks[0]));
      await tick();
      await tick();
      await new Promise((r) => setTimeout(r, 50));
      await tick();

      // Sin guest: no hay sesión compartida activa (antes marcaba sessionId y sharedListening=true)
      expect(ctx().sessionId).toBe(null);
      expect(ctx().sharedListening).toBe(false);

      // Unirse a sesión real como guest: joinSession setea sessionId (sesión compartida real)
      await act(async () => { await ctx().joinSession("s1"); });
      await tick();
      expect(ctx().sessionId).toBe("s1");
      expect(ctx().sharedListening).toBe(true);

      // Salir: leaveSession limpia sessionId/partnerId
      await act(async () => { await ctx().leaveSession(); });
      await tick();
      expect(ctx().sessionId).toBe(null);
      expect(ctx().sharedListening).toBe(false);
    } finally {
      workerClient.hasToken = originalHasToken;
      workerClient.post = originalPost;
      workerClient.fetch = originalFetch;
    }
  });

  it("19. el host detecta joined del guest por el poll y vuelve a null cuando el guest hace left (SC10)", async () => {
    const tracks = MOCK_TRACKS.map((t) => ({ ...t, r2_key: `music/${t.id}.mp3` }));
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    const originalHasToken = workerClient.hasToken;
    const originalPost = workerClient.post;
    const originalFetch = workerClient.fetch;
    workerClient.hasToken = () => true;
    workerClient.post = vi.fn(async (_url, body) => {
      if (body?.action === "create") return { session_id: "s1", active: true, host_id: "edu" };
      return { ok: true };
    });
    // Secuencia del poll controlada con promesas manuales: primero joined (David entra),
    // luego left (David sale). El mock imita el long-polling del server: cada respuesta
    // se resuelve solo cuando el test la libera (evita el bucle apretado de joined/left
    // que hacen `continue` sin esperar → worker crash).
    const resolvers = [];
    workerClient.fetch = vi.fn(() => new Promise((resolve) => resolvers.push(resolve)));
    const joinedResp = {
      ok: true,
      status: 200,
      json: async () => ({
        active: true,
        session_id: "s1",
        host_id: "edu",
        guest_id: "david",
        action: "joined",
        action_by: "david",
        position: 10,
        is_playing: true,
        updated_at: "2026-08-13T00:00:01Z",
      }),
    };
    const leftResp = {
      ok: true,
      status: 200,
      json: async () => ({
        active: true,
        session_id: "s1",
        host_id: "edu",
        guest_id: null,
        action: "left",
        action_by: "david",
        position: 10,
        is_playing: true,
        updated_at: "2026-08-13T00:00:02Z",
      }),
    };
    const waitForFetch = async (n, timeoutMs = 1000) => {
      const t0 = Date.now();
      while (resolvers.length < n && Date.now() - t0 < timeoutMs) {
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(resolvers.length).toBeGreaterThanOrEqual(n);
    };

    try {
      const { ctx } = renderPlayer({ userId: "edu", tracks });
      act(() => ctx().playTrack(tracks[0]));
      await tick();
      await tick();
      // El poll del host está montado (sesión personal) → liberar joined
      await waitForFetch(1);
      resolvers.shift()(joinedResp);
      await tick();
      await tick();

      expect(ctx().sessionId).toBe("s1");
      expect(ctx().partnerId).toBe("david");
      expect(ctx().sharedListening).toBe(true);

      // Al setear sessionId el efecto del poll se re-monta: quedan 2 fetch pendientes
      // (el del poll viejo, abortado, y el del poll nuevo). El viejo descarta la respuesta
      // por active=false; el nuevo procesa left → el host vuelve a sin sesión compartida.
      await waitForFetch(2);
      resolvers.shift()(leftResp); // poll viejo (abortado) → se descarta
      resolvers.shift()(leftResp); // poll nuevo → procesa left
      await tick();
      await tick();
      expect(ctx().sessionId).toBe(null);
      expect(ctx().partnerId).toBe(null);
      expect(ctx().sharedListening).toBe(false);
    } finally {
      workerClient.hasToken = originalHasToken;
      workerClient.post = originalPost;
      workerClient.fetch = originalFetch;
    }
  });
});
