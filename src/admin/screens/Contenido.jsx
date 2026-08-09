// Consola CONTENIDO (B3) — CRUD de las 6 entidades mediante descriptores reales
// (src/admin/resources) montados en AdminShell, más el marcado de clasificación
// en lote por era/tag contra /api/classify (A1): "marcar una era entera en un gesto".
// La autorización la decide el Worker (requireAdmin, B2); esta pantalla solo oculta.
import { useEffect, useState } from "react";
import Button from "../../core/ui/Button";
import Card from "../../core/ui/Card";
import Icon from "../../core/ui/Icon";
import { workerClient } from "../../core/WorkerClient";
import { ACID, RED, FONT_MONO } from "../../tokens";
import AdminShell from "../core/AdminShell";
import { CONTENT_RESOURCES } from "../resources";

// Contrato A1 (workers/routes/classify.js): POST=classify, DELETE=unclassify,
// cuerpo con UN selector: item_id, item_ids, era_id o tag_id.
const CLASSIFY_ENDPOINT = "/api/classify";

const selectStyle = (accentColor) => ({
  minHeight: 44,
  minWidth: 180,
  color: accentColor,
  background: "transparent",
  border: `1px solid ${accentColor}33`,
  fontFamily: FONT_MONO,
  fontSize: 11,
});

const labelStyle = (accentColor) => ({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: `${accentColor}88`,
  fontSize: 10,
  letterSpacing: "0.2em",
});

export default function Contenido({ client, accentColor = ACID, onAudit = null }) {
  const [activeKey, setActiveKey] = useState(CONTENT_RESOURCES[0]?.key ?? null);
  const [eras, setEras] = useState([]);
  const [tags, setTags] = useState([]);
  const [eraId, setEraId] = useState("");
  const [tagId, setTagId] = useState("");
  const [batchState, setBatchState] = useState({ pending: false, message: null, error: null });

  const active = CONTENT_RESOURCES.find((resource) => resource.key === activeKey) ?? CONTENT_RESOURCES[0] ?? null;
  const batch = active?.batch ?? null;
  const withEra = Boolean(batch?.byEra);
  const withTag = Boolean(batch?.byTag);
  const hasSelector = withEra && eraId ? true : Boolean(withTag && tagId);
  const batchBusy = batchState.pending;

  // Eras y tags para los selectores del marcado en lote. Se leen con el
  // WorkerClient de la app (Bearer correcto); fallan silenciosos fuera de línea.
  useEffect(() => {
    let active2 = true;
    Promise.all([
      workerClient.get("/api/eras").catch(() => []),
      workerClient.get("/api/tags").catch(() => []),
    ]).then(([eraList, tagList]) => {
      if (!active2) return;
      setEras(Array.isArray(eraList) ? eraList : []);
      setTags(Array.isArray(tagList) ? tagList : []);
    });
    return () => { active2 = false; };
  }, []);

  // Al cambiar de entidad, los selectores de la anterior no valen.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEraId("");
    setTagId("");
  }, [activeKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const runBatch = async (action) => {
    if (!active || !hasSelector || batchBusy) return;
    const selector = eraId ? { era_id: eraId } : { tag_id: tagId };
    const body = { item_type: active.key, ...selector };
    setBatchState({ pending: true, message: null, error: null });
    try {
      const res = await workerClient.fetch(CLASSIFY_ENDPOINT, {
        method: action === "classify" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      const verb = action === "classify" ? "CLASIFICADOS" : "DESCLASIFICADOS";
      const count = typeof data?.count === "number" ? data.count : "?";
      setBatchState({ pending: false, message: `${count} ITEMS ${verb} · ${active.label}`, error: null });
      onAudit?.({ action, resource: active.key, selector, ok: true });
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      setBatchState({ pending: false, message: null, error });
      onAudit?.({ action, resource: active.key, selector, ok: false, error });
    }
  };

  const pickEra = (value) => {
    setEraId(value);
    if (value) setTagId("");
  };
  const pickTag = (value) => {
    setTagId(value);
    if (value) setEraId("");
  };

  const batchBar = batch && (withEra || withTag) ? (
    <Card accentColor={accentColor} padding="sm" style={{ margin: "0 16px 16px" }}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2" style={{ color: accentColor, fontSize: 11, letterSpacing: "0.2em" }}>
          <Icon name="lock" size={14} decorative />
          MARCADO EN LOTE · {active.label}
        </div>
        {withEra && (
          <label style={labelStyle(accentColor)}>
            ERA
            <select aria-label="ERA PARA MARCADO" value={eraId} onChange={(event) => pickEra(event.target.value)} style={selectStyle(accentColor)}>
              <option value="">SELECCIONAR</option>
              {eras.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}
            </select>
          </label>
        )}
        {withTag && (
          <label style={labelStyle(accentColor)}>
            TAG
            <select aria-label="TAG PARA MARCADO" value={tagId} onChange={(event) => pickTag(event.target.value)} style={selectStyle(accentColor)}>
              <option value="">SELECCIONAR</option>
              {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
            </select>
          </label>
        )}
        <Button size="sm" accentColor={accentColor} icon={<Icon name="lock" size={13} decorative />} title="CLASIFICAR ERA EN LOTE" disabled={!hasSelector || batchBusy} loading={batchBusy} onClick={() => runBatch("classify")}>CLASIFICAR</Button>
        <Button size="sm" variant="ghost" accentColor={accentColor} icon={<Icon name="unlock" size={13} decorative />} title="DESCLASIFICAR ERA EN LOTE" disabled={!hasSelector || batchBusy} loading={batchBusy} onClick={() => runBatch("unclassify")}>DESCLASIFICAR</Button>
        {batchState.message && (
          <span className="flex items-center gap-2" style={{ fontSize: 10, letterSpacing: "0.1em", color: accentColor }}>
            <Icon name="check" size={12} decorative />{batchState.message}
          </span>
        )}
        {batchState.error && (
          <span role="alert" className="flex items-center gap-2" style={{ fontSize: 10, letterSpacing: "0.1em", color: RED }}>
            <Icon name="alert" size={12} decorative />{batchState.error.message}
          </span>
        )}
      </div>
    </Card>
  ) : null;

  return (
    <AdminShell
      resources={CONTENT_RESOURCES}
      client={client}
      activeKey={activeKey}
      onActiveKeyChange={setActiveKey}
      accentColor={accentColor}
      onAudit={onAudit}
      footer={batchBar}
    />
  );
}
