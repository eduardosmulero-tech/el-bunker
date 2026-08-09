// @vitest-environment jsdom
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioVisualizer } from "../AudioVisualizer.jsx";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_target, element) => ({ children, ...props }) =>
      React.createElement(element, props, children),
  }),
  AnimatePresence: ({ children }) => children,
}));

vi.mock("../../core/ui", () => ({
  Icon: ({ name, ...props }) => React.createElement("span", { ...props, "data-icon": name }),
}));

function makeAudioContext() {
  const instances = [];
  const Context = class MockAudioContext {
    constructor() {
      this.destination = {};
      this.resume = vi.fn(() => Promise.resolve());
      this.createAnalyser = vi.fn(() => ({ connect: vi.fn() }));
      this.createMediaElementSource = vi.fn(() => ({ connect: vi.fn() }));
      instances.push(this);
    }
  };
  Context.instances = instances;
  return Context;
}

describe("AudioVisualizer lifecycle", () => {
  let AudioContext;
  let audioRef;

  beforeEach(() => {
    AudioContext = makeAudioContext();
    vi.stubGlobal("AudioContext", AudioContext);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
    });
    audioRef = { current: document.createElement("audio") };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reuses one MediaElementSource when the component remounts", () => {
    const view = render(<AudioVisualizer audioRef={audioRef} isPlaying accentColor="#bfff00" />);
    view.unmount();
    render(<AudioVisualizer audioRef={audioRef} isPlaying accentColor="#bfff00" />);

    expect(AudioContext.instances).toHaveLength(1);
    expect(AudioContext.instances[0].createMediaElementSource).toHaveBeenCalledTimes(1);
  });

  it("exits the visualizer when the browser leaves fullscreen", () => {
    const view = render(<AudioVisualizer audioRef={audioRef} isPlaying={false} />);
    const canvas = view.container.querySelector("canvas");
    const requestFullscreen = vi.fn(() => Promise.resolve());
    document.documentElement.requestFullscreen = requestFullscreen;

    fireEvent.click(canvas);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(canvas).toHaveAttribute("title", expect.stringContaining("ESC"));

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(canvas).toHaveAttribute("title", "Tap para visualizador a pantalla completa");
  });
});
