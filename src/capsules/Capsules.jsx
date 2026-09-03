// ============================================================
//  EL BÚNKER — Capsules.jsx
//  Shell de CAPSULES con 4 sub-tabs (ADR-020)
//  Timeline · Smoke Session · Time Capsules · RECAP
//  S59-S70 · Fases 3-4
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "../core/ui";
import { ACID, FONT_MONO } from "../tokens";
import { usePlayer } from "../core/PlayerContext";
import { workerClient } from "../core/WorkerClient";
import { Icon } from "../core/ui";
import { useSecondLevelNav } from "../layout/Layout";
import { usePullToRefresh } from "../core/usePullToRefresh";
import SmokeSession from "../smoke/SmokeSession";
import Timeline from "./Timeline";
import TimeCapsules from "./TimeCapsules";
import Recaps from "./Recaps";

const SUB_TABS = [
  { id: "timeline",      label: "TIMELINE",      icon: "clock" },
  { id: "smoke",         label: "SMOKE",          icon: "timer" },
  { id: "timecapsules",  label: "TIME CAPSULES",  icon: "lock" },
  { id: "recap",         label: "RECAP",           icon: "analytics" },
];

export default function Capsules({ db: _db, userId: _userId, activeTrack: _activeTrack, masterVolume, onVolumeChange }) {
  // ADR-029 §6 P2: el subTab se eleva al shell (Layout) para que el rail lo lea
  // y lo controle. El subnav del lienzo escribe en el mismo estado real.
  const { secondLevel, setSecondLevel } = useSecondLevelNav();
  const subTab = secondLevel.capsules ?? "timeline";
  const setSubTab = (value) => setSecondLevel("capsules", value);
  const [events, setEvents] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  // S-prt: pull-to-refresh (port fastpotify-audit). El refetch reutiliza la
  // misma lógica de carga; el gesto no roba swipes horizontales del subnav.
  const fetchErrorRef = useRef(false);
  const fetchDataRef = useRef(() => {});
  // G4: usar trackVibe accent en lugar de ACID fijo
  const { trackVibe, resolveVibeAccent } = usePlayer();
  const accent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;

  // Fetch real events y time_capsules desde Worker API cuando hay JWT
  // S115-D3: WorkerClient maneja auth — sin prop-drilling de jwtToken
  // S-prt: fetchData extraído como refetch estable — lo consumen el efecto
  // inicial, el pull-to-refresh y el retry de online/visibility/focus.
  const fetchData = useCallback(async () => {
    if (!workerClient.hasToken()) return;
    setLoadingEvents(true);
    setFetchError(null);
    try {
      const [eventsData, capsulesData] = await Promise.all([
        // S140: 500 = ventana amplia para no desplazar eventos de David
        // cuando Edu acumula muchos plays. Server: min(parseInt, 500).
        workerClient.get('/api/events?limit=500').catch(e => { throw new Error(`Events: ${e.message}`); }),
        workerClient.get('/api/time_capsules').catch(e => { throw new Error(`Capsules: ${e.message}`); }),
      ]);
      fetchErrorRef.current = false;
      setEvents(eventsData);
      setCapsules(capsulesData);
    } catch (e) {
      console.warn("[Capsules] fetch error:", e.message);
      // Estado honesto en español — nunca e.message crudo en inglés (fallos
      // de red aquí son el caso normal offline, no una excepción de app).
      const offline = /failed to fetch|networkerror|load failed/i.test(String(e.message));
      fetchErrorRef.current = true;
      setFetchError(offline ? "SIN CONEXIÓN — se recargará al volver" : "NO SE PUDO CARGAR");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchDataRef.current = fetchData;
    // set-state-in-effect: fetchData setea loading de forma síncrona al arrancar —
    // patrón del motor de datos documentado (ver PlayerContext). El estado
    // skeleton inicial es intencional, no un side-effect accidental.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // S-prt: puente de retry — online/visibility/focus solo refetch si la
  // última carga falló (sesión degradada). El pull-to-refresh siempre puede.
  const pull = usePullToRefresh({ enabled: true, onRefresh: () => fetchDataRef.current() });
  useEffect(() => {
    pull.setOnErrorRetry(() => {
      if (fetchErrorRef.current) fetchDataRef.current();
    });
    return () => pull.setOnErrorRetry(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={pull.containerRef}
      onTouchStart={pull.onTouchStart}
      onTouchMove={pull.onTouchMove}
      onTouchEnd={pull.onTouchEnd}
      className="w-full px-4 py-6 flex flex-col gap-4"
      style={{ fontFamily: FONT_MONO }}
    >
      {/* S-prt: indicador de pull-to-refresh — vibe-aware, con resistencia */}
      {(pull.pullDistance > 0 || pull.refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            height: pull.refreshing ? 28 : Math.min(pull.pullDistance, pull.threshold),
            opacity: pull.refreshing ? 1 : Math.min(1, pull.pullDistance / pull.threshold),
            transition: pull.refreshing ? "none" : "height 60ms linear",
            color: accent,
          }}
          aria-live="polite"
          aria-label={pull.refreshing ? "Actualizando" : "Suelta para actualizar"}
        >
          <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase">
            <Icon name={pull.refreshing ? "refresh" : "arrowDown"} size={14} decorative className={pull.refreshing ? "animate-spin" : undefined} />
            {pull.refreshing ? "ACTUALIZANDO" : pull.pullDistance >= pull.threshold ? "SUELTA PARA ACTUALIZAR" : "TIRA PARA ACTUALIZAR"}
          </span>
        </div>
      )}
      <div className="capsules-layout">
      {/* Sub-tab bar — swipeable en móvil, sin scrollbar.
          Desde el 14-ago el raíl SÍ controla el segundo nivel (botones reales sobre el mismo
          estado elevado que lee esta barra), así que en escritorio las dos son navegación viva y
          están duplicadas a propósito y en tránsito. La retirada de esta copia es la ley L-2 y va
          en su propia tarjeta: quitarla antes de que el raíl funcionase dejó SMOKE, TIME CAPSULES
          y RECAP inalcanzables. Ver X-3 en DISENO_INTERIOR_LIENZO_2026-08-14.md. */}
      <nav
        className="capsules-subnav flex gap-1 pb-1 overflow-x-auto select-none xl:hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          cursor: "default",
        }}
      >
        {SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              whileTap={{ scale: 0.95 }}
              className="text-xs tracking-[0.2em] uppercase px-4 py-3 whitespace-nowrap transition-all flex-shrink-0"
              style={{
                color: active ? accent : `${accent}53`,
                borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
                fontFamily: FONT_MONO,
                minHeight: 44,
              }}
            >
              <Icon name={t.icon} size={14} label={t.label} /> {t.label}
            </motion.button>
          );
        })}
        {/* Oculta scrollbar webkit */}
        <style>{`.capsules-subnav::-webkit-scrollbar { display: none; }`}</style>
      </nav>

      {/* Loading indicator — G4: vibe-aware, S0.5: skeleton */}
      {loadingEvents && (
        <div className="flex flex-col gap-2" style={{ padding: "4px 0" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton.Block key={i} width={60} height={24} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton.Block key={i} height={48} width="100%" />
          ))}
        </div>
      )}

      {/* Error feedback — G4: vibe-aware */}
      {fetchError && !loadingEvents && (
        <div className="py-2 px-3 text-xs opacity-40 text-center" style={{ color: accent, fontFamily: FONT_MONO }}>
          <span className="inline-flex items-center justify-center gap-2">
            <Icon name="alert" size={14} label="Error" />
            <span>{fetchError}</span>
          </span>
        </div>
      )}

      {/* Sub-tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          className="capsules-content min-w-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {subTab === "timeline" &&          <Timeline events={events} accentColor={accent} eras={_db?.eras || []} />}
          {subTab === "smoke" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-1">
                <Icon name="timer" size={16} label="Sesión especial" />
                <h2 className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: accent }}>
                  SESIÓN ESPECIAL
                </h2>
              </div>
              <SmokeSession masterVolume={masterVolume} onVolumeChange={onVolumeChange} />
            </div>
          )}
          {subTab === "timecapsules" && (
            <TimeCapsules capsules={capsules} accentColor={accent} entries={_db?.entries || []} playlists={_db?.music_lab?.playlists || []} />
          )}
          {subTab === "recap" && <Recaps accentColor={accent} />}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}
