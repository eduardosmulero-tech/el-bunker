import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ResourceTable from "../core/ResourceTable";
import toyDescriptor, { TOY_ROWS } from "./fixtures/toyDescriptor";

const base = (overrides = {}) => ({
  columns: toyDescriptor.columns,
  rows: TOY_ROWS,
  query: "",
  onQueryChange: vi.fn(),
  sort: null,
  onSortChange: vi.fn(),
  filters: {},
  onFilterChange: vi.fn(),
  page: 1,
  pageCount: 2,
  total: 30,
  onPageChange: vi.fn(),
  actions: [{ name: "delete", label: "BORRAR", icon: "trash", tone: "danger" }],
  onAction: vi.fn(),
  onRowClick: vi.fn(),
  ...overrides,
});

describe("ResourceTable", () => {
  it("1. pinta cabeceras y filas del descriptor", () => {
    render(<ResourceTable {...base()} />);
    expect(screen.getByText("NOMBRE")).toBeInTheDocument();
    expect(screen.getByText("Widget Uno")).toBeInTheDocument();
    expect(screen.getByText("Widget Dos")).toBeInTheDocument();
  });

  it("2. render lock pinta icono accesible y no emoji", () => {
    const { container } = render(<ResourceTable {...base()} />);
    expect(screen.getAllByLabelText("SÍ")).toHaveLength(1);
    expect(screen.getAllByLabelText("NO")).toHaveLength(2);
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("3. clic en cabecera ordenable llama con la clave", () => {
    const onSortChange = vi.fn();
    render(<ResourceTable {...base({ onSortChange })} />);
    fireEvent.click(screen.getByRole("button", { name: /NOMBRE/ }));
    expect(onSortChange).toHaveBeenCalledWith("name");
  });

  it("4. cabecera no ordenable no es un botón", () => {
    render(<ResourceTable {...base()} />);
    expect(screen.queryByRole("button", { name: "TIPO" })).not.toBeInTheDocument();
  });

  it("5. loading pinta esqueletos y conserva la tabla", () => {
    render(<ResourceTable {...base({ status: "loading" })} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("Widget Uno")).not.toBeInTheDocument();
  });

  it("6. rows vacío pinta emptyLabel", () => {
    render(<ResourceTable {...base({ rows: [], emptyLabel: "VACÍO" })} />);
    expect(screen.getByText("VACÍO")).toBeInTheDocument();
  });

  it("7. error pinta el mensaje", () => {
    render(<ResourceTable {...base({ status: "error", error: new Error("D1 DOWN") })} />);
    expect(screen.getByText("D1 DOWN")).toBeInTheDocument();
  });

  it("8. acción no dispara edición de fila", () => {
    const onAction = vi.fn();
    const onRowClick = vi.fn();
    render(<ResourceTable {...base({ onAction, onRowClick })} />);
    fireEvent.click(screen.getAllByRole("button", { name: "BORRAR" })[0]);
    expect(onAction).toHaveBeenCalledWith("delete", TOY_ROWS[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("9. paginador se deshabilita en los extremos", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<ResourceTable {...base({ onPageChange, page: 1, pageCount: 2 })} />);
    expect(screen.getByRole("button", { name: /ANTERIOR/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /SIGUIENTE/ })).toBeEnabled();
    rerender(<ResourceTable {...base({ onPageChange, page: 2, pageCount: 2 })} />);
    expect(screen.getByRole("button", { name: /ANTERIOR/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /SIGUIENTE/ })).toBeDisabled();
  });

  it("10. selección solo aparece con callback y selecciona la página", () => {
    const { rerender } = render(<ResourceTable {...base({ onSelectionChange: null })} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    const onSelectionChange = vi.fn();
    rerender(<ResourceTable {...base({ selectedIds: [], onSelectionChange })} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "SELECCIONAR TODO" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["w1", "w2", "w3"]);
  });
});
