// Descriptor de CONTENIDO — CÁPSULAS (TimeCapsules, ADR-020)
// Schema: workers/schema.sql · time_capsules
export default {
  key: "capsule",
  label: "CÁPSULAS",
  endpoint: "/api/admin/capsules",
  icon: "timer",
  pageSize: 25,
  columns: [
    { k: "title", label: "TÍTULO", search: true, sort: true },
    { k: "unlock_at", label: "APERTURA", render: "date", sort: true },
    { k: "is_unlocked", label: "ABIERTA" },
    { k: "classified", label: "CLASIF.", render: "lock" },
  ],
  fields: [
    { k: "title", type: "text", label: "TÍTULO", required: true },
    { k: "description", type: "textarea", label: "DESCRIPCIÓN" },
    { k: "unlock_at", type: "text", label: "APERTURA (ISO)" },
  ],
  actions: ["classify", "unclassify", "delete"],
  destructive: { delete: { confirmTyping: "title", snapshot: true } },
  // Sin marcado en lote por era/tag: el contrato A1 no soporta selectores
  // era_id/tag_id para capsule. Se marca fila a fila (acción classify).
  batch: null,
};
