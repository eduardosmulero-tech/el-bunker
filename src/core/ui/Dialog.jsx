import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, FONT_MONO } from "../../tokens";
import Button from "./Button";
import Icon from "./Icon";

function Dialog({ open, title, children, onClose, accentColor = ACID, labelledBy }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const titleId = useId();
  const resolvedLabelledBy = labelledBy ?? titleId;

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const firstFocusable = dialogRef.current?.querySelector(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex=\"-1\"])"
    );
    firstFocusable?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={resolvedLabelledBy}
            tabIndex={-1}
            initial={{ scale: 0.94, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 10 }}
            className="w-full max-w-sm rounded-sm p-4 flex flex-col gap-4 outline-none"
            style={{ background: "#0e0e0e", border: `1px solid ${accentColor}44`, fontFamily: FONT_MONO }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={resolvedLabelledBy} className="text-xs tracking-[0.25em] uppercase font-bold" style={{ color: accentColor }}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar diálogo"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm"
                style={{ color: `${accentColor}88`, border: `1px solid ${accentColor}22` }}
              >
                <Icon name="close" size={14} decorative />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "CONFIRMAR", onConfirm, onClose, accentColor = ACID }) {
  const [busy, setBusy] = useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title={title} onClose={onClose} accentColor={accentColor}>
      <p className="text-xs leading-relaxed opacity-70" style={{ color: accentColor }}>{message}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" accentColor={accentColor} onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button size="sm" accentColor="#ff4444" onClick={handleConfirm} loading={busy}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

export function TextPromptDialog({ open, title, label = "Nombre", placeholder, confirmLabel = "GUARDAR", onConfirm, onClose, accentColor = ACID }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
  };

  return (
    <Dialog key={open ? "open" : "closed"} open={open} title={title} onClose={onClose} accentColor={accentColor}>
      <label className="flex flex-col gap-2 text-xs tracking-wider uppercase" style={{ color: `${accentColor}aa` }}>
        {label}
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          placeholder={placeholder}
          className="w-full min-h-[44px] rounded-sm px-3 outline-none"
          style={{ color: accentColor, background: `${accentColor}06`, border: `1px solid ${accentColor}33`, fontFamily: FONT_MONO }}
        />
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" accentColor={accentColor} onClick={onClose}>Cancelar</Button>
        <Button size="sm" accentColor={accentColor} onClick={submit} disabled={!value.trim()}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

export default Dialog;
