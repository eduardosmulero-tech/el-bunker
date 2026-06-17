import { motion } from "framer-motion";
import { FONT_MONO } from "../../tokens";

const PADDINGS = {
  sm: 10,
  md: 16,
  lg: 24,
};

export default function Card({
  children,
  accentColor = "#bfff00",
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
        background: `${accentColor}04`,
        border: border ? `1px solid ${accentColor}18` : "1px solid transparent",
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
