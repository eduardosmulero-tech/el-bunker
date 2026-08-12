// Consola SALUD (B4) — recuentos que Edu hacía a mano sobre D1
// (files, entries, tracks activos y soft-deleted, referencias y
// colgantes de file_references), servidos por GET /api/admin/health
// (workers/routes/admin-health.js). Lectura por defecto: la
// autorización la decide el Worker (401 sin token, 403 sin rol
// admin); esta pantalla solo muestra y avisa en rojo si hay
// colgantes o soft-deleted.
import { useEffect, useState } from "react";
import Card from "../../core/ui/Card";
import Icon from "../../core/ui/Icon";
import { workerClient } from "../../core/WorkerClient";
import { ACID, RED, FONT_MONO } from "../../tokens";
import AdminShell from "../core/AdminShell";

const HEALTH_ENDPOINT = "/api/admin/health";

const METRICS = [
  { key: "files", label: "FILES", icon: "document" },
  { key: "entries", label: "ENTRADAS", icon: "book" },
  { key: "tracksActive", label: "TRACKS ACTIVOS", icon: "music" },
  { key: "tracksSoftDeleted", label: "SOFT-DELETED", icon: "trash" },
  { key: "references", label: "REFERENCIAS", icon: "archive" },
  { key: "danglingReferences", label: "COLGANTES", icon: "alert" },
];

const metricStyle = (accentColor) => ({
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 12,
  color: accentColor,
  border: `1px solid ${accentColor}18`,
  background: `${accentColor}04`,
});

export default function Salud({ client, accentColor = ACID, onAudit = null }) {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    workerClient
      .get(HEALTH_ENDPOINT)
      .then((data) => {
        if (!active) return;
        setCounts(data?.counts ?? null);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    return () => { active = false; };
  }, []);

  const alertLevel = counts
    ? (counts.danglingReferences > 0 || counts.tracksSoftDeleted > 0) ? RED : null
    : null;

  const healthPanel = (
    <Card accentColor={accentColor} padding="sm" style={{ margin: "0 16px 16px" }}>
      <div className="flex items-center gap-2" style={{ color: accentColor, fontSize: 11, letterSpacing: "0.2em", marginBottom: 12 }}>
        <Icon name="shield" size={14} decorative />
        SALUD DEL SISTEMA · LECTURA D1
        {counts && (
          <span style={{ color: `${accentColor}66`, fontSize: 10 }}>
            {alertLevel ? "ATENCIÓN" : "TODO EN ORDEN"}
          </span>
        )}
      </div>
      {error ? (
        <div role="alert" className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: "0.1em", color: RED }}>
          <Icon name="alert" size={14} decorative />
          {error.message}
        </div>
      ) : counts ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {METRICS.map((metric) => {
            const value = counts[metric.key];
            const warn = metric.key === "danglingReferences" || metric.key === "tracksSoftDeleted";
            return (
              <div key={metric.key} style={metricStyle(alertLevel && warn ? RED : accentColor)}>
                <span className="flex items-center gap-2" style={{ fontSize: 10, letterSpacing: "0.2em", color: `${accentColor}88` }}>
                  <Icon name={metric.icon} size={13} decorative />
                  {metric.label}
                </span>
                <span style={{ fontSize: 22, color: alertLevel && warn ? RED : accentColor, fontFamily: FONT_MONO }}>
                  {typeof value === "number" ? value : "?"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: "0.2em", color: `${accentColor}88` }}>
          <Icon name="refresh" size={14} decorative />
          LEYENDO D1…
        </div>
      )}
    </Card>
  );

  return (
    <AdminShell
      resources={[]}
      client={client}
      title="TERMINAL DE MANDO · SALUD"
      accentColor={accentColor}
      onAudit={onAudit}
      footer={healthPanel}
    />
  );
}
