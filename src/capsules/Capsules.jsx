// ============================================================
//  EL BÚNKER — Capsules.jsx
//  Shell de CAPSULES con 4 sub-tabs (ADR-020)
//  Timeline · Smoke Session · Time Capsules · RECAP
//  S59-S70 · Fases 3-4
// ============================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, FONT_MONO } from "../tokens";
import { usePlayer } from "../core/PlayerContext";
import SmokeSession from "../smoke/SmokeSession";
import Timeline from "./Timeline";
import TimeCapsules from "./TimeCapsules";
import Recaps from "./Recaps";

const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

const SUB_TABS = [
  { id: "timeline",      label: "TIMELINE",      icon: "◎" },
  { id: "smoke",         label: "SMOKE",          icon: "⧖" },
  { id: "timecapsules",  label: "TIME CAPSULES",  icon: "🔮" },
  { id: "recap",         label: "RECAP",           icon: "📊" },
];

export default function Capsules({ db: _db, userId: _userId, jwtToken = null, activeTrack: _activeTrack, masterVolume, onVolumeChange }) {
  const [subTab, setSubTab] = useState("timeline");
  const [events, setEvents] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  // G4: usar trackVibe accent en lugar de ACID fijo
  const { trackVibe, resolveVibeAccent } = usePlayer();
  const accent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;

  // Fetch real events y time_capsules desde Worker API cuando hay JWT
  useEffect(() => {
    if (!jwtToken) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoadingEvents(true);
      setFetchError(null);
      try {
        const [eventsRes, capsulesRes] = await Promise.all([
          fetch(`${API_BASE}/api/events?limit=200`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }),
          fetch(`${API_BASE}/api/time_capsules`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }),
        ]);
        if (!cancelled) {
          if (eventsRes.ok) {
            const data = await eventsRes.json();
            setEvents(data);
          } else {
            setFetchError(`Events API: ${eventsRes.status}`);
          }
          if (capsulesRes.ok) {
            const data = await capsulesRes.json();
            setCapsules(data);
          }
        }
      } catch (e) {
        console.warn("[Capsules] fetch error:", e.message);
        if (!cancelled) setFetchError(e.message);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [jwtToken]);

  return (
    <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* Sub-tab bar — swipeable en móvil, sin scrollbar */}
      <nav
        className="capsules-subnav flex gap-1 pb-1 overflow-x-auto select-none"
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
              {t.icon} {t.label}
            </motion.button>
          );
        })}
        {/* Oculta scrollbar webkit */}
        <style>{`.capsules-subnav::-webkit-scrollbar { display: none; }`}</style>
      </nav>

      {/* Loading indicator */}
      {loadingEvents && (
        <div className="flex items-center justify-center gap-2 py-3">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: ACID }}
          >
            ◌ CARGANDO EVENTOS...
          </motion.span>
        </div>
      )}

      {/* Error feedback */}
      {fetchError && !loadingEvents && (
        <div className="py-2 px-3 text-xs opacity-40 text-center" style={{ color: ACID, fontFamily: FONT_MONO }}>
          ⚠ {fetchError}
        </div>
      )}

      {/* Sub-tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {subTab === "timeline" &&          <Timeline events={events} accentColor={accent} />}
          {subTab === "smoke" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-1">
                <span style={{ color: ACID }}>⧖</span>
                <h2 className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: ACID }}>
                  SESIÓN ESPECIAL
                </h2>
              </div>
              <SmokeSession masterVolume={masterVolume} onVolumeChange={onVolumeChange} />
            </div>
          )}
          {subTab === "timecapsules" && (
            <TimeCapsules token={jwtToken} capsules={capsules} accentColor={accent} />
          )}
          {subTab === "recap" && <Recaps events={events} accentColor={accent} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
