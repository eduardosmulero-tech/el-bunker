// El montaje que exige el DoD de B1: el panel entero levantado con un descriptor de
// juguete y un cliente en memoria. Pin del contrato visible — si esto pasa, admin-core
// se puede montar en vinos-carta-app cambiando solo el descriptor y el cliente.
import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import AdminGuard from "../core/AdminGuard";
import AdminShell from "../core/AdminShell";
import toyDescriptor, { TOY_ROWS } from "./fixtures/toyDescriptor";
import { createFakeClient } from "./fixtures/fakeClient";

const ADMIN = { isAdmin: true, isLoading: false, user: { id: "admin" } };

function mountPanel({ auth = ADMIN, client = createFakeClient(TOY_ROWS) } = {}) {
  const utils = render(
    <AdminGuard auth={auth}>
      <AdminShell resources={[toyDescriptor]} client={client} />
    </AdminGuard>
  );
  return { ...utils, client };
}

const rowOf = (name) => screen.getByText(name).closest("tr");

describe("admin-core — montaje con descriptor de juguete", () => {
  it("1. la guardia no filtra UI de admin mientras verifica", () => {
    mountPanel({ auth: { isAdmin: false, isLoading: true, user: null } });
    expect(screen.getByText(/VERIFICANDO CREDENCIALES/)).toBeInTheDocument();
    expect(screen.queryByText("TERMINAL DE MANDO")).not.toBeInTheDocument();
  });

  it("2. sin ser admin, panel de denegado y ni un nodo del shell", () => {
    mountPanel({ auth: { isAdmin: false, isLoading: false, user: { id: "edu" } } });
    expect(screen.getByText(/ACCESO DENEGADO/)).toBeInTheDocument();
    expect(screen.queryByText("TERMINAL DE MANDO")).not.toBeInTheDocument();
    expect(screen.queryByText("Widget Uno")).not.toBeInTheDocument();
  });

  it("3. como admin pinta el shell y las filas del cliente", async () => {
    mountPanel();
    expect(screen.getByText("TERMINAL DE MANDO")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Widget Uno")).toBeInTheDocument());

    expect(screen.getAllByText("WIDGETS").length).toBeGreaterThan(0);
    expect(screen.getByText("NOMBRE")).toBeInTheDocument();
    expect(within(rowOf("Widget Dos")).getByLabelText("SÍ")).toBeInTheDocument();
    expect(within(rowOf("Widget Uno")).getByLabelText("NO")).toBeInTheDocument();
  });

  it("4. NUEVO abre el formulario y crea contra el cliente", async () => {
    const { client } = mountPanel();
    await waitFor(() => expect(screen.getByText("Widget Uno")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /NUEVO/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("NUEVO · WIDGETS")).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("NOMBRE"), {
      target: { value: "Widget Cuatro" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "CREAR" }));

    await waitFor(() => expect(client.callsOf("create")).toHaveLength(1));
    expect(client.callsOf("create")[0].data).toMatchObject({ name: "Widget Cuatro" });
    await waitFor(() => expect(screen.getByText("Widget Cuatro")).toBeInTheDocument());
  });

  it("5. un campo requerido vacío bloquea el alta", async () => {
    const { client } = mountPanel();
    await waitFor(() => expect(screen.getByText("Widget Uno")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /NUEVO/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "CREAR" }));

    expect(await within(dialog).findByText(/REQUERIDO/)).toBeInTheDocument();
    expect(client.callsOf("create")).toHaveLength(0);
  });

  it("6. pulsar una fila abre la edición con sus valores", async () => {
    mountPanel();
    await waitFor(() => expect(screen.getByText("Widget Dos")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Widget Dos"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("EDITAR · WIDGETS")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("NOMBRE")).toHaveValue("Widget Dos");
    expect(within(dialog).getByLabelText("NOTAS")).toHaveValue("segundo");
  });

  it("7. borrar exige teclear el nombre exacto antes de ejecutarse", async () => {
    const { client } = mountPanel();
    await waitFor(() => expect(screen.getByText("Widget Uno")).toBeInTheDocument());

    fireEvent.click(within(rowOf("Widget Uno")).getByRole("button", { name: "BORRAR" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText(/SE GUARDARÁ UN SNAPSHOT PREVIO/)).toBeInTheDocument();
    const confirmButton = within(dialog).getByRole("button", { name: "BORRAR" });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText("CONFIRMACIÓN"), {
      target: { value: "widget uno" },
    });
    expect(within(dialog).getByRole("button", { name: "BORRAR" })).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText("CONFIRMACIÓN"), {
      target: { value: "Widget Uno" },
    });
    expect(within(dialog).getByRole("button", { name: "BORRAR" })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "BORRAR" }));
    await waitFor(() => expect(client.callsOf("remove")).toHaveLength(1));
    expect(client.callsOf("remove")[0].id).toBe("w1");
    await waitFor(() => expect(screen.queryByText("Widget Uno")).not.toBeInTheDocument());
  });

  it("8. una acción de fila no dispara además la edición", async () => {
    const { client } = mountPanel();
    await waitFor(() => expect(screen.getByText("Widget Uno")).toBeInTheDocument());

    fireEvent.click(within(rowOf("Widget Uno")).getByRole("button", { name: "LOCK" }));

    await waitFor(() => expect(client.callsOf("action")).toHaveLength(1));
    expect(screen.queryByText("EDITAR · WIDGETS")).not.toBeInTheDocument();
  });

  it("9. cero emoji en todo el panel renderizado", async () => {
    const { container } = mountPanel();
    await waitFor(() => expect(screen.getByText("Widget Uno")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
