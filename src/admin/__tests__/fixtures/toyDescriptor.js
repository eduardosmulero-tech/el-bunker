// Descriptor de juguete del DoD de B1. Deliberadamente ajeno a el-bunker:
// si hablara de entries/tracks, montar el panel con él no probaría portabilidad.

export const TOY_ROWS = [
  { id: "w1", name: "Widget Uno", kind: "a", notes: "primero", locked: false, created_at: "2026-01-01" },
  { id: "w2", name: "Widget Dos", kind: "b", notes: "segundo", locked: true, created_at: "2026-01-02" },
  { id: "w3", name: "Widget Tres", kind: "a", notes: "tercero", locked: false, created_at: "2026-01-03" },
];

const toyDescriptor = {
  key: "widgets",
  label: "WIDGETS",
  endpoint: "/api/admin/widgets",
  icon: "settings",
  pageSize: 25,
  columns: [
    { k: "name", label: "NOMBRE", search: true, sort: true },
    { k: "kind", label: "TIPO", filter: true, options: ["a", "b"] },
    { k: "locked", label: "BLOQ.", render: "lock" },
  ],
  fields: [
    { k: "name", type: "text", label: "NOMBRE", required: true },
    { k: "notes", type: "textarea", label: "NOTAS" },
    { k: "kind", type: "select", label: "TIPO", options: ["a", "b"] },
    { k: "locked", type: "checkbox", label: "BLOQUEADO" },
  ],
  actions: ["lock", "delete"],
  destructive: { delete: { confirmTyping: "name", snapshot: true } },
};

export default toyDescriptor;
