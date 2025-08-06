// Temporary simple inventory context to eliminate Firebase errors
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Export types that are used throughout the app
export interface InventoryItem {
  id: string;
  name: string;
  nameEn: string;
  nameAr: string;
  category: string;
  unit: string;
  totalStock: number;
  stockByResidence: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: Date;
  purchasePrice: number;
  supplier: string;
  warrantyEndDate?: Date;
  location: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  storageConditions: string;
  handlingInstructions: string;
  safetyInformation: string;
  notes: string;
  lifespanDays?: number;
}

export interface LocationWithItems {
  locationId: string;
  locationName: string;
  isFacility: boolean;
  items: (InventoryItem & { issueQuantity: number })[];
}

export interface MIV {
  id: string;
  number: string;
  date: Date;
  residenceId: string;
  issuedBy: string;
  items: any[];
  status: 'pending' | 'approved' | 'issued';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransfer {
  id: string;
  fromResidenceId: string;
  toResidenceId: string;
  items: any[];
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface InventoryTransaction {
  id: string;
  type: 'receive' | 'issue' | 'transfer' | 'adjustment';
  itemId: string;
  residenceId: string;
  quantity: number;
  date: Date;
  userId: string;
  notes?: string;
  relatedDocumentId?: string;
}

// Simple mock data - Updated to match InventoryItem interface
const mockItems: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Office Chair',
    nameEn: 'Office Chair',
    nameAr: 'كرسي مكتب',
    category: 'Furniture',
    unit: 'piece',
    totalStock: 20,
    stockByResidence: { 'res-1': 15, 'res-2': 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
    description: 'Comfortable office chair',
    brand: 'OfficeMax',
    model: 'OM-2024',
    serialNumber: 'OM2024001',
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 299.99,
    supplier: 'Office Supplies Co.',
    warrantyEndDate: new Date('2026-01-15'),
    location: 'Office',
    status: 'active' as const,
    minimumStock: 5,
    maximumStock: 50,
    reorderPoint: 10,
    storageConditions: 'Dry environment',
    handlingInstructions: 'Handle with care',
    safetyInformation: 'Check weight limit before use',
    notes: ''
  }
];

const mockCategories = ['Furniture', 'Electronics', 'Office Supplies'];

interface SimpleInventoryContextType {
  items: any[];
  categories: string[];
  transfers: any[];
  audits: any[];
  loading: boolean;
  // Add minimal functions to prevent errors
  loadInventory: () => void;
  getStockForResidence: (itemId: string, residenceId: string) => number;
  getMIVs: () => Promise<any[]>;
  getLastIssueDateForItemAtLocation: (itemId: string, locationId: string) => Promise<Date | null>;
  issueItemsFromStock: (payload: any) => Promise<void>;
  addItem: (item: any) => Promise<void>;
  updateItem: (itemId: string, updates: any) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  transferStock: (payload: any) => Promise<void>;
  createAudit: (auditData: any) => Promise<string>;
  getAudits: () => Promise<any[]>;
  getAuditById: (auditId: string) => Promise<any>;
  updateAuditStatus: (auditId: string, status: any) => Promise<void>;
  getAuditItems: (auditId: string) => Promise<any[]>;
  updateAuditItem: (auditItem: any) => Promise<void>;
  submitAuditCount: (auditId: string, itemId: string, physicalStock: number, notes: string, countedBy: string) => Promise<void>;
  completeAudit: (auditId: string, adjustments: any[], generalNotes: string) => Promise<void>;
  // Additional functions needed by various pages
  getInventoryTransactions?: (itemId: string, residenceId: string) => Promise<InventoryTransaction[]>;
  getAllIssueTransactions?: () => Promise<InventoryTransaction[]>;
  getAllInventoryTransactions?: () => Promise<InventoryTransaction[]>;
  addCategory?: (category: string) => Promise<void>;
  updateCategory?: (oldName: string, newName: string) => Promise<void>;
  inventoryItems?: InventoryItem[];
  createTransferRequest?: (transfer: Omit<StockTransfer, 'id' | 'requestedAt'>) => Promise<void>;
  approveTransfer?: (transferId: string, userId: string) => Promise<void>;
  rejectTransfer?: (transferId: string, userId: string, reason?: string) => Promise<void>;
}

const InventoryContext = createContext<SimpleInventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState(mockItems);
  const [categories, setCategories] = useState(mockCategories);
  const [transfers, setTransfers] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadInventory = () => {
    console.log('Mock: Loading inventory');
  };

  const getStockForResidence = (itemId: string, residenceId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.stockByResidence?.[residenceId as keyof typeof item.stockByResidence] || 0;
  };

  const getMIVs = async () => {
    console.log('Mock: Getting MIVs');
    return [];
  };

  const getLastIssueDateForItemAtLocation = async (itemId: string, locationId: string) => {
    console.log('Mock: Getting last issue date', { itemId, locationId });
    return null;
  };

  const issueItemsFromStock = async (payload: any) => {
    console.log('Mock: Issuing items from stock', payload);
  };

  const addItem = async (item: any) => {
    console.log('Mock: Adding item', item);
  };

  const updateItem = async (itemId: string, updates: any) => {
    console.log('Mock: Updating item', itemId, updates);
  };

  const deleteItem = async (itemId: string) => {
    console.log('Mock: Deleting item', itemId);
  };

  const transferStock = async (payload: any) => {
    console.log('Mock: Transferring stock', payload);
  };

  const createAudit = async (auditData: any) => {
    console.log('Mock: Creating audit', auditData);
    return 'mock-audit-id';
  };

  const getAudits = async () => {
    console.log('Mock: Getting audits');
    return [];
  };

  const getAuditById = async (auditId: string) => {
    console.log('Mock: Getting audit by id', auditId);
    return null;
  };

  const updateAuditStatus = async (auditId: string, status: any) => {
    console.log('Mock: Updating audit status', auditId, status);
  };

  const getAuditItems = async (auditId: string) => {
    console.log('Mock: Getting audit items', auditId);
    return [];
  };

  const updateAuditItem = async (auditItem: any) => {
    console.log('Mock: Updating audit item', auditItem);
  };

  const submitAuditCount = async (auditId: string, itemId: string, physicalStock: number, notes: string, countedBy: string) => {
    console.log('Mock: Submitting audit count', { auditId, itemId, physicalStock, notes, countedBy });
  };

  const completeAudit = async (auditId: string, adjustments: any[], generalNotes: string) => {
    console.log('Mock: Completing audit', { auditId, adjustments, generalNotes });
  };

  const getInventoryTransactions = async (itemId: string, residenceId: string): Promise<InventoryTransaction[]> => {
    console.log('Mock: Getting inventory transactions', { itemId, residenceId });
    return [];
  };

  const getAllIssueTransactions = async (): Promise<InventoryTransaction[]> => {
    console.log('Mock: Getting all issue transactions');
    return [];
  };

  const getAllInventoryTransactions = async (): Promise<InventoryTransaction[]> => {
    console.log('Mock: Getting all inventory transactions');
    return [];
  };

  const addCategory = async (category: string) => {
    console.log('Mock: Adding category', category);
  };

  const updateCategory = async (oldName: string, newName: string) => {
    console.log('Mock: Updating category', { oldName, newName });
  };

  const createTransferRequest = async (transfer: Omit<StockTransfer, 'id' | 'requestedAt'>) => {
    console.log('Mock: Creating transfer request', transfer);
  };

  const approveTransfer = async (transferId: string, userId: string) => {
    console.log('Mock: Approving transfer', { transferId, userId });
  };

  const rejectTransfer = async (transferId: string, userId: string, reason?: string) => {
    console.log('Mock: Rejecting transfer', { transferId, userId, reason });
  };

  return (
    <InventoryContext.Provider value={{
      items,
      categories,
      transfers,
      audits,
      loading,
      loadInventory,
      getStockForResidence,
      getMIVs,
      getLastIssueDateForItemAtLocation,
      issueItemsFromStock,
      addItem,
      updateItem,
      deleteItem,
      transferStock,
      createAudit,
      getAudits,
      getAuditById,
      updateAuditStatus,
      getAuditItems,
      updateAuditItem,
      submitAuditCount,
      completeAudit,
      getInventoryTransactions,
      getAllIssueTransactions,
      getAllInventoryTransactions,
      addCategory,
      updateCategory,
      inventoryItems: items,
      createTransferRequest,
      approveTransfer,
      rejectTransfer
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

console.log('🔧 Simple inventory context loaded - no Firebase errors');
