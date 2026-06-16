// ============================================================
//  EL BÚNKER — Recaps.jsx
//  RECAP Wrapped — 6 secciones narrativas (ADR-026)
//  S75 — Portada, música, memoria, conexión, hitos, cierre
// ============================================================
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";
import { workerClient } from "../core/WorkerClient";

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

export default function Recaps({ events = [], accentColor = ACID }) {
  const [period, setPeriod] = useState("weekly");
  const [section, setSection] = useState(0);
  // S119: guardar RECAP anual como entrada VAULT (ADR-026)
  const [savingRecap, setSavingRecap] = useState(false);
  const [recapSaved, setRecapSaved] = useState(false);
  const [recapError, setRecapError] = useState(null);
  // Reset save state when switching periods
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRecapSaved(false); setRecapError(null); }, [period]);
  const range = getPeriodRange(period);
  const accent = accentColor ?? ACID;

  const filtered = useMemo(() =>
    events.filter(e => e.created_at >= range.since && e.created_at <= range.until),
    [events, range.since, range.until]
  );

  const stats = useMemo(() => {
    const plays = filtered.filter(e => e.event_type === "track_play").length;
    const drops = filtered.filter(e => e.event_type === "drop_sent").length;
    const created = filtered.filter(e => e.event_type === "entry_created").length;
    const smokes = filtered.filter(e => e.event_type?.startsWith("smoke_"));
    const completed = smokes.filter(e => e.event_type === "smoke_session_completed").length;

    // Top day
    const days = {};
    filtered.forEach(e => {
      const d = e.created_at?.slice(0, 10);
      if (d) days[d] = (days[d] || 0) + 1;
    });
    const topDay = Object.entries(days).sort((a, b) => b[1] - a[1])[0];

    // Top tracks
    const trackPlays = {};
    filtered.filter(e => e.event_type === "track_play").forEach(e => {
      let p = {};
      try { p = typeof e.payload === "string" ? JSON.parse(e.payload) : (e.payload || {}); } catch { /* payload malformado — ignorar */ }
      const id = p.track_id || "?";
      trackPlays[id] = (trackPlays[id] || 0) + 1;
    });
    const topTrack = Object.entries(trackPlays).sort((a, b) => b[1] - a[1])[0];

    // User contributions
    const users = {};
    filtered.forEach(e => {
      const u = e.user_id || "?";
      users[u] = (users[u] || 0) + 1;
    });
    const topUser = Object.entries(users).sort((a, b) => b[1] - a[1])[0];

    return {
      plays, drops, created, completed,
      total: filtered.length,
      topDay: topDay ? { date: topDay[0], count: topDay[1] } : null,
      topTrack: topTrack ? { id: topTrack[0], plays: topTrack[1] } : null,
      topUser: topUser ? { id: topUser[0], events: topUser[1] } : null,
      uniqueDays: Object.keys(days).length,
    };
  }, [filtered]);

  const sections = [
    { icon: "📔", label: "PORTADA", content: `Tu ${PERIODS.find(p => p.id === period)?.label} en El Búnker`,
      detail: `${stats.total} eventos · ${stats.uniqueDays} días activos`,
      color: ACID },
    { icon: "🎵", label: "MÚSICA", content: `${stats.plays} reproducciones`,
      detail: stats.topTrack ? `${stats.topTrack.id.slice(0, 20)} · ${stats.topTrack.plays}x` : "Sin datos",
      color: "#00ffcc" },
    { icon: "📝", label: "MEMORIA", content: `${stats.created} entradas creadas`,
      detail: "Fotos, notas, cartas e hitos en el VAULT",
      color: PURPLE },
    { icon: "♥", label: "CONEXIÓN", content: `${stats.drops} drops enviados`,
      detail: stats.topUser ? `${stats.topUser.id} lidera con ${stats.topUser.events} eventos` : "",
      color: "#ff6b35" },
    { icon: "🏆", label: "HITOS", content: stats.topDay ? `Día más activo: ${stats.topDay.date}` : "Sin datos",
      detail: `${stats.topDay?.count || 0} eventos en un solo día`,
      color: "#aaff44" },
    { icon: "✨", label: "CIERRE", content: `${stats.completed} sesiones completadas`,
      detail: "Lo vivido queda guardado. Hasta el próximo RECAP.",
      color: ACID },
  ];

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* Period selector */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <motion.button key={p.id} onClick={() => { setPeriod(p.id); setSection(0); }} whileTap={{ scale: 0.95 }}
            className={`text-xs tracking-[0.2em] uppercase px-3 py-2 ${period === p.id ? "" : "opacity-30"}`}
            style={{ color: period === p.id ? accent : `${accent}88`, borderBottom: period === p.id ? `1px solid ${accent}` : "1px solid transparent", fontFamily: FONT_MONO }}>
            {p.icon} {p.label}
          </motion.button>
        ))}
      </div>

      {/* S75: RECAP Wrapped — 6 narrative sections */}
      <div className="flex flex-col gap-3">
        {/* Section dots nav */}
        <div className="flex gap-1 justify-center">
          {sections.map((_, i) => (
            <button key={i} onClick={() => setSection(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: section === i ? accent : `${accent}22`,
                width: section === i ? 24 : 8,
              }}
            />
          ))}
        </div>

        {/* Current section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="p-5 rounded-sm text-center flex flex-col items-center gap-3"
            style={{
              background: GLASS_BG,
              border: `1px solid ${GLASS_BORDER}`,
              minHeight: 180,
            }}
          >
            {/* Section icon */}
            <motion.span
              key={`icon-${section}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
              className="text-3xl"
            >
              {sections[section].icon}
            </motion.span>

            {/* Section label */}
            <p className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: sections[section].color }}>
              {sections[section].label}
            </p>

            {/* Content */}
            <motion.p
              key={`ct-${section}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg font-bold"
              style={{ color: accent }}
            >
              {sections[section].content}
            </motion.p>

            {/* Detail */}
            <p className="text-xs opacity-40" style={{ color: accent }}>
              {sections[section].detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* S119: Guardar RECAP anual como entrada VAULT */}
        {period === "annual" && (
          <div className="flex flex-col items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (!workerClient.hasToken() || savingRecap) return;
                setSavingRecap(true);
                setRecapError(null);
                try {
                  await workerClient.post('/api/entries', {
                    title: `RECAP ${new Date().getFullYear() - 1}`,
                    type: 'recap',
                    content: JSON.stringify({
                      period: 'annual',
                      year: new Date().getFullYear() - 1,
                      generated_at: new Date().toISOString(),
                      stats,
                      sections,
                    }),
                  });
                  setRecapSaved(true);
                } catch (e) {
                  console.warn('[Recaps] Guardar RECAP falló:', e);
                  setRecapError(e.message?.slice(0, 60) ?? 'Error al guardar');
                } finally {
                  setSavingRecap(false);
                }
              }}
              disabled={savingRecap || recapSaved}
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 rounded-sm"
              style={{
                color: recapSaved ? `${accent}44` : accent,
                border: `1px solid ${recapSaved ? `${accent}22` : `${accent}44`}`,
                background: recapSaved ? `${accent}04` : `${accent}08`,
                fontFamily: FONT_MONO,
                opacity: recapSaved ? 0.5 : 1,
              }}
            >
              {savingRecap ? 'GUARDANDO...' : recapSaved ? '✓ GUARDADO EN VAULT' : '🌟 GUARDAR COMO ENTRADA'}
            </motion.button>
            {recapError && (
              <p className="text-xs opacity-60" style={{ color: '#ff3b3b', fontFamily: FONT_MONO }}>
                {recapError}
              </p>
            )}
          </div>
        )}

        {/* Prev / Next */}
        <div className="flex justify-between">
          <button
            onClick={() => setSection(s => Math.max(0, s - 1))}
            className="text-xs px-3 py-2 opacity-40 hover:opacity-100"
            style={{ color: accent, fontFamily: FONT_MONO }}
            disabled={section === 0}
          >
            ◀ ANTERIOR
          </button>
          <button
            onClick={() => setSection(s => Math.min(sections.length - 1, s + 1))}
            className="text-xs px-3 py-2 opacity-40 hover:opacity-100"
            style={{ color: accent, fontFamily: FONT_MONO }}
            disabled={section === sections.length - 1}
          >
            SIGUIENTE ▶
          </button>
        </div>
      </div>
    </div>
  );
}
