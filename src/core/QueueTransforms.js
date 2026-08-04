// ============================================================
//  EL BÚNKER — QueueTransforms.js
//  Pure queue/shuffle transforms for PlayerContext.
//  No React, audio, DOM, network, or persistence dependencies.
// ============================================================

export function fisherYatesInPlace(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function enforceQueueLimit(queue, maxSize = 75) {
  if (!Array.isArray(queue) || queue.length <= maxSize) return queue;
  const manual = queue.filter((track) => track._manual);
  const context = queue.filter((track) => !track._manual);
  if (manual.length > maxSize) return manual.slice(-maxSize);
  const contextBudget = maxSize - manual.length;
  return [...context.slice(0, contextBudget), ...manual];
}
