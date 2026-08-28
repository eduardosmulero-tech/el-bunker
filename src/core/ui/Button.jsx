import { motion } from "framer-motion";
import Icon from "./Icon";
import { FONT_MONO } from "../../tokens";

// Ley del vibe: si nadie pasa accentColor, el botón sigue a --vibe-accent
// (ADR-030 lo ata al vibe en admin también). El alpha va con color-mix
// porque los sufijos hex no funcionan sobre var().
const mix = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

const VARIANTS = {
  primary:   (c) => ({ bg: mix(c, 8), border: `1px solid ${mix(c, 33)}`, color: c, hoverBg: mix(c, 13) }),
  secondary: (c) => ({ bg: "transparent", border: `1px solid ${mix(c, 20)}`, color: mix(c, 80), hoverBg: mix(c, 3) }),
  ghost:     (c) => ({ bg: "transparent", border: "1px solid transparent", color: mix(c, 53), hoverBg: mix(c, 3) }),
};

const SIZES = {
  sm:  { height: 44, px: 10, fontSize: 10, iconSize: 14 },
  md:  { height: 44, px: 16, fontSize: 11, iconSize: 16 },
  lg:  { height: 52, px: 20, fontSize: 12, iconSize: 18 },
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  accentColor = "var(--vibe-accent, #bfff00)",
  loading = false,
  disabled = false,
  icon,
  onClick,
  className = "",
  title,
  type = "button",
  style: extraStyle,
}) {
  const v = VARIANTS[variant]?.(accentColor) ?? VARIANTS.primary(accentColor);
  const s = SIZES[size] ?? SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      whileTap={isDisabled ? {} : { scale: 0.96 }}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={title}
      className={className}
      style={{
        height: s.height,
        minWidth: s.height,
        paddingLeft: s.px,
        paddingRight: s.px,
        fontSize: s.fontSize,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontFamily: FONT_MONO,
        background: v.bg,
        border: v.border,
        color: isDisabled ? mix(accentColor, 27) : v.color,
        borderRadius: 2,
        cursor: isDisabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        whiteSpace: "nowrap",
        transition: "background 0.15s, border-color 0.15s",
        ...extraStyle,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.background = v.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) e.currentTarget.style.background = v.bg;
      }}
    >
      {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-flex", lineHeight: 1 }}
              >
                <Icon name="circle" size={s.iconSize} decorative />
              </motion.span>
            ) : icon ? (
              <span style={{ fontSize: s.iconSize, lineHeight: 1 }}>{icon}</span>
            ) : null}
      {children}
    </motion.button>
  );
}
