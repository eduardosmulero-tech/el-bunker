// ============================================================
//  EL BÚNKER — Timeline.jsx
//  Feed cronológico unificado (ADR-020)
//  Consume eventos vía props (datos de D1)
//  S67 · Fase 3 — CAPSULES núcleo
// ============================================================
import { useState } from "react";
import { motion } from "framer-motion";
import { ACID, FONT_MONO, GLASS_BG, GLASS_BORDER } from "../tokens";

const PAGE_SIZE = 50;

export default function Timeline({ events = [], accentColor = ACID }) {
  const [viewMode, setViewMode] = useState("timeline"); // timeline | compact
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const accent = accentColor ?? ACID;

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

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

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: FONT_MONO }}>
      {/* G5: Toggle modos de vista + paginación */}
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
          {visibleEvents.length}/{events.length}
        </span>
      </div>

      {viewMode === "compact" ? (
        /* Modo compacto: lista plana sin agrupar por día */
        <div className="flex flex-col gap-1">
          {visibleEvents.map((e, i) => {
            const label = e.event_type?.replace(/_/g, " ").toUpperCase() ?? "EVENTO";
            return (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                className="flex items-center gap-2 px-2 py-1 text-xs"
                style={{ borderBottom: `1px solid ${accent}11` }}>
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
        /* Modo timeline: agrupado por día */
        <>
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.3em] uppercase opacity-40" style={{ color: accent }}>{day}</p>
          {items.map((e, i) => {
            const icon = e.event_type === "track_play" ? "▶" : e.event_type === "drop_sent" ? "♥" :
              e.event_type === "entry_created" ? "✎" : e.event_type === "smoke_session_completed" ? "⧖" : "●";
            const label = e.event_type.replace(/_/g, " ").toUpperCase();
            const detail = e.payload
              ? (typeof e.payload === "string" ? JSON.parse(e.payload) : e.payload)
              : {};
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-3 py-2 text-xs"
                style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
                <span style={{ color: accent }}>{icon}</span>
                <span className="opacity-50" style={{ color: accent }}>{label}</span>
                <span className="opacity-30 ml-auto" style={{ color: accent }}>
                  {e.user_id} · {detail.title || detail.track_id || ""}
                </span>
              </motion.div>
            );
          })}
        </div>
      ))}
        </>
      )}

      {/* G5: Botón cargar más */}
      {hasMore && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, events.length))}
          className="text-xs tracking-[0.2em] uppercase py-2 px-4 mx-auto opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: accent, border: `1px solid ${accent}33`, fontFamily: FONT_MONO }}
        >
          ↓ CARGAR MÁS ({events.length - visibleCount} restantes)
        </motion.button>
      )}
    </div>
  );
}
