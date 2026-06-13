// ============================================================
//  EL BÚNKER — ColorPicker.jsx
//  Design system compartido: paleta 12 colores curados + custom
//  hex input + live preview swatch + selected indicator.
//  Usado por:
//    - src/musiclab/TagManager.jsx (color de cada tag)
//    - src/vault/Vault.jsx        (color de nueva era)
// ============================================================

import { useState } from "react";
import { motion } from "framer-motion";
import { ACID } from "../tokens";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

// Paleta curada — vibra con el design system acid/neon del Búnker.
// 12 colores: 4 cool (cyan/verde/azul/violeta), 4 warm (naranja/rojo/rosa/amarillo),
// 2 accent (lima/magenta) que rompen la grid.
const PALETTE = [
  "#00ffcc", "#aaff44", "#ff6b35", "#bf00ff",
  "#ff2d55", "#00b4ff", "#ffcc00", "#ff69b4",
  "#7fff00", "#ff4500", "#1effbc", "#c77dff",
];

export const ColorPicker = ({ value, onChange, accentColor = ACID }) => {
  const [custom, setCustom] = useState(value ?? "#00ffcc");

  const handleCustom = (hex) => {
    setCustom(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Paleta preset */}
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((c) => (
          <motion.button
            key={c}
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => { setCustom(c); onChange(c); }}
            style={{
              width: 24, height: 24, borderRadius: 2, background: c, flexShrink: 0,
              border: value === c ? `2px solid #fff` : `1px solid ${c}55`,
              boxShadow: value === c ? `0 0 8px ${c}` : "none",
            }}
          />
        ))}
      </div>

      {/* Custom hex input + live preview */}
      <div className="flex items-center gap-2">
        <div style={{
          width: 24, height: 24, borderRadius: 2,
          background: custom, border: `1px solid ${custom}88`, flexShrink: 0,
        }} />
        <input
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          style={{
            flex: 1, background: `${accentColor}06`, border: `1px solid ${accentColor}33`, borderRadius: 2,
            color: accentColor, fontSize: 11, padding: "5px 10px", fontFamily: FONT_MONO,
            letterSpacing: "0.15em", outline: "none",
          }}
        />
      </div>
    </div>
  );
};
