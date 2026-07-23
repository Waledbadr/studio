"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  type Contract,
  type ContractInvoice,
  type ContractAlert,
  type ContractStats,
  type ContractFormData,
  type ContractType,
  type ContractStatus,
  CONTRACT_TYPES,
  getContractTypeInfo,
} from '@/types/contracts';

// ---- Interface for Context ----
interface ContractsContextType {
  // البيانات
  contracts: Contract[];
  invoices: ContractInvoice[];
  alerts: ContractAlert[];
  loading: boolean;
  stats: ContractStats;

  // دوال العقود
  createContract: (data: ContractFormData) => Promise<string>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  getContract: (id: string) => Contract | undefined;
  getContractsByType: (type: ContractType) => Contract[];
  getContractsByStatus: (status: ContractStatus) => Contract[];
  getContractsByResidence: (residenceId: string) => Contract[];
  getContractsByParty: (partyId: string) => Contract[];
  renewContract: (id: string, newEndDate: string) => Promise<void>;
  suspendContract: (id: string) => Promise<void>;
  cancelContract: (id: string) => Promise<void>;
  activateContract: (id: string) => Promise<void>;

  // دوال الفواتير
  generateInvoice: (contractId: string, month: string, amount: number) => Promise<void>;
  generateMonthlyInvoices: () => Promise<void>;
  getInvoicesByContract: (contractId: string) => ContractInvoice[];
  getInvoicesByMonth: (month: string) => ContractInvoice[];
  updateInvoiceStatus: (invoiceId: string, status: ContractInvoice['status']) => Promise<void>;

  // دوال التنبيهات
  checkExpiringContracts: () => Promise<void>;
  getAlertsByContract: (contractId: string) => ContractAlert[];
  markAlertAsRead: (alertId: string) => Promise<void>;

  // إحصائيات
  calculateStats: () => void;

  // فلترة
  searchContracts: (term: string) => Contract[];
  filterContracts: (filters: {
    type?: ContractType;
    status?: ContractStatus;
    category?: 'revenue' | 'expense';
    residenceId?: string;
    partyId?: string;
  }) => Contract[];
}

const ContractsContext = createContext<ContractsContextType | null>(null);

// ---- دوال مساعدة لتحويل التواريخ ----
function fromTimestamp(ts: any): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts.split('T')[0];
  if (typeof ts.toDate === 'function') {
    try {
      return ts.toDate().toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
  if (ts instanceof Date) {
    return ts.toISOString().split('T')[0];
  }
  if (typeof ts === 'object' && 'seconds' in ts && typeof ts.seconds === 'number') {
    return new Date(ts.seconds * 1000).toISOString().split('T')[0];
  }
  return String(ts).split('T')[0];
}

function toTimestamp(dateStr: string): Timestamp {
  if (!dateStr) return Timestamp.now();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Timestamp.now();
  return Timestamp.fromDate(d);
}

export function ContractsProvider({ children }: { children: React.ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<ContractInvoice[]>([]);
  const [alerts, setAlerts] = useState<ContractAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    expiredContracts: 0,
    suspendedContracts: 0,
    draftContracts: 0,
    totalMonthlyRevenue: 0,
    totalMonthlyExpense: 0,
    expiringThisMonth: 0,
    expiringNextMonth: 0,
    contractsByType: {} as Record<ContractType, number>,
    contractsByCategory: { revenue: 0, expense: 0 },
  });

  const { toast } = useToast();

  // ---- Real-time listener for contracts ----
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'contractsV2'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const contractList: Contract[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: fromTimestamp(data.startDate),
            endDate: fromTimestamp(data.endDate),
            lastRenewedDate: data.lastRenewedDate ? fromTimestamp(data.lastRenewedDate) : undefined,
            createdAt: fromTimestamp(data.createdAt),
            updatedAt: data.updatedAt ? fromTimestamp(data.updatedAt) : undefined,
          } as Contract;
        });
        setContracts(contractList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching contracts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ---- Real-time listener for invoices ----
  useEffect(() => {
    const q = query(collection(db, 'contractInvoices'), orderBy('issuedAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const invoiceList: ContractInvoice[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            issuedAt: fromTimestamp(data.issuedAt),
            paidAt: data.paidAt ? fromTimestamp(data.paidAt) : undefined,
          } as ContractInvoice;
        });
        setInvoices(invoiceList);
      },
      (error) => {
        console.error('Error fetching invoices:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ---- حساب الإحصائيات ----
  const calculateStats = useCallback(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const active = contracts.filter(c => c.status === 'Active');
    const expired = contracts.filter(c => c.status === 'Expired');
    const suspended = contracts.filter(c => c.status === 'Suspended');
    const drafts = contracts.filter(c => c.status === 'Draft');

    // العقود المنتهية هذا الشهر
    const expiringThisMonth = active.filter(c => {
      const endDate = new Date(c.endDate);
      const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
      return endMonth === thisMonth;
    }).length;

    const expiringNextMonth = active.filter(c => {
      const endDate = new Date(c.endDate);
      const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
      return endMonth === nextMonth;
    }).length;

    // القيم الشهرية
    let totalMonthlyRevenue = 0;
    let totalMonthlyExpense = 0;

    active.forEach(c => {
      const info = getContractTypeInfo(c.contractType);
      if (c.billingType === 'fixed_monthly' || c.billingType === 'per_person_per_month') {
        if (info.category === 'revenue') {
          totalMonthlyRevenue += c.billingRate;
        } else {
          totalMonthlyExpense += c.billingRate;
        }
      }
    });

    // توزيع حسب النوع
    const contractsByType = {} as Record<ContractType, number>;
    CONTRACT_TYPES.forEach(t => {
      contractsByType[t.type] = contracts.filter(c => c.contractType === t.type).length;
    });

    // توزيع حسب الفئة
    const revenueCount = contracts.filter(c => c.contractCategory === 'revenue').length;
    const expenseCount = contracts.filter(c => c.contractCategory === 'expense').length;

    setStats({
      totalContracts: contracts.length,
      activeContracts: active.length,
      expiredContracts: expired.length,
      suspendedContracts: suspended.length,
      draftContracts: drafts.length,
      totalMonthlyRevenue,
      totalMonthlyExpense,
      expiringThisMonth,
      expiringNextMonth,
      contractsByType,
      contractsByCategory: { revenue: revenueCount, expense: expenseCount },
    });
  }, [contracts]);

  // تحديث الإحصائيات عند تغيير العقود
  useEffect(() => {
    calculateStats();
  }, [contracts, calculateStats]);

  // ---- دوال العقود ----

  const createContract = useCallback(async (data: ContractFormData): Promise<string> => {
    try {
      const contractData = {
        ...data,
        renewalCount: 0,
        status: 'Active' as ContractStatus,
        linkedResidenceNames: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'contractsV2'), contractData);
      
      toast({
        title: 'تم إنشاء العقد',
        description: 'تم إنشاء العقد بنجاح',
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء العقد',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const updateContract = useCallback(async (id: string, data: Partial<Contract>) => {
    try {
      const updateData = { ...data, updatedAt: Timestamp.now() };
      // تحويل التواريخ
      if (data.startDate) updateData.startDate = toTimestamp(data.startDate);
      if (data.endDate) updateData.endDate = toTimestamp(data.endDate);

      await updateDoc(doc(db, 'contractsV2', id), updateData);
      
      toast({
        title: 'تم تحديث العقد',
        description: 'تم تحديث العقد بنجاح',
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث العقد',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const deleteContract = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contractsV2', id));
      
      // حذف الفواتير المرتبطة
      const invoicesQuery = query(collection(db, 'contractInvoices'), where('contractId', '==', id));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const batch = writeBatch(db);
      invoicesSnapshot.forEach(invoiceDoc => {
        batch.delete(invoiceDoc.ref);
      });
      await batch.commit();

      // حذف التنبيهات المرتبطة
      const alertsQuery = query(collection(db, 'contractAlerts'), where('contractId', '==', id));
      const alertsSnapshot = await getDocs(alertsQuery);
      const batch2 = writeBatch(db);
      alertsSnapshot.forEach(alertDoc => {
        batch2.delete(alertDoc.ref);
      });
      await batch2.commit();

      toast({
        title: 'تم حذف العقد',
        description: 'تم حذف العقد وجميع البيانات المرتبطة به',
      });
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف العقد',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const getContract = useCallback((id: string): Contract | undefined => {
    return contracts.find(c => c.id === id);
  }, [contracts]);

  const getContractsByType = useCallback((type: ContractType): Contract[] => {
    return contracts.filter(c => c.contractType === type);
  }, [contracts]);

  const getContractsByStatus = useCallback((status: ContractStatus): Contract[] => {
    return contracts.filter(c => c.status === status);
  }, [contracts]);

  const getContractsByResidence = useCallback((residenceId: string): Contract[] => {
    return contracts.filter(c => c.linkedResidences.includes(residenceId));
  }, [contracts]);

  const getContractsByParty = useCallback((partyId: string): Contract[] => {
    return contracts.filter(c => c.partyId === partyId);
  }, [contracts]);

  const renewContract = useCallback(async (id: string, newEndDate: string) => {
    try {
      const contract = contracts.find(c => c.id === id);
      if (!contract) throw new Error('Contract not found');

      await updateDoc(doc(db, 'contractsV2', id), {
        endDate: toTimestamp(newEndDate),
        lastRenewedDate: Timestamp.now(),
        renewalCount: (contract.renewalCount || 0) + 1,
        status: 'Active',
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'تم تجديد العقد',
        description: `تم تجديد العقد حتى ${newEndDate}`,
      });
    } catch (error) {
      console.error('Error renewing contract:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تجديد العقد',
        variant: 'destructive',
      });
    }
  }, [contracts, toast]);

  const suspendContract = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'contractsV2', id), {
        status: 'Suspended',
        updatedAt: Timestamp.now(),
      });
      toast({ title: 'تم إيقاف العقد', description: 'تم إيقاف العقد بنجاح' });
    } catch (error) {
      console.error('Error suspending contract:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إيقاف العقد', variant: 'destructive' });
    }
  }, [toast]);

  const cancelContract = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'contractsV2', id), {
        status: 'Cancelled',
        updatedAt: Timestamp.now(),
      });
      toast({ title: 'تم إلغاء العقد', description: 'تم إلغاء العقد بنجاح' });
    } catch (error) {
      console.error('Error cancelling contract:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إلغاء العقد', variant: 'destructive' });
    }
  }, [toast]);

  const activateContract = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'contractsV2', id), {
        status: 'Active',
        updatedAt: Timestamp.now(),
      });
      toast({ title: 'تم تفعيل العقد', description: 'تم تفعيل العقد بنجاح' });
    } catch (error) {
      console.error('Error activating contract:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء تفعيل العقد', variant: 'destructive' });
    }
  }, [toast]);

  // ---- دوال الفواتير ----

  const generateInvoice = useCallback(async (contractId: string, month: string, amount: number) => {
    try {
      const invoiceData = {
        contractId,
        month,
        amount,
        status: 'Draft' as ContractInvoice['status'],
        issuedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'contractInvoices'), invoiceData);
      toast({ title: 'تم إنشاء الفاتورة', description: `تم إنشاء فاتورة شهر ${month}` });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إنشاء الفاتورة', variant: 'destructive' });
    }
  }, [toast]);

  const generateMonthlyInvoices = useCallback(async () => {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const activeContracts = contracts.filter(c => c.status === 'Active');
      let count = 0;

      for (const contract of activeContracts) {
        // التحقق من عدم وجود فاتورة لنفس الشهر
        const existingQuery = query(
          collection(db, 'contractInvoices'),
          where('contractId', '==', contract.id),
          where('month', '==', month)
        );
        const existingSnapshot = await getDocs(existingQuery);

        if (existingSnapshot.empty) {
          const monthlyRate = contract.billingType === 'fixed_monthly'
            ? contract.billingRate
            : contract.services
              ? contract.services.reduce((sum, s) => sum + s.rate, 0)
              : contract.billingRate;

          await generateInvoice(contract.id, month, monthlyRate);
          count++;
        }
      }

      toast({
        title: 'تم إنشاء الفواتير',
        description: `تم إنشاء ${count} فاتورة للشهر الحالي`,
      });
    } catch (error) {
      console.error('Error generating monthly invoices:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إنشاء الفواتير', variant: 'destructive' });
    }
  }, [contracts, generateInvoice, toast]);

  const getInvoicesByContract = useCallback((contractId: string): ContractInvoice[] => {
    return invoices.filter(i => i.contractId === contractId);
  }, [invoices]);

  const getInvoicesByMonth = useCallback((month: string): ContractInvoice[] => {
    return invoices.filter(i => i.month === month);
  }, [invoices]);

  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: ContractInvoice['status']) => {
    try {
      const updateData: any = { status, updatedAt: Timestamp.now() };
      if (status === 'Paid') {
        updateData.paidAt = Timestamp.now();
      }
      await updateDoc(doc(db, 'contractInvoices', invoiceId), updateData);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء تحديث الفاتورة', variant: 'destructive' });
    }
  }, [toast]);

  // ---- دوال التنبيهات ----

  const checkExpiringContracts = useCallback(async () => {
    try {
      const now = new Date();
      const activeContracts = contracts.filter(c => c.status === 'Active');

      for (const contract of activeContracts) {
        const endDate = new Date(contract.endDate);
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const alertConfigs = [
          { days: 30, type: 'expiry_30days' as const },
          { days: 14, type: 'expiry_14days' as const },
          { days: 7, type: 'expiry_7days' as const },
        ];

        for (const config of alertConfigs) {
          if (diffDays <= config.days && diffDays > 0) {
            // التحقق من وجود تنبيه مسبق
            const existingQuery = query(
              collection(db, 'contractAlerts'),
              where('contractId', '==', contract.id),
              where('alertType', '==', config.type)
            );
            const existingSnapshot = await getDocs(existingQuery);

            if (existingSnapshot.empty) {
              await addDoc(collection(db, 'contractAlerts'), {
                contractId: contract.id,
                alertType: config.type,
                sent: false,
                read: false,
                createdAt: Timestamp.now(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking expiring contracts:', error);
    }
  }, [contracts]);

  const getAlertsByContract = useCallback((contractId: string): ContractAlert[] => {
    return alerts.filter(a => a.contractId === contractId);
  }, [alerts]);

  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      await updateDoc(doc(db, 'contractAlerts', alertId), { read: true });
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }, []);

  // ---- فلترة وبحث ----

  const searchContracts = useCallback((term: string): Contract[] => {
    if (!term.trim()) return contracts;
    const lower = term.toLowerCase();
    return contracts.filter(c =>
      c.partyName.toLowerCase().includes(lower) ||
      c.notes?.toLowerCase().includes(lower) ||
      c.id.toLowerCase().includes(lower)
    );
  }, [contracts]);

  const filterContracts = useCallback((filters: {
    type?: ContractType;
    status?: ContractStatus;
    category?: 'revenue' | 'expense';
    residenceId?: string;
    partyId?: string;
  }): Contract[] => {
    let result = [...contracts];

    if (filters.type) result = result.filter(c => c.contractType === filters.type);
    if (filters.status) result = result.filter(c => c.status === filters.status);
    if (filters.category) result = result.filter(c => c.contractCategory === filters.category);
    if (filters.residenceId) result = result.filter(c => c.linkedResidences.includes(filters.residenceId!));
    if (filters.partyId) result = result.filter(c => c.partyId === filters.partyId);

    return result;
  }, [contracts]);

  const value: ContractsContextType = {
    contracts,
    invoices,
    alerts,
    loading,
    stats,
    createContract,
    updateContract,
    deleteContract,
    getContract,
    getContractsByType,
    getContractsByStatus,
    getContractsByResidence,
    getContractsByParty,
    renewContract,
    suspendContract,
    cancelContract,
    activateContract,
    generateInvoice,
    generateMonthlyInvoices,
    getInvoicesByContract,
    getInvoicesByMonth,
    updateInvoiceStatus,
    checkExpiringContracts,
    getAlertsByContract,
    markAlertAsRead,
    calculateStats,
    searchContracts,
    filterContracts,
  };

  return (
    <ContractsContext.Provider value={value}>
      {children}
    </ContractsContext.Provider>
  );
}

export function useContracts() {
  const ctx = useContext(ContractsContext);
  if (!ctx) {
    throw new Error('useContracts must be used within a ContractsProvider');
  }
  return ctx;
}
