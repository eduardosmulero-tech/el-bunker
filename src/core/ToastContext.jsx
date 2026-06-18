// ============================================================
//  EL BÚNKER — ToastContext.jsx
//  Sistema de toasts unificado (Fase 1 — UX Polish)
//  Provider + hook useToast
// ============================================================
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useRef, useCallback } from "react";

const ToastContext = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(({ msg, sub, action, actionLabel, secondaryLabel, duration = 3000, type = "info" }) => {
    const id = ++_toastId;
    setToasts((prev) => {
      const updated = [...prev, { id, msg, sub, action, actionLabel, secondaryLabel, type }];
      if (updated.length > 3) return updated.slice(-3);
      return updated;
    });
    if (timersRef.current.has(id)) clearTimeout(timersRef.current.get(id));
    timersRef.current.set(id, setTimeout(() => removeToast(id), duration));
    return id;
  }, [removeToast]);

  const muteToast = useCallback((id) => {
    removeToast(id);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, muteToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
