/**
 * Hook مخصص لإدارة العقارات
 */

import { useState, useEffect, useCallback } from 'react';

export interface Residence {
  id: string;
  address: string;
  unit_number?: string;
  building_name?: string;
  floor_number?: number;
  property_type: 'apartment' | 'villa' | 'office' | 'shop';
  area_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent_amount: number;
  deposit_amount?: number;
  utilities_included: boolean;
  tenant_id?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description?: string;
  amenities?: string; // JSON
  images?: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface CreateResidenceData {
  address: string;
  unit_number?: string;
  building_name?: string;
  floor_number?: number;
  property_type: 'apartment' | 'villa' | 'office' | 'shop';
  area_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent_amount: number;
  deposit_amount?: number;
  utilities_included?: boolean;
  tenant_id?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description?: string;
  amenities?: any[];
  images?: string[];
}

interface UseResidencesOptions {
  status?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useResidences(options: UseResidencesOptions = {}) {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب العقارات
  const fetchResidences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/residences?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات العقارات');
      }

      const result = await response.json();
      setResidences(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب العقارات:', err);
    } finally {
      setLoading(false);
    }
  }, [options.status]);

  // إضافة عقار جديد
  const addResidence = useCallback(async (residenceData: CreateResidenceData): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/residences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(residenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إضافة العقار');
      }

      await fetchResidences(); // إعادة تحميل البيانات
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة العقار');
      console.error('خطأ في إضافة العقار:', err);
      return false;
    }
  }, [fetchResidences]);

  // تحديث عقار
  const updateResidence = useCallback(async (residenceId: string, updateData: Partial<CreateResidenceData>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/residences?id=${residenceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث العقار');
      }

      await fetchResidences(); // إعادة تحميل البيانات
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث العقار');
      console.error('خطأ في تحديث العقار:', err);
      return false;
    }
  }, [fetchResidences]);

  // تحديث حالة العقار
  const updateResidenceStatus = useCallback(async (residenceId: string, status: Residence['status']): Promise<boolean> => {
    return updateResidence(residenceId, { status });
  }, [updateResidence]);

  // تعيين مستأجر للعقار
  const assignTenant = useCallback(async (residenceId: string, tenantId: string, leaseStartDate: string, leaseEndDate: string): Promise<boolean> => {
    return updateResidence(residenceId, {
      tenant_id: tenantId,
      lease_start_date: leaseStartDate,
      lease_end_date: leaseEndDate,
      status: 'occupied'
    });
  }, [updateResidence]);

  // إخلاء العقار
  const vacateResidence = useCallback(async (residenceId: string): Promise<boolean> => {
    return updateResidence(residenceId, {
      tenant_id: undefined,
      lease_start_date: undefined,
      lease_end_date: undefined,
      status: 'available'
    });
  }, [updateResidence]);

  // جلب العقارات حسب الحالة
  const getResidencesByStatus = useCallback((status: Residence['status']) => {
    return residences.filter(residence => residence.status === status);
  }, [residences]);

  // جلب العقارات المتاحة
  const getAvailableResidences = useCallback(() => {
    return getResidencesByStatus('available');
  }, [getResidencesByStatus]);

  // جلب العقارات المؤجرة
  const getOccupiedResidences = useCallback(() => {
    return getResidencesByStatus('occupied');
  }, [getResidencesByStatus]);

  // جلب العقارات التي تحتاج صيانة
  const getMaintenanceResidences = useCallback(() => {
    return getResidencesByStatus('maintenance');
  }, [getResidencesByStatus]);

  // حساب إجمالي الإيجارات
  const getTotalRentRevenue = useCallback(() => {
    return residences
      .filter(residence => residence.status === 'occupied')
      .reduce((total, residence) => total + residence.rent_amount, 0);
  }, [residences]);

  // جلب العقارات حسب النوع
  const getResidencesByType = useCallback((type: Residence['property_type']) => {
    return residences.filter(residence => residence.property_type === type);
  }, [residences]);

  // البحث في العقارات
  const searchResidences = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return residences.filter(residence => 
      residence.address.toLowerCase().includes(lowercaseQuery) ||
      residence.building_name?.toLowerCase().includes(lowercaseQuery) ||
      residence.unit_number?.toLowerCase().includes(lowercaseQuery) ||
      residence.description?.toLowerCase().includes(lowercaseQuery)
    );
  }, [residences]);

  // جلب العقارات منتهية الصلاحية قريباً
  const getExpiringLeases = useCallback((daysThreshold: number = 30) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return residences.filter(residence => {
      if (!residence.lease_end_date) return false;
      const leaseEndDate = new Date(residence.lease_end_date);
      return leaseEndDate <= thresholdDate && leaseEndDate >= new Date();
    });
  }, [residences]);

  // التحميل الأولي
  useEffect(() => {
    fetchResidences();
  }, [fetchResidences]);

  // التحديث التلقائي
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(fetchResidences, options.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchResidences, options.autoRefresh, options.refreshInterval]);

  return {
    residences,
    loading,
    error,
    
    // الوظائف الأساسية
    fetchResidences,
    addResidence,
    updateResidence,
    updateResidenceStatus,
    assignTenant,
    vacateResidence,
    
    // الوظائف المساعدة
    getResidencesByStatus,
    getAvailableResidences,
    getOccupiedResidences,
    getMaintenanceResidences,
    getTotalRentRevenue,
    getResidencesByType,
    searchResidences,
    getExpiringLeases,
    
    // إحصائيات سريعة
    totalResidences: residences.length,
    availableCount: residences.filter(r => r.status === 'available').length,
    occupiedCount: residences.filter(r => r.status === 'occupied').length,
    maintenanceCount: residences.filter(r => r.status === 'maintenance').length,
    totalRentRevenue: getTotalRentRevenue(),
    occupancyRate: residences.length > 0 ? 
      (residences.filter(r => r.status === 'occupied').length / residences.length) * 100 : 0,
  };
}

// Hook منفصل للحصول على عقار واحد
export function useResidence(residenceId: string | null) {
  const [residence, setResidence] = useState<Residence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResidence = useCallback(async () => {
    if (!residenceId) {
      setResidence(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/residences?id=${residenceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات العقار');
      }

      const result = await response.json();
      setResidence(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      console.error('خطأ في جلب العقار:', err);
    } finally {
      setLoading(false);
    }
  }, [residenceId]);

  useEffect(() => {
    fetchResidence();
  }, [fetchResidence]);

  return {
    residence,
    loading,
    error,
    refetch: fetchResidence,
  };
}
