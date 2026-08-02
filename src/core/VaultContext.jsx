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
import {
  initGoogleServices,
  requestAccessToken,
  restoreToken,
  signOut,
  isAuthenticated,
  onAuthChange,
  resolveUser,
  isAuthorizedEmail,
  listLibraryContents,
  checkLibraryCapacity,
  _calcLibraryStatus,
  EMPTY_DB,
} from "./GoogleDriveService";
import { setUploadToken } from "./FileUploadService";
import { setStatsToken } from "./StatsEngine";
import { workerClient } from "./WorkerClient";

// ─── WORKER API URL ─────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

// ─── S130-B: Fallback solo cuando D1 no tiene adventures_start_date ───
// La fuente primaria es GET /api/config → app_config.adventures_start_date.
// Este default solo se usa si la tabla app_config está vacía o el worker no responde.
const DEFAULT_ADVENTURE_DATE = new Date(Date.now() - 500 * 86400000).toISOString();

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
    try { return sessionStorage.getItem("bunker_jwt") || null; }
    catch { return null; }
  });

  // ADR-028: cómo se entró — Google o clave de acceso.
  const [sessionKind, setSessionKind] = useState(null);
  const sessionKindRef = useRef(null);

  // Cache de capacidad por biblioteca { [libraryId]: { used_gb, used_pct, near_full } }
  const [libraryCapacity, setLibraryCapacity] = useState({});

  const hbTimerRef = useRef(null);
  // S140: debounce ref para evitar loop de re-auth en clock-skew patológico
  // (si JWT nuevo ya llega expirado, cada stats emit → 401 → re-auth → loop)
  const lastJwtExpiredRef = useRef(0);

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

  // ── ADR-028: helpers de sesión ─────────────────────────────
  const _setSessionKind = useCallback((kind) => {
    sessionKindRef.current = kind;
    setSessionKind(kind);
    try {
      if (kind) sessionStorage.setItem("bunker_session_kind", kind);
      else sessionStorage.removeItem("bunker_session_kind");
    } catch { /* modo privado */ }
  }, []);

  /** ¿Hay sesión? Google O clave. Se lee del ref: los callbacks tienen deps []. */
  const _hasSession = useCallback(
    () => isAuthenticated() || sessionKindRef.current === "access_key",
    []
  );

  /** Aplica un JWT a todos los clientes que lo necesitan. */
  const _applyJwt = useCallback((token) => {
    setJwtToken(token);
    try { sessionStorage.setItem("bunker_jwt", token); } catch { /* modo privado */ }
    workerClient.setToken(token);
    setUploadToken(token);
    setStatsToken(token);
  }, []);

  /** Guarda el usuario de la sesión y, si Edu lo pidió, la clave en este dispositivo. */
  const _persistAccessSession = useCallback((fullUser, keyToRemember) => {
    try {
      sessionStorage.setItem("bunker_user", JSON.stringify(fullUser));
      if (keyToRemember) localStorage.setItem("bunker_access_key", keyToRemember);
      else localStorage.removeItem("bunker_access_key");
    } catch { /* modo privado */ }
  }, []);

  // ── Step 1: Init Google Services on mount ─────────────────
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setBootPhase(BOOT.INIT_SERVICES);
      try {
        // ADR-028: camino sin Google. Si prende, no se toca gapi en absoluto.
        if (await _tryRestoreAccessSession()) return;
        if (cancelled) return;

        await initGoogleServices();
        if (cancelled) return;

        onAuthChange(({ event, token, error, translated }) => {
          if (event === "SIGNED_IN"  && !cancelled) _onSignedIn(token);
          if (event === "SIGNED_OUT" && !cancelled) _onSignedOut();
          if (event === "AUTH_ERROR" && !cancelled) {
            console.error("[Búnker] Auth error:", error);
            const friendly = translated?.msg ?? error?.error_description ?? "Error de autenticación";
            const actionHint = translated?.action ? ` · ${translated.action}` : "";
            setBootPhase(BOOT.ERROR);
            setBootError(friendly + actionHint);
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
      if (!token) return null;
      _applyJwt(token);
      console.info("[Búnker] JWT obtenido ✓");
      return token;
    } catch (e) {
      console.warn("[Búnker] JWT fetch error:", e.message);
      return null;
    }
  }, [_applyJwt]);

  // ── S64: Worker API como fuente PRIMARIA ───────────────────

  /**
   * _buildDbFromWorker(token)
   * Construye el objeto db completo desde Worker API (D1).
   * Fetch en paralelo de entries, eras, tracks, tags, playlists, drops.
   * Retorna null si falla (el caller usa Drive JSON como fallback).
   */
  // S115-D3: usa workerClient singleton (token via setToken en _fetchJwt)
  const _buildDbFromWorker = useCallback(async (_token) => {
    if (!workerClient.hasToken()) return null;
    try {
      // S115-D3: migrar 7 fetches paralelos a WorkerClient.get()
      const [entries, eras, tracks, tags, playlists, drops, files] = await Promise.all([
        workerClient.get('/api/entries').catch(e => Promise.reject(`entries: ${e.message}`)),
        workerClient.get('/api/eras').catch(e => Promise.reject(`eras: ${e.message}`)),
        workerClient.get('/api/tracks').catch(e => Promise.reject(`tracks: ${e.message}`)),
        workerClient.get('/api/tags').catch(e => Promise.reject(`tags: ${e.message}`)),
        workerClient.get('/api/playlists').catch(e => Promise.reject(`playlists: ${e.message}`)),
        workerClient.get('/api/drops').catch(e => Promise.reject(`drops: ${e.message}`)),
        workerClient.get('/api/files').catch((e) => { console.warn("[Búnker] /api/files failed (non-fatal):", e); return []; }),
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
      // S130-B: fetch app_config desde D1 para adventures_start_date real
      const appConfig = await workerClient.get('/api/config').catch(() => null);
      const realAdventureDate = appConfig?.adventures_start_date || DEFAULT_ADVENTURE_DATE;

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
        // S130-B: usar fecha real desde D1 en vez del hardcoded 500d
        adventures_start_date: realAdventureDate,
      };
    } catch (e) {
      console.warn("[Búnker] Worker DB build failed:", e);
      return null;
    }
  }, []);

  /**
   * _completeSession(fullUser, jwt)
   * Cola común a los dos logins: fija el usuario, construye la db desde D1
   * y deja la app en READY. No sabe nada de cómo se consiguió el JWT.
   */
  const _completeSession = useCallback(async (fullUser, jwt) => {
    setUser(fullUser);
    let data = jwt ? await _buildDbFromWorker(jwt) : null;
    if (data) {
      data.libraries = [];
      data.heartbeat = new Date().toISOString();
      data.adventures_start_date = data.adventures_start_date ?? DEFAULT_ADVENTURE_DATE;
      console.info("[Búnker] DB cargada desde Worker API (D1) ✓");
    } else {
      console.info("[Búnker] Worker no disponible, usando DB vacía como fallback...");
      data = EMPTY_DB();
    }
    setDb(data);
    setLastHeartbeat(data.heartbeat ?? new Date().toISOString());
    setDbStatus("ONLINE");
    setBootPhase(BOOT.READY);
    _scheduleHeartbeat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_buildDbFromWorker]);

  /**
   * _loadDriveComplement(db)
   * Carga desde Drive JSON SOLO los campos que Worker no tiene:
   * libraries, heartbeat, adventures_start_date.
   * Modifica el objeto db in-place. No lanza — si falla, usa defaults.
   */
  // _loadDriveComplement ELIMINADO (S115-D5) — D1 es source of truth única.

  // ── S116: Restaurar JWT de sessionStorage al montar ───────
  useEffect(() => {
    const saved = (() => {
      try { return sessionStorage.getItem("bunker_jwt") || null; }
      catch { return null; }
    })();
    if (saved) {
      // También inicializar WorkerClient si hay token previo
      workerClient.setToken(saved);
      setUploadToken(saved);
      setStatsToken(saved);
    }
  }, []);

  // ── S140: Listener para JWT expirado ──────────────────────
  // WorkerClient dispara 'bunker_jwt_expired' cuando recibe 401 del Worker.
  // Esto ocurre en PWAs abiertas días sin recarga: JWT_EXPIRY (24h) se cumple
  // y sessionStorage retiene el token inválido. Si Google sigue vivo
  // (window.gapi), intentamos re-autenticar silenciosamente y todo vuelve a
  // postear (StatsEngine, drops, entries). Si Google también murió,
  // dejamos que el usuario recargue manualmente.
  useEffect(() => {
    const handler = async () => {
      // S140-P2: debounce 30s — evita loop de re-auth si el JWT nuevo llega
      // con clock skew patológico y expira inmediatamente. Sin esto, cada
      // stats emit → 401 → re-auth → mismo JWT muerto → loop de D1 writes.
      if (Date.now() - lastJwtExpiredRef.current < 30_000) return;
      lastJwtExpiredRef.current = Date.now();

      // ADR-028: sesión por clave — re-canjear si Edu la recordó; si no, volver al login.
      if (sessionKindRef.current === "access_key") {
        let savedKey = null;
        try { savedKey = localStorage.getItem("bunker_access_key"); } catch { /* modo privado */ }
        if (savedKey) {
          console.info("[Búnker] ♻ Re-canjeando clave de acceso (JWT expirado)...");
          await loginWithAccessKey(savedKey, { remember: true });
          return;
        }
        console.warn("[Búnker] Sesión por clave caducada — hay que reintroducir la clave");
        _onSignedOut();
        setBootError("Sesión caducada — vuelve a introducir la clave de acceso.");
        return;
      }

      const googleToken = window.gapi?.client?.getToken?.()?.access_token;
      if (!user?.email || !googleToken) {
        console.warn("[Búnker] JWT expirado sin Google token — recarga manual necesaria");
        return;
      }
      console.info("[Búnker] ♻ Re-autenticando silenciosamente (JWT expirado)...");
      await _fetchJwt(user.email, googleToken);
    };
    window.addEventListener("bunker_jwt_expired", handler);
    return () => window.removeEventListener("bunker_jwt_expired", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

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

      // Obtener JWT del Worker API
      const googleToken = token ?? window.gapi?.client?.getToken?.()?.access_token;
      let jwt = jwtToken;
      if (googleToken && fullUser.email) {
        jwt = await _fetchJwt(fullUser.email, googleToken) || jwt;
      }

      _setSessionKind("google");
      await _completeSession(fullUser, jwt);
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
    sessionStorage.removeItem("bunker_jwt");   // S116: sessionStorage
    _setSessionKind(null);
    try {
      sessionStorage.removeItem("bunker_user");
      localStorage.removeItem("bunker_access_key");
    } catch { /* modo privado */ }
    workerClient.clearToken();
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

  // ── Heartbeat scheduler (S115-D5: local-only, no Drive) ──
  const _scheduleHeartbeat = useCallback(() => {
    _clearHeartbeat();
    hbTimerRef.current = setInterval(() => {
      setLastHeartbeat(new Date().toISOString());
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

  // ── Drop polling (S115-D5: local-only, sin Drive) ────────
  // Detecta drops entrantes del estado local.
  useEffect(() => {
    if (!user || !db) return;
    const drops = db?.music_lab?.drops ?? [];
    const unseen = drops.find((d) => !d.seen && d.to === user.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (unseen) setPendingDrop(unseen);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, db?.music_lab?.drops]);

  // ── PUBLIC ACTIONS: Auth ──────────────────────────────────

  /**
   * loginWithAccessKey(key, { remember })
   * ADR-028 — entra sin Google canjeando la clave por un JWT.
   * Devuelve { ok, error } en vez de lanzar: la pantalla de login pinta el error.
   */
  const loginWithAccessKey = useCallback(async (key, { remember = false } = {}) => {
    const cleanKey = (key ?? "").trim();
    if (!cleanKey) return { ok: false, error: "Introduce la clave de acceso." };

    setBootPhase(BOOT.INIT_SERVICES);
    setBootError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey }),
      });
      if (!res.ok) {
        const msg =
          res.status === 401 ? "Clave de acceso no válida." :
          res.status === 429 ? "Demasiados intentos. Espera un minuto." :
          res.status === 503 ? "El acceso por clave no está configurado en el worker." :
          `Error de acceso (${res.status}).`;
        setBootPhase(BOOT.IDLE);
        setBootError(msg);
        return { ok: false, error: msg };
      }

      const { token, user: apiUser } = await res.json();
      const fullUser = { ...apiUser, avatar: null };
      _applyJwt(token);
      _persistAccessSession(fullUser, remember ? cleanKey : null);
      _setSessionKind("access_key");
      setBootPhase(BOOT.INIT_DB);
      setDbStatus("SYNCING");
      await _completeSession(fullUser, token);
      return { ok: true };
    } catch (e) {
      const msg = "No se pudo contactar con el worker: " + (e?.message ?? e);
      console.error("[Búnker] Access key login error:", e);
      setBootPhase(BOOT.IDLE);
      setBootError(msg);
      return { ok: false, error: msg };
    }
  }, [_applyJwt, _persistAccessSession, _setSessionKind, _completeSession]);

  /**
   * _tryRestoreAccessSession()
   * Sesión por clave restaurada desde el navegador. Se intenta ANTES que Google:
   * en un navegador embebido o con accounts.google.com bloqueado,
   * initGoogleServices() manda la app a ERROR y no llegaríamos a ofrecer nada.
   */
  const _tryRestoreAccessSession = useCallback(async () => {
    let savedJwt = null, savedUser = null, savedKind = null, savedKey = null;
    try {
      savedJwt  = sessionStorage.getItem("bunker_jwt");
      savedKind = sessionStorage.getItem("bunker_session_kind");
      savedUser = JSON.parse(sessionStorage.getItem("bunker_user") || "null");
      savedKey  = localStorage.getItem("bunker_access_key");
    } catch { /* modo privado */ }

    if (savedKind === "access_key" && savedJwt && savedUser) {
      _applyJwt(savedJwt);
      _setSessionKind("access_key");
      setBootPhase(BOOT.INIT_DB);
      setDbStatus("SYNCING");
      await _completeSession(savedUser, savedJwt);
      return true;
    }
    if (savedKey) {
      const { ok } = await loginWithAccessKey(savedKey, { remember: true });
      return ok;
    }
    return false;
  }, [_applyJwt, _setSessionKind, _completeSession, loginWithAccessKey]);

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
    if (!_hasSession()) return;
    setDbStatus("SYNCING");
    try {
      let data = null;
      if (jwtToken) {
        data = await _buildDbFromWorker(jwtToken);
      }
      if (!data) data = EMPTY_DB();
      data.libraries = data.libraries ?? [];
      data.heartbeat = data.heartbeat ?? new Date().toISOString();
      setDb(data);
      setLastHeartbeat(data.heartbeat);
      setDbStatus("ONLINE");
    } catch (err) {
      console.error("[Búnker] refreshDb failed:", err);
      setDbStatus("ERROR");
    }
  }, [jwtToken, _buildDbFromWorker, _hasSession]);

  /**
   * patchDb(updater)
   * Actualización optimista local-only (S115-D5: sin Drive).
   * updater = (currentDb) => newDb
   */
  const patchDb = useCallback(async (updater) => {
    if (!_hasSession()) return;
    setDbStatus("SYNCING");
    try {
      setDb((prev) => updater(prev));
      setDbStatus("ONLINE");
    } catch (err) {
      console.error("[Búnker] patchDb failed:", err);
      setDbStatus("ERROR");
    }
  }, [_hasSession]);

  const heartbeat = useCallback(async () => {
    setLastHeartbeat(new Date().toISOString());
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
  // S115-D5: local-only, sin Drive
  const addLibrary = useCallback(async (data) => {
    const newLib = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString(), last_heartbeat_check: new Date().toISOString() };
    setDb((prev) => ({
      ...prev,
      libraries: [...(prev?.libraries ?? []), newLib],
    }));
    // L1: refrescar capacidad de la nueva biblioteca (Drive read-only)
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
  // S115-D5: local-only
  const updateLibrary = useCallback(async (id, patch) => {
    const updated = { ...patch, id, updated_at: new Date().toISOString() };
    setDb((prev) => ({
      ...prev,
      libraries: (prev?.libraries ?? []).map((l) => (l.id === id ? { ...l, ...patch, updated_at: new Date().toISOString() } : l)),
    }));
    return updated;
  }, []);

  /**
   * removeLibrary(id)
   * Elimina una biblioteca y limpia su cache de capacidad.
   */
  // S115-D5: local-only
  const removeLibrary = useCallback(async (id) => {
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
  // S115-D5: local-only — actualiza last_heartbeat_check
  const markLibraryHeartbeat = useCallback(async (id) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      libraries: (prev?.libraries ?? []).map((l) => (l.id === id ? { ...l, last_heartbeat_check: now } : l)),
    }));
    return { id, last_heartbeat_check: now };
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

    // Si la biblioteca está casi llena, actualizamos su status a "full" localmente
    if (info.used_pct >= 100) {
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
  // S115-D3: migrado a WorkerClient (sin dependencia de jwtToken explícito)
  const updateEntry = useCallback(async (entryId, patch) => {
    const updated = await workerClient.patch(`/api/entries/${entryId}`, patch);
    setDb((prev) => ({
      ...prev,
      entries: (prev?.entries ?? []).map((e) =>
        e.id === entryId ? { ...e, ...patch, updated_at: new Date().toISOString() } : e
      ),
    }));
    return updated;
  }, []);

  /**
   * deleteEntry(entryId)
   * Soft-delete de una entrada vía Worker API (DELETE /api/entries/:id).
   * Actualiza el estado local optimistamente (marca is_deleted).
   */
  // S115-D3: migrado a WorkerClient
  const deleteEntry = useCallback(async (entryId) => {
    await workerClient.del(`/api/entries/${entryId}`);
    setDb((prev) => ({
      ...prev,
      entries: (prev?.entries ?? []).map((e) =>
        e.id === entryId ? { ...e, is_deleted: true, updated_at: new Date().toISOString() } : e
      ),
    }));
    return { ok: true, id: entryId };
  }, []);

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

    // ADR-028: cómo se entró (google | access_key | null)
    sessionKind,

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
    loginWithAccessKey,
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
    // S111: route via PATCH /api/drops/:id so refreshDb no resetea seen=0
    // y el modal de drop no vuelve a salir. Mismo patrón que onMarkDropSeen.
    clearPendingDrop: useCallback(async (dropId) => {
      setPendingDrop(null);
      if (!dropId) return;
      // Optimistic local update para respuesta UI inmediata
      patchDb((db) => ({
        ...db,
        music_lab: {
          ...db.music_lab,
          drops: (db.music_lab?.drops ?? []).map((d) =>
            d.id === dropId ? { ...d, seen: true } : d
          ),
        },
      }));
      // S115-D3: persistir en D1 via WorkerClient (best-effort, no bloqueante)
      try {
        await workerClient.patch(`/api/drops/${dropId}`, { seen: 1 });
      } catch (e) {
        console.warn("[Búnker] clearPendingDrop D1 sync falló:", e);
      }
    }, [patchDb]),

    // Servicio raw para usos avanzados
    // S115-D4: GoogleDriveService reducido a solo OAuth + bibliotecas
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
