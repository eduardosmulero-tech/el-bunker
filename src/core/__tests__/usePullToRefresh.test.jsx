// @vitest-environment jsdom
// S-prt: tests del hook usePullToRefresh (port fastpotify-audit).
// Cubre: umbral, resistencia (damping), dominancia vertical (no roba swipes
// horizontales ni scrolls), gate de enabled/refreshing y refetch de seguridad
// (online/visibility/focus SOLO cuando hay error previo registrado).
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePullToRefresh } from "../usePullToRefresh";

function Probe({ onRefresh, enabled = true, registerRetry = () => {} }) {
  const ptr = usePullToRefresh({ onRefresh, enabled });
  registerRetry(ptr.setOnErrorRetry);
  return (
    <div
      data-testid="container"
      ref={ptr.containerRef}
      onTouchStart={ptr.onTouchStart}
      onTouchMove={ptr.onTouchMove}
      onTouchEnd={ptr.onTouchEnd}
    >
      <span data-testid="pull">{Math.round(ptr.pullDistance)}</span>
      <span data-testid="refreshing">{String(ptr.refreshing)}</span>
      <span data-testid="threshold">{ptr.threshold}</span>
    </div>
  );
}

const start = (el) => act(() => { el.dispatchEvent(new ReactTouchEvent(200, 100)); });
const move = (el, y, x = 100) => act(() => { el.dispatchEvent(new ReactMoveEvent(y, x)); });
const end = (el) => act(() => { el.dispatchEvent(new Event("touchend", { bubbles: true })); });

class ReactTouchEvent extends Event {
  constructor(clientY, clientX) {
    super("touchstart", { bubbles: true, cancelable: true });
    this.touches = [{ clientY, clientX }];
  }
}
class ReactMoveEvent extends Event {
  constructor(clientY, clientX) {
    super("touchmove", { bubbles: true, cancelable: true });
    this.touches = [{ clientY, clientX }];
  }
}

describe("usePullToRefresh", () => {
  it("dispara refetch al superar el umbral (72px de pull)", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<Probe onRefresh={onRefresh} />);
    const el = screen.getByTestId("container");
    start(el);
    move(el, 200 + 80); // 80px > 72
    end(el);
    await act(async () => { await Promise.resolve(); });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("NO dispara por debajo del umbral", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<Probe onRefresh={onRefresh} />);
    const el = screen.getByTestId("container");
    start(el);
    move(el, 200 + 50); // 50px < 72
    end(el);
    await act(async () => { await Promise.resolve(); });
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("aplica resistencia: el offset nunca supera el damping", () => {
    render(<Probe />);
    const el = screen.getByTestId("container");
    start(el);
    move(el, 200 + 500); // pull enorme
    // damping por defecto 110 → 500/(1+500/110) ≈ 90.5, nunca > 110
    expect(Number(screen.getByTestId("pull").textContent)).toBeLessThanOrEqual(110);
  });

  it("ignora swipes horizontales (dominancia vertical)", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<Probe onRefresh={onRefresh} />);
    const el = screen.getByTestId("container");
    start(el);
    // dy=0, dx=300 → gesto horizontal → abortado antes de decidir
    move(el, 200, 400);
    end(el);
    await act(async () => { await Promise.resolve(); });
    expect(onRefresh).not.toHaveBeenCalled();
    expect(screen.getByTestId("pull").textContent).toBe("0");
  });

  it("no hace nada si enabled=false", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<Probe onRefresh={onRefresh} enabled={false} />);
    const el = screen.getByTestId("container");
    start(el);
    move(el, 200 + 200);
    end(el);
    await act(async () => { await Promise.resolve(); });
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("refetch de seguridad en online cuando hay error registrado", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    let retrySetter;
    render(<Probe onRefresh={onRefresh} registerRetry={(fn) => { retrySetter = fn; }} />);
    await act(async () => { retrySetter(onRefresh); });
    await act(async () => { window.dispatchEvent(new Event("online")); });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("NO refetch de seguridad sin error previo registrado", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<Probe onRefresh={onRefresh} />);
    await act(async () => { window.dispatchEvent(new Event("online")); });
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("expone threshold por defecto 72", () => {
    render(<Probe />);
    expect(screen.getByTestId("threshold").textContent).toBe("72");
  });
});
