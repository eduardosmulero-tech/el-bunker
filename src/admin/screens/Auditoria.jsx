// Consola AUDITORÍA (B5) — lectora de la tabla events (ADR-019:
// stats engine único, prohibido agregador paralelo). Servida por
// GET /api/admin/audit (workers/routes/admin-audit.js) con filtros
// de auditoría (tipo) y paginación. La autorización la decide el
// Worker (401 sin token, 403 sin rol admin); esta pantalla solo lee
// y muestra la traza: auth_login (ADR-028), visit_mode_on/off y las
// acciones admin_* cuando existan.
import { useEffect, useState } from "react";
import Card from "../../core/ui/Card";
import Icon from "../../core/ui/Icon";
import { workerClient } from "../../core/WorkerClient";
import { ACID, RED, FONT_MONO } from "../../tokens";
import AdminShell from "../core/AdminShell";

const AUDIT_ENDPOINT = "/api/admin/audit";
const PAGE_SIZE = 25;

// Tipos de auditoría que la consola puede acotar; el endpoint acepta
// cualquier event_type de events, estos son los que hoy pueblan la
// traza (acciones admin_* se sumarán al selector cuando existan).
const AUDIT_TYPES = [
  { value: "", label: "TODOS" },
  { value: "auth_login", label: "auth_login" },
  { value: "visit_mode_on", label: "visit_mode_on" },
  { value: "visit_mode_off", label: "visit_mode_off" },
];

const COLUMN_HEADERS = ["EVENTO", "USUARIO", "ENTIDAD", "CUÁNDO"];

const entityLabel = (entityType, entityId) => {
  if (!entityType && !entityId) return "—";
  if (entityType && entityId) return `${entityType} · ${entityId}`;
  return entityType || entityId;
};

export default function Auditoria({ client, accentColor = ACID, onAudit = null }) {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (type) params.set("type", type);
    workerClient
      .get(`${AUDIT_ENDPOINT}?${params.toString()}`)
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total ?? 0));
        setError(null);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    return () => {
      active = false;
    };
  }, [type, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const auditPanel = (
    <Card accentColor={accentColor} padding="sm" style={{ margin: "0 16px 16px" }}>
      <div className="flex items-center gap-2" style={{ color: accentColor, fontSize: 11, letterSpacing: "0.2em", marginBottom: 12 }}>
        <Icon name="shield" size={14} decorative />
        AUDITORÍA DE EVENTOS · LECTURA D1
        {items && (
          <span style={{ color: `${accentColor}66`, fontSize: 10 }}>
            {total} EVENTOS · PÁGINA {page} DE {totalPages}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
        <label htmlFor="audit-type" className="flex items-center gap-2" style={{ fontSize: 10, letterSpacing: "0.2em", color: `${accentColor}88` }}>
          <Icon name="tag" size={13} decorative />
          TIPO
        </label>
        <select
          id="audit-type"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
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
          {AUDIT_TYPES.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div role="alert" className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: "0.1em", color: RED }}>
          <Icon name="alert" size={14} decorative />
          {error.message}
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
                {COLUMN_HEADERS.map((header) => (
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
    <AdminShell
      resources={[]}
      client={client}
      title="TERMINAL DE MANDO · AUDITORÍA"
      accentColor={accentColor}
      onAudit={onAudit}
      footer={auditPanel}
    />
  );
}
