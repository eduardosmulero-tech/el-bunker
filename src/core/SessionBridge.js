// ============================================================
//  EL BÚNKER — SessionBridge.js
//  Session persistence boundary for VaultContext.
//  No React state, network calls, or auth orchestration.
// ============================================================

export const SESSION_KEYS = Object.freeze({
  JWT: "bunker_jwt",
  KIND: "bunker_session_kind",
  USER: "bunker_user",
  ACCESS_KEY: "bunker_access_key",
});

const browserSessionStorage = () => {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
};

const browserLocalStorage = () => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

export function readStoredJwt(storage = browserSessionStorage()) {
  try {
    return storage?.getItem(SESSION_KEYS.JWT) || null;
  } catch {
    return null;
  }
}

export function setSessionKind(kind, storage = browserSessionStorage()) {
  try {
    if (kind) storage?.setItem(SESSION_KEYS.KIND, kind);
    else storage?.removeItem(SESSION_KEYS.KIND);
  } catch {
    // Private browsing/storage-disabled mode is supported.
  }
}

export function persistAccessSession(fullUser, keyToRemember, {
  session = browserSessionStorage(),
  local = browserLocalStorage(),
} = {}) {
  try {
    session?.setItem(SESSION_KEYS.USER, JSON.stringify(fullUser));
    if (keyToRemember) local?.setItem(SESSION_KEYS.ACCESS_KEY, keyToRemember);
    else local?.removeItem(SESSION_KEYS.ACCESS_KEY);
  } catch {
    // Private browsing/storage-disabled mode is supported.
  }
}

export function readAccessSession({
  session = browserSessionStorage(),
  local = browserLocalStorage(),
} = {}) {
  const read = (storage, key) => {
    try { return storage?.getItem(key) || null; } catch { return null; }
  };
  const rawUser = read(session, SESSION_KEYS.USER);
  let user = null;
  try { user = rawUser ? JSON.parse(rawUser) : null; } catch { /* datos corruptos aislados */ }

  return {
    jwt: read(session, SESSION_KEYS.JWT),
    kind: read(session, SESSION_KEYS.KIND),
    user,
    key: read(local, SESSION_KEYS.ACCESS_KEY),
  };
}

export function applyJwt(token, {
  setJwtToken,
  workerClient,
  setUploadToken,
  setStatsToken,
  storage = browserSessionStorage(),
} = {}) {
  setJwtToken?.(token);
  try {
    if (token) storage?.setItem(SESSION_KEYS.JWT, token);
    else storage?.removeItem(SESSION_KEYS.JWT);
  } catch {
    // Private browsing/storage-disabled mode is supported.
  }
  workerClient?.setToken(token);
  setUploadToken?.(token);
  setStatsToken?.(token);
}

export function clearSession({
  workerClient,
  setUploadToken,
  setStatsToken,
  session = browserSessionStorage(),
  local = browserLocalStorage(),
} = {}) {
  try {
    session?.removeItem(SESSION_KEYS.JWT);
    session?.removeItem(SESSION_KEYS.KIND);
    session?.removeItem(SESSION_KEYS.USER);
    local?.removeItem(SESSION_KEYS.ACCESS_KEY);
  } catch {
    // Private browsing/storage-disabled mode is supported.
  }
  workerClient?.clearToken();
  setUploadToken?.(null);
  setStatsToken?.(null);
}
