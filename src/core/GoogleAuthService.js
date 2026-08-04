// ============================================================
//  EL BÚNKER — GoogleAuthService.js
//  Google Identity Services · OAuth2 solo para autenticación
//  D1/R2 son la fuente de persistencia; este módulo no usa Drive.
// ============================================================

const CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  SCOPES: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" "),
  SCHEMA_VERSION: "5.0.0",
  USERS: {
    "thebunker.admin@gmail.com": { role: "admin", name: "Admin", id: "admin" },
    "bansovi.py@gmail.com":      { role: "edu", name: "Edu", id: "edu" },
    "dcgdozt@gmail.com":         { role: "david", name: "David", id: "david" },
  },
  LIBRARY_AT_RISK_MONTHS: 18,
  LIBRARY_LOST_MONTHS: 23,
};

export const EMPTY_DB = () => ({
  schema_version: CONFIG.SCHEMA_VERSION,
  heartbeat: new Date().toISOString(),
  adventures_start_date: new Date().toISOString(),
  eras: [],
  music_lab: { tracks: [], drops: [], playlists: [], tags: [] },
  entries: [],
  libraries: [],
});

const state = {
  tokenClient: null,
  accessToken: null,
  authListeners: [],
};

const vaultError = (code, message, cause = null) => {
  const error = new Error(`[ElBunker::${code}] ${message}`);
  error.code = code;
  error.cause = cause;
  return error;
};

const notifyAuthListeners = (event, payload = {}) => {
  state.authListeners.forEach((listener) => listener({ event, ...payload }));
};

const translateGisError = (error) => {
  if (!error) return { msg: "Error desconocido al autenticar con Google.", action: null };
  const code = error.error ?? error.type ?? "unknown";
  const subcode = error.error_subtype ?? error.subtype ?? "";
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "?";
  const isLocal = currentOrigin.startsWith("http://localhost") || currentOrigin.startsWith("http://127.");
  switch (code) {
    case "idpiframe_initialization_failed":
      return isLocal
        ? {
            msg: `Google OAuth rechaza ${currentOrigin}. El client_id actual no tiene este origen autorizado.`,
            action: `DEV: añade '${currentOrigin}' en Authorized JavaScript origins del OAuth client.`,
          }
        : { msg: "Google OAuth no se inicializó. Verifica VITE_GOOGLE_CLIENT_ID y la red.", action: null };
    case "redirect_uri_mismatch":
      return { msg: "redirect_uri_mismatch: el origen no está autorizado.", action: null };
    case "access_denied":
      return { msg: "Acceso denegado por el usuario.", action: null };
    case "popup_closed_by_user":
      return { msg: "Popup cerrado por el usuario.", action: null };
    case "invalid_client":
      return { msg: "invalid_client: VITE_GOOGLE_CLIENT_ID inválido o no autorizado.", action: null };
    default:
      return { msg: `Error OAuth (${code}${subcode ? `:${subcode}` : ""}).`, action: null };
  }
};

const loadGisScript = () => new Promise((resolve, reject) => {
  if (window.google?.accounts) return resolve();
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.onload = resolve;
  script.onerror = () => reject(vaultError("GIS_LOAD", "No se pudo cargar GIS client"));
  document.head.appendChild(script);
});

export const initGoogleServices = async () => {
  try {
    await loadGisScript();
    state.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.CLIENT_ID,
      scope: CONFIG.SCOPES,
      callback: () => {},
      error_callback: (error) => {
        const translated = translateGisError(error);
        console.error("[Búnker] GIS error:", error, "\n→", translated.msg);
        notifyAuthListeners("AUTH_ERROR", { error, translated });
      },
    });
    console.info("[Búnker] Google Identity Services inicializado ✓");
  } catch (error) {
    console.error("[Búnker] Error en initGoogleServices:", error);
    throw error;
  }
};

export const requestAccessToken = (forceConsent = false) => new Promise((resolve, reject) => {
  if (!state.tokenClient) return reject(vaultError("NOT_INIT", "Llama a initGoogleServices() primero"));
  state.tokenClient.callback = async (tokenResponse) => {
    if (tokenResponse.error) {
      const translated = translateGisError(tokenResponse);
      notifyAuthListeners("AUTH_ERROR", { error: tokenResponse, translated });
      return reject(vaultError("TOKEN_ERROR", tokenResponse.error_description, tokenResponse));
    }
    state.accessToken = tokenResponse.access_token;
    const expiresAt = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
    localStorage.setItem("bunker_token", tokenResponse.access_token);
    localStorage.setItem("bunker_token_exp", String(expiresAt));
    notifyAuthListeners("SIGNED_IN", { token: tokenResponse.access_token });
    resolve(tokenResponse.access_token);
  };
  state.tokenClient.requestAccessToken({ prompt: forceConsent ? "select_account consent" : "" });
});

export const signOut = () => {
  if (state.accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(state.accessToken, () => console.info("[Búnker] Token revocado"));
  }
  state.accessToken = null;
  localStorage.removeItem("bunker_token");
  localStorage.removeItem("bunker_token_exp");
  notifyAuthListeners("SIGNED_OUT");
};

export const restoreToken = () => {
  try {
    const token = localStorage.getItem("bunker_token");
    const exp = Number(localStorage.getItem("bunker_token_exp") ?? 0);
    if (!token || Date.now() > exp) {
      localStorage.removeItem("bunker_token");
      localStorage.removeItem("bunker_token_exp");
      return false;
    }
    state.accessToken = token;
    return true;
  } catch (error) {
    console.warn("[Búnker] No se pudo restaurar el token:", error);
    return false;
  }
};

export const isAuthenticated = () => Boolean(state.accessToken);
export const getAccessToken = () => state.accessToken;

export const onAuthChange = (callback) => {
  state.authListeners.push(callback);
  return () => { state.authListeners = state.authListeners.filter((listener) => listener !== callback); };
};

export const resolveUser = (email) => email ? CONFIG.USERS[email.toLowerCase()] ?? null : null;
export const isAuthorizedEmail = (email) => Boolean(resolveUser(email));

export const _calcLibraryStatus = (lastHeartbeatCheck) => {
  if (!lastHeartbeatCheck) return "at_risk";
  const diffMonths = (Date.now() - new Date(lastHeartbeatCheck).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (diffMonths >= CONFIG.LIBRARY_LOST_MONTHS) return "lost";
  if (diffMonths >= CONFIG.LIBRARY_AT_RISK_MONTHS) return "at_risk";
  return "active";
};

export default {
  EMPTY_DB,
  initGoogleServices,
  requestAccessToken,
  signOut,
  restoreToken,
  isAuthenticated,
  getAccessToken,
  onAuthChange,
  resolveUser,
  isAuthorizedEmail,
  _calcLibraryStatus,
};
