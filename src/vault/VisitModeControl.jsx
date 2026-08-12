// ============================================================
//  EL BÚNKER — VisitModeControl.jsx
//  Interruptor de Modo Visita (A5, diseño §5).
//  · Encender: cualquier sesión autenticada, sin clave → POST /api/session/visit
//  · Apagar:   pide la clave de acceso (ADR-028) → POST /api/session/visit
//              con access_key; sin clave el worker responde 401 y no apaga.
//  El claim vive en el JWT: sobrevive a la recarga (le pasas el móvil
//  y no se cae solo). Iconos SVG (lucide), sin emoji (regla de Edu).
// ============================================================
import { useState } from "react";
import { motion } from "framer-motion";
import { ACID, FONT_MONO } from "../tokens";
import { Icon } from "../core/ui";
import Dialog from "../core/ui/Dialog";
import { useVault } from "../core/VaultContext";

const HAZARD = "#ff3b3b";

export default function VisitModeControl({ accentColor = ACID }) {
  const { visitMode, setVisitMode } = useVault();
  const [askKey, setAskKey] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    if (visitMode) {
      // Apagar exige clave (ADR-028): sin clave no apaga.
      setError(null);
      setAccessKey("");
      setAskKey(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setVisitMode(true);
    } catch (e) {
      setError(e?.message ?? "No se pudo encender el modo visita.");
    } finally {
      setBusy(false);
    }
  };

  const handleOff = async (e) => {
    e.preventDefault();
    if (busy || !accessKey.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await setVisitMode(false, accessKey.trim());
      setAskKey(false);
      setAccessKey("");
    } catch (err) {
      // 401 "Access key required..." → la clave no vale: sigue encendido.
      setError(err?.message ?? "Clave no válida.");
    } finally {
      setBusy(false);
    }
  };

  const color = visitMode ? HAZARD : accentColor;

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={handleToggle}
        disabled={busy}
        aria-pressed={visitMode}
        aria-label={visitMode ? "Apagar modo visita" : "Encender modo visita"}
        className="text-xs tracking-widest uppercase px-3 py-2.5 rounded-sm flex items-center gap-2"
        style={{
          color,
          border: `1px solid ${visitMode ? `${HAZARD}66` : `${accentColor}33`}`,
          background: visitMode ? `${HAZARD}0d` : `${accentColor}08`,
          fontFamily: FONT_MONO,
          cursor: busy ? "wait" : "pointer",
        }}
        title={visitMode ? "Modo visita activo — apagar requiere clave" : "Mostrar el Búnker con lo clasificado desenfocado"}
      >
        <Icon name={visitMode ? "shield" : "lock"} size={14} decorative />
        {busy ? "..." : visitMode ? "MODO VISITA ON" : "MODO VISITA"}
        {visitMode && (
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: HAZARD, boxShadow: `0 0 6px ${HAZARD}` }}
          />
        )}
      </motion.button>

      <Dialog
        open={askKey}
        title="APAGAR MODO VISITA"
        onClose={() => { if (!busy) { setAskKey(false); setError(null); } }}
        accentColor={HAZARD}
      >
        <p className="text-xs leading-relaxed opacity-70" style={{ color: HAZARD }}>
          Se requiere la clave de acceso (ADR-028) para desactivar el modo visita.
          Sin clave, el modo permanece activo.
        </p>
        <form onSubmit={handleOff} className="flex flex-col gap-3">
          <label
            htmlFor="visit-mode-key"
            className="text-[10px] tracking-[0.3em] uppercase opacity-50"
            style={{ color: HAZARD }}
          >
            CLAVE DE ACCESO
          </label>
          <input
            id="visit-mode-key"
            type="password"
            autoComplete="off"
            spellCheck="false"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            disabled={busy}
            className="w-full min-h-[44px] px-3 text-sm rounded-sm outline-none"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: `1px solid ${HAZARD}55`,
              color: HAZARD,
              fontFamily: FONT_MONO,
              letterSpacing: "0.15em",
            }}
          />
          {error && (
            <p className="text-[10px] tracking-wider uppercase leading-relaxed" style={{ color: HAZARD }}>
              <Icon name="alert" size={12} decorative /> {error}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { if (!busy) { setAskKey(false); setError(null); } }}
              disabled={busy}
              className="text-xs tracking-widest uppercase px-3 py-2.5 min-h-[44px] rounded-sm opacity-50"
              style={{ color: HAZARD, fontFamily: FONT_MONO }}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={busy || !accessKey.trim()}
              className="text-xs tracking-widest uppercase px-4 py-2.5 min-h-[44px] rounded-sm"
              style={{
                color: HAZARD,
                border: `1px solid ${busy || !accessKey.trim() ? `${HAZARD}33` : `${HAZARD}88`}`,
                background: `${HAZARD}0d`,
                fontFamily: FONT_MONO,
                cursor: busy || !accessKey.trim() ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "VERIFICANDO..." : "APAGAR"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
