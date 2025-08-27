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
  loadInventory: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  getStockForResidence: (item: any, residenceId: string) => number;
  // Transfers
  createTransferRequest?: (payload: any, currentUser?: any) => Promise<void>;
  approveTransfer?: (transferId: string, approverId: string) => Promise<void>;
  rejectTransfer?: (transferId: string, rejecterId: string) => Promise<void>;
  transferStock: (payload: any) => Promise<void>;
  createAudit: (auditData: any) => Promise<string>;
  getAudits: () => Promise<any[]>;
  getAuditById: (auditId: string) => Promise<any>;
  updateAuditStatus: (auditId: string, status: any) => Promise<void>;
  getAuditItems: (auditId: string) => Promise<any[]>;
  updateAuditItem: (auditItem: any) => Promise<void>;
  submitAuditCount: (auditId: string, itemId: string, physicalStock: number, notes: string, countedBy: string) => Promise<void>;
  completeAudit: (auditId: string, adjustments: any[], generalNotes: string) => Promise<void>;
  // MRV (Material Receive Voucher) stubs
  getMRVRequests: (status?: string) => Promise<any[]>;
  approveMRVRequest: (requestId: string, approverUserId: string) => Promise<string>;
  rejectMRVRequest: (requestId: string, approverUserId: string) => Promise<void>;
  getMRVs: () => Promise<any[]>;
  // Missing methods for reports and audit
  getAllInventoryTransactions?: () => Promise<any[]>;
  getInventoryTransactions?: (itemId: string, residenceId?: string) => Promise<any[]>;
  getMRVById?: (mrvId: string) => Promise<any>;
  getMIVById?: (mivId: string) => Promise<any>;
  getReconciliationItems?: (auditId: string) => Promise<any[]>;
  getTransferItems?: (transferId: string) => Promise<any[]>;
  reconcileStock?: (payload: any) => Promise<void>;
  getReconciliations?: () => Promise<any[]>;
  getAllReconciliations?: () => Promise<any[]>;
  createReconciliationRequest?: (payload: any) => Promise<void>;
  getReconciliationRequests?: () => Promise<any[]>;
  approveReconciliationRequest?: (requestId: string, approverId: string) => Promise<void>;
  rejectReconciliationRequest?: (requestId: string, rejecterId: string) => Promise<void>;
  getMRVRequestById: (id: string) => Promise<any | null>;
  updateMRVRequest: (id: string, updates: any) => Promise<void>;
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

  const loadInventory = async () => {
    // In mock, just ensure state is set; in real impl, fetch from API
    setLoading(true);
    try {
      // Only update state if it's actually different to prevent unnecessary re-renders
      setItems(prev => {
        if (prev.length !== mockItems.length) return [...mockItems];
        // Check if content is different
        const isDifferent = prev.some((item, i) => item.id !== mockItems[i]?.id);
        return isDifferent ? [...mockItems] : prev;
      });
      setCategories(prev => {
        if (prev.length !== mockCategories.length) return [...mockCategories];
        // Check if content is different
        const isDifferent = prev.some((cat, i) => cat !== mockCategories[i]);
        return isDifferent ? [...mockCategories] : prev;
      });
    } finally {
      setLoading(false);
    }
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

  // no-op transfer workflow for simple mode
  const createTransferRequest = async () => { console.log('Mock: createTransferRequest'); };
  const approveTransfer = async () => { console.log('Mock: approveTransfer'); };
  const rejectTransfer = async () => { console.log('Mock: rejectTransfer'); };

  const addCategory = async (name: string) => {
    if (!name) return;
    setCategories((prev) => {
      if (prev.includes(name)) return prev; // No change needed
      return [...prev, name];
    });
  };

  const updateCategory = async (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName) return;
    setCategories((prev) => {
      const updated = prev.map((c) => (c === oldName ? newName : c));
      // Only return new array if something actually changed
      return updated.some((c, i) => c !== prev[i]) ? updated : prev;
    });
    setItems((prev) => {
      const updated = prev.map((it) => (it.category === oldName ? { ...it, category: newName } : it));
      // Only return new array if something actually changed
      return updated.some((item, i) => item.category !== prev[i]?.category) ? updated : prev;
    });
  };

  const getStockForResidence = (item: any, residenceId: string) => {
    if (!item) return 0;
    if (residenceId === 'all') return item.totalStock ?? 0;
    const map = item.stockByResidence || {};
    return map[residenceId] ?? 0;
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

  // --- MRV stubs ---
  const getMRVRequests = async (status?: string) => {
    console.log('Mock: getMRVRequests', status);
    // Return a small deterministic sample depending on status for UI smoke tests
    const base = [
      {
        id: 'mrvreq-1',
        mrvShort: 'R-001',
        residenceId: 'res-1',
        requestedAt: { toDate: () => new Date(Date.now() - 86400000) },
        status: 'Pending',
        items: [{ id: 'item-1', nameAr: 'كرسي مكتب', nameEn: 'Office Chair', quantity: 2 }],
      },
      {
        id: 'mrvreq-2',
        mrvShort: 'R-002',
        residenceId: 'res-1',
        requestedAt: { toDate: () => new Date(Date.now() - 43200000) },
        status: 'Approved',
        items: [{ id: 'item-1', nameAr: 'كرسي مكتب', nameEn: 'Office Chair', quantity: 1 }],
      },
    ];
    return status ? base.filter((r) => r.status === status) : base;
  };

  const approveMRVRequest = async (requestId: string, approverUserId: string) => {
    console.log('Mock: approveMRVRequest', { requestId, approverUserId });
    // Return a mock MRV id
    return `mrv-${requestId}`;
  };

  const rejectMRVRequest = async (requestId: string, approverUserId: string) => {
    console.log('Mock: rejectMRVRequest', { requestId, approverUserId });
  };

  const getMRVs = async () => {
    console.log('Mock: getMRVs');
    return [
      {
        id: 'mrv-mrvreq-2',
        orderId: 'MR-123',
        date: { toDate: () => new Date(Date.now() - 21600000) },
        residenceId: 'res-1',
        itemCount: 3,
      },
    ];
  };

  const getMRVRequestById = async (id: string) => {
    console.log('Mock: getMRVRequestById', id);
    if (!id) return null;
    return {
      id,
      mrvShort: id.slice(-4).toUpperCase(),
      residenceId: 'res-1',
      supplierName: 'Default Supplier',
      invoiceNo: 'INV-0001',
      notes: '',
      requestedAt: { toDate: () => new Date() },
      status: 'Pending',
      items: [
        { id: 'item-1', nameAr: 'كرسي مكتب', nameEn: 'Office Chair', quantity: 1 },
      ],
    };
  };

  const updateMRVRequest = async (id: string, updates: any) => {
    console.log('Mock: updateMRVRequest', { id, updates });
  };

  // Missing methods implementations
  const getAllInventoryTransactions = async () => [];
  const getInventoryTransactions = async (itemId: string, residenceId?: string) => [];
  const getMRVById = async (mrvId: string) => null;
  const getMIVById = async (mivId: string) => null;
  const getReconciliationItems = async (auditId: string) => [];
  const getTransferItems = async (transferId: string) => [];
  const reconcileStock = async (payload: any) => { console.log('Mock: reconcileStock', payload); };
  const getReconciliations = async () => [];
  const getAllReconciliations = async () => [];
  const createReconciliationRequest = async (payload: any) => { console.log('Mock: createReconciliationRequest', payload); };
  const getReconciliationRequests = async () => [];
  const approveReconciliationRequest = async (requestId: string, approverId: string) => { console.log('Mock: approveReconciliationRequest', requestId, approverId); };
  const rejectReconciliationRequest = async (requestId: string, rejecterId: string) => { console.log('Mock: rejectReconciliationRequest', requestId, rejecterId); };

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
      loadInventory,
      addCategory,
      updateCategory,
      getStockForResidence,
      createTransferRequest,
      approveTransfer,
      rejectTransfer,
      transferStock,
      createAudit,
      getAudits,
      getAuditById,
      updateAuditStatus,
      getAuditItems,
      updateAuditItem,
      submitAuditCount,
      completeAudit
  ,
  // MRV
  getMRVRequests,
  approveMRVRequest,
  rejectMRVRequest,
  getMRVs,
  getMRVRequestById,
  updateMRVRequest,
  // Missing methods
  getAllInventoryTransactions,
  getInventoryTransactions,
  getMRVById,
  getMIVById,
  getReconciliationItems,
  getTransferItems,
  reconcileStock,
  getReconciliations,
  getAllReconciliations,
  createReconciliationRequest,
  getReconciliationRequests,
  approveReconciliationRequest,
  rejectReconciliationRequest
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
