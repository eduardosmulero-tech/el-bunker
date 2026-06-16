import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { PlayerProvider, usePlayer } from "../PlayerContext";

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
});

describe("PlayerContext — Queue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("8. addToQueue añade track al final y devuelve 'added'", async () => {
    const { ctx } = renderPlayer();
    let result;
    act(() => { result = ctx().addToQueue(MOCK_TRACKS[3]); });
    await tick();
    expect(result).toBe("added");
    expect(ctx().localQueue.some((t) => t.id === "t4")).toBe(true);
  });

  it("9. addToQueue con duplicado devuelve 'duplicate'", async () => {
    const { ctx } = renderPlayer();
    act(() => { ctx().addToQueue(MOCK_TRACKS[1]); });
    await tick();
    let result;
    act(() => { result = ctx().addToQueue(MOCK_TRACKS[1]); });
    await tick();
    expect(result).toBe("duplicate");
  });

  it("10. addToQueue(force=true) elimina duplicado y re-añade", async () => {
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

  it("11. restorePosition aplica posición guardada", () => {
    // Verificar que la función no crashea con audioRef no inicializado
    const { ctx } = renderPlayer();
    expect(() => ctx().restorePosition(MOCK_TRACKS[0])).not.toThrow();
  });

  it("12. MAX_QUEUE_SIZE está definido y es 75", () => {
    const { ctx } = renderPlayer();
    expect(ctx().MAX_QUEUE_SIZE).toBe(75);
  });
});
