/**
 * Hook مخصص لإدارة طلبات الصيانة
 */

import { useState, useEffect, useCallback } from 'react';

export interface MaintenanceRequest {
  id: string;
  request_number: string;
  residence_id: string;
  tenant_id?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'carpentry' | 'cleaning' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_completion?: string;
  completion_date?: string;
  tenant_rating?: number;
  tenant_feedback?: string;
  images?: string; // JSON
  before_images?: string; // JSON
  after_images?: string; // JSON
  required_materials?: string; // JSON
  work_log?: string; // JSON
  created_at: string;
  updated_at: string;
  residence_address?: string; // من الجدول المربوط
}

export interface CreateMaintenanceRequestData {
  residence_id: string;
  tenant_id?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'carpentry' | 'cleaning' | 'general';
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  assigned_to?: string;
  estimated_cost?: number;
  estimated_completion?: string;
  images?: string[];
  required_materials?: string[];
}

interface UseMaintenanceOptions {
  status?: string;
  category?: string;
  priority?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useMaintenance(options: UseMaintenanceOptions = {}) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب طلبات الصيانة
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.category) params.append('category', options.category);
      if (options.priority) params.append('priority', options.priority);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/maintenance?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات طلبات الصيانة');
      }

      const result = await response.json();
      setRequests(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب طلبات الصيانة:', err);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.category, options.priority]);

  // إنشاء طلب صيانة جديد
  const createRequest = useCallback(async (requestData: CreateMaintenanceRequestData): Promise<{ success: boolean; requestId?: string; requestNumber?: string }> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء طلب الصيانة');
      }

      const result = await response.json();
      await fetchRequests(); // إعادة تحميل البيانات
      
      return {
        success: true,
        requestId: result.data.id,
        requestNumber: result.data.request_number
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إنشاء طلب الصيانة');
      console.error('خطأ في إنشاء طلب الصيانة:', err);
      return { success: false };
    }
  }, [fetchRequests]);

  // تحديث طلب صيانة
  const updateRequest = useCallback(async (requestId: string, updateData: Partial<MaintenanceRequest>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/maintenance?id=${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث طلب الصيانة');
      }

      await fetchRequests(); // إعادة تحميل البيانات
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث طلب الصيانة');
      console.error('خطأ في تحديث طلب الصيانة:', err);
      return false;
    }
  }, [fetchRequests]);

  // تحديث حالة طلب الصيانة
  const updateStatus = useCallback(async (requestId: string, status: MaintenanceRequest['status']): Promise<boolean> => {
    return updateRequest(requestId, { status });
  }, [updateRequest]);

  // تعيين فني للطلب
  const assignTechnician = useCallback(async (requestId: string, technicianId: string): Promise<boolean> => {
    return updateRequest(requestId, { 
      assigned_to: technicianId, 
      status: 'assigned' 
    });
  }, [updateRequest]);

  // بدء العمل في الطلب
  const startWork = useCallback(async (requestId: string): Promise<boolean> => {
    return updateRequest(requestId, { status: 'in_progress' });
  }, [updateRequest]);

  // إكمال الطلب
  const completeRequest = useCallback(async (requestId: string, actualCost?: number, afterImages?: string[]): Promise<boolean> => {
    const updateData: Partial<MaintenanceRequest> = {
      status: 'completed',
      completion_date: new Date().toISOString(),
    };
    
    if (actualCost !== undefined) {
      updateData.actual_cost = actualCost;
    }
    
    if (afterImages) {
      updateData.after_images = JSON.stringify(afterImages);
    }

    return updateRequest(requestId, updateData);
  }, [updateRequest]);

  // إضافة إدخال في سجل العمل
  const addWorkLogEntry = useCallback(async (requestId: string, workEntry: string): Promise<boolean> => {
    return updateRequest(requestId, { work_entry: workEntry });
  }, [updateRequest]);

  // تقييم الطلب من المستأجر
  const rateRequest = useCallback(async (requestId: string, rating: number, feedback?: string): Promise<boolean> => {
    return updateRequest(requestId, { 
      tenant_rating: rating,
      tenant_feedback: feedback 
    });
  }, [updateRequest]);

  // جلب الطلبات حسب الحالة
  const getRequestsByStatus = useCallback((status: MaintenanceRequest['status']) => {
    return requests.filter(request => request.status === status);
  }, [requests]);

  // جلب الطلبات المعلقة
  const getPendingRequests = useCallback(() => {
    return getRequestsByStatus('pending');
  }, [getRequestsByStatus]);

  // جلب الطلبات قيد التنفيذ
  const getInProgressRequests = useCallback(() => {
    return getRequestsByStatus('in_progress');
  }, [getRequestsByStatus]);

  // جلب الطلبات المكتملة
  const getCompletedRequests = useCallback(() => {
    return getRequestsByStatus('completed');
  }, [getRequestsByStatus]);

  // جلب الطلبات حسب الأولوية
  const getRequestsByPriority = useCallback((priority: MaintenanceRequest['priority']) => {
    return requests.filter(request => request.priority === priority);
  }, [requests]);

  // جلب الطلبات العاجلة والطارئة
  const getUrgentRequests = useCallback(() => {
    return requests.filter(request => 
      request.priority === 'urgent' || request.priority === 'emergency'
    );
  }, [requests]);

  // جلب الطلبات حسب الفئة
  const getRequestsByCategory = useCallback((category: MaintenanceRequest['category']) => {
    return requests.filter(request => request.category === category);
  }, [requests]);

  // جلب الطلبات المعينة لفني معين
  const getRequestsByTechnician = useCallback((technicianId: string) => {
    return requests.filter(request => request.assigned_to === technicianId);
  }, [requests]);

  // حساب التكلفة الإجمالية
  const getTotalCost = useCallback(() => {
    return requests.reduce((total, request) => {
      return total + (request.actual_cost || request.estimated_cost || 0);
    }, 0);
  }, [requests]);

  // حساب متوسط التقييم
  const getAverageRating = useCallback(() => {
    const ratedRequests = requests.filter(request => request.tenant_rating);
    if (ratedRequests.length === 0) return 0;
    
    const totalRating = ratedRequests.reduce((sum, request) => sum + (request.tenant_rating || 0), 0);
    return totalRating / ratedRequests.length;
  }, [requests]);

  // البحث في الطلبات
  const searchRequests = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return requests.filter(request => 
      request.title.toLowerCase().includes(lowercaseQuery) ||
      request.description.toLowerCase().includes(lowercaseQuery) ||
      request.request_number.toLowerCase().includes(lowercaseQuery) ||
      request.residence_address?.toLowerCase().includes(lowercaseQuery)
    );
  }, [requests]);

  // جلب الطلبات المتأخرة
  const getOverdueRequests = useCallback(() => {
    const now = new Date();
    return requests.filter(request => {
      if (!request.estimated_completion || request.status === 'completed') return false;
      const estimatedDate = new Date(request.estimated_completion);
      return estimatedDate < now && request.status !== 'completed';
    });
  }, [requests]);

  // التحميل الأولي
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // التحديث التلقائي
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(fetchRequests, options.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchRequests, options.autoRefresh, options.refreshInterval]);

  return {
    requests,
    loading,
    error,
    
    // الوظائف الأساسية
    fetchRequests,
    createRequest,
    updateRequest,
    updateStatus,
    assignTechnician,
    startWork,
    completeRequest,
    addWorkLogEntry,
    rateRequest,
    
    // الوظائف المساعدة
    getRequestsByStatus,
    getPendingRequests,
    getInProgressRequests,
    getCompletedRequests,
    getRequestsByPriority,
    getUrgentRequests,
    getRequestsByCategory,
    getRequestsByTechnician,
    getTotalCost,
    getAverageRating,
    searchRequests,
    getOverdueRequests,
    
    // إحصائيات سريعة
    totalRequests: requests.length,
    pendingCount: requests.filter(r => r.status === 'pending').length,
    inProgressCount: requests.filter(r => r.status === 'in_progress').length,
    completedCount: requests.filter(r => r.status === 'completed').length,
    urgentCount: requests.filter(r => r.priority === 'urgent' || r.priority === 'emergency').length,
    averageRating: getAverageRating(),
    totalCost: getTotalCost(),
  };
}

// Hook منفصل للحصول على طلب صيانة واحد
export function useMaintenanceRequest(requestId: string | null) {
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      setRequest(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/maintenance?id=${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات طلب الصيانة');
      }

      const result = await response.json();
      setRequest(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب طلب الصيانة:', err);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return {
    request,
    loading,
    error,
    refetch: fetchRequest,
  };
}
