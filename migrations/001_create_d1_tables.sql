-- Cloudflare D1 schema for Firestore collections migration
-- This file defines equivalent tables for the main Firestore collections used by the EstateCare app.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT,
  passwordHash TEXT,
  assignedResidences JSON,
  themeSettings JSON,
  createdAt TEXT,
  updatedAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS residences (
  id TEXT PRIMARY KEY,
  name TEXT,
  rooms JSON,
  metadata JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  name TEXT,
  nationality TEXT,
  companyId TEXT,
  metadata JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS occupants (
  id TEXT PRIMARY KEY,
  workerId TEXT,
  residenceId TEXT,
  roomId TEXT,
  since TEXT,
  until TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS accommodationHistory (
  id TEXT PRIMARY KEY,
  workerId TEXT,
  residenceId TEXT,
  actionType TEXT,
  actionDate TEXT,
  details JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS transferRequests (
  id TEXT PRIMARY KEY,
  workerId TEXT,
  fromResidenceId TEXT,
  toResidenceId TEXT,
  status TEXT,
  requestedById TEXT,
  requestedAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT,
  address JSON,
  contact JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  companyId TEXT,
  workerId TEXT,
  startDate TEXT,
  endDate TEXT,
  amount REAL,
  status TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  contractId TEXT,
  workerId TEXT,
  amount REAL,
  status TEXT,
  dueDate TEXT,
  issuedAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  nameAr TEXT,
  nameEn TEXT,
  category TEXT,
  unit TEXT,
  stock REAL,
  stockByResidence JSON,
  metadata JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS inventoryTransactions (
  id TEXT PRIMARY KEY,
  itemId TEXT,
  type TEXT,
  quantity REAL,
  referenceDocId TEXT,
  residenceId TEXT,
  createdAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  requestedById TEXT,
  status TEXT,
  createdAt TEXT,
  items JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS mrvs (
  id TEXT PRIMARY KEY,
  requestedById TEXT,
  status TEXT,
  createdAt TEXT,
  items JSON,
  attachmentUrl TEXT,
  attachmentPath TEXT,
  attachmentRef TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS mivs (
  id TEXT PRIMARY KEY,
  issuedById TEXT,
  status TEXT,
  createdAt TEXT,
  items JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  sequence INTEGER,
  lastUpdatedAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS maintenanceRequests (
  id TEXT PRIMARY KEY,
  requestedById TEXT,
  status TEXT,
  createdAt TEXT,
  details JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS serviceOrders (
  id TEXT PRIMARY KEY,
  requestedById TEXT,
  status TEXT,
  createdAt TEXT,
  items JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT,
  userEmail TEXT,
  title TEXT,
  body TEXT,
  read INTEGER,
  createdAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS fcmTokens (
  id TEXT PRIMARY KEY,
  userId TEXT,
  token TEXT,
  deviceInfo JSON,
  createdAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  userId TEXT,
  subject TEXT,
  message TEXT,
  status TEXT,
  createdAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  key TEXT,
  value JSON,
  updatedAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS stockTransfers (
  id TEXT PRIMARY KEY,
  itemId TEXT,
  fromResidenceId TEXT,
  toResidenceId TEXT,
  quantity REAL,
  status TEXT,
  createdAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS inventoryAudits (
  id TEXT PRIMARY KEY,
  conductedById TEXT,
  residenceId TEXT,
  status TEXT,
  createdAt TEXT,
  summary JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS auditItems (
  id TEXT PRIMARY KEY,
  auditId TEXT,
  itemId TEXT,
  countedQuantity REAL,
  recordedQuantity REAL,
  notes TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS auditAdjustments (
  id TEXT PRIMARY KEY,
  auditId TEXT,
  itemId TEXT,
  adjustmentQuantity REAL,
  reason TEXT,
  createdAt TEXT,
  data JSON
);

CREATE TABLE IF NOT EXISTS stockReconciliations (
  id TEXT PRIMARY KEY,
  performedById TEXT,
  status TEXT,
  createdAt TEXT,
  summary JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS reconciliationRequests (
  id TEXT PRIMARY KEY,
  requestedById TEXT,
  status TEXT,
  requestedAt TEXT,
  summary JSON,
  data JSON
);

CREATE TABLE IF NOT EXISTS mrvRequests (
  id TEXT PRIMARY KEY,
  requestedById TEXT,
  status TEXT,
  requestedAt TEXT,
  data JSON
);
