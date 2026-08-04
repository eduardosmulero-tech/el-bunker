-- G2 policy rollback — destructive for G2 tables only.
-- Never run against production without an approved snapshot and explicit gate.
-- Drops only structures introduced by migrations/0001_g2_policy.sql.

DROP TABLE IF EXISTS repair_attempts;
DROP TABLE IF EXISTS repair_queue;
DROP TABLE IF EXISTS admin_audit_log;
DROP TABLE IF EXISTS file_references;
