// ============================================================
//  EL BÚNKER — Timeline.jsx
//  Feed cronológico unificado (ADR-020)
//  Consume eventos vía props (datos de D1)
//  S72 — Filtros Era/module/tipo, banner "Un día como hoy"
// ============================================================
import { useState } from "react";
import { motion } from "framer-motion";
import { ACID, FONT_MONO, GLASS_BG, GLASS_BORDER, PURPLE } from "../tokens";
import { Icon } from "../core/ui";
import { useTimelineFilters } from "./useTimelineFilters";

const EVENT_ICONS = {
  track_play: "play", track_pause: "pause", track_skip: "arrowRight",
  entry_created: "edit", entry_updated: "edit", entry_deleted: "close",
  drop_sent: "heart", drop_seen: "check",
  smoke_session_started: "timer", smoke_session_completed: "check",
  smoke_session_abandoned: "close",
  era_created: "archive",
  capsule_sealed: "lock", capsule_opened: "sparkles",
  playlist_created: "music",
};

export default function Timeline({ events = [], accentColor = ACID, eras = [] }) {
  const [viewMode, setViewMode] = useState("timeline");
  const accent = accentColor ?? ACID;
  const {
    filterModule,
    filterType,
    filterEra,
    filterUser,
    filteredEvents,
    todayEvents,
    eventTypes,
    visibleEvents,
    hasMore,
    visibleCount,
    setFilterModule,
    setFilterType,
    setFilterEra,
    setFilterUser,
    loadMore,
  } = useTimelineFilters(events);

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12" style={{ fontFamily: FONT_MONO }}>
        <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
          className="text-3xl" style={{ color: accent }}><Icon name="circle" size={28} label="Sin eventos" /></motion.div>
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

  // Fase 3: User filter options
  const USERS = [
    { id: "all", label: "AMBOS" },
    { id: "edu", label: "EDU" },
    { id: "david", label: "DAVID" },
  ];
  const desktopFilters = [
    { id: "module", label: "MODULO", value: filterModule, onChange: setFilterModule, options: MODULES },
    { id: "user", label: "QUIEN", value: filterUser, onChange: setFilterUser, options: USERS },
    ...(eventTypes.length > 2 ? [{
      id: "type",
      label: "TIPO",
      value: filterType,
      onChange: setFilterType,
      options: [{ id: "all", label: "TODOS" }, ...eventTypes.slice(0, 10).map((type) => ({
        id: type,
        label: type.replace(/_/g, " ").slice(0, 18).toUpperCase(),
      }))],
    }] : []),
    ...(eras.length > 0 ? [{
      id: "era",
      label: "ERA",
      value: filterEra,
      onChange: setFilterEra,
      options: [{ id: "all", label: "TODAS" }, ...eras.slice(0, 6).map((era) => ({ id: era.id, label: era.name }))],
    }] : []),
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
            <Icon name="calendar" size={14} label="Fecha" />
            <span className="text-xs tracking-[0.2em] uppercase font-bold" style={{ color: PURPLE }}>
              UN DÍA COMO HOY
            </span>
          </div>
          <p className="text-xs opacity-50" style={{ color: accent }}>
            {todayEvents.length} evento{todayEvents.length > 1 ? "s" : ""} en esta fecha de años anteriores
          </p>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {todayEvents.slice(0, 3).map((e, i) => {
              const year = e.created_at?.slice(0, 4);
              const icon = EVENT_ICONS[e.event_type] || "help";
    return (
      <span key={e.id || `ev-${i}`} className="text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-1" style={{ background: `${PURPLE}15`, color: PURPLE }}>
                  <Icon name={icon} size={12} label="Evento" /> {year}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* F5: desktop filter bar — one row; mobile keeps the original stacked controls. */}
      <div className="hidden xl:flex items-center min-h-[56px]" style={{ borderTop: `1px solid ${accent}14`, borderBottom: `1px solid ${accent}14` }}>
        {desktopFilters.map((filter) => (
          <label key={filter.id} className="relative flex items-center gap-2 px-3 py-2 border-r min-w-0" style={{ borderColor: `${accent}14` }}>
            <span className="text-[9px] tracking-[0.18em] opacity-40 whitespace-nowrap" style={{ color: accent }}>{filter.label}</span>
            <select
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              aria-label={`Filtrar por ${filter.label.toLowerCase()}`}
              className="min-w-0 max-w-[9rem] bg-transparent text-xs uppercase outline-none cursor-pointer"
              style={{ color: accent, fontFamily: FONT_MONO }}
            >
              {filter.options.map((option) => <option key={option.id} value={option.id} style={{ background: "#0a0a0a", color: accent }}>{option.label}</option>)}
            </select>
          </label>
        ))}
        <div className="ml-auto flex items-center gap-3 px-3 shrink-0">
          <span className="text-xs tabular-nums opacity-40" style={{ color: accent }}>{visibleEvents.length}/{filteredEvents.length}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              aria-label="Vista timeline"
              aria-pressed={viewMode === "timeline"}
              title="Vista timeline"
              className="w-8 h-8 flex items-center justify-center rounded-sm"
              style={{ color: accent, border: `1px solid ${viewMode === "timeline" ? `${accent}66` : `${accent}18`}`, opacity: viewMode === "timeline" ? 1 : 0.4 }}
            ><Icon name="clock" size={14} decorative /></button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              aria-label="Vista compacta"
              aria-pressed={viewMode === "compact"}
              title="Vista compacta"
              className="w-8 h-8 flex items-center justify-center rounded-sm"
              style={{ color: accent, border: `1px solid ${viewMode === "compact" ? `${accent}66` : `${accent}18`}`, opacity: viewMode === "compact" ? 1 : 0.4 }}
            ><Icon name="more" size={14} decorative /></button>
          </div>
        </div>
      </div>

      {/* S72: Filter bar */}
      <div className="flex flex-col gap-2 xl:hidden">
        {/* Module filters */}
        <div className="flex gap-1 overflow-x-auto">
          {MODULES.map(m => (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setFilterModule(m.id)}
               className="text-xs px-3 py-2.5 min-h-[44px] rounded-sm flex-shrink-0"
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
        {/* Fase 3: User filter */}
        <div className="flex gap-1 overflow-x-auto">
          {USERS.map(u => (
            <motion.button
              key={u.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setFilterUser(u.id)}
               className="text-xs px-3 py-2.5 min-h-[44px] rounded-sm flex-shrink-0"
              style={{
                color: filterUser === u.id ? accent : `${accent}55`,
                border: `1px solid ${filterUser === u.id ? `${accent}44` : `${accent}18`}`,
                background: filterUser === u.id ? `${accent}0d` : "transparent",
              }}
            >
              {u.label}
            </motion.button>
          ))}
        </div>

        {/* Type filter — horizontal scroll */}
        {eventTypes.length > 2 && (
          <div className="flex gap-1 overflow-x-auto">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setFilterType("all")}
               className="text-xs px-3 py-2.5 min-h-[44px] rounded-sm flex-shrink-0"
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
                onClick={() => setFilterType(filterType === t ? "all" : t)}
                className="text-xs px-3 py-2 min-h-[44px] rounded-sm flex-shrink-0"
                style={{
                  color: filterType === t ? accent : `${accent}40`,
                  border: `1px solid ${filterType === t ? `${accent}33` : `${accent}14`}`,
                  background: filterType === t ? `${accent}08` : "transparent",
                }}
              >
                <Icon name={EVENT_ICONS[t] || "help"} size={13} label={t.replace(/_/g, " ")} /> {t.replace(/_/g, " ").slice(0, 14)}
              </motion.button>
            ))}
          </div>
        )}

        {/* Era filter — if eras provided */}
        {eras.length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setFilterEra("all")}
               className="text-xs px-3 py-2.5 min-h-[44px] rounded-sm flex-shrink-0"
              style={{ color: filterEra === "all" ? accent : `${accent}40`, border: `1px solid ${filterEra === "all" ? `${accent}33` : `${accent}14`}` }}
            >
              TODAS
            </motion.button>
            {eras.slice(0, 6).map(era => (
              <motion.button
                key={era.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setFilterEra(filterEra === era.id ? "all" : era.id)}
                className="text-xs px-3 py-2 min-h-[44px] rounded-sm flex-shrink-0"
                style={{ color: filterEra === era.id ? era.color : `${accent}40`, border: `1px solid ${filterEra === era.id ? `${era.color}44` : `${accent}14`}` }}
              >
                <Icon name="archive" size={13} label="Era" /> {era.name}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* View mode toggle + count */}
      <div className="flex items-center justify-between gap-2 xl:hidden">
        <div className="flex gap-1">
          {[
            { id: "timeline", icon: "clock", label: "TIMELINE" },
            { id: "compact", icon: "more", label: "COMPACT" },
          ].map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)}
              className={`text-xs px-3 py-2.5 min-h-[44px] uppercase ${viewMode === m.id ? "" : "opacity-30"}`}
              style={{ color: accent, borderBottom: viewMode === m.id ? `1px solid ${accent}` : "1px solid transparent", fontFamily: FONT_MONO }}>
              <Icon name={m.icon} size={14} label={m.label} /> {m.label}
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
            const icon = EVENT_ICONS[e.event_type] || "help";
            const label = e.event_type?.replace(/_/g, " ").toUpperCase() ?? "EVENTO";
            return (
              <motion.div key={e.id || `tev-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                className="flex items-center gap-2 px-2 py-1 text-xs min-w-0 xl:grid xl:grid-cols-[5rem_minmax(10rem,14rem)_8rem_minmax(0,1fr)] xl:gap-4"
                style={{ borderBottom: `1px solid ${accent}11` }}>
                <div className="contents xl:hidden">
                  <Icon name={icon} size={14} label={label} />
                  <span className="opacity-30" style={{ color: accent, fontFamily: FONT_MONO }}>
                    {e.created_at?.slice(11, 16) ?? "--:--"}
                  </span>
                  <span className="opacity-50 truncate" style={{ color: accent, fontFamily: FONT_MONO }}>{label}</span>
                  <span className="opacity-20 ml-auto text-xs min-w-0" style={{ color: accent, overflowWrap: "anywhere", whiteSpace: "normal" }}>{e.user_id}</span>
                </div>
                <div className="hidden xl:contents">
                  <span className="tabular-nums opacity-50" style={{ color: accent }}>{e.created_at?.slice(11, 16) ?? "--:--"}</span>
                  <span className="flex items-center gap-2 min-w-0 truncate" style={{ color: accent }}><Icon name={icon} size={14} decorative /> {label}</span>
                  <span className="truncate opacity-50" style={{ color: accent }}>{e.user_id || "SISTEMA"}</span>
                  <span className="min-w-0 truncate opacity-70" style={{ color: accent }}>{e.title || e.track_id || e.era_name || ""}</span>
                </div>
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
            const icon = EVENT_ICONS[e.event_type] || "help";
            const label = e.event_type?.replace(/_/g, " ").toUpperCase() ?? "EVENTO";
            let detail = {};
            try {
              detail = e.payload ? (typeof e.payload === "string" ? JSON.parse(e.payload) : e.payload) : {};
            } catch { /* keep empty */ }
            const subject = detail.title || detail.track_id || detail.era_name || "";
            return (
              <motion.div key={e.id || `${day}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-3 py-2 text-xs min-w-0 xl:grid xl:grid-cols-[5rem_minmax(10rem,14rem)_8rem_minmax(0,1fr)] xl:gap-4"
                style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
                <div className="contents xl:hidden">
                  <Icon name={icon} size={14} label={label} />
                  <span className="opacity-50" style={{ color: accent }}>{label}</span>
                  <span className="ml-auto opacity-30 min-w-0" style={{ color: accent, overflowWrap: "anywhere", whiteSpace: "normal" }}>
                    {e.user_id} {subject}
                  </span>
                </div>
                <div className="hidden xl:contents">
                  <span className="tabular-nums opacity-50" style={{ color: accent }}>{e.created_at?.slice(11, 16) ?? "--:--"}</span>
                  <span className="flex items-center gap-2 min-w-0 truncate" style={{ color: accent }}><Icon name={icon} size={14} decorative /> {label}</span>
                  <span className="truncate opacity-50" style={{ color: accent }}>{e.user_id || "SISTEMA"}</span>
                  <span className="min-w-0 truncate opacity-70" style={{ color: accent }}>{subject}</span>
                </div>
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
          onClick={loadMore}
          className="text-xs tracking-[0.2em] uppercase py-3 px-4 min-h-[44px] mx-auto opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }}
        >
          <Icon name="arrowDown" size={12} decorative /> CARGAR MÁS ({filteredEvents.length - visibleCount} restantes)
        </motion.button>
      )}
    </div>
      {null}
  </>);
}
