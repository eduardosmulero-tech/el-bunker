import { motion } from "framer-motion";
import { FONT_MONO } from "../../tokens";

// Ley del vibe: Card sigue --vibe-accent si nadie pasa accentColor.
const mix = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

const PADDINGS = {
  sm: 10,
  md: 16,
  lg: 24,
};

export default function Card({
  children,
  accentColor = "var(--vibe-accent, #bfff00)",
  hoverable = false,
  padding = "md",
  border = true,
  className = "",
  onClick,
  style: extraStyle,
}) {
  const p = PADDINGS[padding] ?? PADDINGS.md;

  return (
    <motion.div
      className={`relative rounded-sm overflow-hidden ${className}`}
      style={{
        padding: p,
        fontFamily: FONT_MONO,
        background: mix(accentColor, 2),
        border: border ? `1px solid ${mix(accentColor, 9)}` : "1px solid transparent",
        cursor: onClick ? "pointer" : undefined,
        ...extraStyle,
      }}
      whileHover={hoverable && !onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
