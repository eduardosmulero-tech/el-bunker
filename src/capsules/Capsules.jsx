// ============================================================
//  EL BÚNKER — Capsules.jsx
//  Shell de CAPSULES con 4 sub-tabs (ADR-020)
//  Timeline · Smoke Session · Time Capsules · RECAP
//  S59-S70 · Fases 3-4
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, FONT_MONO } from "../tokens";
import SmokeSession from "../smoke/SmokeSession";
import Timeline from "./Timeline";
import TimeCapsules from "./TimeCapsules";
import Recaps from "./Recaps";

const SUB_TABS = [
  { id: "timeline",      label: "TIMELINE",      icon: "◎" },
  { id: "smoke",         label: "SMOKE",          icon: "⧖" },
  { id: "timecapsules",  label: "TIME CAPSULES",  icon: "🔮" },
  { id: "recap",         label: "RECAP",           icon: "📊" },
];

export default function Capsules({ db: _db, userId: _userId, events = [], activeTrack: _activeTrack, masterVolume, onVolumeChange }) {
  const [subTab, setSubTab] = useState("timeline");
  // events, time_capsules vienen de D1 (Worker API), no de Drive JSON.
  // El padre (App.jsx) los inyecta como prop separada.
  // db se usa en SmokeSession (que accede via useVault internamente).

  return (
    <div className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* Sub-tab bar */}
      <nav className="flex gap-1 overflow-x-auto pb-1">
        {SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              whileTap={{ scale: 0.95 }}
              className="text-xs tracking-[0.2em] uppercase px-3 py-2 whitespace-nowrap transition-colors"
              style={{
                color: active ? ACID : `${ACID}53`,
                borderBottom: active ? `1px solid ${ACID}` : "1px solid transparent",
                fontFamily: FONT_MONO,
              }}
            >
              {t.icon} {t.label}
            </motion.button>
          );
        })}
      </nav>

      {/* Sub-tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {subTab === "timeline" && <Timeline events={events} />}
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
          {subTab === "timecapsules" && <TimeCapsules token={null} capsules={[]} />}
          {subTab === "recap" && <Recaps events={events} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
