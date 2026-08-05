import { useState } from "react";
import Dialog from "../../core/ui/Dialog";
import Button from "../../core/ui/Button";
import Icon from "../../core/ui/Icon";
import { ACID } from "../../tokens";
import useAdminResource from "./useAdminResource";
import ConfirmDialog from "./ConfirmDialog";
import ResourceTable from "./ResourceTable";
import ResourceForm from "./ResourceForm";

const ACTION_META = {
  delete: { label: "BORRAR", icon: "trash", tone: "danger" },
  classify: { label: "CLASIFICAR", icon: "lock" },
  unclassify: { label: "DESCLASIFICAR", icon: "unlock" },
};
const metaFor = (name) => ACTION_META[name] ?? { label: name.toUpperCase(), icon: "settings" };

export default function ResourceConsole({ descriptor, client, accentColor = ACID, onAudit = null, canCreate = descriptor.fields?.length > 0 }) {
  const resource = useAdminResource(descriptor, { client, onAudit });
  const [formState, setFormState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [formError, setFormError] = useState(null);
  const idKey = descriptor.idKey ?? "id";
  const actions = (descriptor.actions ?? []).map((name) => ({ name, ...metaFor(name) }));

  const submitForm = async (draft) => {
    const result = formState.mode === "create"
      ? await resource.create(draft)
      : await resource.update(formState.row[idKey], draft);
    if (result.ok) {
      setFormState(null);
      setFormError(null);
    } else setFormError(result.error);
    return result;
  };

  const onAction = (name, row) => {
    const destructive = descriptor.destructive?.[name];
    if (destructive) {
      setConfirmState({
        action: name,
        row,
        confirmTyping: destructive.confirmTyping ? row[destructive.confirmTyping] ?? null : null,
        snapshot: Boolean(destructive.snapshot),
      });
      return;
    }
    resource.runAction(name, row[idKey]);
  };

  const confirm = () => resource.runAction(confirmState.action, confirmState.row[idKey]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ margin: 0, fontSize: 14, letterSpacing: "0.25em" }}>{descriptor.label}</h1>
          <span style={{ color: `${accentColor}88`, fontSize: 10 }}>{resource.total} REGISTROS</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" accentColor={accentColor} icon={<Icon name="refresh" size={14} decorative />} title="Actualizar" onClick={resource.refresh}>ACTUALIZAR</Button>
          {canCreate && <Button size="sm" accentColor={accentColor} icon={<Icon name="plus" size={14} decorative />} onClick={() => { setFormError(null); setFormState({ mode: "create", row: null }); }}>NUEVO</Button>}
        </div>
      </div>
      <ResourceTable
        columns={descriptor.columns ?? []}
        rows={resource.rows}
        idKey={idKey}
        status={resource.status}
        error={resource.error}
        query={resource.query}
        onQueryChange={resource.setQuery}
        sort={resource.sort}
        onSortChange={resource.setSort}
        filters={resource.filters}
        onFilterChange={resource.setFilter}
        page={resource.page}
        pageCount={resource.pageCount}
        total={resource.total}
        onPageChange={resource.setPage}
        actions={actions}
        onAction={onAction}
        onRowClick={(row) => { setFormError(null); setFormState({ mode: "edit", row }); }}
        accentColor={accentColor}
      />
      <Dialog open={Boolean(formState)} title={`${formState?.mode === "edit" ? "EDITAR" : "NUEVO"} · ${descriptor.label}`} onClose={() => resource.mutation.pending ? null : setFormState(null)} accentColor={accentColor}>
        {formState && <ResourceForm key={formState.mode === "edit" ? formState.row[idKey] : "new"} fields={descriptor.fields ?? []} value={formState.row} mode={formState.mode} busy={resource.mutation.pending} error={formError} accentColor={accentColor} onSubmit={submitForm} onCancel={() => setFormState(null)} />}
      </Dialog>
      <ConfirmDialog open={Boolean(confirmState)} title={`${confirmState?.action?.toUpperCase() ?? "CONFIRMAR"} · ${descriptor.label}`} confirmTyping={confirmState?.confirmTyping} typingLabel="CONFIRMACIÓN" snapshot={confirmState?.snapshot} confirmLabel={confirmState?.action === "delete" ? "BORRAR" : "CONFIRMAR"} onConfirm={confirm} onClose={() => setConfirmState(null)} accentColor={accentColor} />
    </section>
  );
}
