-- B6 — revocación de sesiones por epoch de usuario (ADR-031).
-- Migración aditiva: una columna con default 0. No toca consultas existentes.
-- El claim `epoch` del JWT se compara contra este contador en authenticate().
-- Rollback local revisable: ALTER TABLE users DROP COLUMN token_epoch;
ALTER TABLE users ADD COLUMN token_epoch INTEGER NOT NULL DEFAULT 0;
