// @vitest-environment jsdom
// S-bp-a11y: test del slider de seek del dock (WinampPlayer).
// Verifica el patrón ARIA heredado del reproductor grande:
//   - role="slider" + aria-valuemin/max/now/text
//   - teclado: ←/→ ±5s, Home → 0, End → duración - 0.5
//   - el teclado del slider NO dispara el skip global de track (ADR-009):
//     stopPropagation corta la burbuja antes de los listeners de window.
// WinampPlayer se aísla con un usePlayer mockeado: el audioRef es un fake
// <audio> de 60s con currentTime controlable (no depende del DOM del provider).
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WinampPlayer } from "../WinampPlayer.jsx";

// Mocks de framer-motion y lucide: mismos patrones que AudioVisualizer.test.jsx
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_target, element) => ({ children, ...props }) =>
      React.createElement(element, props, children),
  }),
  AnimatePresence: ({ children }) => children,
}));

vi.mock("lucide-react", () => ({
  Pause: () => React.createElement("span", { "data-icon": "pause" }),
  Play: () => React.createElement("span", { "data-icon": "play" }),
  ListPlus: () => React.createElement("span", { "data-icon": "list-plus" }),
}));

vi.mock("../../core/ui", () => ({
  Icon: ({ name, ...props }) => React.createElement("span", { ...props, "data-icon": name }),
  UserGlyph: (props) => React.createElement("span", { ...props, "data-glyph": props.glyph ?? "" }),
}));

// Fake <audio>: duration fija 60s, currentTime controlable que re-dispara
// timeupdate (igual que un elemento real) y clamp a [0, 60].
function makeFakeAudio() {
  const audio = document.createElement("audio");
  let current = 0;
  Object.defineProperty(audio, "duration", { configurable: true, get: () => 60 });
  Object.defineProperty(audio, "currentTime", {
    configurable: true,
    get: () => current,
    set: (v) => {
      current = Math.min(60, Math.max(0, v));
      audio.dispatchEvent(new Event("timeupdate"));
    },
  });
  audio.play = vi.fn(() => Promise.resolve());
  audio.pause = vi.fn();
  return audio;
}

const TRACKS = [
  { id: "t1", title: "Track 1", artist: "Artist 1", tag: "dnb", url: "" },
  { id: "t2", title: "Track 2", artist: "Artist 2", tag: "gaming", url: "" },
];

let fakeAudio;
let mocks;

// Aislamiento: WinampPlayer consume usePlayer; le damos un contexto controlado
vi.mock("../../core/PlayerContext.jsx", () => ({
  usePlayer: () => mocks.ctx,
  PlayerProvider: ({ children }) => children,
}));

beforeEach(() => {
  fakeAudio = makeFakeAudio();
  mocks = {
    ctx: {
      activeTrack: TRACKS[0],
      isPlaying: false,
      setIsPlaying: vi.fn(),
      localQueue: [],
      addToQueue: vi.fn(),
      loopMode: "off",
      toggleLoopMode: vi.fn(),
      shuffle: false,
      setShuffle: vi.fn(),
      setContextTracks: vi.fn(),
      autoPlaySignal: 0,
      syncStatus: "idle",
      audioRef: { current: fakeAudio },
      skip: vi.fn(),
      masterVolume: 80,
      setMasterVolume: vi.fn(),
      trackVibe: "dnb",
      vibrate: vi.fn(),
      softDeletedIds: new Set(),
      undoRemoveFromQueue: vi.fn(),
      castState: "unavailable",
      isCasting: false,
      startCasting: vi.fn(),
      stopCasting: vi.fn(),
      sessionId: null,
      partnerListening: false,
      partnerTrack: null,
      partnerName: null,
      partnerTrackVibe: null,
      userId: "edu",
      joinPendingSession: vi.fn(),
      leaveSession: vi.fn(),
      peekNextTrack: null,
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function renderDock() {
  return render(<WinampPlayer tracks={TRACKS} />);
}

const sliderDe = (view) => view.container.querySelector('[role="slider"][aria-label="Posición de reproducción"]');

// Cada keyDown que mueve el audio dispara timeupdate → re-render → el nodo
// del slider se REEMPLAZA. Disparar la tecla SIEMPRE sobre una consulta fresca.
const tecla = (view, key) => fireEvent.keyDown(sliderDe(view), { key });

async function dockConDuracion() {
  const view = renderDock();
  // WinampPlayer lee duration desde loadedmetadata (suscripción en mount)
  await act(async () => {
    fakeAudio.dispatchEvent(new Event("loadedmetadata"));
  });
  return view;
}

describe("WinampPlayer — slider de seek ARIA (S-bp-a11y)", () => {
  it("pinta role=slider con ARIA completo", async () => {
    const view = await dockConDuracion();
    const slider = await waitFor(() => {
      const el = sliderDe(view);
      expect(el).toBeTruthy();
      return el;
    });
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "60");
    expect(slider.tabIndex).toBe(0);
    expect(slider.getAttribute("aria-valuetext")).toMatch(/de 1:00$/);
  });

  it("flecha derecha avanza +5s y flecha izquierda retrocede", async () => {
    const view = await dockConDuracion();
    // Importante: el nodo del slider se reemplaza tras cada re-render (el set
    // de currentTime dispara timeupdate → setCurrentT). Re-consultar SIEMPRE
    // el nodo vivo antes del keyDown, nunca reusar una referencia vieja.
    await act(async () => { fakeAudio.currentTime = 10; });
    expect(sliderDe(view)).toBeTruthy();

    tecla(view, "ArrowRight");
    expect(fakeAudio.currentTime).toBeCloseTo(15, 5);

    tecla(view, "ArrowLeft");
    expect(fakeAudio.currentTime).toBeCloseTo(10, 5);
  });

  it("Home va a 0 y End a duración - 0.5", async () => {
    const view = await dockConDuracion();
    await act(async () => { fakeAudio.currentTime = 30; });

    tecla(view, "Home");
    expect(fakeAudio.currentTime).toBe(0);

    tecla(view, "End");
    expect(fakeAudio.currentTime).toBe(59.5);
  });

  it("el teclado del slider NO dispara el skip global (stopPropagation)", async () => {
    const skipGlobal = vi.fn();
    window.addEventListener("keydown", skipGlobal);
    try {
      const view = await dockConDuracion();
      await act(async () => { fakeAudio.currentTime = 10; });

      tecla(view, "ArrowRight");
      // El listener global de window NO debe haber visto el evento
      expect(skipGlobal).not.toHaveBeenCalled();
      expect(fakeAudio.currentTime).toBeCloseTo(15, 5);
    } finally {
      window.removeEventListener("keydown", skipGlobal);
    }
  });

  it("clamp: no pasa de la duración ni baja de 0", async () => {
    const view = await dockConDuracion();
    await act(async () => { fakeAudio.currentTime = 58; });

    tecla(view, "ArrowRight");
    expect(fakeAudio.currentTime).toBe(60); // clamp a duración

    tecla(view, "ArrowLeft");
    expect(fakeAudio.currentTime).toBe(55);
  });
});
