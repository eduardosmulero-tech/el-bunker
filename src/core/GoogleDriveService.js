// ============================================================
//  EL BÚNKER — GoogleDriveService.js
//  S115-D4: Drive persistencia eliminada. Solo OAuth2 + bibliotecas.
//  Toda la persistencia va a D1 via WorkerClient.
// ============================================================
import { R2_PUBLIC_BASE } from "../tokens";

// ─── CONSTANTS ───────────────────────────────────────────────
const CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  SCOPES: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" "),

  DB_FILENAME: "the_vault_database.json",
  DB_MIME:     "application/json",
  HEARTBEAT_THROTTLE_MS: 15 * 60 * 1000,
  SCHEMA_VERSION: "5.0.0",

  USERS: {
    "thebunker.admin@gmail.com": { role: "admin",  name: "Admin",  id: "admin" },
    "bansovi.py@gmail.com":      { role: "edu",    name: "Edu",    id: "edu"   },
    "dcgdozt@gmail.com":         { role: "david",  name: "David",  id: "david" },
  },

  LIBRARY_ALERT_THRESHOLD_PCT: 85,
  LIBRARY_AT_RISK_MONTHS:  18,
  LIBRARY_LOST_MONTHS:     23,
};

// ─── EMPTY DATABASE SCHEMA ───────────────────────────────────
export const EMPTY_DB = () => ({
  schema_version: CONFIG.SCHEMA_VERSION,
  heartbeat:      new Date().toISOString(),
  adventures_start_date: new Date().toISOString(),
  eras: [],
  music_lab: { tracks: [], drops: [], playlists: [], tags: [] },
  entries: [],
  libraries: [],
});

// ─── INTERNAL STATE ──────────────────────────────────────────
const _state = {
  tokenClient:   null,
  accessToken:   null,
  gapiReady:     false,
  lastHeartbeat:  0,
  authListeners:  [],
};

// ─── HELPERS ─────────────────────────────────────────────────
const _notifyAuthListeners = (event, payload = {}) => {
  _state.authListeners.forEach((fn) => fn({ event, ...payload }));
};

const _vaultError = (code, message, cause = null) => {
  const err = new Error(`[ElBunker::${code}] ${message}`);
  err.code = code;
  err.cause = cause;
  return err;
};

// Traducción de errores de Google Identity Services (GIS) al español
// con guía accionable. El problema más común en dev (localhost) es
// origin_mismatch / idpiframe_initialization_failed por no registrar
// http://localhost:<puerto> en Authorized JavaScript origins del OAuth client.
const _translateGisError = (err) => {
  if (!err) return { msg: "Error desconocido al autenticar con Google.", action: null };
  const code = err.error ?? err.type ?? "unknown";
  const subcode = err.error_subtype ?? err.subtype ?? "";
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "?";
  const isLocal = currentOrigin.startsWith("http://localhost") || currentOrigin.startsWith("http://127.");
  switch (code) {
    case "idpiframe_initialization_failed":
      if (isLocal) {
        return {
          msg: `Google OAuth rechaza ${currentOrigin}. El client_id actual no tiene este origen autorizado.`,
          action: "DEV: crea un OAuth client_id de tipo 'Web' en Google Cloud Console y añade '${currentOrigin}' en 'Authorized JavaScript origins'. Alternativamente usa 'chrome.identity.launchWebAuthFlow' o el flujo PKCE fuera del navegador.",
        };
      }
      return {
        msg: "Google OAuth no se inicializó. Verifica VITE_GOOGLE_CLIENT_ID y la red.",
        action: null,
      };
    case "redirect_uri_mismatch":
      return { msg: "redirect_uri_mismatch: el origen no está en Authorized redirect URIs del OAuth client.", action: null };
    case "access_denied":
      return { msg: "Acceso denegado por el usuario.", action: null };
    case "popup_closed_by_user":
      return { msg: "Popup cerrado por el usuario.", action: null };
    case "invalid_client":
      return { msg: "invalid_client: VITE_GOOGLE_CLIENT_ID inválido o no autorizado.", action: null };
    default:
      return { msg: `Error OAuth (${code}${subcode ? ":" + subcode : ""}).`, action: null };
  }
};

// ─── SECTION 1: GAPI + GIS INIT ──────────────────────────────
const _loadGapiScript = () =>
  new Promise((resolve, reject) => {
    if (window.gapi) return resolve();
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = resolve;
    script.onerror = () => reject(_vaultError("GAPI_LOAD", "No se pudo cargar gapi.js"));
    document.head.appendChild(script);
  });

const _loadGisScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = resolve;
    script.onerror = () => reject(_vaultError("GIS_LOAD", "No se pudo cargar GIS client"));
    document.head.appendChild(script);
  });

const _initGapiClient = () =>
  new Promise((resolve, reject) => {
    window.gapi.load("client", {
      callback: async () => {
        try {
          await window.gapi.client.init({});
          await window.gapi.client.load(
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
          );
          _state.gapiReady = true;
          resolve();
        } catch (err) {
          reject(_vaultError("GAPI_INIT", "Error inicializando gapi.client", err));
        }
      },
      onerror: (err) =>
        reject(_vaultError("GAPI_CLIENT_LOAD", "Error cargando gapi.client", err)),
    });
  });

export const initGoogleServices = async () => {
  try {
    await Promise.all([_loadGapiScript(), _loadGisScript()]);
    await _initGapiClient();
    _state.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.CLIENT_ID,
      scope:     CONFIG.SCOPES,
      callback:  () => {},
      error_callback: (err) => {
        const translated = _translateGisError(err);
        console.error("[Búnker] GIS error:", err, "\n→", translated.msg);
        _notifyAuthListeners("AUTH_ERROR", { error: err, translated });
      },
    });
    console.info("[Búnker] Google Services inicializados ✓");
  } catch (err) {
    console.error("[Búnker] Error en initGoogleServices:", err);
    throw err;
  }
};

// ─── SECTION 2: AUTH ─────────────────────────────────────────
export const requestAccessToken = (forceConsent = false) =>
  new Promise((resolve, reject) => {
    if (!_state.tokenClient) {
      return reject(_vaultError("NOT_INIT", "Llama a initGoogleServices() primero"));
    }
    _state.tokenClient.callback = async (tokenResponse) => {
      if (tokenResponse.error) {
        const translated = _translateGisError(tokenResponse);
        console.error("[Búnker] Token error:", tokenResponse, "\n→", translated.msg);
        _notifyAuthListeners("AUTH_ERROR", { error: tokenResponse, translated });
        return reject(_vaultError("TOKEN_ERROR", tokenResponse.error_description, tokenResponse));
      }
      _state.accessToken = tokenResponse.access_token;
      window.gapi.client.setToken({ access_token: tokenResponse.access_token });
      const expiresAt = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
      localStorage.setItem("bunker_token", tokenResponse.access_token);
      localStorage.setItem("bunker_token_exp", String(expiresAt));
      _notifyAuthListeners("SIGNED_IN", { token: tokenResponse.access_token });
      console.info("[Búnker] Token OAuth2 obtenido ✓");
      resolve(tokenResponse.access_token);
    };
    if (forceConsent) {
      _state.tokenClient.requestAccessToken({ prompt: "select_account consent" });
    } else {
      _state.tokenClient.requestAccessToken({ prompt: "" });
    }
  });

export const signOut = () => {
  if (_state.accessToken) {
    window.google.accounts.oauth2.revoke(_state.accessToken, () => {
      console.info("[Búnker] Token revocado");
    });
  }
  _state.accessToken = null;
  localStorage.removeItem("bunker_token");
  localStorage.removeItem("bunker_token_exp");
  window.gapi.client.setToken(null);
  _notifyAuthListeners("SIGNED_OUT");
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
    _state.accessToken = token;
    window.gapi.client.setToken({ access_token: token });
    console.info("[Búnker] Token restaurado desde localStorage ✓");
    return true;
  } catch (err) {
    console.warn("[Búnker] No se pudo restaurar el token:", err);
    return false;
  }
};

export const isAuthenticated = () => Boolean(_state.accessToken);

export const onAuthChange = (callback) => {
  _state.authListeners.push(callback);
  return () => { _state.authListeners = _state.authListeners.filter((fn) => fn !== callback); };
};

// ─── SECTION 2B: ACCESS CONTROL ──────────────────────────────
export const resolveUser = (email) => {
  if (!email) return null;
  return CONFIG.USERS[email.toLowerCase()] ?? null;
};
export const isAuthorizedEmail = (email) => Boolean(resolveUser(email));

// ─── SECTION 3: LIBRARY MANAGEMENT (via patchDb — no Drive writes) ──
export const _calcLibraryStatus = (lastHeartbeatCheck) => {
  if (!lastHeartbeatCheck) return "at_risk";
  const diffMs = Date.now() - new Date(lastHeartbeatCheck).getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  if (diffMonths >= CONFIG.LIBRARY_LOST_MONTHS) return "lost";
  if (diffMonths >= CONFIG.LIBRARY_AT_RISK_MONTHS) return "at_risk";
  return "active";
};

// ─── SECTION 4: DRIVE API (read-only: list libraries) ────────
export const listLibraryContents = async (sharedFolderId) => {
  if (!isAuthenticated()) throw _vaultError("NOT_AUTH", "Usuario no autenticado.");
  const allFiles = [];
  let pageToken = null;
  try {
    do {
      const params = {
        q: `'${sharedFolderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, size, mimeType, createdTime)",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 1000,
      };
      if (pageToken) params.pageToken = pageToken;
      const response = await window.gapi.client.drive.files.list(params);
      allFiles.push(...(response.result.files ?? []));
      pageToken = response.result.nextPageToken ?? null;
    } while (pageToken);
    return allFiles;
  } catch (err) {
    throw _vaultError("LIST_LIBRARY", `Error listando la carpeta compartida ${sharedFolderId}`, err);
  }
};

export const calculateLibraryUsage = async (sharedFolderId) => {
  const files = await listLibraryContents(sharedFolderId);
  const used_bytes = files.reduce((acc, f) => acc + Number(f.size ?? 0), 0);
  return { used_bytes, used_gb: parseFloat((used_bytes / (1024 ** 3)).toFixed(2)), file_count: files.length };
};

export const checkLibraryCapacity = async (library) => {
  const { used_gb, file_count } = await calculateLibraryUsage(library.shared_folder_id);
  const capacity_gb = library.capacity_gb ?? 15;
  const used_pct = parseFloat(((used_gb / capacity_gb) * 100).toFixed(1));
  return { used_gb, used_pct, near_full: used_pct >= CONFIG.LIBRARY_ALERT_THRESHOLD_PCT, file_count };
};

// ─── SECTION 5: STREAM URL ───────────────────────────────────
export const getStreamUrl = (track) => {
  if (!track) return null;
  if (track.r2_key) return `${R2_PUBLIC_BASE}/${track.r2_key}`;
  const token = window.gapi.client.getToken()?.access_token;
  if (!token || !track.drive_file_id) return null;
  return `https://www.googleapis.com/drive/v3/files/${track.drive_file_id}?alt=media&access_token=${token}`;
};

// ─── DEFAULT EXPORT ──────────────────────────────────────────
const GoogleDriveService = {
  initGoogleServices,
  requestAccessToken,
  signOut,
  restoreToken,
  isAuthenticated,
  onAuthChange,
  resolveUser,
  isAuthorizedEmail,
  _calcLibraryStatus,
  listLibraryContents,
  calculateLibraryUsage,
  checkLibraryCapacity,
  getStreamUrl,
};

export default GoogleDriveService;
