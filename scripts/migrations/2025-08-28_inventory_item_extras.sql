-- Migration: Add extra item definition columns to inventory table
-- Note: Run once locally with `npm run d1:migrate:cleanup:local` equivalent for this file (see README/commands)

ALTER TABLE inventory ADD COLUMN name_ar TEXT;
ALTER TABLE inventory ADD COLUMN name_en TEXT;
ALTER TABLE inventory ADD COLUMN lifespan_days INTEGER;
ALTER TABLE inventory ADD COLUMN variants TEXT; -- JSON array as string
ALTER TABLE inventory ADD COLUMN keywords_ar TEXT; -- JSON array as string
ALTER TABLE inventory ADD COLUMN keywords_en TEXT; -- JSON array as string
