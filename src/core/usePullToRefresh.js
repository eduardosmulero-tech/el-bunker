// ============================================================
//  EL BÚNKER — usePullToRefresh.js
//  Port fastpotify-audit (paso pendiente histórico): pull-to-refresh
//  honesto para listas de datos (CAPSULES primero).
//
//  Contrato:
//   - Gesto con DOMINANCIA vertical: |dy| > |dx|*1.2 en el arranque.
//     No roba swipes horizontales (subnav/canvas) ni scrolls verticales.
//   - Resistencia progresiva: offset = pull / (1 + pull/DAMPING) —
//     nunca supera DAMPING px, feedback físico sin saltos.
//   - Umbral de disparo: THRESHOLD px hacia abajo desde el borde
//     superior del contenedor (scrollY === 0).
//   - Deshabilitado con refetching, sin refetch, o handler `enabled`.
//   - Refetch de seguridad: online, visibilitychange y focus cuando hay
//     error previo (degraded session) — el estado honesto "SIN CONEXIÓN —
//     se recargará al volver" se cumple de verdad.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD_DEFAULT = 72;   // px de pull para disparar refetch
const DAMPING_DEFAULT = 110;    // tope visual del indicador
const DOMINANCE = 1.2;          // |dy| debe superar |dx| * DOMINANCE

export function usePullToRefresh({ onRefresh, enabled = true, threshold = THRESHOLD_DEFAULT, damping = DAMPING_DEFAULT } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const gestureRef = useRef({ active: false, startY: 0, startX: 0, decided: false, vertical: false });
  const rawPullRef = useRef(0); // pull sin amortiguar — el umbral se evalúa contra esto

  const runRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  // Refetch de seguridad: recuperación de red, foco de la pestaña y visibilidad.
  // Solo cuando hay error degradado — no golpea la API en cada focus normal.
  const onErrorRetryRef = useRef(null);
  const setOnErrorRetry = useCallback((fn) => {
    onErrorRetryRef.current = typeof fn === "function" ? fn : null;
  }, []);

  useEffect(() => {
    const retry = () => { if (onErrorRetryRef.current) onErrorRetryRef.current(); };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", retry);
    window.addEventListener("focus", retry);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", retry);
      window.removeEventListener("focus", retry);
    };
  }, []);

  const onTouchStart = useCallback((event) => {
    if (!enabled || refreshing || event.touches?.length !== 1) return;
    const el = containerRef.current;
    // Solo desde el borde superior (scroll en el origen del gesto)
    if (el && (el.scrollTop || el.getBoundingClientRect().top > 0)) return;
    const touch = event.touches[0];
    gestureRef.current = { active: true, startY: touch.clientY, startX: touch.clientX, decided: false, vertical: false };
  }, [enabled, refreshing]);

  const onTouchMove = useCallback((event) => {
    const gesture = gestureRef.current;
    if (!gesture.active || refreshing) return;
    const touch = event.touches[0];
    const dy = touch.clientY - gesture.startY;
    const dx = touch.clientX - gesture.startX;
    if (!gesture.decided) {
      // Decisión única por gesto: dominancia vertical estricta
      if (Math.abs(dx) > Math.abs(dy)) { gesture.active = false; return; }
      if (Math.abs(dy) > Math.abs(dx) * DOMINANCE) {
        const el = containerRef.current;
        if (el && el.scrollTop > 0) { gesture.active = false; return; }
        gesture.vertical = true;
        gesture.decided = true;
      } else {
        return; // aún indeciso — esperar más movimiento
      }
    }
    if (dy > 0) {
      rawPullRef.current = dy;
      setPullDistance(dy / (1 + dy / damping));
    } else {
      rawPullRef.current = 0;
      setPullDistance(0);
    }
  }, [damping, refreshing]);

  const onTouchEnd = useCallback(() => {
    const gesture = gestureRef.current;
    gestureRef.current = { active: false, startY: 0, startX: 0, decided: false, vertical: false };
    if (!gesture.vertical) return;
    // El umbral se compara contra el pull RAW, no el amortiguado: la resistencia
    // es presentación pura (tope visual del indicador). Si se comparara contra
    // el damped, el usuario tendría que tirar ~2x el umbral real para disparar.
    if (rawPullRef.current >= threshold) runRefresh();
    rawPullRef.current = 0;
    setPullDistance(0);
  }, [runRefresh, threshold]);

  return {
    containerRef,
    pullDistance,
    refreshing,
    threshold,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    runRefresh,
    setOnErrorRetry,
  };
}

export default usePullToRefresh;
