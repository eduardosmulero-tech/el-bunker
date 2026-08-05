-- Integration release metadata for A1/B2.
-- The structural A1 migration is 0002; this keeps app_config aligned on upgraded databases.
UPDATE app_config SET value = '1.1.0' WHERE key = 'schema_version';
