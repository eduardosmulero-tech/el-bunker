// Descriptor de CONTENIDO — ENTRADAS (VAULT)
// Schema: workers/schema.sql · entries
// El endpoint /api/admin/entries es el contrato del panel (DISENO_PANEL_ADMIN
// 2026-08-04 §2); las rutas admin las decide el cierre de B2 (OLA2 §5).
// `classified` llega del LEFT JOIN con classified_items (A1).
export default {
  key: "entry",
  label: "ENTRADAS",
  endpoint: "/api/admin/entries",
  icon: "document",
  pageSize: 25,
  columns: [
    { k: "title", label: "TÍTULO", search: true, sort: true },
    { k: "era_id", label: "ERA", filter: true },
    { k: "type", label: "TIPO", filter: true },
    { k: "classified", label: "CLASIF.", render: "lock" },
    { k: "created_at", label: "FECHA", render: "date", sort: true },
  ],
  fields: [
    { k: "title", type: "text", label: "TÍTULO", required: true },
    { k: "type", type: "text", label: "TIPO" },
    { k: "era_id", type: "text", label: "ERA (ID)" },
    { k: "from_user", type: "select", label: "DE", options: ["edu", "david", "admin"] },
    { k: "to_user", type: "select", label: "PARA", options: ["edu", "david", "both"] },
  ],
  actions: ["classify", "unclassify", "delete"],
  destructive: { delete: { confirmTyping: "title", snapshot: true } },
  // Marcado en lote: era y tag (contrato A1: era_id/tag_id válidos para entry)
  batch: { byEra: true, byTag: true },
};
