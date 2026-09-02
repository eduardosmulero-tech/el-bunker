// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAudioGraph } from "../AudioGraph.js";

function makeAudioElement() {
  return {};
}

function makeAudioContext() {
  const analyser = {
    connect: vi.fn(),
  };
  const source = {
    connect: vi.fn(),
  };
  return class MockAudioContext {
    static instances = [];

    constructor() {
      this.destination = {};
      this.createAnalyser = vi.fn(() => analyser);
      this.createMediaElementSource = vi.fn(() => source);
      this.createBiquadFilter = vi.fn(() => ({
        type: "",
        frequency: { value: 0 },
        Q: { value: 0 },
        gain: { value: 0 },
        connect: vi.fn(),
      }));
      MockAudioContext.instances.push(this);
    }
  };
}

describe("AudioGraph", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates one graph per audio element and reuses it across remounts", () => {
    const audio = makeAudioElement();
    const AudioContext = makeAudioContext();

    const first = getAudioGraph(audio, AudioContext);
    const second = getAudioGraph(audio, AudioContext);

    expect(second).toBe(first);
    expect(AudioContext.instances).toHaveLength(1);
    expect(AudioContext.instances[0].createMediaElementSource).toHaveBeenCalledTimes(1);
  });

  it("keeps separate audio elements isolated", () => {
    const firstAudio = makeAudioElement();
    const secondAudio = makeAudioElement();
    const AudioContext = makeAudioContext();

    const first = getAudioGraph(firstAudio, AudioContext);
    const second = getAudioGraph(secondAudio, AudioContext);

    expect(second).not.toBe(first);
    expect(AudioContext.instances).toHaveLength(2);
  });

  it("adds ten flat peaking bands before the analyser", () => {
    const audio = makeAudioElement();
    const AudioContext = makeAudioContext();

    const graph = getAudioGraph(audio, AudioContext);

    expect(graph.eqBands).toHaveLength(10);
    expect(graph.eqBands.map((band) => band.frequency.value)).toEqual([31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]);
    expect(graph.eqBands.every((band) => band.type === "peaking" && band.gain.value === 0)).toBe(true);
    expect(AudioContext.instances[0].createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(graph.source.connect).toHaveBeenCalledWith(graph.eqBands[0]);
    expect(graph.eqBands[9].connect).toHaveBeenCalledWith(graph.analyser);
  });

  it("does not create a second graph for the same audio element", () => {
    const audio = makeAudioElement();
    const AudioContext = makeAudioContext();

    const graph = getAudioGraph(audio, AudioContext);

    expect(getAudioGraph(audio, AudioContext)).toBe(graph);
    expect(AudioContext.instances).toHaveLength(1);
  });

});
