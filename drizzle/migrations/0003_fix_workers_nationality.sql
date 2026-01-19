-- Fix typo in workers table: `nationaliy` -> `nationality`
-- Keep the old column for backwards compatibility; add the correct column and backfill.

ALTER TABLE `workers` ADD COLUMN `nationality` text;
--> statement-breakpoint
UPDATE `workers`
SET `nationality` = `nationaliy`
WHERE `nationality` IS NULL
  AND `nationaliy` IS NOT NULL;
