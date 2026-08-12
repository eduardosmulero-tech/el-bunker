// VisitModeControl — interruptor del Modo Visita (A5, diseño §5 / ADR-028).
// Verifica: encender sin clave, apagar exigiendo clave, y que una clave
// inválida (401) no apaga y muestra el error.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import VaultContext from "../../core/VaultContext";
import VisitModeControl from "../VisitModeControl";

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

function renderControl({ visitMode = false, setVisitMode = vi.fn().mockResolvedValue({ ok: true }) } = {}) {
  const value = {
    visitMode,
    setVisitMode,
    // El componente solo consume estos dos; el resto del contexto no aplica.
  };
  return render(
    <VaultContext.Provider value={value}>
      <VisitModeControl accentColor="#bfff00" />
    </VaultContext.Provider>
  );
}

describe("VisitModeControl", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("apagado: el clic enciende el modo visita sin pedir clave", async () => {
    const setVisitMode = vi.fn().mockResolvedValue({ ok: true });
    renderControl({ visitMode: false, setVisitMode });
    fireEvent.click(screen.getByRole("button", { name: "Encender modo visita" }));
    await flush();
    expect(setVisitMode).toHaveBeenCalledTimes(1);
    expect(setVisitMode).toHaveBeenCalledWith(true);
  });

  it("encendido: el clic pide la clave de acceso antes de apagar (ADR-028)", async () => {
    const setVisitMode = vi.fn().mockResolvedValue({ ok: true });
    renderControl({ visitMode: true, setVisitMode });
    fireEvent.click(screen.getByRole("button", { name: "Apagar modo visita" }));
    expect(screen.getByText("APAGAR MODO VISITA")).toBeInTheDocument();
    expect(setVisitMode).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/CLAVE DE ACCESO/i), { target: { value: "clave-secreta" } });
    fireEvent.click(screen.getByRole("button", { name: "APAGAR" }));
    await flush();
    expect(setVisitMode).toHaveBeenCalledTimes(1);
    expect(setVisitMode).toHaveBeenCalledWith(false, "clave-secreta");
  });

  it("sin clave no apaga: el botón APAGAR queda deshabilitado", () => {
    renderControl({ visitMode: true });
    fireEvent.click(screen.getByRole("button", { name: "Apagar modo visita" }));
    const submit = screen.getByRole("button", { name: "APAGAR" });
    expect(submit).toBeDisabled();
  });

  it("clave inválida (401): muestra el error y el modo sigue encendido", async () => {
    const setVisitMode = vi.fn().mockRejectedValue(new Error("Access key required to disable visit mode"));
    renderControl({ visitMode: true, setVisitMode });
    fireEvent.click(screen.getByRole("button", { name: "Apagar modo visita" }));
    fireEvent.change(screen.getByLabelText(/CLAVE DE ACCESO/i), { target: { value: "clave-mala" } });
    fireEvent.click(screen.getByRole("button", { name: "APAGAR" }));
    await flush();
    expect(setVisitMode).toHaveBeenCalledWith(false, "clave-mala");
    expect(screen.getByText(/Access key required to disable visit mode/i)).toBeInTheDocument();
    // El diálogo sigue abierto: no se ha apagado.
    expect(screen.getByText("APAGAR MODO VISITA")).toBeInTheDocument();
  });

  it("muestra estado visual ON cuando el modo está activo", () => {
    renderControl({ visitMode: true });
    expect(screen.getByText("MODO VISITA ON")).toBeInTheDocument();
  });
});
