import { useEffect, useState } from "react";
import Dialog from "../../core/ui/Dialog";
import Button from "../../core/ui/Button";
import Input from "../../core/ui/Input";
import Icon from "../../core/ui/Icon";
import { ACID, RED } from "../../tokens";

export default function ConfirmDialog({
  open,
  title,
  message = null,
  confirmTyping = null,
  typingLabel = "ESCRIBE EL NOMBRE PARA CONFIRMAR",
  snapshot = false,
  confirmLabel = "CONFIRMAR",
  accentColor = ACID,
  onConfirm,
  onClose,
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Reset local confirmation state when the dialog opens intentionally.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setTyped("");
      setBusy(false);
      setLocalError(null);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const canConfirm = !confirmTyping || typed.trim() === confirmTyping.trim();
  const submit = async () => {
    if (!canConfirm || busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      const result = await onConfirm?.();
      if (result?.ok === false) {
        setLocalError(result.error instanceof Error ? result.error : new Error(String(result.error ?? "ERROR")));
        return;
      }
      onClose?.();
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason : new Error(String(reason)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title={title} onClose={busy ? undefined : onClose} accentColor={accentColor}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2" style={{ color: RED }}>
          <Icon name="alert" size={14} decorative />
          <p className="text-xs leading-relaxed">{message ?? "ESTA OPERACIÓN NO SE PUEDE DESHACER."}</p>
        </div>
        {snapshot && (
          <p className="flex items-center gap-2 text-[10px] tracking-wider" style={{ color: `${accentColor}aa` }}>
            <Icon name="archive" size={12} decorative />
            SE GUARDARÁ UN SNAPSHOT PREVIO
          </p>
        )}
        {confirmTyping && (
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            label={typingLabel}
            aria-label={typingLabel}
            autoFocus
            accentColor={accentColor}
            onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          />
        )}
        {localError && <p role="alert" className="text-xs" style={{ color: RED }}>{localError.message}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" accentColor={accentColor} onClick={onClose} disabled={busy}>CANCELAR</Button>
          <Button size="sm" accentColor={RED} onClick={submit} disabled={!canConfirm} loading={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  );
}
