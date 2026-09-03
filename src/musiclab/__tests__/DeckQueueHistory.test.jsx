// @vitest-environment jsdom
// DeckQueueHistory: reorder de cola del deck (port fastpotify queue.rs).
// Regresión del fix de invariant canónica: el panel DEBE reordenar con
// reorderQueueByIds (la misma transformación que el drag&drop de MusicLab),
// nunca reconstruir la cola ad-hoc. Cubre:
//   - salida canónica: activo al head (Q1/Q8) y grupo reordenado detrás
//   - no-op protegido: vecinos de grupos distintos (manual/contexto) se
//     rechazan sin mutar estado ni emitir evento undo (mismo contrato que MusicLab)
//   - undo: evento `bunker_cola_reordered` con snapshot PREVIA al reorder
//   - límites: subir el primero / bajar el último van deshabilitados
// Aislamiento: mismo harness que WinampPlayerSeek.test.jsx (usePlayer mockeado).
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeckQueueHistory } from "../DeckQueueHistory.jsx";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_target, element) => ({ children, ...props }) =>
      React.createElement(element, props, children),
  }),
  AnimatePresence: ({ children }) => children,
}));

vi.mock("../../core/ui", () => ({
  Icon: ({ name, ...props }) => React.createElement("span", { ...props, "data-icon": name }),
  UserGlyph: (props) => React.createElement("span", { ...props, "data-glyph": props.glyph ?? "" }),
}));

// Aislamiento: DeckQueueHistory consume usePlayer; contexto controlado por test.
let mocks;
vi.mock("../../core/PlayerContext.jsx", () => ({
  usePlayer: () => mocks.ctx,
  PlayerProvider: ({ children }) => children,
}));

const ACTIVE = { id: "active", title: "Sonando", artist: "A", tag: "dnb" };
const M1 = { id: "m1", title: "Manual 1", artist: "A", _manual: true };
const M2 = { id: "m2", title: "Manual 2", artist: "A", _manual: true };
const M3 = { id: "m3", title: "Manual 3", artist: "A", _manual: true };
const C1 = { id: "c1", title: "Contexto 1", artist: "B" };

beforeEach(() => {
  mocks = {
    ctx: {
      activeTrack: ACTIVE,
      localQueue: [],
      setLocalQueue: vi.fn(),
      removeFromQueue: vi.fn(),
      playTrack: vi.fn(),
      playHistory: [],
      setPlayHistory: vi.fn(),
      queueContextName: null,
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const renderPanel = (props = {}) =>
  render(<DeckQueueHistory accentColor="#bfff00" mode="queue" onClose={vi.fn()} onJump={vi.fn()} {...props} />);

const upButtons = (view) => view.container.querySelectorAll('[aria-label="Subir en cola"]');
const downButtons = (view) => view.container.querySelectorAll('[aria-label="Bajar en cola"]');

describe("DeckQueueHistory — reorder canónico de cola", () => {
  it("reordena vía reorderQueueByIds: activo al head y grupo reordenado detrás (Q1/Q8)", () => {
    // Cola real: [activo, m1, m2, m3]. Vista del panel (sin activo): [m1, m2, m3].
    // Subir m3 (index 2) → canónico: [activo, m1, m3, m2].
    mocks.ctx.localQueue = [ACTIVE, M1, M2, M3];
    const view = renderPanel();

    fireEvent.click(upButtons(view)[2]);

    expect(mocks.ctx.setLocalQueue).toHaveBeenCalledTimes(1);
    const next = mocks.ctx.setLocalQueue.mock.calls[0][0];
    expect(next.map((t) => t.id)).toEqual(["active", "m1", "m3", "m2"]);
  });

  it("NO reconstruye la cola ad-hoc: el activo nunca acaba fuera del head", () => {
    // Regresión del bug: la implementación anterior pegaba el activo AL FINAL
    // ([...next, active]) — cambiaba quién era "next" y violaba Q1/Q8.
    mocks.ctx.localQueue = [ACTIVE, M1, M2];
    const view = renderPanel();

    fireEvent.click(upButtons(view)[1]); // subir m2 sobre m1

    const next = mocks.ctx.setLocalQueue.mock.calls[0][0];
    expect(next[0].id).toBe("active");
    expect(next[next.length - 1].id).not.toBe("active");
  });

  it("vecinos de grupos distintos (manual/contexto) se rechazan: no-op sin estado ni evento", () => {
    // Mismo contrato que el drag&drop de MusicLab: reorderQueueByIds devuelve
    // la MISMA referencia cuando from/to son de grupos distintos → el panel
    // no llama setLocalQueue ni emite undo.
    mocks.ctx.localQueue = [ACTIVE, M1, C1, M2];
    const eventSpy = vi.spyOn(window, "dispatchEvent");
    const view = renderPanel();

    // Vista: [m1, c1, m2]. Subir c1 (index 1) cruza el límite manual/contexto.
    fireEvent.click(upButtons(view)[1]);

    expect(mocks.ctx.setLocalQueue).not.toHaveBeenCalled();
    expect(eventSpy).not.toHaveBeenCalled();
  });

  it("emite bunker_cola_reordered con la snapshot PREVIA al reorder (undo S85d Q17)", () => {
    mocks.ctx.localQueue = [ACTIVE, M1, M2, M3];
    const handler = vi.fn();
    window.addEventListener("bunker_cola_reordered", handler);
    try {
      const view = renderPanel();
      fireEvent.click(upButtons(view)[2]);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.detail.snapshot.map((t) => t.id)).toEqual(["active", "m1", "m2", "m3"]);
    } finally {
      window.removeEventListener("bunker_cola_reordered", handler);
    }
  });

  it("límites: subir el primero y bajar el último van deshabilitados", () => {
    mocks.ctx.localQueue = [ACTIVE, M1, M2];
    const view = renderPanel();

    expect(upButtons(view)[0]).toBeDisabled();
    expect(downButtons(view)[0]).toBeEnabled();
    expect(upButtons(view)[1]).toBeEnabled();
    expect(downButtons(view)[1]).toBeDisabled();
  });

  it("reorder dentro del grupo de contexto también respeta la canónica", () => {
    // Grupo contexto puro: [activo, c1, c2] → bajar c1 → [activo, c2, c1].
    const C2 = { id: "c2", title: "Contexto 2", artist: "B" };
    mocks.ctx.localQueue = [ACTIVE, C1, C2];
    const view = renderPanel();

    fireEvent.click(downButtons(view)[0]);

    const next = mocks.ctx.setLocalQueue.mock.calls[0][0];
    expect(next.map((t) => t.id)).toEqual(["active", "c2", "c1"]);
  });
});
