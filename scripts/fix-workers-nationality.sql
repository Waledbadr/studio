-- One-off fix for existing local D1 DBs created before the schema typo was corrected.
-- The initial migration created `workers.nationaliy` (typo). The app expects `workers.nationality`.

ALTER TABLE `workers` ADD COLUMN `nationality` text;

UPDATE `workers`
SET `nationality` = `nationaliy`
WHERE `nationality` IS NULL
  AND `nationaliy` IS NOT NULL;
