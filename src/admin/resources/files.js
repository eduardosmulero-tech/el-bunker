// Descriptor de CONTENIDO — ARCHIVOS (R2 references, ADR-022)
// Schema: workers/schema.sql · files
export default {
  key: "file",
  label: "ARCHIVOS",
  endpoint: "/api/admin/files",
  icon: "image",
  pageSize: 25,
  columns: [
    { k: "filename", label: "NOMBRE", search: true, sort: true },
    { k: "prefix", label: "PREFIJO", filter: true, options: ["music", "vault/photos", "vault/videos", "vault/docs", "vault/audio"] },
    { k: "mime_type", label: "MIME" },
    { k: "size_bytes", label: "TAMAÑO", render: "number" },
    { k: "classified", label: "CLASIF.", render: "lock" },
  ],
  fields: [
    { k: "filename", type: "text", label: "NOMBRE", required: true },
    { k: "prefix", type: "select", label: "PREFIJO", options: ["music", "vault/photos", "vault/videos", "vault/docs", "vault/audio"] },
    { k: "mime_type", type: "text", label: "MIME" },
    { k: "size_bytes", type: "number", label: "TAMAÑO (BYTES)" },
  ],
  actions: ["classify", "unclassify", "delete"],
  destructive: { delete: { confirmTyping: "filename", snapshot: true } },
  // Marcado en lote: era y tag (contrato A1: era_id/tag_id válidos para file)
  batch: { byEra: true, byTag: true },
};
