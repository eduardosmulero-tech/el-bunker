-- G2 policy structures — additive only.
-- No backfill, no existing-table changes, no purge, no production execution.
-- Apply only after reviewing this SQL, taking a remote snapshot and preparing rollback.

CREATE TABLE IF NOT EXISTS file_references (
  id          TEXT PRIMARY KEY,
  file_id     TEXT NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('entry', 'track', 'playlist', 'drop', 'capsule', 'other')),
  owner_id    TEXT NOT NULL,
  source      TEXT NOT NULL CHECK (source IN ('files_fk', 'entry_content_json', 'track_field', 'playlist_ref', 'capsule_ref', 'manual')),
  source_path TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (file_id, owner_type, owner_id, source, source_path)
);
CREATE INDEX IF NOT EXISTS idx_file_references_file ON file_references(file_id);
CREATE INDEX IF NOT EXISTS idx_file_references_owner ON file_references(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id      TEXT NOT NULL,
  actor_user_id     TEXT NOT NULL REFERENCES users(id),
  action            TEXT NOT NULL CHECK (action IN ('archive', 'restore', 'purge_plan', 'purge_start', 'purge_result', 'repair_retry', 'repair_block', 'retention_sweep')),
  entity_type       TEXT,
  entity_id         TEXT,
  reason            TEXT NOT NULL,
  result            TEXT NOT NULL CHECK (result IN ('planned', 'started', 'completed', 'failed', 'blocked')),
  details_json      TEXT NOT NULL DEFAULT '{}',
  r2_manifest_hash  TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_operation ON admin_audit_log(operation_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at);

CREATE TABLE IF NOT EXISTS repair_queue (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id      TEXT NOT NULL UNIQUE,
  parent_operation_id TEXT,
  kind              TEXT NOT NULL CHECK (kind IN ('purge', 'r2_delete_retry', 'd1_finalize', 'reconcile_r2_deleted_d1_pending')),
  entity_type       TEXT,
  entity_id         TEXT,
  r2_key            TEXT,
  file_id           TEXT,
  state             TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'retrying', 'needs_admin', 'completed', 'blocked')),
  purge_phase       TEXT CHECK (purge_phase IN ('planned', 'd1_prepared', 'r2_pending', 'r2_deleted', 'd1_finalized', 'blocked_snapshot_failed', 'blocked_shared_reference', 'retrying_r2_delete', 'needs_admin_r2_delete', 'blocked_r2_deleted_d1_pending')),
  attempt_count     INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  first_failed_at   TEXT,
  next_attempt_at   TEXT,
  last_attempt_at   TEXT,
  lease_owner       TEXT,
  lease_until       TEXT,
  last_error_code   TEXT,
  last_error_message TEXT,
  payload_json      TEXT NOT NULL DEFAULT '{}',
  resolution        TEXT,
  resolved_by       TEXT REFERENCES users(id),
  resolved_at       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_repair_state_next ON repair_queue(state, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_repair_lease ON repair_queue(lease_until);
CREATE INDEX IF NOT EXISTS idx_repair_entity ON repair_queue(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS repair_attempts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_id          INTEGER NOT NULL REFERENCES repair_queue(id),
  attempt_number    INTEGER NOT NULL CHECK (attempt_number > 0),
  actor_user_id     TEXT REFERENCES users(id),
  outcome           TEXT NOT NULL CHECK (outcome IN ('started', 'retryable_failure', 'completed', 'needs_admin', 'blocked')),
  error_code        TEXT,
  error_message     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (queue_id, attempt_number)
);
CREATE INDEX IF NOT EXISTS idx_repair_attempts_queue ON repair_attempts(queue_id, attempt_number);
