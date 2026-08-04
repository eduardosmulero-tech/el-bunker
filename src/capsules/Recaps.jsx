// ============================================================
//  EL BÚNKER — Recaps.jsx
//  RECAP Wrapped — 6 secciones narrativas (ADR-026)
//  S75 — Portada, música, memoria, conexión, hitos, cierre
// ============================================================
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";
import { workerClient } from "../core/WorkerClient";
import { Icon } from "../core/ui";

const PERIODS = [
  { id: "weekly", label: "SEMANAL", icon: "calendar" },
  { id: "monthly", label: "MENSUAL", icon: "clock" },
  { id: "annual", label: "ANUAL", icon: "star" },
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

export default function Recaps({ accentColor = ACID }) {
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

  // STAT-M9: agregaciones server-side mediante /api/stats/recap (workers/routes/stats.js)
  // Mantiene shape idéntico al `stats` que el cliente generaba antes, más campos
  // extra (title, artist, name) que vienen del JOIN en D1.
  const [recapData, setRecapData] = useState(null);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [recapFetchErr, setRecapFetchErr] = useState(null);
  // STAT-M9: race-condition guard. Si el usuario cambia de period rapid-click,
  // `reqIdRef` incrementa en cada fetch — sólo el último reqId sobrevive.
  const reqIdRef = useRef(0);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!workerClient.hasToken()) { setRecapData(null); return; }
    const reqId = ++reqIdRef.current;
    let cancelled = false;
    setLoadingRecap(true);
    setRecapFetchErr(null);
    workerClient.get(
      `/api/stats/recap?since=${encodeURIComponent(range.since)}&until=${encodeURIComponent(range.until)}`
    ).then(data => {
      if (cancelled || reqId !== reqIdRef.current) return;
      setRecapData(data);
    }).catch(e => {
      if (cancelled || reqId !== reqIdRef.current) return;
      console.warn("[Recaps] fetch error:", e.message);
      setRecapFetchErr(e.message);
      setRecapData(null);
    }).finally(() => {
      if (cancelled || reqId !== reqIdRef.current) return;
      setLoadingRecap(false);
    });
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => { cancelled = true; };
    // STAT-M9: deps `[period]` (no `[range.since, range.until]`) porque getPeriodRange
    // usa `new Date()` y cambiaría `until` en cada render → re-fetches infinitos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const stats = recapData ?? {
    plays: 0, drops: 0, created: 0, completed: 0,
    total: 0, uniqueDays: 0,
    topDay: null, topTrack: null, topUser: null,
  };

  const sections = [
    { icon: "book", label: "PORTADA", content: `Tu ${PERIODS.find(p => p.id === period)?.label} en El Búnker`,
      detail: `${stats.total} eventos · ${stats.uniqueDays} días activos`,
      color: ACID },
    { icon: "music", label: "MÚSICA", content: `${stats.plays} reproducciones`,
      detail: stats.topTrack
        ? `${stats.topTrack.title}${stats.topTrack.artist ? " — " + stats.topTrack.artist : ""} · ${stats.topTrack.plays}x`
        : "Sin datos",
      color: "#00ffcc" },
    { icon: "edit", label: "MEMORIA", content: `${stats.created} entradas creadas`,
      detail: "Fotos, notas, cartas e hitos en el VAULT",
      color: PURPLE },
    { icon: "heart", label: "CONEXIÓN", content: `${stats.drops} drops enviados`,
      detail: stats.topUser ? `${stats.topUser.name} lidera con ${stats.topUser.events} eventos` : "",
      color: "#ff6b35" },
    { icon: "star", label: "HITOS", content: stats.topDay ? `Día más activo: ${stats.topDay.date}` : "Sin datos",
      detail: `${stats.topDay?.count || 0} eventos en un solo día`,
      color: "#aaff44" },
    { icon: "sparkles", label: "CIERRE", content: `${stats.completed} sesiones completadas`,
      detail: "Lo vivido queda guardado. Hasta el próximo RECAP.",
      color: ACID },
  ];

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* STAT-M9: indicador de carga + error de fetch server-side */}
      {loadingRecap && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs opacity-50" style={{ color: accent, fontFamily: FONT_MONO }}>
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }}><Icon name="circle" size={14} label="Generando recap" /></motion.span>
          <span className="tracking-[0.3em] uppercase">GENERANDO RECAP</span>
        </div>
      )}
      {recapFetchErr && !loadingRecap && (
        <div className="py-2 px-3 text-xs opacity-70 text-center" style={{ color: "#ff3b3b", fontFamily: FONT_MONO }}>
          <Icon name="alert" size={14} label="Error" /> {recapFetchErr}
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <motion.button key={p.id} onClick={() => { setPeriod(p.id); setSection(0); }} whileTap={{ scale: 0.95 }}
            className={`text-xs tracking-[0.2em] uppercase px-3 py-3 min-h-[44px] ${period === p.id ? "" : "opacity-30"}`}
            style={{ color: period === p.id ? accent : `${accent}88`, borderBottom: period === p.id ? `1px solid ${accent}` : "1px solid transparent", fontFamily: FONT_MONO }}>              <Icon name={p.icon} size={14} label={p.label} /> {p.label}
          </motion.button>
        ))}
      </div>

      {/* S75: RECAP Wrapped — 6 narrative sections */}
      <div className="flex flex-col gap-3">
        {/* Section dots nav */}
        <div className="flex gap-1 justify-center">
          {sections.map((_, i) => (
            <button key={i} onClick={() => setSection(i)}
              className="w-11 h-11 flex items-center justify-center"
              style={{ background: 'transparent' }}
            >
              <span className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: section === i ? accent : `${accent}22`,
                  width: section === i ? 24 : 8,
                }}
              />
            </button>
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
              <Icon name={sections[section].icon} size={32} label={sections[section].label} />
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
              className="text-xs tracking-[0.2em] uppercase px-4 py-3 min-h-[44px] rounded-sm"
              style={{
                color: recapSaved ? `${accent}44` : accent,
                border: `1px solid ${recapSaved ? `${accent}22` : `${accent}44`}`,
                background: recapSaved ? `${accent}04` : `${accent}08`,
                fontFamily: FONT_MONO,
                opacity: recapSaved ? 0.5 : 1,
              }}
            >
              {savingRecap ? 'GUARDANDO...' : recapSaved ? 'GUARDADO EN VAULT' : 'GUARDAR COMO ENTRADA'}
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
            className="text-xs px-3 py-3 min-h-[44px] opacity-40 hover:opacity-100"
            style={{ color: accent, fontFamily: FONT_MONO }}
            disabled={section === 0}
          >
            <Icon name="arrowLeft" size={14} label="Anterior" /> ANTERIOR
          </button>
          <button
            onClick={() => setSection(s => Math.min(sections.length - 1, s + 1))}
            className="text-xs px-3 py-3 min-h-[44px] opacity-40 hover:opacity-100"
            style={{ color: accent, fontFamily: FONT_MONO }}
            disabled={section === sections.length - 1}
          >
            SIGUIENTE <Icon name="arrowRight" size={14} label="Siguiente" />
          </button>
        </div>
      </div>
    </div>
  );
}
