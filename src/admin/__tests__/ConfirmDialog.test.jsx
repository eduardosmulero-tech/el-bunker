import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConfirmDialog from "../core/ConfirmDialog";

const mount = (props = {}) => render(
  <ConfirmDialog open title="BORRAR · WIDGETS" onConfirm={vi.fn()} onClose={vi.fn()} {...props} />
);

const confirmButton = () => screen.getByRole("button", { name: "CONFIRMAR" });

describe("ConfirmDialog", () => {
  it("1. sin confirmTyping el botón está activo desde el principio", () => {
    mount();
    expect(confirmButton()).toBeEnabled();
  });

  it("2. con confirmTyping queda deshabilitado hasta escribir el valor exacto", () => {
    mount({ confirmTyping: "Widget Uno" });
    const input = screen.getByLabelText("ESCRIBE EL NOMBRE PARA CONFIRMAR");
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(input, { target: { value: "Widget Uno" } });
    expect(confirmButton()).toBeEnabled();
  });

  it("3. una capitalización distinta no habilita", () => {
    mount({ confirmTyping: "Widget Uno" });
    fireEvent.change(screen.getByLabelText("ESCRIBE EL NOMBRE PARA CONFIRMAR"), { target: { value: "widget uno" } });
    expect(confirmButton()).toBeDisabled();
  });

  it("4. snapshot pinta el aviso y sin él no aparece", () => {
    const { rerender } = mount({ snapshot: true });
    expect(screen.getByText("SE GUARDARÁ UN SNAPSHOT PREVIO")).toBeInTheDocument();
    rerender(<ConfirmDialog open title="BORRAR" snapshot={false} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText("SE GUARDARÁ UN SNAPSHOT PREVIO")).not.toBeInTheDocument();
  });

  it("5. onConfirm con ok:false deja el diálogo abierto y muestra el error", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: false, error: new Error("403 FORBIDDEN") });
    mount({ onConfirm });
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("403 FORBIDDEN"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("6. onConfirm correcto llama a onClose", async () => {
    const onClose = vi.fn();
    mount({ onConfirm: vi.fn().mockResolvedValue({ ok: true }), onClose });
    fireEvent.click(confirmButton());
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("7. reabrir limpia lo tecleado", () => {
    const { rerender } = mount({ confirmTyping: "Widget Uno" });
    const input = screen.getByLabelText("ESCRIBE EL NOMBRE PARA CONFIRMAR");
    fireEvent.change(input, { target: { value: "Widget Uno" } });
    expect(confirmButton()).toBeEnabled();
    rerender(<ConfirmDialog open={false} title="BORRAR" confirmTyping="Widget Uno" onConfirm={vi.fn()} onClose={vi.fn()} />);
    rerender(<ConfirmDialog open title="BORRAR" confirmTyping="Widget Uno" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText("ESCRIBE EL NOMBRE PARA CONFIRMAR")).toHaveValue("");
    expect(confirmButton()).toBeDisabled();
  });
});
