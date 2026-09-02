// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { getAudioGraph } from "../AudioGraph.js";
import {
  EQ_BAND_COUNT,
  applyEqState,
  applyPreset,
  clampEqGain,
  getEqBands,
  normalizeEqGains,
  resetEq,
  setBandGain,
} from "../eq.js";

function makeGraph() {
  const analyser = { connect: vi.fn() };
  const source = { connect: vi.fn() };
  const bands = Array.from({ length: EQ_BAND_COUNT }, () => ({
    type: "",
    frequency: { value: 0 },
    Q: { value: 0 },
    gain: { value: 0 },
    connect: vi.fn(),
  }));
  class AudioContext {
    constructor() { this.destination = {}; }
    createAnalyser() { return analyser; }
    createMediaElementSource() { return source; }
    createBiquadFilter() { return bands.shift(); }
  }
  return getAudioGraph({}, AudioContext);
}

describe("10-band EQ operations", () => {
  it("normalizes missing, invalid, and out-of-range gains", () => {
    expect(normalizeEqGains([20, -20, "4", "bad"])).toEqual([12, -12, 4, 0, 0, 0, 0, 0, 0, 0]);
    expect(clampEqGain(NaN)).toBe(0);
    expect(clampEqGain(Infinity)).toBe(0);
  });

  it("applies gains to the graph and clamps each band", () => {
    const graph = makeGraph();
    const gains = applyPreset(graph, [20, -20, 3]);

    expect(getEqBands(graph)).toHaveLength(10);
    expect(gains.slice(0, 3)).toEqual([12, -12, 3]);
    expect(graph.eqBands.map((band) => band.gain.value)).toEqual(gains);
  });

  it("resets the graph to flat", () => {
    const graph = makeGraph();
    applyPreset(graph, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(resetEq(graph)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(graph.eqBands.every((band) => band.gain.value === 0)).toBe(true);
  });

  it("bypasses without losing the stored gains", () => {
    const graph = makeGraph();
    const gains = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    applyEqState(graph, gains, false);
    expect(graph.eqBands.every((band) => band.gain.value === 0)).toBe(true);

    applyEqState(graph, gains, true);
    expect(graph.eqBands.map((band) => band.gain.value)).toEqual(gains);
  });

  it("rejects graphs not created by the audio graph factory", () => {
    expect(() => setBandGain({ eqBands: [] }, 0, 1)).toThrow(TypeError);
    expect(() => setBandGain(makeGraph(), 10, 1)).toThrow(RangeError);
  });
});
