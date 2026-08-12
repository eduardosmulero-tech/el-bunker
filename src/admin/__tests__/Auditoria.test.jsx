// B5 — consola AUDITORÍA: traza lectora de events servida por
// /api/admin/audit montada en AdminShell (test de montaje del DoD).
// El screen lee con workerClient (Bearer correcto); el 401/403 lo
// decide el Worker, y aquí se verifica que el error se muestra.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Auditoria from "../screens/Auditoria";
import { createFakeClient } from "./fixtures/fakeClient";
import { workerClient } from "../../core/WorkerClient";

vi.mock("../../core/WorkerClient", () => ({
  workerClient: { get: vi.fn() },
}));

// Traza de auditoría real de events: auth_login (ADR-028) y
// visit_mode_on/off (modo visita); acciones admin_* aún no existen.
const EVENTS = [
  { id: 3, event_type: "auth_login", user_id: "admin", entity_type: null, entity_id: null, payload: "{}", created_at: "2026-08-12 04:00:00" },
  { id: 2, event_type: "visit_mode_on", user_id: "edu", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 03:00:00" },
  { id: 1, event_type: "visit_mode_off", user_id: "edu", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 02:00:00" },
];

function payload(events = EVENTS, total = events.length, page = 1) {
  return { ok: true, readOnly: true, items: events, total, page, pageSize: 25 };
}

function mountScreen() {
  const client = createFakeClient([]);
  const utils = render(<Auditoria client={client} />);
  return { ...utils, client };
}

beforeEach(() => {
  workerClient.get.mockReset();
  workerClient.get.mockResolvedValue(payload());
});

describe("Auditoria — consola de AUDITORÍA (B5)", () => {
  it("1. monta AdminShell y lee la traza al endpoint protegido", async () => {
    mountScreen();
    expect(screen.getByText("TERMINAL DE MANDO · AUDITORÍA")).toBeInTheDocument();
    expect(workerClient.get).toHaveBeenCalledWith("/api/admin/audit?page=1&pageSize=25");
  });

  it("2. renderiza la tabla con los eventos leídos de D1", async () => {
    mountScreen();
    const loginCell = await screen.findByRole("cell", { name: "auth_login" });
    expect(loginCell).toBeInTheDocument();
    for (const header of ["EVENTO", "USUARIO", "ENTIDAD", "CUÁNDO"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.getByRole("cell", { name: "visit_mode_on" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "visit_mode_off" })).toBeInTheDocument();
    expect(screen.getByText("2026-08-12 04:00:00")).toBeInTheDocument();
    expect(screen.getAllByText("edu").length).toBe(2);
    expect(screen.getByText("3 EVENTOS · PÁGINA 1 DE 1")).toBeInTheDocument();
  });

  it("3. filtra por tipo de auditoría y vuelve a pedir con ?type=", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByText("auth_login")).toBeInTheDocument());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "auth_login" } });
    await waitFor(() =>
      expect(workerClient.get).toHaveBeenCalledWith("/api/admin/audit?page=1&pageSize=25&type=auth_login")
    );
  });

  it("4. pagina con ANTERIOR/SIGUIENTE y respeta el total de D1", async () => {
    workerClient.get.mockResolvedValue(payload(EVENTS.slice(0, 2), 60, 1));
    mountScreen();
    const nextButton = await screen.findByRole("button", { name: /SIGUIENTE/ });
    const prevButton = screen.getByRole("button", { name: /ANTERIOR/ });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
    expect(screen.getByText("60 EVENTOS · PÁGINA 1 DE 3")).toBeInTheDocument();

    fireEvent.click(nextButton);
    await waitFor(() =>
      expect(workerClient.get).toHaveBeenCalledWith("/api/admin/audit?page=2&pageSize=25")
    );
  });

  it("5. muestra el error del worker (403 sin rol admin) en un alert", async () => {
    workerClient.get.mockRejectedValue(new Error("Worker GET /api/admin/audit: 403"));
    mountScreen();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Worker GET /api/admin/audit: 403");
  });

  it("6. muestra SIN EVENTOS cuando la traza está vacía", async () => {
    workerClient.get.mockResolvedValue(payload([], 0, 1));
    mountScreen();
    expect(await screen.findByText("SIN EVENTOS")).toBeInTheDocument();
  });

  it("7. cero emoji en toda la pantalla renderizada", async () => {
    const { container } = mountScreen();
    await waitFor(() => expect(screen.getByText("auth_login")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
