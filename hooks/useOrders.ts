/**
 * Hook مخصص لإدارة الطلبات
 */

import { useState, useEffect, useCallback } from 'react';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  order_type: 'purchase' | 'rental' | 'service' | 'maintenance';
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount?: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method?: string;
  currency: string;
  delivery_date?: string;
  delivery_address?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Request tracking properties for inventory orders
  requestedById?: string;
  requestedByName?: string;
  requestedByEmail?: string;
  approvedById?: string;
  approvedByName?: string;
}

export interface CreateOrderData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  order_type: 'purchase' | 'rental' | 'service' | 'maintenance';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  payment_method?: string;
  currency?: string;
  delivery_date?: string;
  delivery_address?: string;
  assigned_to?: string;
  notes?: string;
}

interface UseOrdersOptions {
  status?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب الطلبات
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات الطلبات');
      }

      const result = await response.json() as { data?: Order[] };
      setOrders(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب الطلبات:', err);
    } finally {
      setLoading(false);
    }
  }, [options.status]);

  // إنشاء طلب جديد
  const createOrder = useCallback(async (orderData: CreateOrderData): Promise<{ success: boolean; orderId?: string; orderNumber?: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'فشل في إنشاء الطلب');
      }

      const result = await response.json() as { data?: Order };
      await fetchOrders(); // إعادة تحميل البيانات
      
      return {
        success: true,
        orderId: result.data?.id,
        orderNumber: result.data?.order_number
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إنشاء الطلب');
      console.error('خطأ في إنشاء الطلب:', err);
      return { success: false };
    }
  }, [fetchOrders]);

  // تحديث طلب
  const updateOrder = useCallback(async (orderId: string, updateData: Partial<Order>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'فشل في تحديث الطلب');
      }

      await fetchOrders(); // إعادة تحميل البيانات
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث الطلب');
      console.error('خطأ في تحديث الطلب:', err);
      return false;
    }
  }, [fetchOrders]);

  // تحديث حالة الطلب
  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']): Promise<boolean> => {
    return updateOrder(orderId, { status });
  }, [updateOrder]);

  // تحديث حالة الدفع
  const updatePaymentStatus = useCallback(async (orderId: string, paymentStatus: Order['payment_status']): Promise<boolean> => {
    return updateOrder(orderId, { payment_status: paymentStatus });
  }, [updateOrder]);

  // جلب الطلبات حسب الحالة
  const getOrdersByStatus = useCallback((status: Order['status']) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // جلب الطلبات المعلقة
  const getPendingOrders = useCallback(() => {
    return getOrdersByStatus('pending');
  }, [getOrdersByStatus]);

  // جلب الطلبات المكتملة
  const getCompletedOrders = useCallback(() => {
    return getOrdersByStatus('completed');
  }, [getOrdersByStatus]);

  // حساب المبلغ الإجمالي للطلبات
  const getTotalRevenue = useCallback((filterStatus?: Order['status']) => {
    const filteredOrders = filterStatus 
      ? orders.filter(order => order.status === filterStatus)
      : orders;
      
    return filteredOrders.reduce((total, order) => {
      return total + (order.final_amount || order.total_amount);
    }, 0);
  }, [orders]);

  // حساب عدد الطلبات حسب الحالة
  const getOrderCountByStatus = useCallback(() => {
    const statusCount: Record<string, number> = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    return statusCount;
  }, [orders]);

  // جلب الطلبات حسب النوع
  const getOrdersByType = useCallback((type: Order['order_type']) => {
    return orders.filter(order => order.order_type === type);
  }, [orders]);

  // التحميل الأولي
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // التحديث التلقائي
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(fetchOrders, options.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, options.autoRefresh, options.refreshInterval]);

  return {
    orders,
    loading,
    error,
    
    // الوظائف الأساسية
    fetchOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    updatePaymentStatus,
    
    // الوظائف المساعدة
    getOrdersByStatus,
    getPendingOrders,
    getCompletedOrders,
    getTotalRevenue,
    getOrderCountByStatus,
    getOrdersByType,
    
    // إحصائيات سريعة
    totalOrders: orders.length,
    pendingCount: orders.filter(order => order.status === 'pending').length,
    completedCount: orders.filter(order => order.status === 'completed').length,
    totalRevenue: getTotalRevenue('completed'),
  };
}

// Hook منفصل للحصول على طلب واحد
export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات الطلب');
      }

      const result = await response.json() as { data?: Order };
      setOrder(result.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب الطلب:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}
