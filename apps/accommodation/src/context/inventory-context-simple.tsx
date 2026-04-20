// Temporary simple inventory context to eliminate Firebase errors
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Simple mock data
const mockItems = [
  {
    id: 'item-1',
    name: 'Office Chair',
    nameAr: 'كرسي مكتب',
    category: 'Furniture',
    unit: 'piece',
    totalStock: 20,
    stockByResidence: { 'res-1': 15, 'res-2': 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    description: 'Comfortable office chair',
    descriptionAr: 'كرسي مكتب مريح',
    barcode: '',
    location: 'Office',
    locationAr: 'المكتب',
    minStock: 5,
    maxStock: 50,
    supplier: 'Office Supplies Co.',
    supplierAr: 'شركة اللوازم المكتبية',
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
}

const InventoryContext = createContext<SimpleInventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState(mockItems);
  const [categories, setCategories] = useState(mockCategories);
  const [transfers, setTransfers] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <InventoryContext.Provider value={{
      items,
      categories,
      transfers,
      audits,
      loading,
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
      completeAudit
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
