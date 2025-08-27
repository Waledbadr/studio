// Global app-level ambient types to satisfy typecheck in simple/local mode.

declare type InventoryItem = import('@/context/inventory-context').InventoryItem;
declare type InventoryTransaction = import('@/context/inventory-context').InventoryTransaction;

declare type StockTransfer = import('@/context/inventory-context').StockTransfer;

declare type User = import('@/context/users-context').User;

declare type Facility = import('@/context/residences-context').Facility;

declare type SubFacility = {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | string;
  number?: string;
  notes?: string;
};

declare type Service = {
  id: string;
  name: string;
  category: 'Essential' | 'Amenity' | 'Utility' | string;
  status: 'Active' | 'Inactive' | 'Maintenance' | string;
  notes?: string;
  addedDate?: string;
  subFacilities: SubFacility[];
};

declare type ServiceLocation = {
  complexId: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  facilityId?: string;
};

declare type ReconciliationRequest = {
  id: string;
  name: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
  requestedBy: string;
  requestedById: string;
  approvedBy?: string;
  notes?: string;
  residenceId: string;
  reservedId?: string;
  adjustments?: any[];
};

// Fallback Cloudflare env types in case workers-types are unavailable during typecheck.
// These cover the subset of APIs we use in this project.
declare interface D1PreparedStatement {
  bind: (...values: any[]) => D1PreparedStatement;
  all: () => Promise<{ results?: any[]; success?: boolean; meta?: any }>;
  first: <T = any>(colName?: string) => Promise<T | null>;
  run: () => Promise<{ success?: boolean; meta?: any }>; 
}

declare interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

declare interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
}

declare interface R2ObjectBody {
  body: ReadableStream<any>;
  size?: number;
  httpMetadata?: any;
  customMetadata?: any;
}

declare interface R2Bucket {
  put(key: string, value: any, options?: any): Promise<any>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}
