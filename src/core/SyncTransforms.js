export function advanceSyncCursor(current = 0, response = {}) {
  if (response?.unchanged || !response?.updated_at) return current;
  const next = new Date(response.updated_at).getTime();
  return Number.isFinite(next) && next > current ? next : current;
}
