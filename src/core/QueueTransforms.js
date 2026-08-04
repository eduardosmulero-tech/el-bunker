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

/**
 * Reorders two items in the same manual/context group without relying on
 * their rendered index (which may come from a filtered queue view).
 */
export function reorderQueueByIds(queue, fromId, toId, activeId = null) {
  if (!Array.isArray(queue) || !fromId || !toId || fromId === toId) return queue;
  if (activeId && !queue.some((track) => track.id === activeId)) return queue;

  const withoutActive = activeId ? queue.filter((track) => track.id !== activeId) : [...queue];
  const from = withoutActive.find((track) => track.id === fromId);
  const to = withoutActive.find((track) => track.id === toId);
  if (!from || !to || Boolean(from._manual) !== Boolean(to._manual)) return queue;

  const group = withoutActive.filter((track) => Boolean(track._manual) === Boolean(from._manual));
  const fromIndex = group.findIndex((track) => track.id === fromId);
  const toIndex = group.findIndex((track) => track.id === toId);
  if (fromIndex < 0 || toIndex < 0) return queue;

  const reorderedGroup = [...group];
  const [moved] = reorderedGroup.splice(fromIndex, 1);
  reorderedGroup.splice(toIndex, 0, moved);
  let groupIndex = 0;
  const reordered = withoutActive.map((track) => {
    if (Boolean(track._manual) !== Boolean(from._manual)) return track;
    return reorderedGroup[groupIndex++];
  });

  const activeTrack = activeId ? queue.find((track) => track.id === activeId) : null;
  return activeTrack ? [activeTrack, ...reordered] : reordered;
}
