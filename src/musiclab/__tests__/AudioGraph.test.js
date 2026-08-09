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

  it("returns null when Web Audio is unavailable", () => {
    expect(getAudioGraph(makeAudioElement(), null)).toBeNull();
  });

});
