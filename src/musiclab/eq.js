import { EQ_FREQUENCIES, isAudioGraph } from "./AudioGraph";

export { EQ_FREQUENCIES };
export const EQ_BAND_COUNT = EQ_FREQUENCIES.length;
export const EQ_MIN_GAIN = -12;
export const EQ_MAX_GAIN = 12;
export const FLAT_EQ = Object.freeze(EQ_FREQUENCIES.map(() => 0));

function assertGraph(graph) {
  if (!isAudioGraph(graph)) throw new TypeError("Expected an audio graph created by getAudioGraph");
  if (!Array.isArray(graph.eqBands) || graph.eqBands.length !== EQ_BAND_COUNT) {
    throw new TypeError("Audio graph does not contain the 10-band EQ");
  }
}

export function clampEqGain(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(EQ_MAX_GAIN, Math.max(EQ_MIN_GAIN, numeric));
}

export function normalizeEqGains(gains) {
  return EQ_FREQUENCIES.map((_, index) => clampEqGain(gains?.[index] ?? 0));
}

export function getEqBands(graph) {
  assertGraph(graph);
  return graph.eqBands;
}

export function setBandGain(graph, index, gain) {
  const bands = getEqBands(graph);
  if (!Number.isInteger(index) || index < 0 || index >= bands.length) {
    throw new RangeError(`EQ band index must be between 0 and ${bands.length - 1}`);
  }
  bands[index].gain.value = clampEqGain(gain);
  return bands[index].gain.value;
}

export function applyPreset(graph, gains) {
  const normalized = normalizeEqGains(gains);
  normalized.forEach((gain, index) => setBandGain(graph, index, gain));
  return normalized;
}

export function resetEq(graph) {
  return applyPreset(graph, FLAT_EQ);
}

export function applyEqState(graph, gains, enabled = true) {
  const normalized = normalizeEqGains(gains);
  return applyPreset(graph, enabled ? normalized : FLAT_EQ);
}
