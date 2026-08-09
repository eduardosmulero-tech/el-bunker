export default function UserGlyph({ glyph = "", size = 16, label, decorative = false, className = "" }) {
  const value = typeof glyph === "string" ? glyph : "";

  return (
    <span
      className={className}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || !label ? true : undefined}
      role={decorative || !label ? undefined : "img"}
      style={{
        display: "inline-block",
        fontSize: size,
        lineHeight: 1,
        verticalAlign: "middle",
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
}
