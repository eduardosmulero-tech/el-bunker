// ============================================================
//  EL BÚNKER — WorkerClient.js  (S115-D2)
//  Singleton para todas las llamadas al Worker API (D1+R2).
//  Centraliza auth JWT, manejo de 401, logging y retry.
//  Elimina el prop-drilling de jwtToken por todos los componentes.
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

class WorkerClient {
  constructor() {
    this.token = null;
  }

  setToken(jwt) {
    this.token = jwt;
  }

  clearToken() {
    this.token = null;
  }

  hasToken() {
    return !!this.token;
  }

  async _fetch(method, path, body = null) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    if (res.status === 401) {
      console.warn("[WorkerClient] ⚠ 401 — token expirado o inválido");
      this.clearToken();
      // S140: notificar a la app para que re-autentique silenciosamente.
      // Sin esto, StatsEngine.emit() falla silenciosa y eventos (track_play,
      // entry_created, etc.) jamás llegan a D1 — bug real detectado en
      // Timeline de David (evento del 22-Jun se quedó como el último).
      try { window.dispatchEvent(new CustomEvent("bunker_jwt_expired")); }
      catch { /* SSR / tests */ }
    }
    return res;
  }

  async get(path) {
    const res = await this._fetch("GET", path);
    if (!res.ok) throw new Error(`Worker GET ${path}: ${res.status}`);
    return res.json();
  }

  async post(path, body) {
    const res = await this._fetch("POST", path, body);
    if (!res.ok) throw new Error(`Worker POST ${path}: ${res.status}`);
    return res.json();
  }

  async patch(path, body) {
    const res = await this._fetch("PATCH", path, body);
    if (!res.ok) throw new Error(`Worker PATCH ${path}: ${res.status}`);
    return res.json();
  }

  async put(path, body) {
    const res = await this._fetch("PUT", path, body);
    if (!res.ok) throw new Error(`Worker PUT ${path}: ${res.status}`);
    return res.json();
  }

  async del(path) {
    const res = await this._fetch("DELETE", path);
    if (!res.ok) throw new Error(`Worker DELETE ${path}: ${res.status}`);
    return res.json();
  }

  async fetch(path, opts = {}) {
    const headers = { ...opts.headers };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return fetch(`${API_BASE}${path}`, { ...opts, headers });
  }
}

export const workerClient = new WorkerClient();
