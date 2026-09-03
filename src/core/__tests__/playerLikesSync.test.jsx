// @vitest-environment jsdom
// t_like-sync: REGRESIÓN del bug push-on-mount del sync de likes.
//
// El bug: el efecto de push tenía deps [likedTrackIds, userId] (luego +jwtToken)
// que disparan en mount → agendaba un PUT /api/likes con el set VIEJO de
// localStorage a los 2s. Si el pull tardaba más (o fallaba), D1 quedaba
// sobreescrito con datos rancios — pérdida silenciosa de likes hechos en otro
// dispositivo. El guard correcto (mismo patrón que el save de cola):
//   1. el push SOLO se arma cuando el pull ya aterrizó (likesSyncedRef)
//   2. y SOLO cuando hay cambios locales reales (likesDirtyRef)
//   3. si el usuario toggló antes del pull, el merge del pull NO pisa el estado
//      local (el push de esos cambios es la verdad más reciente)
//   4. pull fallido TAMBIÉN marca synced (si no, un error de red desactivaría
//      el push para siempre)
//
// Timers: fake pero SOLO setTimeout/clearTimeout (toFake) — el scheduler de
// React usa MessageChannel/microtasks y NO debe congelarse.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { PlayerProvider, usePlayer } from "../PlayerContext";
import { workerClient } from "../WorkerClient";

const MOCK_TRACKS = [
  { id: "t1", title: "Track 1", artist: "Artist 1", tag: "dnb", url: "" },
  { id: "t2", title: "Track 2", artist: "Artist 2", tag: "gaming", url: "" },
];

function Consumer({ onMount }) {
  const ctx = usePlayer();
  if (onMount) onMount(ctx);
  return null;
}

function renderPlayer({ userId = "edu", jwtToken = "test-jwt", ...props } = {}) {
  let captured;
  render(
    <PlayerProvider userId={userId} tracks={MOCK_TRACKS} tags={[]} jwtToken={jwtToken} {...props}>
      <Consumer onMount={(ctx) => { captured = ctx; }} />
    </PlayerProvider>
  );
  return () => captured;
}

// Flush de microtasks sin depender de timers (bajo toFake, Promise sigue vivo)
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const advance = (ms) => act(async () => { vi.advanceTimersByTime(ms); });

// Llamadas PUT a /api/likes registradas por el mock de workerClient.fetch
const likesPuts = (fetchMock) =>
  fetchMock.mock.calls
    .filter(([url, opts]) => String(url).includes("/api/likes") && opts?.method === "PUT")
    .map(([, opts]) => JSON.parse(opts.body).liked_track_ids);

const likesGetCalls = (getSpy) =>
  getSpy.mock.calls.filter(([url]) => String(url).includes("/api/likes"));

beforeEach(() => {
  localStorage.clear();
  workerClient.clearToken();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
});

afterEach(() => {
  vi.restoreAllMocks();
  workerClient.clearToken();
  vi.useRealTimers();
  localStorage.clear();
});

describe("PlayerContext — likes sync: guard pull-antes-que-push (regresión push-on-mount)", () => {
  it("NUNCA pushea al montar, aunque el pull cambie likedTrackIds (set rancio de localStorage no viaja)", async () => {
    // Escenario exacto del bug: local rancio ["t1"], servidor ["srv-1"].
    // El merge del pull cambia el estado → el efecto de push se re-ejecuta —
    // pero sin dirty NO debe agendarse PUT alguno.
    localStorage.setItem("el_bunker_liked_edu", JSON.stringify(["t1"]));
    workerClient.setToken("test-token");
    const getSpy = vi.spyOn(workerClient, "get").mockImplementation((url) =>
      String(url).includes("/api/likes")
        ? Promise.resolve({ liked_track_ids: ["srv-1"] })
        : Promise.resolve([])
    );
    const fetchSpy = vi.spyOn(workerClient, "fetch").mockResolvedValue({ ok: true });

    const ctx = renderPlayer();
    await flush();
    expect(likesGetCalls(getSpy).length).toBe(1); // el pull sí ocurrió

    // El merge fue unión con el local: {"t1","srv-1"}
    expect(ctx().likedTrackIds.has("t1")).toBe(true);
    expect(ctx().likedTrackIds.has("srv-1")).toBe(true);

    await advance(2500); // más que el debounce de 2s
    expect(likesPuts(fetchSpy)).toEqual([]); // SIN toggle no hay PUT — jamás
  });

  it("toggle ANTES del pull: el pull no pisa el estado local y el PUT lleva solo la verdad local", async () => {
    workerClient.setToken("test-token");
    let resolveLikes;
    vi.spyOn(workerClient, "get").mockImplementation((url) =>
      String(url).includes("/api/likes")
        ? new Promise((resolve) => { resolveLikes = resolve; })
        : Promise.resolve([])
    );
    const fetchSpy = vi.spyOn(workerClient, "fetch").mockResolvedValue({ ok: true });

    const ctx = renderPlayer();
    await flush();

    // El usuario togea mientras el pull sigue en vuelo
    let nowLiked;
    act(() => { nowLiked = ctx().toggleTrackLike("t1"); });
    expect(nowLiked).toBe(true);

    // El pull aterriza con likes de otro dispositivo: NO deben fusionarse
    // (los cambios locales sin pushear son la verdad más reciente)
    await act(async () => { resolveLikes({ liked_track_ids: ["srv-1"] }); await Promise.resolve(); });
    await flush();
    expect(ctx().likedTrackIds.has("srv-1")).toBe(false);
    expect(ctx().likedTrackIds.has("t1")).toBe(true);

    await advance(2500);
    const puts = likesPuts(fetchSpy);
    expect(puts.length).toBe(1);
    expect(puts[0]).toEqual(["t1"]); // sin "srv-1": el push refleja el estado local real
  });

  it("toggle DESPUÉS del pull: el PUT lleva el set fusionado (el guard no rompe el sync normal)", async () => {
    workerClient.setToken("test-token");
    vi.spyOn(workerClient, "get").mockImplementation((url) =>
      String(url).includes("/api/likes")
        ? Promise.resolve({ liked_track_ids: ["srv-1"] })
        : Promise.resolve([])
    );
    const fetchSpy = vi.spyOn(workerClient, "fetch").mockResolvedValue({ ok: true });

    const ctx = renderPlayer();
    await flush();
    expect(ctx().likedTrackIds.has("srv-1")).toBe(true);

    act(() => { ctx().toggleTrackLike("t1"); });
    await advance(2500);

    const puts = likesPuts(fetchSpy);
    expect(puts.length).toBe(1);
    expect(puts[0]).toEqual(expect.arrayContaining(["srv-1", "t1"]));
  });

  it("pull FALLIDO también arma el guard: un error de red no desactiva el push para siempre", async () => {
    workerClient.setToken("test-token");
    vi.spyOn(workerClient, "get").mockImplementation((url) =>
      String(url).includes("/api/likes")
        ? Promise.reject(new Error("network down"))
        : Promise.resolve([])
    );
    const fetchSpy = vi.spyOn(workerClient, "fetch").mockResolvedValue({ ok: true });

    const ctx = renderPlayer();
    await flush();

    act(() => { ctx().toggleTrackLike("t1"); });
    await advance(2500);

    const puts = likesPuts(fetchSpy);
    expect(puts.length).toBe(1);
    expect(puts[0]).toEqual(["t1"]);
  });

  it("sin jwtToken no hay pull ni push (el token puede llegar después del mount)", async () => {
    // Regresión del guard añadido: el código original solo miraba hasToken(),
    // así que una sesión donde el JWT llega tras el montar nunca sincronizaba.
    workerClient.setToken("test-token"); // hasToken() true, jwtToken prop null
    const getSpy = vi.spyOn(workerClient, "get").mockResolvedValue([]);
    const fetchSpy = vi.spyOn(workerClient, "fetch").mockResolvedValue({ ok: true });

    const ctx = renderPlayer({ jwtToken: null });
    await flush();
    act(() => { ctx().toggleTrackLike("t1"); });
    await advance(2500);

    expect(likesGetCalls(getSpy)).toEqual([]);
    expect(likesPuts(fetchSpy)).toEqual([]);
    // El estado local (localStorage) sigue siendo la fuente inmediata
    expect(ctx().likedTrackIds.has("t1")).toBe(true);
    expect(JSON.parse(localStorage.getItem("el_bunker_liked_edu"))).toEqual(["t1"]);
  });
});
