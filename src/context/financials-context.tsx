'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  MonthlyFinancial,
  makeEmptyFinancial,
  IncomeKey,
  ExpenseCategoryKey,
} from '@/types/financials';

interface FinancialsContextType {
  financials: MonthlyFinancial[];
  loading: boolean;
  fetchByMonth: (fiscalMonth: string) => Promise<void>;
  saveFinancial: (data: MonthlyFinancial) => Promise<void>;
  deleteFinancial: (id: string) => Promise<void>;
  getOrCreate: (residenceId: string, residenceName: string, fiscalMonth: string) => MonthlyFinancial;
}

const FinancialsContext = createContext<FinancialsContextType | undefined>(undefined);

export function FinancialsProvider({ children }: { children: ReactNode }) {
  const [financials, setFinancials] = useState<MonthlyFinancial[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchByMonth = useCallback(async (fiscalMonth: string) => {
    if (!db) return;
    setLoading(true);
    try {
      const q = query(
        collection(db as any, 'monthlyFinancials'),
        where('fiscalMonth', '==', fiscalMonth),
      );
      const snap = await getDocs(q);
      const data: MonthlyFinancial[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyFinancial));
      setFinancials(data);
    } catch (e: any) {
      console.error('Error fetching financials:', e);
      toast({ title: 'خطأ', description: 'تعذر جلب البيانات المالية.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveFinancial = useCallback(async (data: MonthlyFinancial) => {
    if (!db) {
      // localStorage fallback
      setFinancials(prev => {
        const idx = prev.findIndex(f => f.id === data.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data;
          return next;
        }
        return [...prev, data];
      });
      toast({ title: 'تم الحفظ (محلياً)', description: `تم حفظ بيانات ${data.residenceName}` });
      return;
    }
    try {
      const ref = doc(db as any, 'monthlyFinancials', data.id);
      await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      setFinancials(prev => {
        const idx = prev.findIndex(f => f.id === data.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data;
          return next;
        }
        return [...prev, data];
      });
      toast({ title: 'تم الحفظ ✓', description: `تم حفظ بيانات ${data.residenceName} للشهر ${data.fiscalMonth}` });
    } catch (e: any) {
      console.error('Error saving financial:', e);
      toast({ title: 'خطأ في الحفظ', description: e.message, variant: 'destructive' });
    }
  }, [toast]);

  const deleteFinancial = useCallback(async (id: string) => {
    if (!db) {
      setFinancials(prev => prev.filter(f => f.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db as any, 'monthlyFinancials', id));
      setFinancials(prev => prev.filter(f => f.id !== id));
      toast({ title: 'تم الحذف' });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  }, [toast]);

  const getOrCreate = useCallback(
    (residenceId: string, residenceName: string, fiscalMonth: string): MonthlyFinancial => {
      const existing = financials.find(f => f.id === `${residenceId}_${fiscalMonth}`);
      return existing ?? makeEmptyFinancial(residenceId, residenceName, fiscalMonth);
    },
    [financials],
  );

  return (
    <FinancialsContext.Provider value={{ financials, loading, fetchByMonth, saveFinancial, deleteFinancial, getOrCreate }}>
      {children}
    </FinancialsContext.Provider>
  );
}

export function useFinancials() {
  const ctx = useContext(FinancialsContext);
  if (!ctx) throw new Error('useFinancials must be used within FinancialsProvider');
  return ctx;
}
