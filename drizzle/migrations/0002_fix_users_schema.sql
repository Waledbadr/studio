-- Fix users table schema to match src/db/schema.ts
-- Adds missing columns used by auth/login queries.

ALTER TABLE `users` ADD COLUMN `password_hash` text;
ALTER TABLE `users` ADD COLUMN `last_seen` text;
ALTER TABLE `users` ADD COLUMN `disabled` integer DEFAULT 0;
