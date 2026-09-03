-- t_like-sync — likes de tracks persistidos en D1 (multi-dispositivo).
-- Migración aditiva: tabla nueva, no toca consultas existentes.
-- Rollback local revisable: DROP TABLE track_likes;
CREATE TABLE IF NOT EXISTS track_likes (
  user_id    TEXT NOT NULL REFERENCES users(id),
  track_id   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_track_likes_track
  ON track_likes(track_id);

-- Bump de versión de esquema (patrón 0003)
UPDATE app_config SET value = '1.2.0' WHERE key = 'schema_version';
