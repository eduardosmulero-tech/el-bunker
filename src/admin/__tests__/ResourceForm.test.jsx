import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ResourceForm from "../core/ResourceForm";

const fields = [
  { k: "name", type: "text", label: "NOMBRE", required: true },
  { k: "notes", type: "textarea", label: "NOTAS" },
  { k: "amount", type: "number", label: "CANTIDAD" },
  { k: "kind", type: "select", label: "TIPO", options: ["a", { value: "b", label: "BETA" }] },
  { k: "locked", type: "checkbox", label: "BLOQUEADO" },
];

const mount = (props = {}) => render(<ResourceForm fields={fields} onSubmit={vi.fn()} {...props} />);

describe("ResourceForm", () => {
  it("1. pinta un control por campo con el tipo correcto", () => {
    mount();
    expect(screen.getByLabelText("NOMBRE")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("NOTAS").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("CANTIDAD")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("TIPO").tagName).toBe("SELECT");
    expect(screen.getByRole("switch", { name: "BLOQUEADO" })).toBeInTheDocument();
  });

  it("2. required vacío bloquea y marca el error", () => {
    const onSubmit = vi.fn();
    mount({ onSubmit });
    fireEvent.click(screen.getByRole("button", { name: "CREAR" }));
    expect(screen.getByText("REQUERIDO")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("3. envío entrega solo las llaves de fields", () => {
    const onSubmit = vi.fn();
    mount({ value: { name: "Widget", created_at: "secret" }, onSubmit });
    fireEvent.click(screen.getByRole("button", { name: "GUARDAR" }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Widget", notes: "", amount: "", kind: "", locked: false });
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("created_at");
  });

  it("4. number se envía como número", () => {
    const onSubmit = vi.fn();
    mount({ onSubmit });
    fireEvent.change(screen.getByLabelText("NOMBRE"), { target: { value: "Widget" } });
    fireEvent.change(screen.getByLabelText("CANTIDAD"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "CREAR" }));
    expect(onSubmit.mock.calls[0][0].amount).toBe(7);
  });

  it("5. checkbox alterna y viaja como booleano", () => {
    const onSubmit = vi.fn();
    mount({ onSubmit });
    fireEvent.change(screen.getByLabelText("NOMBRE"), { target: { value: "Widget" } });
    fireEvent.click(screen.getByRole("switch", { name: "BLOQUEADO" }));
    fireEvent.click(screen.getByRole("button", { name: "CREAR" }));
    expect(onSubmit.mock.calls[0][0].locked).toBe(true);
  });

  it("6. select soporta opciones string y objeto", () => {
    mount();
    expect(screen.getByRole("option", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "BETA" })).toBeInTheDocument();
  });

  it("7. error de servidor se pinta", () => {
    mount({ error: new Error("500 D1 DOWN") });
    expect(screen.getByRole("alert")).toHaveTextContent("500 D1 DOWN");
  });

  it("8. remount con key distinta nace con el valor nuevo", () => {
    const { rerender } = render(<ResourceForm key="one" fields={fields} value={{ name: "Uno" }} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("NOMBRE")).toHaveValue("Uno");
    rerender(<ResourceForm key="two" fields={fields} value={{ name: "Dos" }} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("NOMBRE")).toHaveValue("Dos");
  });
});
