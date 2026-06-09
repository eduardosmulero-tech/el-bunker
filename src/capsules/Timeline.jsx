// ============================================================
//  EL BÚNKER — Timeline.jsx
//  Feed cronológico unificado (ADR-020)
//  Consume eventos vía props (datos de D1)
//  S67 · Fase 3 — CAPSULES núcleo
// ============================================================
import { motion } from "framer-motion";
import { ACID, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";

export default function Timeline({ events = [], tracks = [], entries = [] }) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12" style={{ fontFamily: FONT_MONO }}>
        <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
          className="text-3xl" style={{ color: ACID }}>◎</motion.div>
        <p className="text-xs tracking-[0.3em] uppercase opacity-30" style={{ color: ACID }}>
          SIN EVENTOS AÚN
        </p>
      </div>
    );
  }

  const grouped = {};
  for (const e of events) {
    const day = e.created_at?.slice(0, 10) ?? "desconocido";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  }

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.3em] uppercase opacity-40" style={{ color: ACID }}>{day}</p>
          {items.map((e, i) => {
            const icon = e.event_type === "track_play" ? "▶" : e.event_type === "drop_sent" ? "♥" :
              e.event_type === "entry_created" ? "✎" : e.event_type === "smoke_session_completed" ? "⧖" : "●";
            const label = e.event_type.replace(/_/g, " ").toUpperCase();
            const detail = e.payload ? (typeof e.payload === "string" ? JSON.parse(e.payload) : e.payload) : {};
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-3 py-2 text-xs"
                style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
                <span style={{ color: ACID }}>{icon}</span>
                <span className="opacity-50" style={{ color: ACID }}>{label}</span>
                <span className="opacity-30 ml-auto" style={{ color: ACID }}>
                  {e.user_id} · {detail.title || detail.track_id || ""}
                </span>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
