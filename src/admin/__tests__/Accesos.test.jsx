// B6 — consola ACCESOS: usuarios whitelist + traza de accesos + revocación
// por epoch (ADR-031) servidos por /api/admin/access* montados en AdminShell
// (test de montaje del DoD). El screen lee con workerClient (Bearer correcto);
// el 401/403 lo decide el Worker, y aquí se verifica que el error se muestra.
// Revocar exige ConfirmDialog escribiendo el user_id (diseño §6.2).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Accesos from "../screens/Accesos";
import { createFakeClient } from "./fixtures/fakeClient";
import { workerClient } from "../../core/WorkerClient";

vi.mock("../../core/WorkerClient", () => ({
  workerClient: { get: vi.fn(), fetch: vi.fn() },
}));

const USERS_PAYLOAD = {
  ok: true,
  readOnly: false,
  users: [
    {
      id: "admin",
      email: "thebunker.admin@gmail.com",
      role: "admin",
      token_epoch: 3,
      hasAccessKey: true,
      methods: ["access_key", "google"],
      lastLogin: { at: "2026-08-12 04:00:00", ip: "1.2.3.4", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" },
    },
    {
      id: "edu",
      email: "bansovi.py@gmail.com",
      role: "user",
      token_epoch: 0,
      hasAccessKey: false,
      methods: [],
      lastLogin: null, // nunca ha entrado: la fila dice vacío
    },
    {
      id: "david",
      email: "dcgdozt@gmail.com",
      role: "user",
      token_epoch: 1,
      hasAccessKey: false,
      methods: ["google"],
      lastLogin: { at: "2026-08-10 04:00:00", ip: "9.9.9.9", ua: "Mozilla/5.0" },
    },
  ],
};

const EVENTS = [
  { id: 5, event_type: "auth_revoked", user_id: "admin", entity_type: "user", entity_id: "edu", payload: "{}", created_at: "2026-08-12 05:00:00" },
  { id: 4, event_type: "auth_login", user_id: "admin", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 04:00:00" },
  { id: 3, event_type: "visit_mode_on", user_id: "edu", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 03:00:00" },
];

function loginsPayload(items = EVENTS, total = items.length, page = 1) {
  return { ok: true, readOnly: true, items, total, page, pageSize: 25 };
}

function mountScreen() {
  const client = createFakeClient([]);
  const utils = render(<Accesos client={client} />);
  return { ...utils, client };
}

beforeEach(() => {
  workerClient.get.mockReset();
  workerClient.fetch.mockReset();
  workerClient.get.mockImplementation(async (path) => {
    if (path.startsWith("/api/admin/access/logins")) return loginsPayload();
    if (path === "/api/admin/access") return USERS_PAYLOAD;
    return {};
  });
  workerClient.fetch.mockResolvedValue(new Response(JSON.stringify({ ok: true, token_epoch: 4 }), { status: 200 }));
});

describe("Accesos — consola de ACCESOS (B6)", () => {
  it("1. monta AdminShell y lee usuarios y traza a los endpoints protegidos", async () => {
    mountScreen();
    expect(screen.getByText("TERMINAL DE MANDO · ACCESOS")).toBeInTheDocument();
    await waitFor(() => {
      expect(workerClient.get).toHaveBeenCalledWith("/api/admin/access");
      expect(workerClient.get).toHaveBeenCalledWith("/api/admin/access/logins?page=1&pageSize=25");
    });
  });

  it("2. renderiza la tabla de usuarios con epoch, métodos y último acceso de D1", async () => {
    mountScreen();
    // "admin" aparece en la tabla de usuarios y en la traza (user_id): ambas celdas.
    await waitFor(() => expect(screen.getAllByRole("cell", { name: "admin" }).length).toBeGreaterThanOrEqual(1));
    for (const header of ["USUARIO", "EMAIL", "ENTRADAS", "ÚLTIMO ACCESO", "IP", "UA", "EPOCH", "CLAVE"]) {
      expect(screen.getAllByText(header).length).toBeGreaterThanOrEqual(1);
    }
    expect(screen.getByRole("cell", { name: "access_key · google" })).toBeInTheDocument();
    expect(screen.getAllByText("2026-08-12 04:00:00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2026-08-10 04:00:00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3 USUARIOS · EPOCH EN D1")).toBeInTheDocument();
  });

  it("3. el usuario sin entradas muestra vacío, no una fecha de relleno", async () => {
    mountScreen();
    await screen.findByText("3 USUARIOS · EPOCH EN D1");
    // edu no tiene lastLogin ni methods: sus celdas dicen "—". Las únicas fechas
    // de acceso son las de admin (12-08) y david (10-08); edu nunca aparece con
    // una fecha inventada (la de 04:00 del 12-08 en la traza es el auth_login).
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("2026-08-12 04:00:00").length).toBe(2); // admin (tabla) + auth_login (traza)
    expect(screen.getAllByText("2026-08-10 04:00:00").length).toBe(1); // david
  });

  it("4. renderiza la traza de accesos con auth_revoked, auth_login y visit_mode_on", async () => {
    mountScreen();
    const revokedCell = await screen.findByRole("cell", { name: "auth_revoked" });
    expect(revokedCell).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "auth_login" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "visit_mode_on" })).toBeInTheDocument();
    expect(screen.getByText("3 EVENTOS · PÁGINA 1 DE 1")).toBeInTheDocument();
    for (const header of ["EVENTO", "USUARIO", "ENTIDAD", "CUÁNDO"]) {
      expect(screen.getAllByText(header).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("5. filtra la traza por usuario y vuelve a pedir con ?user=", async () => {
    mountScreen();
    await waitFor(() => expect(screen.getByRole("cell", { name: "auth_revoked" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("USUARIO"), { target: { value: "edu" } });
    await waitFor(() =>
      expect(workerClient.get).toHaveBeenCalledWith("/api/admin/access/logins?page=1&pageSize=25&user=edu")
    );
  });

  it("6. pagina la traza con ANTERIOR/SIGUIENTE respetando el total", async () => {
    workerClient.get.mockImplementation(async (path) => {
      if (path.startsWith("/api/admin/access/logins")) return loginsPayload(EVENTS.slice(0, 2), 60, 1);
      if (path === "/api/admin/access") return USERS_PAYLOAD;
      return {};
    });
    mountScreen();
    const nextButton = await screen.findByRole("button", { name: /SIGUIENTE/ });
    const prevButton = screen.getByRole("button", { name: /ANTERIOR/ });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
    expect(screen.getByText("60 EVENTOS · PÁGINA 1 DE 3")).toBeInTheDocument();

    fireEvent.click(nextButton);
    await waitFor(() =>
      expect(workerClient.get).toHaveBeenCalledWith("/api/admin/access/logins?page=2&pageSize=25")
    );
  });

  it("7. revocar exige escribir el user_id en el ConfirmDialog y llama al endpoint", async () => {
    mountScreen();
    const revokeButtons = await screen.findAllByRole("button", { name: "REVOCAR" });
    fireEvent.click(revokeButtons[0]); // fila admin

    const input = screen.getByRole("textbox", { name: "ESCRIBE EL USER_ID PARA CONFIRMAR" });
    expect(input).toBeInTheDocument();
    const confirmButton = screen.getAllByRole("button", { name: "REVOCAR" }).at(-1);
    expect(confirmButton).toBeDisabled(); // sin escribir el user_id no se puede

    fireEvent.change(input, { target: { value: "admin" } });
    await waitFor(() => expect(confirmButton).not.toBeDisabled());
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(workerClient.fetch).toHaveBeenCalledWith(
        "/api/admin/access/admin/revoke",
        expect.objectContaining({ method: "POST" }),
      )
    );
    expect(await screen.findByText("EPOCH REVOCADO · admin → 4")).toBeInTheDocument();
    // Tras revocar se recarga la tabla de usuarios (el epoch subió en D1).
    await waitFor(() => expect(workerClient.get).toHaveBeenCalledWith("/api/admin/access"));
  });

  it("8. muestra el error del worker (403 sin rol admin) en un alert", async () => {
    workerClient.get.mockRejectedValue(new Error("Worker GET /api/admin/access: 403"));
    mountScreen();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Worker GET /api/admin/access: 403");
  });

  it("9. cero emoji en toda la pantalla renderizada", async () => {
    const { container } = mountScreen();
    await waitFor(() => expect(screen.getAllByRole("cell", { name: "admin" }).length).toBeGreaterThanOrEqual(1));
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
