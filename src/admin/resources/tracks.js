// Descriptor de CONTENIDO — TRACKS (MusicLab)
// Schema: workers/schema.sql · tracks
export default {
  key: "track",
  label: "TRACKS",
  endpoint: "/api/admin/tracks",
  icon: "music",
  pageSize: 25,
  columns: [
    { k: "title", label: "TÍTULO", search: true, sort: true },
    { k: "artist", label: "ARTISTA", search: true },
    { k: "era_id", label: "ERA", filter: true },
    { k: "duration", label: "DURACIÓN", render: "number" },
    { k: "classified", label: "CLASIF.", render: "lock" },
  ],
  fields: [
    { k: "title", type: "text", label: "TÍTULO", required: true },
    { k: "artist", type: "text", label: "ARTISTA" },
    { k: "note", type: "textarea", label: "NOTA" },
    { k: "duration", type: "number", label: "DURACIÓN (SEG)" },
    { k: "format", type: "text", label: "FORMATO" },
  ],
  actions: ["classify", "unclassify", "delete"],
  destructive: { delete: { confirmTyping: "title", snapshot: true } },
  // Marcado en lote: era y tag (contrato A1: era_id/tag_id válidos para track)
  batch: { byEra: true, byTag: true },
};
