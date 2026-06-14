// ============================================================
//  EL BÚNKER — Timeline.jsx
//  Feed cronológico unificado (ADR-020)
//  Consume eventos vía props (datos de D1)
//  S72 — Filtros Era/module/tipo, banner "Un día como hoy"
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ACID, FONT_MONO, GLASS_BG, GLASS_BORDER, PURPLE } from "../tokens";

const PAGE_SIZE = 50;

const EVENT_ICONS = {
  track_play: "▶", track_pause: "⏸", track_skip: "⏭",
  entry_created: "✎", entry_updated: "✏", entry_deleted: "✕",
  drop_sent: "♥", drop_seen: "👁",
  smoke_session_started: "⧖", smoke_session_completed: "✓",
  smoke_session_abandoned: "⌁",
  era_created: "◈",
  capsule_sealed: "🔮", capsule_opened: "✨",
  playlist_created: "♫",
};

export default function Timeline({ events = [], accentColor = ACID, eras = [] }) {
  const [viewMode, setViewMode] = useState("timeline");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterModule, setFilterModule] = useState("all"); // all | vault | music | smoke | system
  const [filterType, setFilterType] = useState("all");
  const [filterEra, setFilterEra] = useState("all");
  const accent = accentColor ?? ACID;
  // S85d: toast infra para feedback de fetch errors (silent catch fix)
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // S72: Filtered & sorted events
  const filteredEvents = useMemo(() => {
    let result = events;
    if (filterModule !== "all") {
      result = result.filter(e => {
        if (filterModule === "vault") return e.event_type?.startsWith("entry_") || e.event_type === "era_created";
        if (filterModule === "music") return e.event_type?.startsWith("track_") || e.event_type?.startsWith("drop_") || e.event_type === "playlist_created";
        if (filterModule === "smoke") return e.event_type?.startsWith("smoke_");
        if (filterModule === "system") return e.event_type?.startsWith("capsule_") || !e.event_type?.match(/^(entry_|track_|drop_|smoke_|era_|playlist_)/);
        return true;
      });
    }
    if (filterType !== "all") {
      result = result.filter(e => e.event_type === filterType);
    }
    if (filterEra !== "all") {
      result = result.filter(e => {
        try {
          const p = typeof e.payload === "string" ? JSON.parse(e.payload || "{}") : (e.payload || {});
          return p.era_id === filterEra || p.era_name === filterEra;
        } catch { return false; }
      });
    }
    return result;
  }, [events, filterModule, filterType, filterEra]);

  // S72: "Un día como hoy" — events from this day in past years
  const todayEvents = useMemo(() => {
    const today = new Date();
    const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return filteredEvents.filter(e => {
      if (!e.created_at) return false;
      const eventYear = new Date(e.created_at).getFullYear();
      if (eventYear === today.getFullYear()) return false;
      const eventMMDD = e.created_at.slice(5, 10);
      return eventMMDD === mmdd;
    });
  }, [filteredEvents]);

  // Unique event types for filter
  const eventTypes = useMemo(() =>
    [...new Set(events.map(e => e.event_type).filter(Boolean))].sort(),
    [events]
  );

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12" style={{ fontFamily: FONT_MONO }}>
        <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
          className="text-3xl" style={{ color: ACID }}>◎</motion.div>
        <p className="text-xs tracking-[0.3em] uppercase opacity-30" style={{ color: accent }}>
          SIN EVENTOS AÚN
        </p>
      </div>
    );
  }

  const grouped = {};
  for (const e of visibleEvents) {
    const day = e.created_at?.slice(0, 10) ?? "desconocido";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  }

  // Module filter options
  const MODULES = [
    { id: "all", label: "TODO" },
    { id: "vault", label: "VAULT" },
    { id: "music", label: "MUSIC" },
    { id: "smoke", label: "SMOKE" },
  ];

  return (
    <>
    <div className="flex flex-col gap-3" style={{ fontFamily: FONT_MONO }}>
      {/* S72: "Un día como hoy" banner */}
      {todayEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-sm"
          style={{ background: `${PURPLE}0d`, border: `1px solid ${PURPLE}33` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm" style={{ color: PURPLE }}>📅</span>
            <span className="text-xs tracking-[0.2em] uppercase font-bold" style={{ color: PURPLE }}>
              UN DÍA COMO HOY
            </span>
          </div>
          <p className="text-xs opacity-50" style={{ color: ACID }}>
            {todayEvents.length} evento{todayEvents.length > 1 ? "s" : ""} en esta fecha de años anteriores
          </p>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {todayEvents.slice(0, 3).map((e, i) => {
              const year = e.created_at?.slice(0, 4);
              const icon = EVENT_ICONS[e.event_type] || "●";
              return (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded-sm" style={{ background: `${PURPLE}15`, color: PURPLE }}>
                  {icon} {year}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* S72: Filter bar */}
      <div className="flex flex-col gap-2">
        {/* Module filters */}
        <div className="flex gap-1 overflow-x-auto">
          {MODULES.map(m => (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => { setFilterModule(m.id); setVisibleCount(PAGE_SIZE); }}
              className="text-xs px-2 py-1 rounded-sm flex-shrink-0"
              style={{
                color: filterModule === m.id ? accent : `${accent}55`,
                border: `1px solid ${filterModule === m.id ? `${accent}44` : `${accent}18`}`,
                background: filterModule === m.id ? `${accent}0d` : "transparent",
              }}
            >
              {m.label}
            </motion.button>
          ))}
        </div>

        {/* Type filter — horizontal scroll */}
        {eventTypes.length > 2 && (
          <div className="flex gap-1 overflow-x-auto">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { setFilterType("all"); setVisibleCount(PAGE_SIZE); }}
              className="text-xs px-2 py-1 rounded-sm flex-shrink-0"
              style={{
                color: filterType === "all" ? accent : `${accent}40`,
                border: `1px solid ${filterType === "all" ? `${accent}33` : `${accent}14`}`,
                background: filterType === "all" ? `${accent}08` : "transparent",
              }}
            >
              TIPOS
            </motion.button>
            {eventTypes.slice(0, 10).map(t => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setFilterType(filterType === t ? "all" : t); setVisibleCount(PAGE_SIZE); }}
                className="text-xs px-2 py-1 rounded-sm flex-shrink-0"
                style={{
                  color: filterType === t ? accent : `${accent}40`,
                  border: `1px solid ${filterType === t ? `${accent}33` : `${accent}14`}`,
                  background: filterType === t ? `${accent}08` : "transparent",
                }}
              >
                {EVENT_ICONS[t] || "●"} {t.replace(/_/g, " ").slice(0, 14)}
              </motion.button>
            ))}
          </div>
        )}

        {/* Era filter — if eras provided */}
        {eras.length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { setFilterEra("all"); setVisibleCount(PAGE_SIZE); }}
              className="text-xs px-2 py-1 rounded-sm flex-shrink-0"
              style={{ color: filterEra === "all" ? accent : `${accent}40`, border: `1px solid ${filterEra === "all" ? `${accent}33` : `${accent}14`}` }}
            >
              TODAS
            </motion.button>
            {eras.slice(0, 6).map(era => (
              <motion.button
                key={era.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setFilterEra(filterEra === era.id ? "all" : era.id); setVisibleCount(PAGE_SIZE); }}
                className="text-xs px-2 py-1 rounded-sm flex-shrink-0"
                style={{ color: filterEra === era.id ? era.color : `${accent}40`, border: `1px solid ${filterEra === era.id ? `${era.color}44` : `${accent}14`}` }}
              >
                ◈ {era.name}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* View mode toggle + count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {[
            { id: "timeline", icon: "◎", label: "TIMELINE" },
            { id: "compact", icon: "≡", label: "COMPACT" },
          ].map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)}
              className={`text-xs px-2 py-1 uppercase ${viewMode === m.id ? "" : "opacity-30"}`}
              style={{ color: accent, borderBottom: viewMode === m.id ? `1px solid ${accent}` : "1px solid transparent", fontFamily: FONT_MONO }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <span className="text-xs opacity-30" style={{ color: accent, fontFamily: FONT_MONO }}>
          {visibleEvents.length}/{filteredEvents.length}
        </span>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-xs opacity-25 text-center py-6" style={{ color: accent }}>Sin eventos con estos filtros</p>
      ) : viewMode === "compact" ? (
        /* Modo compacto */
        <div className="flex flex-col gap-1">
          {visibleEvents.map((e, i) => {
            const icon = EVENT_ICONS[e.event_type] || "●";
            const label = e.event_type?.replace(/_/g, " ").toUpperCase() ?? "EVENTO";
            return (
              <motion.div key={`${e.id || i}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                className="flex items-center gap-2 px-2 py-1 text-xs"
                style={{ borderBottom: `1px solid ${accent}11` }}>
                <span style={{ color: accent }}>{icon}</span>
                <span className="opacity-30" style={{ color: accent, fontFamily: FONT_MONO }}>
                  {e.created_at?.slice(11, 16) ?? "--:--"}
                </span>
                <span className="opacity-50 truncate" style={{ color: accent, fontFamily: FONT_MONO }}>{label}</span>
                <span className="opacity-20 ml-auto text-xs" style={{ color: accent }}>{e.user_id}</span>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Modo timeline */
        <>
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.3em] uppercase opacity-40" style={{ color: accent }}>{day}</p>
          {items.map((e, i) => {
            const icon = EVENT_ICONS[e.event_type] || "●";
            const label = e.event_type?.replace(/_/g, " ").toUpperCase() ?? "EVENTO";
            let detail = {};
            try {
              detail = e.payload ? (typeof e.payload === "string" ? JSON.parse(e.payload) : e.payload) : {};
            } catch { /* keep empty */ }
            return (
              <motion.div key={`${e.id || day}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-3 py-2 text-xs"
                style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
                <span style={{ color: accent }}>{icon}</span>
                <span className="opacity-50" style={{ color: accent }}>{label}</span>
                <span className="opacity-30 ml-auto truncate" style={{ color: accent }}>
                  {e.user_id} {detail.title || detail.track_id || detail.era_name || ""}
                </span>
              </motion.div>
            );
          })}
        </div>
      ))}
        </>
      )}

      {/* Load more */}
      {hasMore && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, filteredEvents.length))}
          className="text-xs tracking-[0.2em] uppercase py-2 px-4 mx-auto opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }}
        >
          ↓ CARGAR MÁS ({filteredEvents.length - visibleCount} restantes)
        </motion.button>
      )}
    </div>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: "fixed", bottom: 90, left: 16, right: 16,
            background: `${ACID}18`, border: `1px solid ${ACID}55`, color: ACID,
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.25em",
            padding: "8px 20px", borderRadius: 2, zIndex: 9999, textAlign: "center" }}>
          {toast}
        </motion.div>
      )}
  </>);
}
