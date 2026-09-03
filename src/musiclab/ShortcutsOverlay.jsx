// ============================================================
//  EL BÚNKER — ShortcutsOverlay.jsx
//  Port fastpotify keys.rs: chuleta de atajos de teclado ("?" abre).
//  Modal accesible: Escape cierra, foco entra en el diálogo, sin
//  tocar el motor de audio ni secuestrar el foco global.
// ============================================================
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Icon } from "../core/ui";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const GROUPS = [
  {
    title: "TRANSPORTE",
    items: [
      ["Espacio", "Reproducir / pausar"],
      ["← / →", "Track anterior / siguiente"],
      ["Shift + ← / →", "Retroceder / avanzar 10s"],
    ],
  },
  {
    title: "MEZCLA",
    items: [
      ["M", "Silenciar / reactivar"],
      ["L", "Like al track activo"],
    ],
  },
  {
    title: "COLA Y VISTA",
    items: [
      ["Q", "Añadir track a la cola"],
      ["F", "Visualizador a pantalla completa"],
      ["?", "Esta chuleta"],
    ],
  },
];

export function ShortcutsOverlay({ accentColor = "#bfff00", open, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (event.key === "?") {
        onClose(); // toggle: la misma tecla abre y cierra
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-label="Atajos de teclado"
        className="w-full max-w-md rounded-sm p-5"
        style={{ fontFamily: FONT_MONO, color: accentColor, background: "rgba(5,5,5,0.97)", border: `1px solid ${accentColor}55`, boxShadow: `0 0 40px ${accentColor}22` }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="zap" size={15} decorative />
            <h2 className="text-[11px] tracking-[0.3em] uppercase font-bold">ATAJOS DE TECLADO</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar atajos"
            className="p-1"
            style={{ color: `${accentColor}99` }}
          >
            <Icon name="close" size={15} decorative />
          </button>
        </header>

        <div className="grid gap-4">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="text-[9px] tracking-[0.3em] uppercase opacity-45 mb-2">{group.title}</h3>
              <ul className="grid gap-1.5">
                {group.items.map(([keys, description]) => (
                  <li key={keys} className="flex items-center justify-between gap-3">
                    <span className="text-[11px] opacity-80">{description}</span>
                    <kbd
                      className="text-[10px] tracking-wider px-2 py-0.5 rounded-sm whitespace-nowrap"
                      style={{ color: accentColor, border: `1px solid ${accentColor}44`, background: `${accentColor}0d` }}
                    >
                      {keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-4 text-[9px] tracking-widest uppercase opacity-35 text-center">? ABRE · ESC CIERRA</p>
      </motion.div>
    </motion.div>
  );
}

export default ShortcutsOverlay;
