-- Modo Visita A1 — clasificación lateral y metadata visual.
-- Migración aditiva: no modifica consultas existentes ni backfillea datos.
-- Rollback local revisable: DROP TABLE classified_items; ALTER TABLE files DROP COLUMN blurhash;

CREATE TABLE IF NOT EXISTS classified_items (
  item_type  TEXT NOT NULL CHECK (item_type IN ('entry', 'file', 'track', 'playlist', 'capsule', 'drop')),
  item_id    TEXT NOT NULL,
  marked_by  TEXT NOT NULL REFERENCES users(id),
  marked_at  INTEGER NOT NULL,
  PRIMARY KEY (item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_classified_items_type
  ON classified_items(item_type);

ALTER TABLE files ADD COLUMN blurhash TEXT;
