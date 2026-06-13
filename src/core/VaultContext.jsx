// ============================================================
//  EL BÚNKER — VaultContext.jsx
//  Global State Provider · Google Drive Sync · Heartbeat Engine
//  v3.0.0 — Multi-usuario · Bibliotecas · Alertas de capacidad
// ============================================================

/* eslint-disable react-hooks/immutability, react-hooks/preserve-manual-memoization */
// ^ Funciones useCallback definidas después del useEffect que las
//   consume (boot en mount). El orden es intencional para legibilidad.
//   No refactorizar sin tests.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import GoogleDriveService, {
  initGoogleServices,
  requestAccessToken,
  restoreToken,  
  signOut,
  isAuthenticated,
  onAuthChange,
  initDatabase,
  fetchData,
  updateData,
  triggerHeartbeat,
  // Control de acceso
  resolveUser,
  isAuthorizedEmail,
  // Bibliotecas
  addLibrary   as svcAddLibrary,
  updateLibrary as svcUpdateLibrary,
  removeLibrary as svcRemoveLibrary,
  markLibraryHeartbeat as svcMarkLibraryHeartbeat,
  listLibraryContents,
  checkLibraryCapacity,
  _calcLibraryStatus,
} from "./GoogleDriveService";
import { setUploadToken } from "./FileUploadService";
import { setStatsToken } from "./StatsEngine";

// ─── WORKER API URL ─────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

// ─── CONTEXT SHAPE ───────────────────────────────────────────
/**
 * VaultContextValue
 * {
 *   // Auth
 *   user:            { name, email, avatar, role, id } | null,
 *   isLoading:       boolean,
 *   authStatus:      "idle"|"loading"|"authenticated"|"error"|"unauthorized",
 *   bootError:       string | null,
 *
 *   // Database
 *   db:              VaultDB | null,
 *   dbStatus:        "OFFLINE"|"SYNCING"|"ONLINE"|"ERROR",
 *   lastHeartbeat:   ISO string | null,
 *
 *   // Navegación
 *   activeTab:       string,
 *   setActiveTab:    (tab: string) => void,
 *
 *   // Música
 *   masterVolume:    number,
 *   setMasterVolume: (v: number) => void,
 *
 *   // Entradas filtradas por usuario actual
 *   myEntries:       Entry[],   — entradas dirigidas al usuario actual (to === userId | "both")
 *   myMessages:      Entry[],   — solo type "letter" dirigidas al usuario actual
 *
 *   // Bibliotecas (con status calculado automáticamente)
 *   libraries:          Library[],
 *   librariesAtRisk:    Library[],   — status "at_risk"
 *   librariesLost:      Library[],   — status "lost"
 *   librariesNearFull:  Library[],   — near_full según capacidad (requiere checkLibraryCapacity)
 *
 *   // Acciones core
 *   login:           () => Promise<void>,
 *   logout:          () => Promise<void>,
 *   refreshDb:       () => Promise<void>,
 *   patchDb:         (updater: fn) => Promise<void>,
 *   heartbeat:       () => Promise<void>,
 *
 *   // Acciones de biblioteca
 *   addLibrary:              (data) => Promise<Library>,
 *   updateLibrary:           (id, patch) => Promise<Library>,
 *   removeLibrary:           (id) => Promise<void>,
 *   markLibraryHeartbeat:    (id) => Promise<Library>,
 *   getLibraryContents:      (sharedFolderId) => Promise<File[]>,
 *   refreshLibraryCapacity:  (library) => Promise<CapacityInfo>,
 * }
 */

const VaultContext = createContext(null);

// ─── BOOT PHASES ─────────────────────────────────────────────
const BOOT = Object.freeze({
  IDLE:          "idle",
  INIT_SERVICES: "init_services",
  INIT_DB:       "init_db",
  READY:         "ready",
  UNAUTHORIZED:  "unauthorized",  // ← NUEVO: email no en la lista blanca
  ERROR:         "error",
});

// ─── PROVIDER ────────────────────────────────────────────────
export function VaultProvider({ children }) {

  // ── State ─────────────────────────────────────────────────
  const [bootPhase,     setBootPhase]     = useState(BOOT.IDLE);
  const [user,          setUser]          = useState(null);   // { name, email, avatar, role, id }
  const [db,            setDb]            = useState(null);
  const [dbStatus,      setDbStatus]      = useState("OFFLINE");
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [activeTab,     setActiveTab]     = useState("vault");
  const [masterVolume,  setMasterVolume]  = useState(80);
  const [bootError,     setBootError]     = useState(null);
  const [pendingDrop,   setPendingDrop]   = useState(null);
  // JWT para Worker API (ADR-024) — persistido en localStorage
  const [jwtToken,      setJwtToken]      = useState(() => {
    try { return localStorage.getItem("bunker_jwt") || null; }
    catch { return null; }
  });

  // Cache de capacidad por biblioteca { [libraryId]: { used_gb, used_pct, near_full } }
  const [libraryCapacity, setLibraryCapacity] = useState({});

  const hbTimerRef = useRef(null);

  // ── Derived: authStatus ───────────────────────────────────
  const authStatus =
    bootPhase === BOOT.IDLE          ? "idle"          :
    bootPhase === BOOT.INIT_SERVICES ? "loading"       :
    bootPhase === BOOT.INIT_DB       ? "loading"       :
    bootPhase === BOOT.READY         ? "authenticated" :
    bootPhase === BOOT.UNAUTHORIZED  ? "unauthorized"  :
    "error";

  const isLoadingApp =
    bootPhase === BOOT.INIT_SERVICES ||
    bootPhase === BOOT.INIT_DB;

  // ── Derived: bibliotecas con status recalculado ───────────
  /**
   * Recalcula el status de cada biblioteca en cada render
   * basándose únicamente en fechas (sin red).
   */
  const libraries = useMemo(() => {
    if (!db?.libraries) return [];
    return db.libraries.map((lib) => ({
      ...lib,
      status: _calcLibraryStatus(lib.last_heartbeat_check),
    }));
  }, [db?.libraries]);

  /** Bibliotecas en riesgo de inactividad (18-22 meses sin heartbeat). */
  const librariesAtRisk = useMemo(
    () => libraries.filter((l) => l.status === "at_risk"),
    [libraries]
  );

  /** Bibliotecas presumiblemente cerradas por Google (≥23 meses). */
  const librariesLost = useMemo(
    () => libraries.filter((l) => l.status === "lost"),
    [libraries]
  );

  /**
   * Bibliotecas con capacidad casi agotada.
   * Solo las que tengamos en el cache de capacidad.
   */
  const librariesNearFull = useMemo(
    () => libraries.filter((l) => libraryCapacity[l.id]?.near_full === true),
    [libraries, libraryCapacity]
  );

  // ── Derived: entradas filtradas por usuario actual ────────
  /**
   * myEntries — todas las entradas dirigidas al usuario actual
   * (to === userId || to === "both")
   */
  const myEntries = useMemo(() => {
    if (!db?.entries || !user) return [];
    return db.entries.filter(
      (e) => e.to === "both" || e.to === user.id
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db?.entries, user?.id]);

  /**
   * myMessages — solo type "letter" dirigidas al usuario actual
   * (cartas de Edu a David y viceversa)
   */
  const myMessages = useMemo(
    () => myEntries.filter((e) => e.type === "letter"),
    [myEntries]
  );

  // ── Step 1: Init Google Services on mount ─────────────────
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setBootPhase(BOOT.INIT_SERVICES);
      try {
        await initGoogleServices();
        if (cancelled) return;

        onAuthChange(({ event, token, error }) => {
          if (event === "SIGNED_IN"  && !cancelled) _onSignedIn(token);
          if (event === "SIGNED_OUT" && !cancelled) _onSignedOut();
          if (event === "AUTH_ERROR" && !cancelled) {
            console.error("[Búnker] Auth error:", error);
            setBootPhase(BOOT.ERROR);
            setBootError(error?.error_description ?? "Error de autenticación");
          }
        });

        if (isAuthenticated()) {
          await _fetchUserAndDb();
        } else if (restoreToken()) {
          await _fetchUserAndDb();
        } else {
          setBootPhase(BOOT.IDLE);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[Búnker] Boot failed:", err);
          setBootPhase(BOOT.ERROR);
          setBootError(err.message ?? "No se pudieron cargar los servicios de Google.");
        }
      }
    };

    boot();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── JWT helper: obtener token del Worker API ───────────────
  const _fetchJwt = useCallback(async (email, googleToken) => {
    if (!email || !googleToken) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, google_token: googleToken }),
      });
      if (!res.ok) {
        console.warn("[Búnker] JWT login failed:", res.status);
        return null;
      }
      const { token } = await res.json();
      if (token) {
        setJwtToken(token);
        localStorage.setItem("bunker_jwt", token);
        setUploadToken(token);
        setStatsToken(token);
        console.info("[Búnker] JWT obtenido ✓");
        return token;
      }
      return null;
    } catch (e) {
      console.warn("[Búnker] JWT fetch error:", e.message);
      return null;
    }
  }, []);

  // ── S64: Worker API como fuente PRIMARIA ───────────────────

  /**
   * _buildDbFromWorker(token)
   * Construye el objeto db completo desde Worker API (D1).
   * Fetch en paralelo de entries, eras, tracks, tags, playlists, drops.
   * Retorna null si falla (el caller usa Drive JSON como fallback).
   */
  const _buildDbFromWorker = useCallback(async (token) => {
    if (!token) return null;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [entries, eras, tracks, tags, playlists, drops, files] = await Promise.all([
        fetch(`${API_BASE}/api/entries`, { headers }).then(r => r.ok ? r.json() : Promise.reject(`entries ${r.status}`)),
        fetch(`${API_BASE}/api/eras`, { headers }).then(r => r.ok ? r.json() : Promise.reject(`eras ${r.status}`)),
        fetch(`${API_BASE}/api/tracks`, { headers }).then(r => r.ok ? r.json() : Promise.reject(`tracks ${r.status}`)),
        fetch(`${API_BASE}/api/tags`, { headers }).then(r => r.ok ? r.json() : Promise.reject(`tags ${r.status}`)),
        fetch(`${API_BASE}/api/playlists`, { headers }).then(r => r.ok ? r.json() : Promise.reject(`playlists ${r.status}`)),
        fetch(`${API_BASE}/api/drops`, { headers }).then(r => r.ok ? r.json() : Promise.reject(`drops ${r.status}`)),
        // S64 audit: añadir /api/files al export — antes faltaba en el JSON
        // de backup, así que los file metadata de R2 nunca se capturaban.
        // S64c: .catch silencia la falla para no tumbar los otros 6 endpoints,
        // deja warn en consola (breadcrumb de debugging) y files=[] como fallback
        // hasta el próximo refresh.
        fetch(`${API_BASE}/api/files`, { headers }).then(r => r.ok ? r.json() : Promise.reject(`files ${r.status}`)).catch((e) => { console.warn("[Búnker] /api/files failed (non-fatal):", e); return []; }),
      ]);
      const safeParse = (v) => {
        if (typeof v !== "string") return v;
        try { return JSON.parse(v); } catch { return v; }
      };
      const parsedEntries = (entries || []).map((e) => ({
        ...e,
        content: safeParse(e.content),
        // S64 audit: mapear from_user→from, to_user→to para compatibilidad frontend
        from: e.from_user || e.from,
        to: e.to_user || e.to,
      }));
      console.info("[Búnker] Worker DB built:", { entries: entries.length, eras: eras.length, tracks: tracks.length, tags: tags.length, playlists: playlists.length, drops: drops.length, files: files.length });
      return {
        entries: parsedEntries,
        eras: eras || [],
        music_lab: {
          tracks: tracks || [],
          tags: tags || [],
          playlists: playlists || [],
          // S64 audit: mapear from_user→from, to_user→to en drops
          drops: (drops || []).map(d => ({ ...d, from: d.from_user || d.from, to: d.to_user || d.to })),
        },
        // S64 audit: añadir files al export (top-level, junto a entries/eras).
        // Antes faltaba — el JSON de backup nunca capturó file metadata de R2.
        files: files || [],
        libraries: [],
        schema_version: "5.0.0",
        heartbeat: new Date().toISOString(),
        adventures_start_date: new Date().toISOString(),
      };
    } catch (e) {
      console.warn("[Búnker] Worker DB build failed:", e);
      return null;
    }
  }, []);

  /**
   * _loadDriveComplement(db)
   * Carga desde Drive JSON SOLO los campos que Worker no tiene:
   * libraries, heartbeat, adventures_start_date.
   * Modifica el objeto db in-place. No lanza — si falla, usa defaults.
   */
  const _loadDriveComplement = useCallback(async (db) => {
    try {
      const driveData = await fetchData();
      if (driveData) {
        db.libraries = driveData.libraries ?? [];
        db.heartbeat = driveData.heartbeat ?? db.heartbeat;
        db.adventures_start_date = driveData.adventures_start_date ?? db.adventures_start_date;
        db.schema_version = driveData.schema_version ?? db.schema_version;
        console.info("[Búnker] Drive complement loaded:", { libraries: db.libraries.length });
      }
    } catch (e) {
      console.warn("[Búnker] Drive complement failed, using defaults:", e.message);
    }
    return db;
  }, []);

  // ── Restaurar JWT de localStorage al montar ───────────────
  useEffect(() => {
    const saved = (() => {
      try { return localStorage.getItem("bunker_jwt") || null; }
      catch { return null; }
    })();
    if (saved) {
      setUploadToken(saved);
      setStatsToken(saved);
    }
  }, []);

  // ── Step 2: Fetch user info + DB (S64: Worker primero, Drive fallback) ─
  const _fetchUserAndDb = useCallback(async (token) => {
    setBootPhase(BOOT.INIT_DB);
    setDbStatus("SYNCING");

    try {
      const profile = await _fetchGoogleProfile(token);

      // ── Control de acceso ───────────────────────────────────
      if (!isAuthorizedEmail(profile.email)) {
        console.warn(`[Búnker] Acceso denegado para: ${profile.email}`);
        await signOut();
        setBootPhase(BOOT.UNAUTHORIZED);
        setBootError(`El email ${profile.email} no tiene acceso al Búnker.`);
        return;
      }

      const bunkerProfile = resolveUser(profile.email);
      const fullUser = {
        ...profile,
        role: bunkerProfile.role,
        id:   bunkerProfile.id,
        name: bunkerProfile.name,
      };
      setUser(fullUser);

      // Obtener JWT del Worker API
      const googleToken = token ?? window.gapi?.client?.getToken?.()?.access_token;
      let jwt = jwtToken;
      if (googleToken && fullUser.email) {
        jwt = await _fetchJwt(fullUser.email, googleToken) || jwt;
      }

      // S64: Worker API como fuente PRIMARIA
      let data = null;
      if (jwt) {
        data = await _buildDbFromWorker(jwt);
      }

      if (data) {
        // Worker OK — cargar complemento de Drive (libraries, heartbeat)
        await _loadDriveComplement(data);
        console.info("[Búnker] DB cargada desde Worker API (D1) + Drive complement ✓");
      } else {
        // Worker falló — usar Drive JSON como fallback completo
        console.info("[Búnker] Worker no disponible, usando Drive JSON como fallback...");
        data = await initDatabase();
        console.info("[Búnker] DB cargada desde Drive JSON (fallback) ✓");
      }

      setDb(data);
      setLastHeartbeat(data.heartbeat ?? new Date().toISOString());
      setDbStatus("ONLINE");
      setBootPhase(BOOT.READY);
      _scheduleHeartbeat();
    } catch (err) {
      console.error("[Búnker] DB init failed:", err);
      setDbStatus("ERROR");
      setBootPhase(BOOT.ERROR);
      setBootError(err.message ?? "Error al inicializar la base de datos.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth event handlers ───────────────────────────────────
  const _onSignedIn = useCallback(async (token) => {
    await _fetchUserAndDb(token);
  }, [_fetchUserAndDb]);

  const _onSignedOut = useCallback(() => {
    setUser(null);
    setDb(null);
    setJwtToken(null);
    localStorage.removeItem("bunker_jwt");
    setUploadToken(null);
    setStatsToken(null);
    setDbStatus("OFFLINE");
    setLastHeartbeat(null);
    setLibraryCapacity({});
    setBootPhase(BOOT.IDLE);
    _clearHeartbeat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Google profile helper ─────────────────────────────────
  const _fetchGoogleProfile = async (accessToken) => {
    try {
      const token = accessToken ?? window.gapi?.client?.getToken?.()?.access_token;
      if (!token) throw new Error("No hay token disponible");

      // Usar oauth2 userinfo (solo necesita scopes userinfo.email + userinfo.profile)
      // En vez de drive/v3/about que requiere el scope drive (restringido en apps no verificadas)
      const res = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Userinfo failed: ${res.status}`);
      const json = await res.json();
      return {
        name:   json.name ?? "Usuario",
        email:  json.email ?? "",
        avatar: json.picture ?? null,
      };
    } catch (err) {
      throw new Error("[Búnker] No se pudo obtener el perfil: " + (err?.message ?? err), { cause: err });
    }
  };

  // ── Heartbeat scheduler ───────────────────────────────────
  const _scheduleHeartbeat = useCallback(() => {
    _clearHeartbeat();
    hbTimerRef.current = setInterval(async () => {
      try {
        await triggerHeartbeat();
        setLastHeartbeat(new Date().toISOString());
      } catch (e) {
        console.warn("[Búnker] Scheduled heartbeat failed:", e);
      }
    }, 20 * 60 * 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _clearHeartbeat = useCallback(() => {
    if (hbTimerRef.current) {
      clearInterval(hbTimerRef.current);
      hbTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => _clearHeartbeat(), [_clearHeartbeat]);

  // ── Drop polling global (ERROR 33) ────────────────────────
  // Detecta drops entrantes independientemente de la ruta activa.
  useEffect(() => {
    if (!user || !db) return;
    const checkDrops = () => {
      const drops = db?.music_lab?.drops ?? [];
      const unseen = drops.find((d) => !d.seen && d.to === user.id);
      if (unseen) setPendingDrop(unseen);
    };
    checkDrops();
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchData();
        const unseen = (fresh?.music_lab?.drops ?? []).find(
          (d) => !d.seen && d.to === user.id
        );
        if (unseen) setPendingDrop(unseen);
      } catch (e) {
        console.warn("[Búnker] Drop polling falló silenciosamente:", e);
      }
    }, 30 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, db?.music_lab?.drops]);

  // ── PUBLIC ACTIONS: Auth ──────────────────────────────────

  const login = useCallback(async () => {
    setBootPhase(BOOT.INIT_SERVICES);
    try {
      await requestAccessToken(true);
      // _onSignedIn se dispara vía onAuthChange
    } catch (err) {
      console.error("[Búnker] Login error:", err);
      setBootPhase(BOOT.ERROR);
      setBootError(err.message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn("[Búnker] Sign out error:", e);
    }
    _onSignedOut();
  }, [_onSignedOut]);

  const refreshDb = useCallback(async () => {
    if (!isAuthenticated()) return;
    setDbStatus("SYNCING");
    try {
      // S64: Worker primero, Drive fallback
      let data = null;
      if (jwtToken) {
        data = await _buildDbFromWorker(jwtToken);
      }
      if (data) {
        await _loadDriveComplement(data);
      } else {
        // Fallback a Drive JSON
        data = await fetchData();
        if (jwtToken) {
          // Intentar mergear Worker data sobre Drive (backward compat)
          try {
            const wData = await _buildDbFromWorker(jwtToken);
            if (wData) {
              data = { ...data, entries: wData.entries, eras: wData.eras, files: wData.files || [], music_lab: { ...data.music_lab, tracks: wData.music_lab?.tracks, tags: wData.music_lab?.tags, playlists: wData.music_lab?.playlists, drops: wData.music_lab?.drops } };
            }
          } catch { /* keep Drive data */ }
        }
      }
      setDb(data);
      setLastHeartbeat(data.heartbeat ?? new Date().toISOString());
      setDbStatus("ONLINE");
    } catch (err) {
      console.error("[Búnker] refreshDb failed:", err);
      setDbStatus("ERROR");
    }
  }, [jwtToken, _buildDbFromWorker, _loadDriveComplement]);

  /**
   * patchDb(updater)
   * Actualización optimista local + persistencia en Drive.
   * updater = (currentDb) => newDb
   */
  const patchDb = useCallback(async (updater) => {
    if (!isAuthenticated()) return;
    setDbStatus("SYNCING");
    try {
      setDb((prev) => updater(prev));
      // P2.5: Solo escribir campos de Drive (libraries, heartbeat, adventures).
      // Entries, eras, music_lab.* están en D1 (Worker API) — no contaminar Drive JSON.
      await updateData((prev) => {
        const full = updater(prev);
        return {
          libraries: full.libraries ?? prev?.libraries ?? [],
          heartbeat: full.heartbeat ?? prev?.heartbeat ?? new Date().toISOString(),
          adventures_start_date: full.adventures_start_date ?? prev?.adventures_start_date ?? new Date().toISOString(),
          schema_version: full.schema_version ?? prev?.schema_version ?? "5.0.0",
        };
      });
      setDbStatus("ONLINE");
    } catch (err) {
      console.error("[Búnker] patchDb failed:", err);
      setDbStatus("ERROR");
      await refreshDb();
    }
  }, [refreshDb]);

  const heartbeat = useCallback(async () => {
    try {
      await triggerHeartbeat();
      setLastHeartbeat(new Date().toISOString());
    } catch (e) {
      console.warn("[Búnker] Manual heartbeat failed:", e);
    }
  }, []);

  // ── Page Visibility: heartbeat al volver de background ────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && bootPhase === BOOT.READY) {
        heartbeat();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [bootPhase, heartbeat]);

  // ── PUBLIC ACTIONS: Bibliotecas ───────────────────────────

  /**
   * addLibrary(data)
   * Añade una biblioteca y actualiza el estado local optimistamente.
   */
  const addLibrary = useCallback(async (data) => {
    const newLib = await svcAddLibrary(data);
    setDb((prev) => ({
      ...prev,
      libraries: [...(prev?.libraries ?? []), newLib],
    }));
    // L1: refrescar capacidad de la nueva biblioteca
    try {
      const info = await checkLibraryCapacity(newLib);
      setLibraryCapacity((prev) => ({ ...prev, [newLib.id]: info }));
    } catch (e) {
      console.warn("[Búnker] Capacity check for new library failed:", e);
    }
    return newLib;
  }, []);

  /**
   * updateLibrary(id, patch)
   * Actualiza una biblioteca y sincroniza el estado local.
   */
  const updateLibrary = useCallback(async (id, patch) => {
    const updated = await svcUpdateLibrary(id, patch);
    setDb((prev) => ({
      ...prev,
      libraries: (prev?.libraries ?? []).map((l) => (l.id === id ? updated : l)),
    }));
    return updated;
  }, []);

  /**
   * removeLibrary(id)
   * Elimina una biblioteca y limpia su cache de capacidad.
   */
  const removeLibrary = useCallback(async (id) => {
    await svcRemoveLibrary(id);
    setDb((prev) => ({
      ...prev,
      libraries: (prev?.libraries ?? []).filter((l) => l.id !== id),
    }));
    setLibraryCapacity((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  /**
   * markLibraryHeartbeat(id)
   * El admin confirma que acaba de entrar a la cuenta biblioteca.
   */
  const markLibraryHeartbeat = useCallback(async (id) => {
    const updated = await svcMarkLibraryHeartbeat(id);
    setDb((prev) => ({
      ...prev,
      libraries: (prev?.libraries ?? []).map((l) => (l.id === id ? updated : l)),
    }));
    return updated;
  }, []);

  /**
   * getLibraryContents(sharedFolderId)
   * Lista los archivos de una carpeta compartida.
   */
  const getLibraryContents = useCallback(
    (sharedFolderId) => listLibraryContents(sharedFolderId),
    []
  );

  /**
   * refreshLibraryCapacity(library)
   * Calcula el uso actual de una biblioteca y actualiza el cache.
   * Llama a Drive API — úsalo con moderación.
   *
   * @param {{ id, shared_folder_id, capacity_gb }} library
   * @returns {Promise<{ used_gb, used_pct, near_full, file_count }>}
   */
  const refreshLibraryCapacity = useCallback(async (library) => {
    const info = await checkLibraryCapacity(library);
    setLibraryCapacity((prev) => ({ ...prev, [library.id]: info }));

    // Si la biblioteca está casi llena, actualizamos su status a "full" en la DB
    if (info.used_pct >= 100) {
      await svcUpdateLibrary(library.id, { status: "full" });
      setDb((prev) => ({
        ...prev,
        libraries: (prev?.libraries ?? []).map((l) =>
          l.id === library.id ? { ...l, status: "full" } : l
        ),
      }));
    }

    return info;
  }, []);

  // ── S65: VAULT entry edit/delete via Worker API ──────────

  /**
   * updateEntry(entryId, patch)
   * Actualiza una entrada vía Worker API (PATCH /api/entries/:id).
   * Actualiza el estado local optimistamente.
   */
  const updateEntry = useCallback(async (entryId, patch) => {
    if (!jwtToken) throw new Error("No JWT token");
    const res = await fetch(`${API_BASE}/api/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`updateEntry failed: ${res.status}`);
    const updated = await res.json();
    // Actualizar estado local optimistamente
    setDb((prev) => ({
      ...prev,
      entries: (prev?.entries ?? []).map((e) =>
        e.id === entryId ? { ...e, ...patch, updated_at: new Date().toISOString() } : e
      ),
    }));
    return updated;
  }, [jwtToken]);

  /**
   * deleteEntry(entryId)
   * Soft-delete de una entrada vía Worker API (DELETE /api/entries/:id).
   * Actualiza el estado local optimistamente (marca is_deleted).
   */
  const deleteEntry = useCallback(async (entryId) => {
    if (!jwtToken) throw new Error("No JWT token");
    const res = await fetch(`${API_BASE}/api/entries/${entryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    if (!res.ok) throw new Error(`deleteEntry failed: ${res.status}`);
    // Actualizar estado local — marcar como eliminada
    setDb((prev) => ({
      ...prev,
      entries: (prev?.entries ?? []).map((e) =>
        e.id === entryId ? { ...e, is_deleted: true, updated_at: new Date().toISOString() } : e
      ),
    }));
    return { ok: true, id: entryId };
  }, [jwtToken]);

  // ── Context Value ─────────────────────────────────────────
  const value = {
    // Auth
    user,
    isLoading: isLoadingApp,
    authStatus,
    bootPhase,
    bootError,

    // Database
    db,
    dbStatus,
    lastHeartbeat,

    // Worker API JWT
    jwtToken,

    // Navegación
    activeTab,
    setActiveTab,

    // Música
    masterVolume,
    setMasterVolume,

    // Entradas filtradas por usuario
    myEntries,
    myMessages,

    // Bibliotecas
    libraries,
    librariesAtRisk,
    librariesLost,
    librariesNearFull,
    libraryCapacity,

    // Acciones core
    login,
    logout,
    refreshDb,
    patchDb,
    heartbeat,

    // Acciones de biblioteca
    addLibrary,
    updateLibrary,
    removeLibrary,
    markLibraryHeartbeat,
    getLibraryContents,
    refreshLibraryCapacity,

    // Acciones de entrada (S65 — Worker API)
    updateEntry,
    deleteEntry,

    // Drops globales (ERROR 33)
    pendingDrop,
    clearPendingDrop: (dropId) => {
      setPendingDrop(null);
      if (dropId) {
        patchDb((db) => ({
          ...db,
          music_lab: {
            ...db.music_lab,
            drops: (db.music_lab?.drops ?? []).map((d) =>
              d.id === dropId ? { ...d, seen: true } : d
            ),
          },
        }));
      }
    },

    // Servicio raw para usos avanzados
    driveService: GoogleDriveService,
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

// ─── HOOK ─────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("[useVault] Must be used inside <VaultProvider>");
  return ctx;
}

// ─── BOOT PHASE EXPORT ────────────────────────────────────────
export { BOOT };

export default VaultContext;
