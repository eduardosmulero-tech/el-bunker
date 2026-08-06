import { describe, it, expect } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import useAdminResource from "../core/useAdminResource";
import toyDescriptor, { TOY_ROWS } from "./fixtures/toyDescriptor";
import { createFakeClient, makeRows } from "./fixtures/fakeClient";

// ─── Helpers ──────────────────────────────────────────

function Harness({ descriptor, client, options, onRender }) {
  const api = useAdminResource(descriptor, { client, debounceMs: 0, ...options });
  onRender(api);
  return null;
}

function mountResource({ descriptor = toyDescriptor, client, options } = {}) {
  let latest;
  const utils = render(
    <Harness
      descriptor={descriptor}
      client={client}
      options={options}
      onRender={(api) => { latest = api; }}
    />
  );
  return { ...utils, api: () => latest };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = (ms) => act(async () => { await sleep(ms); });
const lastList = (client) => client.callsOf("list").at(-1).params;

// ─── Tests ────────────────────────────────────────────

describe("useAdminResource", () => {
  it("1. carga al montar y expone rows, total y status ready", async () => {
    const client = createFakeClient(TOY_ROWS);
    const { api } = mountResource({ client });

    expect(api().status).toBe("loading");
    await waitFor(() => expect(api().status).toBe("ready"));
    expect(api().rows).toHaveLength(3);
    expect(api().total).toBe(3);
    expect(api().error).toBeNull();
    expect(lastList(client).pageSize).toBe(25);
  });

  it("2. setPage pide la página nueva", async () => {
    const client = createFakeClient(makeRows(30));
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().rows).toHaveLength(25));

    act(() => api().setPage(2));
    await waitFor(() => expect(api().rows).toHaveLength(5));
    expect(Number(lastList(client).page)).toBe(2);
    expect(api().pageCount).toBe(2);
  });

  it("3. setQuery hace debounce: varias teclas seguidas = una sola petición", async () => {
    const client = createFakeClient(TOY_ROWS);
    const { api } = mountResource({ client, options: { debounceMs: 40 } });
    await waitFor(() => expect(api().status).toBe("ready"));
    const before = client.callsOf("list").length;

    act(() => api().setQuery("W"));
    act(() => api().setQuery("Wi"));
    act(() => api().setQuery("Widget Dos"));
    expect(api().query).toBe("Widget Dos");

    await waitFor(() => expect(client.callsOf("list").length).toBe(before + 1));
    await settle(120);
    expect(client.callsOf("list").length).toBe(before + 1);
    expect(lastList(client).q).toBe("Widget Dos");
    expect(api().rows).toHaveLength(1);
  });

  it("4. setQuery vuelve a la página 1", async () => {
    const client = createFakeClient(makeRows(30));
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().status).toBe("ready"));

    act(() => api().setPage(2));
    await waitFor(() => expect(api().page).toBe(2));
    act(() => api().setQuery("Widget 01"));

    await waitFor(() => expect(api().page).toBe(1));
    expect(Number(lastList(client).page)).toBe(1);
  });

  it("5. setSort cicla asc → desc → sin orden", async () => {
    const client = createFakeClient(TOY_ROWS);
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().status).toBe("ready"));

    act(() => api().setSort("name"));
    await waitFor(() => expect(api().sort).toEqual({ k: "name", dir: "asc" }));
    expect(lastList(client).sort).toBe("name");
    expect(lastList(client).dir).toBe("asc");

    act(() => api().setSort("name"));
    await waitFor(() => expect(api().sort).toEqual({ k: "name", dir: "desc" }));
    expect(lastList(client).dir).toBe("desc");

    act(() => api().setSort("name"));
    await waitFor(() => expect(api().sort).toBeNull());
    expect(lastList(client).sort).toBeUndefined();
  });

  it("6. setFilter filtra en servidor y vuelve a la página 1", async () => {
    const client = createFakeClient(TOY_ROWS);
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().status).toBe("ready"));

    act(() => api().setFilter("kind", "b"));
    await waitFor(() => expect(api().rows).toHaveLength(1));
    expect(lastList(client).kind).toBe("b");
    expect(api().filters).toEqual({ kind: "b" });
    expect(api().page).toBe(1);
  });

  it("7. una respuesta lenta antigua no pisa a la nueva", async () => {
    const client = createFakeClient(TOY_ROWS, { listDelays: [60] });
    const { api } = mountResource({ client });

    act(() => api().setQuery("Dos"));
    await settle(180);

    expect(api().rows).toHaveLength(1);
    expect(api().rows[0].name).toBe("Widget Dos");
  });

  it("8. tolera que el servidor devuelva un array pelado", async () => {
    const bare = {
      list: async () => TOY_ROWS,
      create: async () => null,
      update: async () => null,
      remove: async () => null,
      action: async () => null,
    };
    const { api } = mountResource({ client: bare });

    await waitFor(() => expect(api().status).toBe("ready"));
    expect(api().rows).toHaveLength(3);
    expect(api().total).toBe(3);
  });

  it("9. create con éxito devuelve ok y recarga", async () => {
    const client = createFakeClient(TOY_ROWS);
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().status).toBe("ready"));

    let result;
    await act(async () => { result = await api().create({ name: "Widget Cuatro" }); });

    expect(result.ok).toBe(true);
    expect(client.callsOf("create")).toHaveLength(1);
    expect(client.callsOf("create")[0].endpoint).toBe(toyDescriptor.endpoint);
    await waitFor(() => expect(api().rows).toHaveLength(4));
  });

  it("10. una mutación que falla no lanza: devuelve ok:false y puebla mutation.error", async () => {
    const client = createFakeClient(TOY_ROWS, { failures: { remove: new Error("403 FORBIDDEN") } });
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().status).toBe("ready"));

    let result;
    await act(async () => { result = await api().remove("w1"); });

    expect(result.ok).toBe(false);
    expect(result.error.message).toContain("403");
    expect(api().mutation.error).toBeTruthy();
    expect(api().mutation.pending).toBe(false);
    expect(api().rows).toHaveLength(3);
  });

  it("11. borrar la última fila de la página 2 devuelve a la página 1", async () => {
    const client = createFakeClient(makeRows(26));
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().status).toBe("ready"));

    act(() => api().setPage(2));
    await waitFor(() => expect(api().rows).toHaveLength(1));

    await act(async () => { await api().remove(api().rows[0].id); });
    await waitFor(() => expect(api().page).toBe(1));
    expect(api().rows).toHaveLength(25);
  });

  it("12. runAction usa client.action, y 'delete' usa client.remove", async () => {
    const client = createFakeClient(TOY_ROWS);
    const { api } = mountResource({ client });
    await waitFor(() => expect(api().status).toBe("ready"));

    await act(async () => { await api().runAction("lock", "w1"); });
    expect(client.callsOf("action")).toHaveLength(1);
    expect(client.callsOf("action")[0]).toMatchObject({ id: "w1", action: "lock" });

    await act(async () => { await api().runAction("delete", "w2"); });
    expect(client.callsOf("remove")).toHaveLength(1);
    expect(client.callsOf("action")).toHaveLength(1);
  });

  it("13. onAudit recibe el resultado de cada mutación", async () => {
    const audits = [];
    const client = createFakeClient(TOY_ROWS, { failures: { update: new Error("boom") } });
    const { api } = mountResource({ client, options: { onAudit: (e) => audits.push(e) } });
    await waitFor(() => expect(api().status).toBe("ready"));

    await act(async () => { await api().runAction("lock", "w1"); });
    expect(audits.at(-1)).toMatchObject({ action: "lock", resource: "widgets", id: "w1", ok: true });

    await act(async () => { await api().update("w1", { name: "x" }); });
    expect(audits.at(-1)).toMatchObject({ action: "update", resource: "widgets", id: "w1", ok: false });
    expect(audits.at(-1).error).toBeTruthy();
  });

  it("14. un fallo de carga deja status error y el mensaje accesible", async () => {
    const client = createFakeClient(TOY_ROWS, { failures: { list: new Error("500 D1 DOWN") } });
    const { api } = mountResource({ client });

    await waitFor(() => expect(api().status).toBe("error"));
    expect(api().error.message).toContain("500");
    expect(api().rows).toEqual([]);
  });
});
