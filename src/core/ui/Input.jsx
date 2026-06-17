import { FONT_MONO } from "../../tokens";

export default function Input({
  value,
  onChange,
  placeholder,
  label,
  error,
  accentColor = "#bfff00",
  type = "text",
  multiline = false,
  className = "",
  style: extraStyle,
  ...rest
}) {
  const sharedStyle = {
    width: "100%",
    background: "transparent",
    outline: "none",
    fontFamily: FONT_MONO,
    color: accentColor,
    border: `1px solid ${error ? "#ff3b3b" : `${accentColor}33`}`,
    borderRadius: 2,
    padding: "10px 12px",
    fontSize: 13,
    letterSpacing: "0.05em",
    transition: "border-color 0.15s",
    ...extraStyle,
  };

  const Tag = multiline ? "textarea" : "input";

  return (
    <div className="flex flex-col gap-1" style={{ fontFamily: FONT_MONO }}>
      {label && (
        <label
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: error ? "#ff3b3b" : `${accentColor}88`,
          }}
        >
          {label}
        </label>
      )}
      <Tag
        type={multiline ? undefined : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        className={className}
        style={sharedStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? "#ff3b3b" : accentColor;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "#ff3b3b" : `${accentColor}33`;
        }}
        {...rest}
      />
      {error && (
        <span style={{ fontSize: 9, color: "#ff3b3b", letterSpacing: "0.1em" }}>
          {error}
        </span>
      )}
    </div>
  );
}
