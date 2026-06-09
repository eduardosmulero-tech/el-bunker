// ============================================================
//  EL BÚNKER — Recaps.jsx
//  Resúmenes semanales/mensuales/anuales (ADR-026)
//  S69-S70 · Fase 4 — RECAP
// ============================================================
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";

const PERIODS = [
  { id: "weekly", label: "SEMANAL", icon: "📅" },
  { id: "monthly", label: "MENSUAL", icon: "🌙" },
  { id: "annual", label: "ANUAL", icon: "🌟" },
];

function getPeriodRange(period) {
  const now = new Date();
  if (period === "weekly") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return { since: start.toISOString(), until: now.toISOString() };
  }
  if (period === "monthly") {
    const start = new Date(now); start.setMonth(now.getMonth() - 1);
    return { since: start.toISOString(), until: now.toISOString() };
  }
  const start = new Date(now); start.setFullYear(now.getFullYear() - 1);
  return { since: start.toISOString(), until: now.toISOString() };
}

export default function Recaps({ events = [], tracks = [], entries = [] }) {
  const [period, setPeriod] = useState("weekly");
  const range = getPeriodRange(period);

  const filtered = useMemo(() =>
    events.filter(e => e.created_at >= range.since && e.created_at <= range.until),
    [events, range.since, range.until]
  );

  const stats = useMemo(() => {
    const plays = filtered.filter(e => e.event_type === "track_play").length;
    const drops = filtered.filter(e => e.event_type === "drop_sent").length;
    const created = filtered.filter(e => e.event_type === "entry_created").length;
    const smokes = filtered.filter(e => e.event_type === "smoke_session_completed").length;
    return { plays, drops, created, smokes, total: filtered.length };
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* Selector de periodo */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <motion.button key={p.id} onClick={() => setPeriod(p.id)} whileTap={{ scale: 0.95 }}
            className={`text-xs tracking-[0.2em] uppercase px-3 py-2 ${period === p.id ? "" : "opacity-30"}`}
            style={{ color: period === p.id ? ACID : `${ACID}88`, borderBottom: period === p.id ? `1px solid ${ACID}` : "1px solid transparent", fontFamily: FONT_MONO }}>
            {p.icon} {p.label}
          </motion.button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "REPRODUCCIONES", value: stats.plays, color: ACID },
          { label: "DROPS", value: stats.drops, color: "#ff6b35" },
          { label: "ENTRADAS", value: stats.created, color: PURPLE },
          { label: "SESIONES", value: stats.smokes, color: "#00ffcc" },
        ].map(s => (
          <div key={s.label} className="p-3 text-center" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs tracking-[0.2em] opacity-50 mt-1" style={{ color: ACID }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="p-3 text-center text-xs tracking-[0.3em] uppercase" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: ACID }}>
        {stats.total} EVENTOS TOTALES · {range.since.slice(0, 10)} → {range.until.slice(0, 10)}
      </div>
    </div>
  );
}
