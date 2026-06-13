-- ============================================================
--  EL BÚNKER — schema.sql
--  D1 Schema v1.0.0 · Migración Drive JSON → SQL (ADR-024)
--  S54 · Fase 1 — Infraestructura Cloudflare
-- ============================================================

-- ═══ USUARIOS ═══════════════════════════════════════════════
CREATE TABLE users (
  id         TEXT PRIMARY KEY,              -- 'edu', 'david', 'admin'
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user',  -- 'admin', 'user'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══ APP CONFIG ═════════════════════════════════════════════
CREATE TABLE app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL
);

-- ═══ ERAS (VAULT) ═══════════════════════════════════════════
CREATE TABLE eras (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date  TEXT,
  end_date    TEXT,
  color       TEXT DEFAULT '#bfff00',
  cover_image TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══ ENTRIES (VAULT — polimórfico) ══════════════════════════
CREATE TABLE entries (
  id          TEXT PRIMARY KEY,
  era_id      TEXT REFERENCES eras(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'note',  -- note|photo|milestone|letter|document|audio
  title       TEXT DEFAULT '',
  content     TEXT NOT NULL DEFAULT '{}',    -- JSON blob: { text, images[], metadata }
  from_user   TEXT NOT NULL REFERENCES users(id),
  to_user     TEXT NOT NULL DEFAULT 'both',  -- edu|david|both
  is_deleted  INTEGER NOT NULL DEFAULT 0,    -- soft delete
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_entries_era     ON entries(era_id);
CREATE INDEX idx_entries_type    ON entries(type);
CREATE INDEX idx_entries_from    ON entries(from_user);
CREATE INDEX idx_entries_created ON entries(created_at);


CREATE TABLE tags (
  id          TEXT PRIMARY KEY,
  namespace   TEXT NOT NULL,                 -- 'music' (vibes) | 'vault' (contexto)
  label       TEXT NOT NULL,
  icon        TEXT DEFAULT '◈',
  color       TEXT DEFAULT '#ffffff',
  created_by  TEXT NOT NULL DEFAULT 'system',
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tags_namespace ON tags(namespace);

-- ═══ ENTRY_TAGS (junction VAULT) ════════════════════════════
CREATE TABLE entry_tags (
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

-- ═══ TRACKS (MusicLab) ══════════════════════════════════════
CREATE TABLE tracks (
  id          TEXT PRIMARY KEY,
  era_id      TEXT REFERENCES eras(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  artist      TEXT DEFAULT '',
  tag_id      TEXT REFERENCES tags(id) ON DELETE SET NULL,  -- vibe principal
  r2_key      TEXT,                        -- R2 object key para getStreamUrl (ADR-010)
  format      TEXT DEFAULT 'mp3',
  note        TEXT DEFAULT '',
  duration    INTEGER,                     -- seconds
  thumbnail   TEXT,                        -- R2 key for thumbnail
  drive_file_id TEXT,                      -- legacy Google Drive file ID (fallback stream)
  color       TEXT,                        -- user-set custom color (≠ tag color)
  play_count  INTEGER DEFAULT 0,
  last_played TEXT,
  is_deleted  INTEGER NOT NULL DEFAULT 0,  -- soft delete
  added_by    TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tracks_era     ON tracks(era_id);
CREATE INDEX idx_tracks_tag     ON tracks(tag_id);
CREATE INDEX idx_tracks_r2      ON tracks(r2_key);
CREATE INDEX idx_tracks_created ON tracks(created_at);

-- ═══ TRACK_TAGS (junction MusicLab) ═════════════════════════
CREATE TABLE track_tags (
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, tag_id)
);

-- ═══ FILES (R2 references — ADR-022) ════════════════════════
CREATE TABLE files (
  id          TEXT PRIMARY KEY,
  entry_id    TEXT REFERENCES entries(id) ON DELETE CASCADE,
  track_id    TEXT REFERENCES tracks(id) ON DELETE SET NULL,
  r2_key      TEXT NOT NULL,
  r2_bucket   TEXT NOT NULL DEFAULT 'el-bunker-music',
  prefix      TEXT NOT NULL,                 -- music|vault/photos|vault/videos|vault/docs|vault/audio
  filename    TEXT NOT NULL,
  mime_type   TEXT,
  size_bytes  INTEGER,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_files_entry ON files(entry_id);
CREATE INDEX idx_files_prefix ON files(prefix);

-- ═══ PLAYLISTS ══════════════════════════════════════════════
CREATE TABLE playlists (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by  TEXT NOT NULL REFERENCES users(id),
  sort_order  INTEGER DEFAULT 0,    -- S84: orden de cards en LISTS tab (lower = higher)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_playlists_order ON playlists(sort_order, created_at);

-- ═══ PLAYLIST_TRACKS (junction ordenada) ════════════════════
CREATE TABLE playlist_tracks (
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  added_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (playlist_id, track_id)
);
CREATE INDEX idx_pl_tracks_pos ON playlist_tracks(playlist_id, position);

-- ═══ DROPS ══════════════════════════════════════════════════
CREATE TABLE drops (
  id           TEXT PRIMARY KEY,
  era_id       TEXT REFERENCES eras(id) ON DELETE SET NULL,
  track_id     TEXT REFERENCES tracks(id) ON DELETE SET NULL,
  from_user    TEXT NOT NULL REFERENCES users(id),
  to_user      TEXT NOT NULL REFERENCES users(id),
  drop_date    TEXT,                        -- fecha real del momento (≠ created_at)
  memory       TEXT DEFAULT '',
  mood         TEXT DEFAULT '',
  seen         INTEGER NOT NULL DEFAULT 0,
  favorited    INTEGER NOT NULL DEFAULT 0,
  favorited_by TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_drops_era   ON drops(era_id);
CREATE INDEX idx_drops_from  ON drops(from_user);
CREATE INDEX idx_drops_to    ON drops(to_user);
CREATE INDEX idx_drops_date  ON drops(drop_date);

-- ═══ QUEUE_ITEMS (ADR-002 — cola por usuario) ══════════════
CREATE TABLE queue_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT NOT NULL REFERENCES users(id),
  track_id     TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  is_manual    INTEGER NOT NULL DEFAULT 0,   -- Q14: 1=manual, 0=context
  context_name TEXT,                         -- playlist name if loaded from context
  added_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_queue_user ON queue_items(user_id, position);

-- ═══ EVENTS (ADR-019 — append-only, inmutable) ═════════════
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type  TEXT NOT NULL,                 -- track_play|track_pause|track_skip|drop_sent|entry_created|...
  user_id     TEXT NOT NULL REFERENCES users(id),
  entity_type TEXT,                          -- track|entry|drop|capsule
  entity_id   TEXT,
  payload     TEXT NOT NULL DEFAULT '{}',    -- JSON blob con datos específicos del evento
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_events_type    ON events(event_type);
CREATE INDEX idx_events_user    ON events(user_id);
CREATE INDEX idx_events_created ON events(created_at);

-- ═══ TIME CAPSULES (ADR-020) ════════════════════════════════
CREATE TABLE time_capsules (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  unlock_at   TEXT NOT NULL,                 -- ISO datetime when capsule opens
  created_by  TEXT NOT NULL REFERENCES users(id),
  is_unlocked INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_capsules_unlock ON time_capsules(unlock_at);

-- ═══ CAPSULE_ITEMS ══════════════════════════════════════════
CREATE TABLE capsule_items (
  id          TEXT PRIMARY KEY,
  capsule_id  TEXT NOT NULL REFERENCES time_capsules(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'note',   -- note|photo|track_ref|entry_ref
  content     TEXT NOT NULL DEFAULT '{}',     -- JSON blob
  sort_order  INTEGER DEFAULT 0,
  created_by  TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══ SEED DATA: usuarios ════════════════════════════════════
INSERT INTO users (id, email, name, role) VALUES
  ('admin', 'thebunker.admin@gmail.com', 'Admin', 'admin'),
  ('edu',   'bansovi.py@gmail.com',      'Edu',   'user'),
  ('david', 'dcgdozt@gmail.com',         'David', 'user');

-- ═══ SEED DATA: tags canónicos (ADR-016) ════════════════════
INSERT INTO tags (id, namespace, label, icon, color, created_by, sort_order) VALUES
  ('gaming',      'music', 'GAMING', '◉', '#00ffcc', 'system', 0),
  ('420_chill',   'music', '420',    '◎', '#aaff44', 'system', 1),
  ('dnb',         'music', 'DnB',    '⚡', '#ff6b35', 'system', 2),
  ('romantiqueo', 'music', '♥',      '♥', '#bf00ff', 'system', 3);

-- ═══ SEED DATA: app_config ══════════════════════════════════
INSERT INTO app_config (key, value) VALUES
  ('schema_version',       '1.0.0'),
  ('adventures_start_date', datetime('now'));
