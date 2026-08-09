const audioGraphs = new WeakMap();

function getAudioContextConstructor(explicitConstructor) {
  if (explicitConstructor) return explicitConstructor;
  return globalThis.AudioContext || globalThis.webkitAudioContext || null;
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
  source.connect(analyser);
  analyser.connect(context.destination);

  const graph = { context, analyser, source };
  audioGraphs.set(audioElement, graph);
  return graph;
}

