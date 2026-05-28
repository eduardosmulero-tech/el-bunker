// ============================================================
//  EL BÚNKER — GoogleDriveService.js
//  Motor de Datos · Google Drive API v3 + GIS OAuth2
//  Arquitectura Serverless · Carpeta Compartida Drive
//  v3.0.0 — Multi-usuario, bibliotecas, alertas de capacidad
// ============================================================

// ─── CONSTANTS ───────────────────────────────────────────────
const CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  // drive.file     → crear/modificar archivos en carpeta compartida (ADR-001)
  // drive.readonly → leer carpetas compartidas de cuentas biblioteca
  SCOPES: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" "),

  DB_FILENAME: "the_vault_database.json",
  DB_MIME:     "application/json",

  // Throttle del heartbeat de la cuenta principal (15 min)
  HEARTBEAT_THROTTLE_MS: 15 * 60 * 1000,

  // Versión del esquema — permite migraciones futuras
  SCHEMA_VERSION: "4.0.0",

  // ── Usuarios autorizados ─────────────────────────────────
  // Solo estos tres emails pueden usar la app.
  // Roles: admin → gestión de bibliotecas, edu/david → usuarios normales
  USERS: {
    "thebunker.admin@gmail.com": { role: "admin",  name: "Admin",  id: "admin" },
    "bansovi.py@gmail.com":      { role: "edu",    name: "Edu",    id: "edu"   },
    "dcgdozt@gmail.com":         { role: "david",  name: "David",  id: "david" },
  },

  // Umbral de capacidad (%) a partir del cual se considera "casi llena"
  LIBRARY_ALERT_THRESHOLD_PCT: 85,

  // Meses sin heartbeat para considerar la biblioteca "at_risk" o "lost"
  LIBRARY_AT_RISK_MONTHS:  18,
  LIBRARY_LOST_MONTHS:     23,
};

// ─── EMPTY DATABASE SCHEMA ───────────────────────────────────
const EMPTY_DB = () => ({
  // ── Meta / Control ──────────────────────────────────────────
  schema_version: CONFIG.SCHEMA_VERSION,
  heartbeat:      new Date().toISOString(),
  adventures_start_date: new Date().toISOString(),

  // ── Eras ────────────────────────────────────────────────────
  eras: [],
  // { id, name, description, start_date, end_date, color, cover_image, created_at }

  // ── Music Lab ────────────────────────────────────────────────
  music_lab: {
    tracks: [],
    // { id, era_id, title, artist, drive_file_id, tag, tags, thumbnail, format, note, play_count, last_played, added_at }
    drops:  [],
    // { id, era_id, track_id, from, to, memory, mood, date, favorited, favorited_by, created_at }

    playlists: [],
    // { id, name, track_ids: [], created_by, created_at, updated_at }
  },

  // ── Entradas generales (diario, fotos, cartas...) ────────────
  entries: [],
  // {
  //   id, era_id, type: "note"|"photo"|"milestone"|"letter",
  //   content: {},
  //   tags: [],
  //   from:  "edu" | "david" | "admin",   ← NUEVO: quién lo crea
  //   to:    "edu" | "david" | "both",    ← NUEVO: a quién va dirigido
  //   created_at, updated_at
  // }

  // ── Cuentas biblioteca ───────────────────────────────────────
  libraries: [],
  // {
  //   id, email, type: "music"|"photos"|"mixed", label,
  //   shared_folder_id, capacity_gb,
  //   added_at, last_heartbeat_check, status: "active"|"full"|"at_risk"|"lost"
  // }
});

// ─── INTERNAL STATE ──────────────────────────────────────────
const _state = {
  tokenClient:   null,
  accessToken:   null,
  dbFileId:      null,
  gapiReady:     false,
  lastHeartbeat:  0,
  queueFileIds:   {},   // { [userId]: fileId } — cacheado por sesión
  authListeners:  [],
};

// ─── HELPERS ─────────────────────────────────────────────────

/** Genera un UUID v4 simple sin dependencias externas. */
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

/** Notifica a todos los listeners de auth registrados. */
const _notifyAuthListeners = (event, payload = {}) => {
  _state.authListeners.forEach((fn) => fn({ event, ...payload }));
};

/** Lanza un error tipado con contexto para facilitar el debugging. */
const _vaultError = (code, message, cause = null) => {
  const err   = new Error(`[ElBunker::${code}] ${message}`);
  err.code    = code;
  err.cause   = cause;
  return err;
};

// ─── SECTION 1: GAPI + GIS INITIALIZATION ────────────────────

const _loadGapiScript = () =>
  new Promise((resolve, reject) => {
    if (window.gapi) return resolve();
    const script   = document.createElement("script");
    script.src     = "https://apis.google.com/js/api.js";
    script.onload  = resolve;
    script.onerror = () => reject(_vaultError("GAPI_LOAD", "No se pudo cargar gapi.js"));
    document.head.appendChild(script);
  });

const _loadGisScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const script   = document.createElement("script");
    script.src     = "https://accounts.google.com/gsi/client";
    script.onload  = resolve;
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

/**
 * initGoogleServices()
 * Carga GAPI + GIS y configura el TokenClient de OAuth2.
 * Debe llamarse una vez al montar la app.
 */
export const initGoogleServices = async () => {
  try {
    await Promise.all([_loadGapiScript(), _loadGisScript()]);
    await _initGapiClient();

    _state.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.CLIENT_ID,
      scope:     CONFIG.SCOPES,
      callback:  () => {},
      error_callback: (err) => {
        console.error("[Búnker] GIS error:", err);
        _notifyAuthListeners("AUTH_ERROR", { error: err });
      },
    });

    console.info("[Búnker] Google Services inicializados ✓");
  } catch (err) {
    console.error("[Búnker] Error en initGoogleServices:", err);
    throw err;
  }
};

// ─── SECTION 2: AUTHENTICATION ───────────────────────────────

/**
 * requestAccessToken(forceConsent)
 * Solicita (o renueva) el access token OAuth2 vía GIS.
 */
export const requestAccessToken = (forceConsent = false) =>
  new Promise((resolve, reject) => {
    if (!_state.tokenClient) {
      return reject(_vaultError("NOT_INIT", "Llama a initGoogleServices() primero"));
    }

    _state.tokenClient.callback = async (tokenResponse) => {
      if (tokenResponse.error) {
        _notifyAuthListeners("AUTH_ERROR", { error: tokenResponse });
        return reject(
          _vaultError("TOKEN_ERROR", tokenResponse.error_description, tokenResponse)
        );
      }

      _state.accessToken = tokenResponse.access_token;
      window.gapi.client.setToken({ access_token: tokenResponse.access_token });
      const expiresAt = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
      localStorage.setItem("bunker_token", tokenResponse.access_token);
      localStorage.setItem("bunker_token_exp", String(expiresAt));
      _notifyAuthListeners("SIGNED_IN", { token: tokenResponse.access_token });
      console.info("[Búnker] Token OAuth2 obtenido ✓");

      try {
        await _triggerHeartbeat();
      } catch (hbErr) {
        console.warn("[Búnker] Heartbeat post-login fallido:", hbErr);
      }

      resolve(tokenResponse.access_token);
    };

    if (forceConsent) {
      _state.tokenClient.requestAccessToken({ prompt: "select_account consent" });
    } else {
      _state.tokenClient.requestAccessToken({ prompt: "" });
    }
  });

/** signOut() — Revoca el token y limpia el estado local. */
export const signOut = () => {
  if (_state.accessToken) {
    window.google.accounts.oauth2.revoke(_state.accessToken, () => {
      console.info("[Búnker] Token revocado");
    });
  }
  _state.accessToken = null;
  localStorage.removeItem("bunker_token");
  localStorage.removeItem("bunker_token_exp");
  _state.dbFileId    = null;
  window.gapi.client.setToken(null);
  _notifyAuthListeners("SIGNED_OUT");
};

/** @returns {boolean} */
export const restoreToken = () => {
  try {
    const token = localStorage.getItem("bunker_token");
    const exp   = Number(localStorage.getItem("bunker_token_exp") ?? 0);
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

/**
 * onAuthChange(callback)
 * Suscripción a eventos: SIGNED_IN | SIGNED_OUT | AUTH_ERROR
 * @returns {Function} unsubscribe
 */
export const onAuthChange = (callback) => {
  _state.authListeners.push(callback);
  return () => {
    _state.authListeners = _state.authListeners.filter((fn) => fn !== callback);
  };
};

// ─── SECTION 2B: CONTROL DE ACCESO POR USUARIO ───────────────

/**
 * resolveUser(email)
 *
 * Dado un email, devuelve el perfil del usuario autorizado o null.
 * Si el email no está en USERS, el login debe ser rechazado por la UI.
 *
 * @param {string} email
 * @returns {{ role, name, id } | null}
 */
export const resolveUser = (email) => {
  if (!email) return null;
  return CONFIG.USERS[email.toLowerCase()] ?? null;
};

/**
 * isAuthorizedEmail(email)
 * Comprueba rápidamente si un email puede usar la app.
 *
 * @param {string} email
 * @returns {boolean}
 */
export const isAuthorizedEmail = (email) => Boolean(resolveUser(email));

// ─── SECTION 3: DRIVE FILE OPERATIONS ────────────────────────

const _findDatabaseFile = async () => {
  const folderId = import.meta.env.VITE_GOOGLE_SHARED_FOLDER_ID;
  if (!folderId) {
    throw _vaultError("MISSING_FOLDER_ID", "VITE_GOOGLE_SHARED_FOLDER_ID no está configurada. Revisa el .env.");
  }
  if (_state.dbFileId) return _state.dbFileId;

  console.info(`[Búnker] Buscando DB en carpeta compartida: ${folderId}`);

  try {
    const params = {
      spaces: "drive",
      q:      `'${folderId}' in parents and name = '${CONFIG.DB_FILENAME}' and trashed = false`,
      fields: "files(id, name, modifiedTime)",
      includeItemsFromAllDrives: true,
      supportsAllDrives:         true,
    };
    const response = await window.gapi.client.drive.files.list(params);

    const files = response.result.files ?? [];
    if (files.length === 0) return null;

    if (files.length > 1) {
      console.warn("[Búnker] Múltiples archivos DB — usando el más reciente");
      files.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    }

    _state.dbFileId = files[0].id;
    return _state.dbFileId;
  } catch (err) {
    throw _vaultError("FIND_FILE", "Error buscando el archivo DB en Drive", err);
  }
};

const _createDatabaseFile = async (data) => {
  const folderId = import.meta.env.VITE_GOOGLE_SHARED_FOLDER_ID;
  if (!folderId) {
    throw _vaultError("MISSING_FOLDER_ID", "VITE_GOOGLE_SHARED_FOLDER_ID no está configurada. Revisa el .env.");
  }
  try {
    const metadata = {
      name:     CONFIG.DB_FILENAME,
      mimeType: CONFIG.DB_MIME,
      parents:  [folderId],
    };

    const body          = JSON.stringify(data, null, 2);
    const boundary      = "-------BunkerBoundary314159";
    const delimiter     = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${CONFIG.DB_MIME}\r\n\r\n` +
      body +
      closeDelimiter;

    const response = await window.gapi.client.request({
      path:    "https://www.googleapis.com/upload/drive/v3/files",
      method:  "POST",
      params:  { uploadType: "multipart", fields: "id", supportsAllDrives: true },
      headers: { "Content-Type": `multipart/related; boundary="${boundary}"` },
      body:    multipartBody,
    });

    _state.dbFileId = response.result.id;
    console.info(`[Búnker] DB creada en Drive ✓ (fileId: ${_state.dbFileId})`);
    return _state.dbFileId;
  } catch (err) {
    throw _vaultError("CREATE_FILE", "Error creando el archivo DB en Drive", err);
  }
};

const _withTokenRetry = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    const status = err?.status ?? err?.result?.error?.code ?? err?.code;
    if (status === 401 || status === 403) {
      console.info("[Búnker] Token rechazado (HTTP " + status + ") — renovando…");
      try {
        await requestAccessToken(false);
      } catch (_silentErr) {
        console.warn("[Búnker] Silent refresh fallido — forzando popup de login…");
        await requestAccessToken(true);
      }
      return await fn();
    }
    throw err;
  }
};

  const _updateDatabaseFile = async (data, fileId) => {
  try {
    const body          = JSON.stringify(data, null, 2);
    const boundary      = "-------BunkerBoundary271828";
    const delimiter     = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify({ mimeType: CONFIG.DB_MIME }) +
      delimiter +
      `Content-Type: ${CONFIG.DB_MIME}\r\n\r\n` +
      body +
      closeDelimiter;

    await _withTokenRetry(() =>
        window.gapi.client.request({
          path:    `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
          method:  "PATCH",
          params:  { uploadType: "multipart", supportsAllDrives: true },
          headers: { "Content-Type": `multipart/related; boundary="${boundary}"` },
          body:    multipartBody,
        })
      );
    } catch (err) {
      throw _vaultError("UPDATE_FILE", "Error actualizando el archivo DB en Drive", err);
  }
};

const _readDatabaseFile = async (fileId) => {
  try {
    const response = await _withTokenRetry(() =>
        window.gapi.client.drive.files.get({
          fileId: fileId,
          alt:    "media",
        })
      );

      const raw = typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.result);

      return JSON.parse(raw);
    } catch (err) {
      throw _vaultError("READ_FILE", "Error leyendo el archivo DB desde Drive", err);
  }
};

// ─── SECTION 3B: QUEUE FILE OPERATIONS ───────────────────────

const _queueFilename = (userId) => `queue_${userId}.json`;

const _findQueueFile = async (userId) => {
  const folderId = import.meta.env.VITE_GOOGLE_SHARED_FOLDER_ID;
  if (!folderId) {
    throw _vaultError("MISSING_FOLDER_ID", "VITE_GOOGLE_SHARED_FOLDER_ID no está configurada.");
  }
  if (_state.queueFileIds[userId]) return _state.queueFileIds[userId];

  const filename = _queueFilename(userId);
  console.info(`[Búnker] Buscando cola de ${userId} en carpeta compartida`);

  try {
    const response = await _withTokenRetry(() =>
        window.gapi.client.drive.files.list({
          spaces: "drive",
          q:      `'${folderId}' in parents and name = '${filename}' and trashed = false`,
          fields: "files(id, name)",
          includeItemsFromAllDrives: true,
          supportsAllDrives:         true,
        })
      );


    const files = response.result.files ?? [];
    if (files.length === 0) return null;

    _state.queueFileIds[userId] = files[0].id;
    return _state.queueFileIds[userId];
  } catch (err) {
    throw _vaultError("FIND_QUEUE", `Error buscando cola de ${userId} en Drive`, err);
  }
};

const _createQueueFile = async (userId, data) => {
  const folderId = import.meta.env.VITE_GOOGLE_SHARED_FOLDER_ID;
  if (!folderId) {
    throw _vaultError("MISSING_FOLDER_ID", "VITE_GOOGLE_SHARED_FOLDER_ID no está configurada.");
  }

  try {
    const metadata = {
      name:     _queueFilename(userId),
      mimeType: CONFIG.DB_MIME,
      parents:  [folderId],
    };

    const body           = JSON.stringify(data, null, 2);
    const boundary       = "-------BunkerBoundary628318";
    const delimiter      = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${CONFIG.DB_MIME}\r\n\r\n` +
      body +
      closeDelimiter;

    const response = await window.gapi.client.request({
      path:    "https://www.googleapis.com/upload/drive/v3/files",
      method:  "POST",
      params:  { uploadType: "multipart", fields: "id", supportsAllDrives: true },
      headers: { "Content-Type": `multipart/related; boundary="${boundary}"` },
      body:    multipartBody,
    });

    _state.queueFileIds[userId] = response.result.id;
    console.info(`[Búnker] Cola de ${userId} creada en Drive ✓`);
    return _state.queueFileIds[userId];
  } catch (err) {
    throw _vaultError("CREATE_QUEUE", `Error creando cola de ${userId} en Drive`, err);
  }
};

const _updateQueueFile = async (userId, data, fileId) => {
  try {
    const body           = JSON.stringify(data, null, 2);
    const boundary       = "-------BunkerBoundary628318";
    const delimiter      = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify({ mimeType: CONFIG.DB_MIME }) +
      delimiter +
      `Content-Type: ${CONFIG.DB_MIME}\r\n\r\n` +
      body +
      closeDelimiter;

    await window.gapi.client.request({
      path:    `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
      method:  "PATCH",
      params:  { uploadType: "multipart", supportsAllDrives: true },
      headers: { "Content-Type": `multipart/related; boundary="${boundary}"` },
      body:    multipartBody,
    });
  } catch (err) {
    throw _vaultError("UPDATE_QUEUE", `Error actualizando cola de ${userId} en Drive`, err);
  }
};

// ─── SECTION 4: PUBLIC CRUD API ──────────────────────────────

/**
 * initDatabase()
 * Inicializa la DB: la crea si no existe, la migra si hay versión antigua.
 */
export const initDatabase = async () => {
  if (!isAuthenticated()) {
    throw _vaultError("NOT_AUTH", "Usuario no autenticado. Llama a requestAccessToken() primero.");
  }

  try {
    const fileId = await _findDatabaseFile();

    if (!fileId) {
      console.info("[Búnker] Primera ejecución — creando DB…");
      const freshDb = EMPTY_DB();
      await _createDatabaseFile(freshDb);
      return freshDb;
    }

    const existing = await _readDatabaseFile(fileId);
    const migrated = _migrateSchema(existing);

    if (migrated._wasMigrated) {
      delete migrated._wasMigrated;
      await _updateDatabaseFile(migrated, fileId);
      console.info("[Búnker] Esquema migrado y guardado ✓");
    }

    console.info("[Búnker] DB cargada desde Drive ✓");
    return migrated;
  } catch (err) {
    if (err.code) throw err;
    throw _vaultError("INIT_DB", "Error inicializando la base de datos", err);
  }
};

/**
 * fetchData()
 * Descarga el estado actual de la DB desde Drive.
 */
export const fetchData = async () => {
  if (!isAuthenticated()) {
    throw _vaultError("NOT_AUTH", "Usuario no autenticado.");
  }

  try {
    const fileId = await _findDatabaseFile();
    if (!fileId) {
      throw _vaultError("NO_DB", "DB no encontrada. Llama a initDatabase() primero.");
    }
    return await _readDatabaseFile(fileId);
  } catch (err) {
    if (err.code) throw err;
    throw _vaultError("FETCH_DATA", "Error obteniendo datos desde Drive", err);
  }
};

/**
 * updateData(updater)
 * Patrón read-modify-write seguro.
 * @param {Function} updater — fn(currentDb) => newDb
 */
export const updateData = async (updater) => {
  if (!isAuthenticated()) {
    throw _vaultError("NOT_AUTH", "Usuario no autenticado.");
  }
  if (typeof updater !== "function") {
    throw _vaultError("INVALID_UPDATER", "updateData() requiere una función como argumento.");
  }

  try {
    const fileId  = await _findDatabaseFile();
    if (!fileId) {
      throw _vaultError("NO_DB", "DB no encontrada. Llama a initDatabase() primero.");
    }

    const current = await _readDatabaseFile(fileId);
    const updated = updater(current);

    if (!updated || typeof updated !== "object") {
      throw _vaultError("INVALID_UPDATE", "La función updater debe retornar un objeto válido.");
    }

    updated.updated_at = new Date().toISOString();

    await _updateDatabaseFile(updated, fileId);
    console.info("[Búnker] DB actualizada en Drive ✓");
    return updated;
  } catch (err) {
    if (err.code) throw err;
    throw _vaultError("UPDATE_DATA", "Error actualizando la base de datos", err);
  }
};

// ─── SECTION 5: HEARTBEAT (cuenta principal) ─────────────────

const _triggerHeartbeat = async () => {
  const now = Date.now();

  if (now - _state.lastHeartbeat < CONFIG.HEARTBEAT_THROTTLE_MS) {
    console.info("[Búnker] Heartbeat throttled — aún no es necesario");
    return;
  }

  try {
    const fileId = await _findDatabaseFile();
    if (!fileId) {
      console.info("[Búnker] Heartbeat omitido — DB aún no creada");
      return;
    }

    const current = await _readDatabaseFile(fileId);
    const updated = {
      ...current,
      heartbeat:  new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await _updateDatabaseFile(updated, fileId);
    _state.lastHeartbeat = now;

    console.info(`[Búnker] 💚 Heartbeat registrado: ${updated.heartbeat}`);
  } catch (err) {
    console.warn("[Búnker] Heartbeat falló silenciosamente:", err);
  }
};

export const triggerHeartbeat = () => _triggerHeartbeat();

// ─── SECTION 6: SCHEMA MIGRATION ─────────────────────────────

const _migrateSchema = (data) => {
  const version = data.schema_version ?? "0.0.0";
  if (version === CONFIG.SCHEMA_VERSION) return data;

  console.info(`[Búnker] Migrando esquema ${version} → ${CONFIG.SCHEMA_VERSION}`);

  let migrated = { ...data };

  // ── 0.0.0 → 1.0.0: campos base ──────────────────────────────
  if (!migrated.schema_version) {
    migrated = {
      ...EMPTY_DB(),
      ...migrated,
      schema_version: "1.0.0",
      music_lab: {
        tracks: migrated.music_lab?.tracks ?? [],
        drops:  migrated.music_lab?.drops  ?? [],
      },
    };
  }

  // ── 1.0.0 → 2.0.0: campo libraries ──────────────────────────
  if (migrated.schema_version === "1.0.0") {
    migrated = {
      ...migrated,
      libraries:      migrated.libraries ?? [],
      schema_version: "2.0.0",
    };
  }

  // ── 2.0.0 → 3.0.0: campos from/to en entries ────────────────
  // Añade from:"admin" y to:"both" en entradas existentes que no lo tengan.
  if (migrated.schema_version === "2.0.0") {
    migrated = {
      ...migrated,
      entries: (migrated.entries ?? []).map((e) => ({
        ...e,
        from: e.from ?? "admin",
        to:   e.to   ?? "both",
      })),
      schema_version: "3.0.0",
    };
  }

  // ── 3.0.0 → 3.1.0: campos vibe, thumbnail, play_count, last_played en tracks
  if (migrated.schema_version === "3.0.0") {
    migrated = {
      ...migrated,
      music_lab: {
        ...migrated.music_lab,
        tracks: (migrated.music_lab?.tracks ?? []).map((t) => ({
          ...t,
          vibe:        t.vibe        ?? null,
          thumbnail:   t.thumbnail   ?? null,
          play_count:  t.play_count  ?? 0,
          last_played: t.last_played ?? null,
        })),
      },
      schema_version: "3.1.0",
    };
  }
  if (migrated.schema_version === "3.1.0") {
    migrated = {
      ...migrated,
      music_lab: {
        ...migrated.music_lab,
        playlists: migrated.music_lab?.playlists ?? [],
      },
      schema_version: "3.2.0",
    };
  }
  // ── 3.2.0 → 3.3.0: campos type y drive_file_id en tracks ─────
  if (migrated.schema_version === "3.2.0") {
    migrated = {
      ...migrated,
      music_lab: {
        ...migrated.music_lab,
        tracks: (migrated.music_lab?.tracks ?? []).map((t) => ({
          ...t,
          type:          t.type          ?? "youtube",
          drive_file_id: t.drive_file_id ?? null,
          youtube_url:   t.youtube_url   ?? t.url ?? null,
        })),
      },
      schema_version: "3.3.0",
    };
  }
    // ── 3.3.0 → 3.4.0: campos favorited y favorited_by en drops ──
  if (migrated.schema_version === "3.3.0") {
    migrated = {
      ...migrated,
      music_lab: {
        ...migrated.music_lab,
        drops: (migrated.music_lab?.drops ?? []).map((d) => ({
          ...d,
          from:         d.from         ?? null,
          to:           d.to           ?? null,
          favorited:    d.favorited    ?? false,
          favorited_by: d.favorited_by ?? null,
        })),
      },
      schema_version: "3.4.0",
    };
  }

  // ── 3.4.0 → 4.0.0: extirpación YT — purgar tracks y drops ──
  if (migrated.schema_version === "3.4.0") {
    migrated = {
      ...migrated,
      music_lab: {
        ...migrated.music_lab,
        tracks: [],
        drops:  [],
      },
      schema_version: "4.0.0",
    };
  }

  migrated.schema_version = CONFIG.SCHEMA_VERSION;
  migrated._wasMigrated   = true;
  return migrated;

};

// ─── SECTION 7: BIBLIOTECA HEARTBEAT & STATUS ────────────────

/**
 * _calcLibraryStatus(lastHeartbeatCheck)
 *
 * Calcula el estado de una biblioteca según los meses
 * transcurridos desde su último heartbeat manual.
 * Solo aritmética de fechas — no hace ninguna llamada de red.
 *
 * @param {string | null} lastHeartbeatCheck — ISO string o null
 * @returns {"active" | "at_risk" | "lost"}
 */
export const _calcLibraryStatus = (lastHeartbeatCheck) => {
  if (!lastHeartbeatCheck) return "at_risk"; // nunca registrado → alerta inmediata

  const diffMs     = Date.now() - new Date(lastHeartbeatCheck).getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);

  if (diffMonths >= CONFIG.LIBRARY_LOST_MONTHS)    return "lost";
  if (diffMonths >= CONFIG.LIBRARY_AT_RISK_MONTHS)  return "at_risk";
  return "active";
};

/**
 * addLibrary(libraryData)
 * Añade una cuenta biblioteca al JSON de la DB.
 *
 * @param {{ email, type, label, shared_folder_id, capacity_gb }} libraryData
 * @returns {Promise<object>} — la biblioteca creada
 */
export const addLibrary = async (libraryData) => {
  if (!libraryData.email || !libraryData.shared_folder_id) {
    throw _vaultError("INVALID_LIBRARY", "addLibrary() requiere email y shared_folder_id.");
  }

  const newLibrary = {
    id:                   uuid(),
    email:                libraryData.email,
    type:                 libraryData.type         ?? "mixed",
    label:                libraryData.label        ?? libraryData.email,
    shared_folder_id:     libraryData.shared_folder_id,
    capacity_gb:          libraryData.capacity_gb  ?? 15,
    added_at:             new Date().toISOString(),
    last_heartbeat_check: null,
    status:               "at_risk", // Sin heartbeat todavía → at_risk por defecto
  };

  await updateData((db) => ({
    ...db,
    libraries: [...(db.libraries ?? []), newLibrary],
  }));

  console.info(`[Búnker] Biblioteca añadida: ${newLibrary.label}`);
  return newLibrary;
};

/**
 * updateLibrary(id, patch)
 * Actualiza campos sueltos de una biblioteca existente.
 *
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object>} — la biblioteca actualizada
 */
export const updateLibrary = async (id, patch) => {
  let updatedLibrary = null;

  await updateData((db) => ({
    ...db,
    libraries: (db.libraries ?? []).map((lib) => {
      if (lib.id !== id) return lib;
      updatedLibrary = { ...lib, ...patch, id };
      return updatedLibrary;
    }),
  }));

  if (!updatedLibrary) {
    throw _vaultError("LIB_NOT_FOUND", `Biblioteca ${id} no encontrada`);
  }
  return updatedLibrary;
};

/**
 * removeLibrary(id)
 * Elimina una biblioteca de la lista (no toca Drive).
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export const removeLibrary = async (id) => {
  await updateData((db) => ({
    ...db,
    libraries: (db.libraries ?? []).filter((lib) => lib.id !== id),
  }));
  console.info(`[Búnker] Biblioteca ${id} eliminada`);
};

/**
 * markLibraryHeartbeat(id)
 * El admin pulsa "acabo de entrar a esta cuenta".
 * Fija last_heartbeat_check = ahora y recalcula status → "active".
 *
 * @param {string} id
 * @returns {Promise<object>} — la biblioteca actualizada
 */
export const markLibraryHeartbeat = async (id) => {
  const now = new Date().toISOString();
  return updateLibrary(id, {
    last_heartbeat_check: now,
    status:               "active",
  });
};

// ─── SECTION 8: BIBLIOTECA — LISTADO Y USO VÍA DRIVE API ─────

/**
 * listLibraryContents(sharedFolderId)
 *
 * Lista todos los archivos de una carpeta compartida usando el
 * token de la cuenta principal (sin login adicional).
 * Pagina automáticamente hasta obtener todos los resultados.
 *
 * @param {string} sharedFolderId — ID de la carpeta compartida
 * @returns {Promise<Array>} — lista de archivos { id, name, size, mimeType, createdTime }
 */
export const listLibraryContents = async (sharedFolderId) => {
  if (!isAuthenticated()) {
    throw _vaultError("NOT_AUTH", "Usuario no autenticado.");
  }

  const allFiles   = [];
  let   pageToken  = null;

  try {
    do {
      const params = {
        q:                         `'${sharedFolderId}' in parents and trashed = false`,
        fields:                    "nextPageToken, files(id, name, size, mimeType, createdTime)",
        // Imprescindible para acceder a carpetas de otras cuentas compartidas
        includeItemsFromAllDrives: true,
        supportsAllDrives:         true,
        pageSize:                  1000,
      };
      if (pageToken) params.pageToken = pageToken;

      const response = await window.gapi.client.drive.files.list(params);
      const result   = response.result;

      allFiles.push(...(result.files ?? []));
      pageToken = result.nextPageToken ?? null;
    } while (pageToken);

    return allFiles;
  } catch (err) {
    throw _vaultError(
      "LIST_LIBRARY",
      `Error listando la carpeta compartida ${sharedFolderId}`,
      err
    );
  }
};

/**
 * calculateLibraryUsage(sharedFolderId)
 *
 * Suma el tamaño de todos los archivos de la carpeta compartida.
 *
 * @param {string} sharedFolderId
 * @returns {Promise<{ used_bytes: number, used_gb: number, file_count: number }>}
 */
export const calculateLibraryUsage = async (sharedFolderId) => {
  const files      = await listLibraryContents(sharedFolderId);
  const used_bytes = files.reduce((acc, f) => acc + Number(f.size ?? 0), 0);

  return {
    used_bytes,
    used_gb:    parseFloat((used_bytes / (1024 ** 3)).toFixed(2)),
    file_count: files.length,
  };
};

/**
 * checkLibraryCapacity(library)
 *
 * Comprueba si una biblioteca supera el umbral de capacidad.
 * Retorna el porcentaje usado y si se debe mostrar alerta.
 *
 * @param {{ shared_folder_id, capacity_gb }} library
 * @returns {Promise<{ used_gb, used_pct, near_full, file_count }>}
 */
export const checkLibraryCapacity = async (library) => {
  const { used_gb, file_count } = await calculateLibraryUsage(library.shared_folder_id);
  const capacity_gb = library.capacity_gb ?? 15;
  const used_pct    = parseFloat(((used_gb / capacity_gb) * 100).toFixed(1));
  const near_full   = used_pct >= CONFIG.LIBRARY_ALERT_THRESHOLD_PCT;

  return { used_gb, used_pct, near_full, file_count };
};

// ─── SECTION 9: CONVENIENCE HELPERS ──────────────────────────

/**
 * addEra(eraData)
 * Añade una nueva Era a la lista.
 */
export const addEra = async (eraData) => {
  const newEra = {
    id:          uuid(),
    name:        eraData.name        ?? "Nueva Era",
    description: eraData.description ?? "",
    start_date:  eraData.start_date  ?? new Date().toISOString(),
    end_date:    eraData.end_date    ?? null,
    color:       eraData.color       ?? "#bfff00",
    cover_image: eraData.cover_image ?? null,
    created_at:  new Date().toISOString(),
  };

  await updateData((db) => ({ ...db, eras: [...db.eras, newEra] }));
  return newEra;
};

/**
 * updateEra(eraId, patch)
 * Actualiza campos específicos de una Era existente.
 */
export const updateEra = async (eraId, patch) => {
  let updatedEra = null;

  await updateData((db) => ({
    ...db,
    eras: db.eras.map((era) => {
      if (era.id !== eraId) return era;
      updatedEra = { ...era, ...patch, id: eraId };
      return updatedEra;
    }),
  }));

  if (!updatedEra) throw _vaultError("ERA_NOT_FOUND", `Era ${eraId} no encontrada`);
  return updatedEra;
};

/**
 * addEntry(entryData)
 * Crea una nueva entrada con soporte de destinatario.
 *
 * @param {{ era_id, type, content, tags, from, to }} entryData
 *   from: "edu" | "david" | "admin"  — autor
 *   to:   "edu" | "david" | "both"   — destinatario
 */
export const addEntry = async (entryData) => {
  const now = new Date().toISOString();
  const newEntry = {
    id:         uuid(),
    era_id:     entryData.era_id  ?? null,
    type:       entryData.type    ?? "note",
    content:    entryData.content ?? {},
    tags:       entryData.tags    ?? [],
    from:       entryData.from    ?? "admin",  // ← quién lo crea
    to:         entryData.to      ?? "both",   // ← a quién va dirigido
    created_at: now,
    updated_at: now,
  };

  await updateData((db) => ({ ...db, entries: [...db.entries, newEntry] }));
  return newEntry;
};

/**
 * addTrack(trackData)
 * Añade una canción al Music Lab.
 */
export const addTrack = async (trackData) => {
  const newTrack = {
    id:            uuid(),
    era_id:        trackData.era_id        ?? null,
    title:         trackData.title         ?? "Sin título",
    artist:        trackData.artist        ?? "",
    drive_file_id: trackData.drive_file_id ?? null,
    tag:           trackData.tag           ?? null,
    tags:          trackData.tags          ?? [],
    thumbnail:     trackData.thumbnail     ?? null,
    format:        trackData.format        ?? "mp3",
    note:          trackData.note          ?? "",
    play_count:    0,
    last_played:   null,
    added_at:      new Date().toISOString(),
  };

  await updateData((db) => ({
    ...db,
    music_lab: {
      ...db.music_lab,
      tracks: [...(db.music_lab?.tracks ?? []), newTrack],
    },
  }));
  return newTrack;
};

/**
 * addDrop(dropData)
 * Registra un "drop" — momento especial ligado a una canción.
 */
export const addDrop = async (dropData) => {
  const now = new Date().toISOString();
  const newDrop = {
    id:         uuid(),
    era_id:     dropData.era_id   ?? null,
    track_id:   dropData.track_id ?? null,
    memory:     dropData.memory   ?? "",
    mood:       dropData.mood     ?? "",
    date:       dropData.date     ?? now,
    created_at: now,
  };

  await updateData((db) => ({
    ...db,
    music_lab: {
      ...db.music_lab,
      drops: [...(db.music_lab?.drops ?? []), newDrop],
    },
  }));
  return newDrop;
};

/**
 * removeTrack(trackId)
 * Elimina un track del Music Lab por id.
 */
export const removeTrack = async (trackId) => {
  await updateData((db) => ({
    ...db,
    music_lab: {
      ...db.music_lab,
      tracks: (db.music_lab?.tracks ?? []).filter((t) => t.id !== trackId),
    },
  }));
  console.info(`[Búnker] Track ${trackId} eliminado`);
};

/**
 * updateTrack(trackId, patch)
 * Actualiza campos sueltos de un track existente.
 *
 * @param {string} trackId
 * @param {object} patch
 * @returns {Promise<object>} — el track actualizado
 */
export const updateTrack = async (trackId, patch) => {
  let updatedTrack = null;
  await updateData((db) => ({
    ...db,
    music_lab: {
      ...db.music_lab,
      tracks: (db.music_lab?.tracks ?? []).map((t) => {
        if (t.id !== trackId) return t;
        updatedTrack = { ...t, ...patch, id: trackId };
        return updatedTrack;
      }),
    },
  }));
  if (!updatedTrack) throw _vaultError("TRACK_NOT_FOUND", `Track ${trackId} no encontrado`);
  return updatedTrack;
};

// ─── SECTION 10: QUEUE PUBLIC API ────────────────────────────────────────────

/**
 * fetchQueue(userId)
 * Descarga la cola del usuario desde Drive.
 * Si no existe el archivo, devuelve [] sin error.
 *
 * @param {string} userId — "edu" | "david" | "admin"
 * @returns {Promise<string[]>} — array de track_ids
 */
export const fetchQueue = async (userId) => {
  if (!isAuthenticated()) {
    throw _vaultError("NOT_AUTH", "Usuario no autenticado.");
  }
  if (!userId) {
    throw _vaultError("INVALID_USER", "fetchQueue() requiere un userId.");
  }

  try {
    const fileId = await _findQueueFile(userId);
    if (!fileId) return [];

    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt:    "media",
    });

    const raw  = typeof response.body === "string"
      ? response.body
      : JSON.stringify(response.result);
    const data = JSON.parse(raw);
    return Array.isArray(data.track_ids) ? data.track_ids : [];
  } catch (err) {
    if (err.code) throw err;
    throw _vaultError("FETCH_QUEUE", `Error obteniendo cola de ${userId} desde Drive`, err);
  }
};

/**
 * saveQueue(userId, trackIds)
 * Persiste la cola del usuario en Drive.
 * Crea el archivo si no existe. Comportamiento optimista: el caller
 * no espera esta promesa para actualizar la UI.
 *
 * @param {string}   userId   — "edu" | "david" | "admin"
 * @param {string[]} trackIds — array ordenado de track_ids
 * @returns {Promise<void>}
 */
export const saveQueue = async (userId, trackIds) => {
  if (!isAuthenticated()) {
    throw _vaultError("NOT_AUTH", "Usuario no autenticado.");
  }
  if (!userId) {
    throw _vaultError("INVALID_USER", "saveQueue() requiere un userId.");
  }

  const data = {
    user_id:    userId,
    track_ids:  Array.isArray(trackIds) ? trackIds : [],
    updated_at: new Date().toISOString(),
  };

  try {
    let fileId = await _findQueueFile(userId);
    if (!fileId) {
      await _createQueueFile(userId, data);
    } else {
      await _updateQueueFile(userId, data, fileId);
    }
    console.info(`[Búnker] Cola de ${userId} guardada ✓ (${data.track_ids.length} tracks)`);
  } catch (err) {
    if (err.code) throw err;
    throw _vaultError("SAVE_QUEUE", `Error guardando cola de ${userId} en Drive`, err);
  }
};

/**
 * clearQueue(userId)
 * Vacía la cola del usuario (guarda array vacío, no borra el archivo).
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const clearQueue = async (userId) => {
  return saveQueue(userId, []);
};

const GoogleDriveService = {
  // Init
  initGoogleServices,
  // Auth
  requestAccessToken,
  signOut,
  isAuthenticated,
  onAuthChange,
  // Control de acceso por usuario
  resolveUser,
  isAuthorizedEmail,
  // Core CRUD
  initDatabase,
  fetchData,
  updateData,
  // Heartbeat cuenta principal
  triggerHeartbeat,
  // Bibliotecas — gestión
  addLibrary,
  updateLibrary,
  removeLibrary,
  markLibraryHeartbeat,
  _calcLibraryStatus,
  // Bibliotecas — lectura Drive
  listLibraryContents,
  calculateLibraryUsage,
  checkLibraryCapacity,
  // Helpers
  addEra,
  updateEra,
  addEntry,
  addTrack,
  addDrop,
  // Queue por usuario (ADR-002 Opción B)
  fetchQueue,
  saveQueue,
  clearQueue,
  // Playlists
  fetchPlaylists,
  createPlaylist,
  addTrackToPlaylist,
  deletePlaylist,
};
// ─── SECTION 11: PLAYLISTS PUBLIC API ────────────────────────

/**
 * fetchPlaylists()
 * Devuelve todas las playlists de la DB.
 * @returns {Promise<Array>}
 */
export const fetchPlaylists = async () => {
  const db = await fetchData();
  return db.music_lab?.playlists ?? [];
};

/**
 * createPlaylist(name, createdBy)
 * Crea una playlist vacía.
 * @param {string} name
 * @param {string} createdBy — userId del creador
 * @returns {Promise<object>} — la playlist creada
 */
export const createPlaylist = async (name, createdBy) => {
  if (!name?.trim()) {
    throw _vaultError("INVALID_PLAYLIST", "createPlaylist() requiere un nombre.");
  }
  const now = new Date().toISOString();
  const newPlaylist = {
    id:         uuid(),
    name:       name.trim(),
    track_ids:  [],
    created_by: createdBy ?? "admin",
    created_at: now,
    updated_at: now,
  };

  await updateData((db) => ({
    ...db,
    music_lab: {
      ...db.music_lab,
      playlists: [...(db.music_lab?.playlists ?? []), newPlaylist],
    },
  }));
  return newPlaylist;
};

/**
 * addTrackToPlaylist(playlistId, trackId)
 * Añade un track a una playlist. Idempotente: no duplica si ya existe.
 * @param {string} playlistId
 * @param {string} trackId
 * @returns {Promise<object>} — la playlist actualizada
 */
export const addTrackToPlaylist = async (playlistId, trackId) => {
  let updated = null;

  await updateData((db) => ({
    ...db,
    music_lab: {
      ...db.music_lab,
      playlists: (db.music_lab?.playlists ?? []).map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.track_ids.includes(trackId)) return pl;
        updated = {
          ...pl,
          track_ids:  [...pl.track_ids, trackId],
          updated_at: new Date().toISOString(),
        };
        return updated;
      }),
    },
  }));

  if (!updated) throw _vaultError("PLAYLIST_NOT_FOUND", `Playlist ${playlistId} no encontrada`);
  return updated;
};

/**
 * deletePlaylist(playlistId)
 * Elimina una playlist por id.
 * @param {string} playlistId
 * @returns {Promise<void>}
 */
export const deletePlaylist = async (playlistId) => {
  const db = await fetchData();
  const playlist = (db.music_lab?.playlists ?? []).find((pl) => pl.id === playlistId);

  if (!playlist) {
    throw _vaultError("PLAYLIST_NOT_FOUND", `Playlist ${playlistId} no encontrada`);
  }

  await updateData((db) => ({
    ...db,
    music_lab: {
      ...db.music_lab,
      playlists: (db.music_lab?.playlists ?? []).filter((pl) => pl.id !== playlistId),
    },
  }));
};

export const uploadMusicFile = async (file) => {
  const folderId = import.meta.env.VITE_GOOGLE_SHARED_FOLDER_ID;
  if (!folderId) throw _vaultError("MISSING_FOLDER_ID", "VITE_GOOGLE_SHARED_FOLDER_ID no configurada.");

  const token = window.gapi.client.getToken()?.access_token;
  if (!token) throw _vaultError("NO_TOKEN", "No hay token OAuth2 activo.");

  const metadata = {
    name:    file.name,
    mimeType: file.type || "audio/mpeg",
    parents: [folderId],
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    form,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw _vaultError("UPLOAD_MUSIC", `Error subiendo archivo a Drive: ${response.status}`, err);
  }

  const result = await response.json();
  console.info(`[Búnker] Archivo de música subido ✓ (fileId: ${result.id})`);
  return result.id;
};
const R2_PUBLIC_BASE = "https://el-bunker-r2-proxy.thebunker-admin.workers.dev";

export const getStreamUrl = (track) => {
  if (!track) return null;

  // R2 — URL pública directa (ADR-010, Opción A reproducción)
  if (track.r2_key) {
    return `${R2_PUBLIC_BASE}/${track.r2_key}`;
  }

  // Drive — fallback para tracks legacy sin r2_key
  const token = window.gapi.client.getToken()?.access_token;
  if (!token || !track.drive_file_id) return null;
  return `https://www.googleapis.com/drive/v3/files/${track.drive_file_id}?alt=media&access_token=${token}`;
};

// ─── DEFAULT EXPORT ───────────────────────────────────────────────────────────
export default GoogleDriveService;
