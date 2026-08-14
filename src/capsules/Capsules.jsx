// ============================================================
//  EL BÚNKER — Capsules.jsx
//  Shell de CAPSULES con 4 sub-tabs (ADR-020)
//  Timeline · Smoke Session · Time Capsules · RECAP
//  S59-S70 · Fases 3-4
// ============================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "../core/ui";
import { ACID, FONT_MONO } from "../tokens";
import { usePlayer } from "../core/PlayerContext";
import { workerClient } from "../core/WorkerClient";
import { useToast } from "../core/ToastContext";
import { Icon } from "../core/ui";
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
  const [subTab, setSubTab] = useState("timeline");
  const [events, setEvents] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const { toast } = useToast();
  // G4: usar trackVibe accent en lugar de ACID fijo
  const { trackVibe, resolveVibeAccent } = usePlayer();
  const accent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;

  // Fetch real events y time_capsules desde Worker API cuando hay JWT
  // S115-D3: WorkerClient maneja auth — sin prop-drilling de jwtToken
  useEffect(() => {
    if (!workerClient.hasToken()) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoadingEvents(true);
      setFetchError(null);
      try {
        const [eventsData, capsulesData] = await Promise.all([
          // S140: 500 = ventana amplia para no desplazar eventos de David
          // cuando Edu acumula muchos plays. Server: min(parseInt, 500).
          workerClient.get('/api/events?limit=500').catch(e => { throw new Error(`Events: ${e.message}`); }),
          workerClient.get('/api/time_capsules').catch(e => { throw new Error(`Capsules: ${e.message}`); }),
        ]);
        if (!cancelled) {
          setEvents(eventsData);
          setCapsules(capsulesData);
        }
      } catch (e) {
        console.warn("[Capsules] fetch error:", e.message);
        if (!cancelled) {
          setFetchError(e.message);
          toast({ msg: "NO SE PUDO CARGAR", sub: e.message, duration: 3500 });
        }
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [toast]);

  return (
    <div className="w-full px-4 py-6 max-w-6xl mx-auto flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {null}
      <div className="capsules-layout lg:grid lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* Sub-tab bar — swipeable en móvil, sin scrollbar.
          NO se oculta en escritorio: hoy es el ÚNICO control real del segundo nivel. El raíl los
          pinta como <span> sin onClick (Layout.jsx:435-440), así que sigue siendo navegación viva
          hasta que el raíl la asuma de verdad. Ver X-3 en DISENO_INTERIOR_LIENZO_2026-08-14.md. */}
      <nav
        className="capsules-subnav flex gap-1 pb-1 overflow-x-auto select-none lg:max-w-sm"
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
          className="capsules-content min-w-0 lg:max-w-5xl lg:w-full lg:self-end"
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
