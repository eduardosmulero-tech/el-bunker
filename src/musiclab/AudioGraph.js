const audioGraphs = new WeakMap();
const ownedGraphs = new WeakSet();

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

function getAudioContextConstructor(explicitConstructor) {
  if (explicitConstructor) return explicitConstructor;
  return globalThis.AudioContext || globalThis.webkitAudioContext || null;
}

function createEqBands(context) {
  if (typeof context.createBiquadFilter !== "function") return [];

  return EQ_FREQUENCIES.map((frequency) => {
    const band = context.createBiquadFilter();
    band.type = "peaking";
    band.frequency.value = frequency;
    band.Q.value = 1;
    band.gain.value = 0;
    return band;
  });
}

export function getAudioGraph(audioElement, AudioContextConstructor) {
  if (!audioElement) return null;

  const existing = audioGraphs.get(audioElement);
  if (existing) return existing;

  const Context = getAudioContextConstructor(AudioContextConstructor);
  if (!Context) return null;

  const context = new Context();
  const analyser = context.createAnalyser();
  const source = context.createMediaElementSource(audioElement);
  const eqBands = createEqBands(context);

  if (eqBands.length) {
    source.connect(eqBands[0]);
    eqBands.forEach((band, index) => band.connect(eqBands[index + 1] ?? analyser));
  } else {
    // Keeps the visualizer usable with minimal test doubles/older implementations.
    source.connect(analyser);
  }
  analyser.connect(context.destination);

  const graph = { context, analyser, source, eqBands };
  audioGraphs.set(audioElement, graph);
  ownedGraphs.add(graph);
  return graph;
}

export function getExistingAudioGraph(audioElement) {
  return audioElement ? audioGraphs.get(audioElement) ?? null : null;
}

export function isAudioGraph(graph) {
  return Boolean(graph && ownedGraphs.has(graph));
}
