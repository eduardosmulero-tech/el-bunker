// apiClient.test.js — red de regresion del header Authorization.
// El contrato t_1689eda3 pedia verificar que createApiClient() emite el
// header canonico "Authorization: Bearer <token>" (igual que WorkerClient)
// y nunca asteriscos literales. Se capturan los headers reales del fetch
// con un mock, sin tocar la logica de auth ni otros ficheros.
import { describe, expect, it, vi, afterEach } from "vitest";
import { createApiClient } from "../core/apiClient";

const okResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ items: [], total: 0 }),
  text: async () => "",
});

const captureFetch = () => {
  const calls = [];
  const mock = vi.fn(async (url, opts = {}) => {
    calls.push({ url, opts });
    return okResponse();
  });
  vi.stubGlobal("fetch", mock);
  return calls;
};

describe("createApiClient — header Authorization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("1. con token envia Authorization Bearer canonico", async () => {
    const calls = captureFetch();
    const client = createApiClient({ baseUrl: "https://api.test", getToken: () => "tok-123" });

    await client.list("/widgets");

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.test/widgets");
    expect(calls[0].opts.headers.Authorization).toBe("Bearer tok-123");
    expect(calls[0].opts.headers["Content-Type"]).toBe("application/json");
  });

  it("2. sin token no manda header Authorization", async () => {
    const calls = captureFetch();
    const client = createApiClient({ baseUrl: "https://api.test", getToken: () => null });

    await client.list("/widgets");

    expect(calls[0].opts.headers.Authorization).toBeUndefined();
    expect(calls[0].opts.headers["Content-Type"]).toBe("application/json");
  });

  it("3. crea con POST serializando el body y mismo header", async () => {
    const calls = captureFetch();
    const client = createApiClient({ baseUrl: "https://api.test", getToken: () => "tok-abc" });

    await client.create("/widgets", { name: "Widget Uno" });

    expect(calls).toHaveLength(1);
    expect(calls[0].opts.method).toBe("POST");
    expect(calls[0].opts.headers.Authorization).toBe("Bearer tok-abc");
    expect(JSON.parse(calls[0].opts.body)).toEqual({ name: "Widget Uno" });
  });

  it("4. sin token no aparece asterisco ni en header ni en URL", async () => {
    const calls = captureFetch();
    const client = createApiClient({ baseUrl: "", getToken: () => null });

    await client.list("/widgets");

    expect(calls[0].opts.headers.Authorization ?? "").not.toContain("*");
    expect(calls[0].url).not.toContain("*");
  });
});
