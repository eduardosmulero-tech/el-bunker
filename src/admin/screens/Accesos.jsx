// Consola ACCESOS (B6) — revocación de sesiones por epoch de usuario (ADR-031).
// Dos piezas: la tabla de los 3 usuarios whitelist (métodos de entrada,
// último acceso, token_epoch, clave configurada) servida por GET
// /api/admin/access, y el lector de la traza de ACCESOS (auth_login,
// auth_revoked, visit_mode_on/off) servido por GET /api/admin/access/logins.
// Revocar exige ConfirmDialog escribiendo el user_id (misma regla que los
// borrados, diseño §6.2): la acción mata TODAS las sesiones de ese usuario.
// La autorización la decide el Worker (401/403); esta pantalla solo oculta.
// Cero emoji: iconografía del registro Icon.jsx (key, lock, shield).
import { useEffect, useState } from "react";
import Card from "../../core/ui/Card";
import Icon from "../../core/ui/Icon";
import { workerClient } from "../../core/WorkerClient";
import { ACID, RED, FONT_MONO } from "../../tokens";
import AdminShell from "../core/AdminShell";
import ResourceTable from "../core/ResourceTable";
import ConfirmDialog from "../core/ConfirmDialog";

const ACCESS_ENDPOINT = "/api/admin/access";
const LOGINS_ENDPOINT = "/api/admin/access/logins";
const PAGE_SIZE = 25;

// Usuarios de la whitelist (ADR-006) para el filtro de la traza y el
// confirm de revocación. El endpoint los sirve vivos; este es el selector.
const USER_OPTIONS = [
  { value: "", label: "TODOS" },
  { value: "admin", label: "admin" },
  { value: "edu", label: "edu" },
  { value: "david", label: "david" },
];

const USERS_COLUMNS = [
  { k: "id", label: "USUARIO" },
  { k: "email", label: "EMAIL" },
  { k: "methods", label: "ENTRADAS", render: (value) => methodsLabel(value) },
  { k: "lastLoginAt", label: "ÚLTIMO ACCESO" },
  { k: "lastLoginIp", label: "IP" },
  { k: "lastLoginUa", label: "UA" },
  { k: "token_epoch", label: "EPOCH", render: "number" },
  { k: "hasAccessKey", label: "CLAVE", render: "lock" },
];

const LOGIN_COLUMNS = ["EVENTO", "USUARIO", "ENTIDAD", "CUÁNDO"];

const USERS_ACTIONS = [{ name: "revoke", label: "REVOCAR", icon: "lock", tone: "danger" }];

// Métodos de entrada observados: "—" si el usuario nunca ha entrado (nada
// inventado en pantalla, REGLAS.md), lista unida si sí.
const methodsLabel = (methods) =>
  Array.isArray(methods) && methods.length > 0 ? methods.join(" · ") : "—";

const entityLabel = (entityType, entityId) => {
  if (!entityType && !entityId) return "—";
  if (entityType && entityId) return `${entityType} · ${entityId}`;
  return entityType || entityId;
};

export default function Accesos({ client, accentColor = ACID, onAudit = null }) {
  const [users, setUsers] = useState(null);
  const [usersError, setUsersError] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeMessage, setRevokeMessage] = useState(null);

  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterUser, setFilterUser] = useState("");
  const [loginsError, setLoginsError] = useState(null);

  useEffect(() => {
    let active = true;
    workerClient
      .get(ACCESS_ENDPOINT)
      .then((data) => {
        if (!active) return;
        setUsers(Array.isArray(data?.users) ? data.users : []);
        setUsersError(null);
      })
      .catch((reason) => {
        if (!active) return;
        setUsersError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (filterUser) params.set("user", filterUser);
    workerClient
      .get(`${LOGINS_ENDPOINT}?${params.toString()}`)
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total ?? 0));
        setLoginsError(null);
      })
      .catch((reason) => {
        if (!active) return;
        setLoginsError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    return () => { active = false; };
  }, [filterUser, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmRevoke = async () => {
    const res = await workerClient.fetch(`${ACCESS_ENDPOINT}/${revokeTarget}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: new Error(data?.error ?? `HTTP ${res.status}`) };
    }
    setRevokeMessage(`EPOCH REVOCADO · ${revokeTarget} → ${data?.token_epoch}`);
    onAudit?.({ action: "revoke", target: revokeTarget, ok: true });
    // El epoch subió en D1: recargar la tabla de usuarios y la traza.
    workerClient
      .get(ACCESS_ENDPOINT)
      .then((fresh) => {
        setUsers(Array.isArray(fresh?.users) ? fresh.users : []);
        setUsersError(null);
      })
      .catch((reason) => {
        setUsersError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    setPage(1);
    return { ok: true };
  };

  const rows = (users ?? []).map((user) => ({
    ...user,
    lastLoginAt: user.lastLogin?.at ?? null,
    lastLoginIp: user.lastLogin?.ip ?? null,
    lastLoginUa: user.lastLogin?.ua ?? null,
  }));

  const usersPanel = (
    <Card accentColor={accentColor} padding="sm" style={{ margin: "0 16px 16px" }}>
      <div className="flex items-center gap-2" style={{ color: accentColor, fontSize: 11, letterSpacing: "0.2em", marginBottom: 12 }}>
        <Icon name="key" size={14} decorative />
        USUARIOS · WHITELIST (ADR-006)
        {users && (
          <span style={{ color: `${accentColor}66`, fontSize: 10 }}>
            {users.length} USUARIOS · EPOCH EN D1
          </span>
        )}
      </div>
      {revokeMessage && (
        <div className="flex items-center gap-2" style={{ fontSize: 10, letterSpacing: "0.1em", color: accentColor, marginBottom: 10 }}>
          <Icon name="check" size={12} decorative />
          {revokeMessage}
        </div>
      )}
      <ResourceTable
        columns={USERS_COLUMNS}
        rows={rows}
        idKey="id"
        status={users ? "ready" : usersError ? "error" : "loading"}
        error={usersError}
        actions={USERS_ACTIONS}
        onAction={(name, row) => { if (name === "revoke") setRevokeTarget(row.id); }}
        accentColor={accentColor}
        emptyLabel="SIN USUARIOS"
      />
    </Card>
  );

  const loginsPanel = (
    <Card accentColor={accentColor} padding="sm" style={{ margin: "0 16px 16px" }}>
      <div className="flex items-center gap-2" style={{ color: accentColor, fontSize: 11, letterSpacing: "0.2em", marginBottom: 12 }}>
        <Icon name="shield" size={14} decorative />
        TRAZA DE ACCESOS · LECTURA D1
        {items && (
          <span style={{ color: `${accentColor}66`, fontSize: 10 }}>
            {total} EVENTOS · PÁGINA {page} DE {totalPages}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
        <label htmlFor="access-user" className="flex items-center gap-2" style={{ fontSize: 10, letterSpacing: "0.2em", color: `${accentColor}88` }}>
          <Icon name="key" size={13} decorative />
          USUARIO
        </label>
        <select
          id="access-user"
          value={filterUser}
          onChange={(event) => {
            setFilterUser(event.target.value);
            setPage(1);
          }}
          style={{
            background: "transparent",
            color: accentColor,
            border: `1px solid ${accentColor}33`,
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: "0.12em",
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          {USER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loginsError ? (
        <div role="alert" className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: "0.1em", color: RED }}>
          <Icon name="alert" size={14} decorative />
          {loginsError.message}
        </div>
      ) : !items ? (
        <div className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: "0.2em", color: `${accentColor}88` }}>
          <Icon name="refresh" size={14} decorative />
          LEYENDO D1…
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: "0.2em", color: `${accentColor}88` }}>
          <Icon name="alert" size={14} decorative />
          SIN EVENTOS
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, letterSpacing: "0.08em" }}>
            <thead>
              <tr>
                {LOGIN_COLUMNS.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    style={{
                      textAlign: "left",
                      padding: "6px 10px",
                      color: `${accentColor}88`,
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      borderBottom: `1px solid ${accentColor}33`,
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((event) => (
                <tr key={event.id ?? `${event.event_type}-${event.created_at}`} style={{ borderBottom: `1px solid ${accentColor}14` }}>
                  <td style={{ padding: "6px 10px", color: accentColor, whiteSpace: "nowrap" }}>{event.event_type}</td>
                  <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{event.user_id}</td>
                  <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{entityLabel(event.entity_type, event.entity_id)}</td>
                  <td style={{ padding: "6px 10px", color: `${accentColor}88`, whiteSpace: "nowrap" }}>{event.created_at ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: `1px solid ${page <= 1 ? `${accentColor}22` : `${accentColor}55`}`,
                color: page <= 1 ? `${accentColor}33` : accentColor,
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: "0.16em",
                padding: "6px 12px",
                cursor: page <= 1 ? "default" : "pointer",
              }}
            >
              <Icon name="chevronLeft" size={13} decorative />
              ANTERIOR
            </button>
            <span style={{ fontSize: 10, letterSpacing: "0.2em", color: `${accentColor}66` }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: `1px solid ${page >= totalPages ? `${accentColor}22` : `${accentColor}55`}`,
                color: page >= totalPages ? `${accentColor}33` : accentColor,
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: "0.16em",
                padding: "6px 12px",
                cursor: page >= totalPages ? "default" : "pointer",
              }}
            >
              SIGUIENTE
              <Icon name="chevronRight" size={13} decorative />
            </button>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <>
      <AdminShell
        resources={[]}
        client={client}
        title="TERMINAL DE MANDO · ACCESOS"
        accentColor={accentColor}
        onAudit={onAudit}
        footer={<>{usersPanel}{loginsPanel}</>}
      />
      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="REVOCAR SESIONES"
        message={`REVOCAR ${revokeTarget} INVALIDA TODAS SUS SESIONES EN EL ACTO (ADR-031). LOS TOKENS ANTERIORES DEJAN DE SERVIR.`}
        confirmTyping={revokeTarget}
        typingLabel="ESCRIBE EL USER_ID PARA CONFIRMAR"
        confirmLabel="REVOCAR"
        accentColor={accentColor}
        onConfirm={confirmRevoke}
        onClose={() => setRevokeTarget(null)}
      />
    </>
  );
}
