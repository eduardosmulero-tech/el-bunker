// admin-core — apiClient.js
// Cliente REST mínimo, inyectable. No depende de ningún WorkerClient del
// host: cada app pasa su propio getToken() al montar <AdminGuard>/<AdminShell>.

export function createApiClient({ baseUrl = "", getToken = () => null } = {}) {
  const request = async (path, { method = "GET", body, headers } = {}) => {
    const token = getToken();
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`${method} ${path} → ${res.status}${detail ? `: ${detail}` : ""}`);
    }
    if (res.status === 204) return null;
    return res.json();
  };

  return {
    list:   (endpoint, params) => request(`${endpoint}${toQuery(params)}`),
    create: (endpoint, data)   => request(endpoint, { method: "POST", body: data }),
    update: (endpoint, id, data) => request(`${endpoint}/${id}`, { method: "PATCH", body: data }),
    remove: (endpoint, id)     => request(`${endpoint}/${id}`, { method: "DELETE" }),
    action: (endpoint, id, name, data) =>
      request(`${endpoint}/${id}/${name}`, { method: "POST", body: data }),
  };
}

function toQuery(params) {
  if (!params) return "";
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}
