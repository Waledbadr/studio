-- Non-destructive cleanup: create a minimal view and (optional) hierarchical tables

-- 1) Minimal view exposing only what the UI needs now
CREATE VIEW IF NOT EXISTS view_residences_min AS
SELECT 
  id,
  COALESCE(building_name, address) AS name,
  'Unknown' AS city,
  status,
  created_at,
  updated_at
FROM residences;

-- 2) Optional: hierarchical tables matching UI model (no drops)
CREATE TABLE IF NOT EXISTS residence_complexes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Unknown',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS residence_buildings (
  id TEXT PRIMARY KEY,
  complex_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complex_id) REFERENCES residence_complexes(id)
);

CREATE TABLE IF NOT EXISTS residence_floors (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  name TEXT NOT NULL,
  level INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (building_id) REFERENCES residence_buildings(id)
);

CREATE TABLE IF NOT EXISTS residence_rooms (
  id TEXT PRIMARY KEY,
  floor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  area REAL,
  capacity INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (floor_id) REFERENCES residence_floors(id)
);

-- Optional triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_residence_complexes_timestamp 
AFTER UPDATE ON residence_complexes
BEGIN
  UPDATE residence_complexes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_residence_buildings_timestamp 
AFTER UPDATE ON residence_buildings
BEGIN
  UPDATE residence_buildings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_residence_floors_timestamp 
AFTER UPDATE ON residence_floors
BEGIN
  UPDATE residence_floors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_residence_rooms_timestamp 
AFTER UPDATE ON residence_rooms
BEGIN
  UPDATE residence_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
