// B3 — pantalla CONTENIDO: CRUD de las 6 entidades con descriptores reales,
// marcado en lote por era/tag contra /api/classify (A1) y borrado con
// confirmación escrita (DoD 1/2/3 de la tarjeta).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Contenido from "../screens/Contenido";
import { createFakeClient } from "./fixtures/fakeClient";
import { workerClient } from "../../core/WorkerClient";

vi.mock("../../core/WorkerClient", () => ({
  workerClient: { get: vi.fn(), fetch: vi.fn() },
}));

const ERAS = [
  { id: "era-1", name: "Universidad" },
  { id: "era-2", name: "Londres" },
];
const TAGS = [
  { id: "dnb", label: "DnB" },
  { id: "gaming", label: "GAMING" },
];

const ENTRY_ROWS = [
  { id: "e1", title: "Recuerdo Uno", era_id: "era-1", type: "note", classified: false },
  { id: "e2", title: "Recuerdo Dos", era_id: "era-2", type: "photo", classified: true },
];

const okResponse = (payload) => ({ ok: true, status: 200, json: async () => payload });

function mountScreen({ seedRows = ENTRY_ROWS } = {}) {
  const client = createFakeClient(seedRows);
  const utils = render(<Contenido client={client} />);
  return { ...utils, client };
}

const rowOf = (text) => screen.getByText(text).closest("tr");

beforeEach(() => {
  workerClient.get.mockReset();
  workerClient.fetch.mockReset();
  workerClient.get.mockImplementation((path) =>
    path === "/api/eras" ? Promise.resolve(ERAS) : Promise.resolve(TAGS)
  );
  workerClient.fetch.mockResolvedValue(okResponse({ ok: true, count: 37, item_ids: [] }));
});

describe("Contenido — consola de CONTENIDO (B3)", () => {
  it("1. monta el shell con las 6 entidades y lista la activa", async () => {
    mountScreen();
    expect(screen.getByText("TERMINAL DE MANDO")).toBeInTheDocument();
    for (const label of ["ENTRADAS", "ARCHIVOS", "TRACKS", "PLAYLISTS", "CÁPSULAS", "DROPS"]) {
      expect(screen.getAllByRole("button", { name: label }).length, label).toBeGreaterThan(0);
    }
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());
  });

  it("2. marca una era entera en un gesto: POST /api/classify con item_type + era_id", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("ERA PARA MARCADO"), { target: { value: "era-1" } });
    fireEvent.click(screen.getByTitle("CLASIFICAR ERA EN LOTE"));

    await waitFor(() => expect(workerClient.fetch).toHaveBeenCalledTimes(1));
    expect(workerClient.fetch).toHaveBeenCalledWith("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_type: "entry", era_id: "era-1" }),
    });
    await waitFor(() =>
      expect(screen.getByText("37 ITEMS CLASIFICADOS · ENTRADAS")).toBeInTheDocument()
    );
  });

  it("3. desmarca la era entera con DELETE /api/classify", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("ERA PARA MARCADO"), { target: { value: "era-2" } });
    fireEvent.click(screen.getByTitle("DESCLASIFICAR ERA EN LOTE"));

    await waitFor(() => expect(workerClient.fetch).toHaveBeenCalledTimes(1));
    expect(workerClient.fetch).toHaveBeenCalledWith("/api/classify", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_type: "entry", era_id: "era-2" }),
    });
    await waitFor(() =>
      expect(screen.getByText("37 ITEMS DESCLASIFICADOS · ENTRADAS")).toBeInTheDocument()
    );
  });

  it("4. sin selector, los botones de lote quedan deshabilitados", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());
    expect(screen.getByTitle("CLASIFICAR ERA EN LOTE")).toBeDisabled();
    expect(screen.getByTitle("DESCLASIFICAR ERA EN LOTE")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("ERA PARA MARCADO"), { target: { value: "era-1" } });
    expect(screen.getByTitle("CLASIFICAR ERA EN LOTE")).toBeEnabled();
  });

  it("5. la barra de lote sigue a la entidad activa y usa su item_type", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("button", { name: "TRACKS" })[0]);
    await waitFor(() => expect(screen.getByRole("heading", { name: "TRACKS" })).toBeInTheDocument());
    expect(screen.getByText("MARCADO EN LOTE · TRACKS")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("ERA PARA MARCADO"), { target: { value: "era-1" } });
    fireEvent.click(screen.getByTitle("CLASIFICAR ERA EN LOTE"));
    await waitFor(() => expect(workerClient.fetch).toHaveBeenCalledTimes(1));
    expect(workerClient.fetch).toHaveBeenCalledWith("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_type: "track", era_id: "era-1" }),
    });
  });

  it("6. drops: era sí y tag no; playlist: sin barra de marcado en lote", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("button", { name: "DROPS" })[0]);
    await waitFor(() => expect(screen.getByRole("heading", { name: "DROPS" })).toBeInTheDocument());
    expect(screen.getByText("MARCADO EN LOTE · DROPS")).toBeInTheDocument();
    expect(screen.getByLabelText("ERA PARA MARCADO")).toBeInTheDocument();
    expect(screen.queryByLabelText("TAG PARA MARCADO")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "PLAYLISTS" })[0]);
    await waitFor(() => expect(screen.getByRole("heading", { name: "PLAYLISTS" })).toBeInTheDocument());
    expect(screen.queryByText(/MARCADO EN LOTE/)).not.toBeInTheDocument();
  });

  it("7. CRUD: NUEVO crea contra el cliente con los campos del descriptor", async () => {
    const { client } = mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /NUEVO/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("NUEVO · ENTRADAS")).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("TÍTULO"), { target: { value: "Recuerdo Tres" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "CREAR" }));

    await waitFor(() => expect(client.callsOf("create")).toHaveLength(1));
    expect(client.callsOf("create")[0]).toMatchObject({ endpoint: "/api/admin/entries" });
    expect(client.callsOf("create")[0].data).toMatchObject({ title: "Recuerdo Tres" });
    await waitFor(() => expect(screen.getByText("Recuerdo Tres")).toBeInTheDocument());
  });

  it("8. borrar exige teclear el nombre exacto antes de ejecutarse", async () => {
    const { client } = mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());

    fireEvent.click(within(rowOf("Recuerdo Uno")).getByRole("button", { name: "BORRAR" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/SE GUARDARÁ UN SNAPSHOT PREVIO/)).toBeInTheDocument();

    const confirm = within(dialog).getByRole("button", { name: "BORRAR" });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("CONFIRMACIÓN"), { target: { value: "recuerdo uno" } });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("CONFIRMACIÓN"), { target: { value: "Recuerdo Uno" } });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    await waitFor(() => expect(client.callsOf("remove")).toHaveLength(1));
    expect(client.callsOf("remove")[0]).toMatchObject({ endpoint: "/api/admin/entries", id: "e1" });
    await waitFor(() => expect(screen.queryByText("Recuerdo Uno")).not.toBeInTheDocument());
  });

  it("9. la acción de fila classify va contra el contrato de acción y no abre edición", async () => {
    const { client } = mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());

    fireEvent.click(within(rowOf("Recuerdo Uno")).getByRole("button", { name: "CLASIFICAR" }));

    await waitFor(() => expect(client.callsOf("action")).toHaveLength(1));
    expect(client.callsOf("action")[0]).toMatchObject({
      endpoint: "/api/admin/entries",
      id: "e1",
      action: "classify",
    });
    expect(screen.queryByText("EDITAR · ENTRADAS")).not.toBeInTheDocument();
  });

  it("10. cero emoji en toda la pantalla renderizada", async () => {
    const { container } = mountScreen();
    await waitFor(() => expect(screen.getByText("Recuerdo Uno")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
