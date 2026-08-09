// Descriptor de CONTENIDO — PLAYLISTS (MusicLab)
// Schema: workers/schema.sql · playlists
export default {
  key: "playlist",
  label: "PLAYLISTS",
  endpoint: "/api/admin/playlists",
  icon: "archive",
  pageSize: 25,
  columns: [
    { k: "name", label: "NOMBRE", search: true, sort: true },
    { k: "description", label: "DESCRIPCIÓN" },
    { k: "sort_order", label: "ORDEN", render: "number" },
    { k: "classified", label: "CLASIF.", render: "lock" },
  ],
  fields: [
    { k: "name", type: "text", label: "NOMBRE", required: true },
    { k: "description", type: "textarea", label: "DESCRIPCIÓN" },
    { k: "sort_order", type: "number", label: "ORDEN" },
  ],
  actions: ["classify", "unclassify", "delete"],
  destructive: { delete: { confirmTyping: "name", snapshot: true } },
  // Sin marcado en lote por era/tag: el contrato A1 no soporta selectores
  // era_id/tag_id para playlist. Se marca fila a fila (acción classify).
  batch: null,
};
