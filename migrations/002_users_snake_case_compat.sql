-- Compatibility migration for current auth mapper fields used in accommodation.
-- Keeps legacy camelCase columns while adding snake_case columns expected by D1 writes.

ALTER TABLE users ADD COLUMN assigned_residences JSON;
ALTER TABLE users ADD COLUMN theme_settings JSON;
ALTER TABLE users ADD COLUMN created_at TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
