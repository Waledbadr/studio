/**
 * Hook مخصص لإدارة المخزون
 * يستبدل Firebase hooks بـ fetch API عادي
 */

import { useState, useEffect, useCallback } from 'react';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unit_of_measure: string;
  unit_price?: number;
  total_value?: number;
  minimum_stock: number;
  maximum_stock?: number;
  supplier_name?: string;
  supplier_contact?: string;
  purchase_date?: string;
  expiry_date?: string;
  location?: string;
  condition_status: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  image_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItemData {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unit_of_measure: string;
  unit_price?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  supplier_name?: string;
  supplier_contact?: string;
  purchase_date?: string;
  expiry_date?: string;
  location?: string;
  condition_status?: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  image_url?: string;
  notes?: string;
}

interface UseInventoryOptions {
  category?: string;
  search?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useInventory(options: UseInventoryOptions = {}) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب المخزون
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.search) params.append('search', options.search);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المخزون');
      }

      const result = await response.json();
      setInventory(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب المخزون:', err);
    } finally {
      setLoading(false);
    }
  }, [options.category, options.search]);

  // إضافة عنصر جديد
  const addItem = useCallback(async (itemData: CreateInventoryItemData): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إضافة العنصر');
      }

      await fetchInventory(); // إعادة تحميل البيانات
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة العنصر');
      console.error('خطأ في إضافة عنصر المخزون:', err);
      return false;
    }
  }, [fetchInventory]);

  // تحديث عنصر
  const updateItem = useCallback(async (itemId: string, updateData: Partial<CreateInventoryItemData>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/inventory?id=${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث العنصر');
      }

      await fetchInventory(); // إعادة تحميل البيانات
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث العنصر');
      console.error('خطأ في تحديث عنصر المخزون:', err);
      return false;
    }
  }, [fetchInventory]);

  // حذف عنصر
  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/inventory?id=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في حذف العنصر');
      }

      await fetchInventory(); // إعادة تحميل البيانات
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في حذف العنصر');
      console.error('خطأ في حذف عنصر المخزون:', err);
      return false;
    }
  }, [fetchInventory]);

  // تحديث كمية عنصر
  const updateQuantity = useCallback(async (itemId: string, newQuantity: number): Promise<boolean> => {
    return updateItem(itemId, { quantity: newQuantity });
  }, [updateItem]);

  // جلب العناصر منخفضة المخزون
  const getLowStockItems = useCallback(() => {
    return inventory.filter(item => item.quantity <= item.minimum_stock);
  }, [inventory]);

  // حساب القيمة الإجمالية للمخزون
  const getTotalValue = useCallback(() => {
    return inventory.reduce((total, item) => {
      return total + (item.quantity * (item.unit_price || 0));
    }, 0);
  }, [inventory]);

  // جلب الفئات الفريدة
  const getCategories = useCallback(() => {
    const categories = inventory.map(item => item.category);
    return [...new Set(categories)];
  }, [inventory]);

  // التحميل الأولي
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // التحديث التلقائي
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(fetchInventory, options.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchInventory, options.autoRefresh, options.refreshInterval]);

  return {
    inventory,
    loading,
    error,
    
    // الوظائف
    fetchInventory,
    addItem,
    updateItem,
    deleteItem,
    updateQuantity,
    
    // الوظائف المساعدة
    getLowStockItems,
    getTotalValue,
    getCategories,
    
    // إحصائيات سريعة
    totalItems: inventory.length,
    lowStockCount: inventory.filter(item => item.quantity <= item.minimum_stock).length,
    activeItems: inventory.filter(item => item.is_active).length,
  };
}

// Hook منفصل للحصول على عنصر واحد
export function useInventoryItem(itemId: string | null) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!itemId) {
      setItem(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/inventory?id=${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات العنصر');
      }

      const result = await response.json();
      setItem(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب عنصر المخزون:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  return {
    item,
    loading,
    error,
    refetch: fetchItem,
  };
}
