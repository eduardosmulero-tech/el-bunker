import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminShell from "../core/AdminShell";
import toyDescriptor, { TOY_ROWS } from "./fixtures/toyDescriptor";
import { createFakeClient } from "./fixtures/fakeClient";

const otherDescriptor = { ...toyDescriptor, key: "other", label: "OTROS", endpoint: "/api/admin/other" };
const client = () => createFakeClient(TOY_ROWS);

describe("AdminShell", () => {
  it("1. pinta un botón por recurso y activa el primero", async () => {
    render(<AdminShell resources={[toyDescriptor, otherDescriptor]} client={client()} />);
    expect(screen.getAllByRole("button", { name: "WIDGETS" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "OTROS" }).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText("Widget Uno")).toBeInTheDocument());
  });

  it("2. cambiar de recurso monta la otra consola", async () => {
    render(<AdminShell resources={[toyDescriptor, otherDescriptor]} client={client()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "OTROS" })[0]);
    expect(screen.getByRole("heading", { name: "OTROS" })).toBeInTheDocument();
  });

  it("3. modo controlado respeta activeKey y avisa al pulsar", () => {
    const onActiveKeyChange = vi.fn();
    render(<AdminShell resources={[toyDescriptor, otherDescriptor]} activeKey="other" onActiveKeyChange={onActiveKeyChange} client={client()} />);
    expect(screen.getByRole("heading", { name: "OTROS" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "WIDGETS" })[0]);
    expect(onActiveKeyChange).toHaveBeenCalledWith("widgets");
    expect(screen.getByRole("heading", { name: "OTROS" })).toBeInTheDocument();
  });

  it("4. resources vacío no revienta y avisa", () => {
    render(<AdminShell resources={[]} client={client()} />);
    expect(screen.getByText("SIN RECURSOS CONFIGURADOS")).toBeInTheDocument();
  });
});
