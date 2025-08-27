
// Inventory context for Cloudflare D1
'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const itemsFromDb = await getAllInventoryItems();
      // Normalize minimal fields for UI compatibility
      const normalized = (itemsFromDb || []).map((it: any) => ({
        ...it,
        // derive UI-friendly fields if missing
        stock: it.stock ?? it.quantity ?? 0,
        unit: it.unit ?? it.unit_of_measure ?? '',
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
  };

  const addItem = async (item: any) => {
    // Map UI item shape to D1 API shape
    const payload = {
      name: item.name ?? item.nameEn ?? item.nameAr ?? '',
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
      notes: item.notes ?? undefined,
      is_active: item.is_active !== false,
    };
    await addInventoryItem(payload);
    await loadInventory();
  };

  const updateItem = async (id: string, updates: any) => {
    // Map partial UI updates to D1 fields
    const payload: any = { ...updates };
    if ('stock' in updates && !('quantity' in updates)) payload.quantity = updates.stock;
    if ('unit' in updates && !('unit_of_measure' in updates)) payload.unit_of_measure = updates.unit;
    await updateInventoryItem(id, payload);
    await loadInventory();
  };

  const deleteItem = async (id: string) => {
    await deleteInventoryItem(id);
    await loadInventory();
  };

  // Categories: naive local management (no separate table in D1)
  const addCategory = async (name: string) => {
    const n = (name || '').trim();
    if (!n) return;
    setCategories(prev => (prev.includes(n) ? prev : [...prev, n].sort((a, b) => a.localeCompare(b))));
  };

  const updateCategory = async (oldName: string, newName: string) => {
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
  };

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

  return (
  <InventoryContext.Provider value={{ items, loading, addItem, loadInventory, updateItem, deleteItem, categories, addCategory, updateCategory, getStockForResidence }}>
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
