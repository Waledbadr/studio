
// Inventory context for Cloudflare D1
'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { getAllInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../lib/d1-db';

interface InventoryContextType {
  items: any[];
  loading: boolean;
  // Inventory CRUD
  addItem: (item: any) => Promise<void>;
  loadInventory: () => Promise<void>;
  updateItem: (id: string, updates: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  // Categories support (UI expects these)
  categories: string[];
  addCategory: (name: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  // Stock helpers (fallbacks for D1 shape)
  getStockForResidence: (item: any, residenceId: string) => number;
  // Transfer methods
  transfers: any[];
  createTransferRequest: (transferData: any) => Promise<void>;
  approveTransfer: (id: string, userId: string) => Promise<void>;
  rejectTransfer: (id: string, userId: string) => Promise<void>;
  // Transaction methods
  getAllInventoryTransactions: (filters?: any) => Promise<any[]>;
  // MRV/MIV methods
  getMRVById: (id: string) => Promise<any>;
  getMIVById: (id: string) => Promise<any>;
  getMRVs: () => Promise<any[]>;
  getMRVRequests: (status?: string) => Promise<any[]>;
  approveMRVRequest: (id: string, userId: string) => Promise<void>;
  rejectMRVRequest: (id: string, userId: string) => Promise<void>;
  getMRVRequestById: (id: string) => Promise<any>;
  updateMRVRequest: (id: string, updates: any) => Promise<void>;
  createMRV: (mrvData: any) => Promise<void>;
  // Reconciliation methods
  getReconciliations: () => Promise<any[]>;
  getReconciliationById: (id: string) => Promise<any>;
  getReconciliationItems: (reconciliationId: string) => Promise<any[]>;
  getReconciliationRequests: () => Promise<any[]>;
  createReconciliationRequest: (data: any) => Promise<void>;
  approveReconciliationRequest: (id: string, userId: string) => Promise<void>;
  rejectReconciliationRequest: (id: string, userId: string) => Promise<void>;
  reconcileStock: (reconciliationData: any) => Promise<void>;
  // Additional reconciliation methods
  getAllReconciliations: () => Promise<any[]>;
  // Deprecation methods
  depreciateItems: (depreciationRequest: any) => Promise<void>;
  // Alias for getAllInventoryTransactions
  getInventoryTransactions: (itemId?: string, residenceId?: string) => Promise<any[]>;
  // Transfer items
  getTransferItems: (transferId: string) => Promise<any[]>;
  // Issue transactions
  getAllIssueTransactions: (filters?: any) => Promise<any[]>;
  // Issue methods
  issueItemsFromStock: (residenceId: string, voucherLocations: any[]) => Promise<void>;
  getLastIssueDateForItemAtLocation: (itemId: string, locationId: string) => Promise<any>;
  getMIVs: () => Promise<any[]>;
  // Alias for items (used by some components)
  inventoryItems: any[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const itemsFromDb = await getAllInventoryItems();
      // Normalize minimal fields for UI compatibility
      const normalized = (itemsFromDb || []).map((it: any) => ({
        ...it,
        // Backfill UI-friendly fields
        stock: it.stock ?? it.quantity ?? 0,
        unit: it.unit ?? it.unit_of_measure ?? '',
        nameAr: it.nameAr ?? it.name_ar ?? undefined,
        nameEn: it.nameEn ?? it.name_en ?? undefined,
        lifespanDays: it.lifespanDays ?? it.lifespan_days ?? undefined,
        variants: Array.isArray(it.variants) ? it.variants : (it.variants ? it.variants : undefined),
        keywordsAr: Array.isArray(it.keywordsAr) ? it.keywordsAr : (it.keywords_ar ? it.keywords_ar : undefined),
        keywordsEn: Array.isArray(it.keywordsEn) ? it.keywordsEn : (it.keywords_en ? it.keywords_en : undefined),
        imageUrl: it.imageUrl ?? it.image_url ?? undefined,
      }));
      setItems(normalized);
      // Derive categories from items
      const cats = Array.from(
        new Set(
          normalized
            .map((it: any) => (it.category || '').toString().trim())
            .filter((c: string) => c.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b));
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load inventory from D1', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item: any) => {
    // Map UI item shape to D1 API shape
    const payload = {
      name: item.name ?? item.nameEn ?? item.nameAr ?? '',
      nameAr: item.nameAr ?? undefined,
      nameEn: item.nameEn ?? undefined,
      description: item.description ?? undefined,
      category: item.category ?? '',
      subcategory: item.subcategory ?? undefined,
      sku: item.sku ?? undefined,
      barcode: item.barcode ?? undefined,
      quantity: Number(item.quantity ?? item.stock ?? 0),
      unit_of_measure: item.unit ?? item.unit_of_measure ?? 'Piece',
      unit_price: item.unit_price ?? undefined,
      minimum_stock: Number(item.minimum_stock ?? 0),
      maximum_stock: item.maximum_stock != null ? Number(item.maximum_stock) : undefined,
      supplier_name: item.supplier_name ?? undefined,
      supplier_contact: item.supplier_contact ?? undefined,
      purchase_date: item.purchase_date ?? undefined,
      expiry_date: item.expiry_date ?? undefined,
      location: item.location ?? undefined,
      condition_status: (item.condition_status ?? 'new'),
      image_url: item.image_url ?? item.imageUrl ?? undefined,
      lifespan_days: item.lifespanDays ?? undefined,
      variants: item.variants ?? undefined,
      keywords_ar: item.keywordsAr ?? undefined,
      keywords_en: item.keywordsEn ?? undefined,
      notes: item.notes ?? undefined,
      is_active: item.is_active !== false,
    };
    await addInventoryItem(payload);
    await loadInventory();
  }, [loadInventory]);

  const updateItem = useCallback(async (id: string, updates: any) => {
    // Map partial UI updates to D1 fields
    const payload: any = { ...updates };
    if ('stock' in updates && !('quantity' in updates)) payload.quantity = updates.stock;
    if ('unit' in updates && !('unit_of_measure' in updates)) payload.unit_of_measure = updates.unit;
    await updateInventoryItem(id, payload);
    await loadInventory();
  }, [loadInventory]);

  const deleteItem = useCallback(async (id: string) => {
    await deleteInventoryItem(id);
    await loadInventory();
  }, [loadInventory]);

  // Categories: naive local management (no separate table in D1)
  const addCategory = useCallback(async (name: string) => {
    const n = (name || '').trim();
    if (!n) return;
    setCategories(prev => (prev.includes(n) ? prev : [...prev, n].sort((a, b) => a.localeCompare(b))));
  }, []);

  const updateCategory = useCallback(async (oldName: string, newName: string) => {
    const o = (oldName || '').trim();
    const n = (newName || '').trim();
    if (!o || !n || o === n) return;
    setLoading(true);
    try {
      // Update items that match the old category
      const affected = items.filter((it) => (it.category || '') === o);
      for (const it of affected) {
        try {
          await updateInventoryItem(it.id, { category: n });
        } catch (err) {
          console.warn('Failed to update item category', it.id, err);
        }
      }
      await loadInventory();
      setCategories(prev => {
        const next = prev.filter(c => c !== o);
        if (!next.includes(n)) next.push(n);
        return next.sort((a, b) => a.localeCompare(b));
      });
    } finally {
      setLoading(false);
    }
  }, [items, loadInventory]);

  // Stock helper: fallback to per-residence if available else 0
  const getStockForResidence = useCallback((item: any, residenceId: string) => {
    if (!item) return 0;
    if (item.stockByResidence && typeof item.stockByResidence === 'object') {
      const v = item.stockByResidence[residenceId];
      return typeof v === 'number' ? v : 0;
    }
    // No per-residence tracking in D1 baseline
    return 0;
  }, []);

  // Transfer methods
  const loadTransfers = useCallback(async () => {
    try {
      const response = await fetch('/api/transfers');
      if (response.ok) {
        const transfersData = await response.json();
        setTransfers(Array.isArray(transfersData) ? transfersData : []);
      }
    } catch (e) {
      console.error('Failed to load transfers', e);
    }
  }, []);

  const createTransferRequest = useCallback(async (transferData: any) => {
    const response = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData)
    });
    if (!response.ok) {
      throw new Error('Failed to create transfer request');
    }
    await loadTransfers();
  }, [loadTransfers]);

  const approveTransfer = useCallback(async (id: string, userId: string) => {
    const response = await fetch(`/api/transfers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', approvedBy: userId })
    });
    if (!response.ok) {
      throw new Error('Failed to approve transfer');
    }
    await loadTransfers();
  }, [loadTransfers]);

  const rejectTransfer = useCallback(async (id: string, userId: string) => {
    const response = await fetch(`/api/transfers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (!response.ok) {
      throw new Error('Failed to reject transfer');
    }
    await loadTransfers();
  }, [loadTransfers]);

  // Transaction methods
  const getAllInventoryTransactions = async (itemId?: string, residenceId?: string): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (itemId) {
      queryParams.set('itemId', itemId);
    }
    if (residenceId) {
      queryParams.set('residenceId', residenceId);
    }
    const response = await fetch(`/api/transactions?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  // MRV/MIV methods (mock implementations)
  const getMRVById = async (id: string) => {
    return {
      id,
      items: [],
      status: 'completed',
      createdAt: new Date().toISOString()
    };
  };

  const getMIVById = async (id: string) => {
    return {
      id,
      items: [],
      status: 'completed',
      createdAt: new Date().toISOString()
    };
  };

  const getMRVs = async () => {
    return [];
  };

  const getMRVRequests = async () => {
    return [];
  };

  const approveMRVRequest = async (id: string, userId: string) => {
    console.log('Approving MRV request', id, userId);
  };

  const rejectMRVRequest = async (id: string, userId: string) => {
    console.log('Rejecting MRV request', id, userId);
  };

  const getMRVRequestById = async (id: string) => {
    return {
      id,
      status: 'pending',
      items: [],
      createdAt: new Date().toISOString()
    };
  };

  const updateMRVRequest = async (id: string, updates: any) => {
    console.log('Updating MRV request', id, updates);
  };

  const createMRV = async (mrvData: any) => {
    console.log('Creating MRV', mrvData);
  };

  // Reconciliation methods (mock implementations)
  const getAllReconciliations = async () => {
    return [];
  };

  const getReconciliationById = async (id: string) => {
    return {
      id,
      items: [],
      status: 'completed',
      createdAt: new Date().toISOString()
    };
  };

  const getReconciliationItems = async (reconciliationId: string) => {
    return [];
  };

  // Transfer items
  const getTransferItems = async (transferId: string) => {
    return [];
  };

  // Issue transactions
  const getAllIssueTransactions = async (filters?: any) => {
    return [];
  };

  // Reconciliation methods (mock implementations)
  const getReconciliations = async () => {
    return [];
  };

  const getReconciliationRequests = async () => {
    return [];
  };

  const createReconciliationRequest = async (data: any) => {
    console.log('Creating reconciliation request', data);
  };

  const approveReconciliationRequest = async (id: string, userId: string) => {
    console.log('Approving reconciliation request', id, userId);
  };

  const rejectReconciliationRequest = async (id: string, userId: string) => {
    console.log('Rejecting reconciliation request', id, userId);
  };

  const reconcileStock = async (reconciliationData: any) => {
    console.log('Reconciling stock', reconciliationData);
  };

  // Deprecation methods
  const depreciateItems = async (depreciationRequest: any) => {
    console.log('Depreciating items', depreciationRequest);
  };

  // Alias for getAllInventoryTransactions
  const getInventoryTransactions = getAllInventoryTransactions;

  // Issue methods
  const issueItemsFromStock = async (residenceId: string, voucherLocations: any[]) => {
    console.log('Issuing items from stock', residenceId, voucherLocations);
  };

  const getLastIssueDateForItemAtLocation = async (itemId: string, locationId: string) => {
    return null;
  };

  const getMIVs = async () => {
    return [];
  };

  return (
  <InventoryContext.Provider value={{
    items,
    loading,
    addItem,
    loadInventory,
    updateItem,
    deleteItem,
    categories,
    addCategory,
    updateCategory,
    getStockForResidence,
    transfers,
    createTransferRequest,
    approveTransfer,
    rejectTransfer,
    getAllInventoryTransactions,
    getMRVById,
    getMIVById,
    getMRVs,
    getMRVRequests,
    approveMRVRequest,
    rejectMRVRequest,
    getMRVRequestById,
    updateMRVRequest,
    createMRV,
    getReconciliations,
    getReconciliationById,
    getReconciliationItems,
    getReconciliationRequests,
    createReconciliationRequest,
    approveReconciliationRequest,
    rejectReconciliationRequest,
    reconcileStock,
    getAllReconciliations,
    depreciateItems,
    getInventoryTransactions,
    getTransferItems,
    getAllIssueTransactions,
    issueItemsFromStock,
    getLastIssueDateForItemAtLocation,
    getMIVs,
    inventoryItems: items
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
