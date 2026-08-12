// B4 — consola SALUD: recuentos D1 servidos por /api/admin/health
// montados en AdminShell (test de montaje del DoD). El screen lee
// con workerClient (Bearer correcto); el 401/403 lo decide el Worker,
// y aquí se verifica que el error se muestra.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Salud from "../screens/Salud";
import { createFakeClient } from "./fixtures/fakeClient";
import { workerClient } from "../../core/WorkerClient";

vi.mock("../../core/WorkerClient", () => ({
  workerClient: { get: vi.fn() },
}));

// Canon de la consola de SALUD (B4): 527 files / 527 entries / 529
// tracks activos / 0 soft-deleted / 1.054 referencias / 0 colgantes.
const COUNTS = {
  files: 527,
  entries: 527,
  tracksActive: 529,
  tracksSoftDeleted: 0,
  references: 1054,
  danglingReferences: 0,
};

const LABELS = [
  "FILES",
  "ENTRADAS",
  "TRACKS ACTIVOS",
  "SOFT-DELETED",
  "REFERENCIAS",
  "COLGANTES",
];

function mountScreen() {
  const client = createFakeClient([]);
  const utils = render(<Salud client={client} />);
  return { ...utils, client };
}

beforeEach(() => {
  workerClient.get.mockReset();
  workerClient.get.mockResolvedValue({ ok: true, counts: COUNTS });
});

describe("Salud — consola de SALUD (B4)", () => {
  it("1. monta AdminShell y pide los recuentos al endpoint protegido", async () => {
    mountScreen();
    expect(screen.getByText("TERMINAL DE MANDO · SALUD")).toBeInTheDocument();
    expect(workerClient.get).toHaveBeenCalledWith("/api/admin/health");
  });

  it("2. renderiza los seis recuentos leídos de D1", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByText("1054")).toBeInTheDocument());
    for (const label of LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByText("527").length).toBe(2);
    expect(screen.getByText("529")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBe(2);
    expect(screen.getByText("TODO EN ORDEN")).toBeInTheDocument();
  });

  it("3. avisa en rojo cuando hay colgantes o soft-deleted", async () => {
    workerClient.get.mockResolvedValue({
      ok: true,
      counts: { ...COUNTS, tracksSoftDeleted: 3, danglingReferences: 1 },
    });
    mountScreen();
    await waitFor(() => expect(screen.getByText("ATENCIÓN")).toBeInTheDocument());
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("4. muestra el error del worker (403 sin rol admin) en un alert", async () => {
    workerClient.get.mockRejectedValue(new Error("Worker GET /api/admin/health: 403"));
    mountScreen();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Worker GET /api/admin/health: 403");
  });

  it("5. cero emoji en toda la pantalla renderizada", async () => {
    const { container } = mountScreen();
    await waitFor(() => expect(screen.getByText("1054")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
