// Descriptor de CONTENIDO — DROPS (MusicLab)
// Schema: workers/schema.sql · drops
export default {
  key: "drop",
  label: "DROPS",
  endpoint: "/api/admin/drops",
  icon: "send",
  pageSize: 25,
  columns: [
    { k: "memory", label: "MEMORIA", search: true },
    { k: "mood", label: "MOMENTO", filter: true },
    { k: "drop_date", label: "FECHA", render: "date", sort: true },
    { k: "from_user", label: "DE" },
    { k: "classified", label: "CLASIF.", render: "lock" },
  ],
  fields: [
    { k: "memory", type: "textarea", label: "MEMORIA" },
    { k: "mood", type: "text", label: "MOMENTO" },
    { k: "drop_date", type: "text", label: "FECHA" },
    { k: "from_user", type: "select", label: "DE", options: ["edu", "david", "admin"] },
    { k: "to_user", type: "select", label: "PARA", options: ["edu", "david", "admin"] },
  ],
  actions: ["classify", "unclassify", "delete"],
  destructive: { delete: { confirmTyping: "memory", snapshot: true } },
  // Marcado en lote por era (contrato A1: era_id válido para drop; tag_id no)
  batch: { byEra: true, byTag: false },
};
