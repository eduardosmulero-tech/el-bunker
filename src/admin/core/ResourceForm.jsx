import { useState } from "react";
import Button from "../../core/ui/Button";
import Input from "../../core/ui/Input";
import Icon from "../../core/ui/Icon";
import { ACID, RED, FONT_MONO } from "../../tokens";

// eslint-disable-next-line react-refresh/only-export-components
export const initialDraft = (fields, value) => Object.fromEntries(
  fields.map((field) => [field.k, value?.[field.k] ?? (field.type === "checkbox" ? false : "")])
);

const normalizeOptions = (options = []) => options.map((option) => (
  typeof option === "object" ? option : { value: option, label: option }
));

export default function ResourceForm({
  fields,
  value = null,
  mode = value ? "edit" : "create",
  busy = false,
  error = null,
  accentColor = ACID,
  onSubmit,
  onCancel = null,
  submitLabel = mode === "edit" ? "GUARDAR" : "CREAR",
}) {
  const [draft, setDraft] = useState(() => initialDraft(fields, value));
  const [errors, setErrors] = useState({});

  const updateField = (key, nextValue) => setDraft((current) => ({ ...current, [key]: nextValue }));
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    for (const field of fields) {
      const fieldValue = draft[field.k];
      if (field.required && (fieldValue == null || String(fieldValue).trim() === "")) nextErrors[field.k] = "REQUERIDO";
      if (field.type === "number" && fieldValue !== "" && !Number.isFinite(Number(fieldValue))) nextErrors[field.k] = "DEBE SER UN NÚMERO";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const output = Object.fromEntries(fields.map((field) => {
      const raw = draft[field.k];
      if (field.type === "number") return [field.k, raw === "" ? "" : Number(raw)];
      if (field.type === "checkbox") return [field.k, Boolean(raw)];
      return [field.k, raw];
    }));
    onSubmit(output);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <p role="alert" className="flex items-center gap-2 text-xs" style={{ color: RED }}><Icon name="alert" size={14} decorative />{error.message ?? String(error)}</p>}
      {fields.map((field) => {
        const label = field.label ?? field.k.toUpperCase();
        const fieldError = errors[field.k];
        if (field.type === "select") return (
          <label key={field.k} className="flex flex-col gap-1" style={{ color: fieldError ? RED : `${accentColor}88`, fontSize: 10, letterSpacing: "0.2em" }}>
            {label}
            <select aria-label={label} value={draft[field.k]} onChange={(event) => updateField(field.k, event.target.value)} style={{ minHeight: 44, width: "100%", color: accentColor, background: "transparent", border: `1px solid ${fieldError ? RED : `${accentColor}33`}`, fontFamily: FONT_MONO }}>
              <option value="">SELECCIONAR</option>
              {normalizeOptions(field.options).map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
            </select>
            {fieldError && <span style={{ color: RED, fontSize: 9 }}>{fieldError}</span>}
          </label>
        );
        if (field.type === "checkbox") return (
          <div key={field.k} className="flex items-center justify-between gap-3" style={{ minHeight: 44, color: accentColor, fontSize: 10, letterSpacing: "0.2em" }}>
            <span>{label}</span>
            <button type="button" role="switch" aria-checked={Boolean(draft[field.k])} aria-label={label} onClick={() => updateField(field.k, !draft[field.k])} style={{ minHeight: 44, minWidth: 64, color: accentColor, background: "transparent", border: `1px solid ${accentColor}44`, fontFamily: FONT_MONO }}>{draft[field.k] ? "ACTIVO" : "INACTIVO"}</button>
          </div>
        );
        return <Input key={field.k} type={field.type === "textarea" ? "text" : field.type} multiline={field.type === "textarea"} value={draft[field.k]} onChange={(event) => updateField(field.k, event.target.value)} label={label} aria-label={label} error={fieldError} accentColor={accentColor} />;
      })}
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="secondary" size="sm" accentColor={accentColor} onClick={onCancel} disabled={busy}>CANCELAR</Button>}
        <Button type="submit" size="sm" accentColor={accentColor} loading={busy}>{submitLabel}</Button>
      </div>
    </form>
  );
}
