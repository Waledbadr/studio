'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { FinanceTransaction, FinanceTransactionKind, FinanceTransactionTypeKey } from '@/types/income-expense-transactions';

interface FinanceTransactionsContextType {
  transactions: FinanceTransaction[];
  loading: boolean;

  fetchByMonth: (residenceId: string, fiscalMonth: string) => Promise<void>;
  addTransaction: (payload: Omit<FinanceTransaction, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<FinanceTransaction, 'id'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Helpers (optional)
  upsertLocalOnly: (t: FinanceTransaction) => void;
}

const FinanceTransactionsContext = createContext<FinanceTransactionsContextType | undefined>(undefined);

const LS_KEY = 'estatecare_incomeExpenseTransactions';

function readLocal(): FinanceTransaction[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FinanceTransaction[];
  } catch {
    return [];
  }
}

function writeLocal(list: FinanceTransaction[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function makeId(residenceId: string, fiscalMonth: string) {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${residenceId}_${fiscalMonth}_${Date.now()}_${rand}`;
}

export function IncomeExpenseTransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchByMonth = useCallback(
    async (residenceId: string, fiscalMonth: string) => {
      setLoading(true);
      try {
        if (!db) {
          const local = readLocal();
          setTransactions(local.filter((t) => t.residenceId === residenceId && t.fiscalMonth === fiscalMonth));
          return;
        }

        const q = query(
          collection(db as any, 'incomeExpenseTransactions'),
          where('residenceId', '==', residenceId),
          where('fiscalMonth', '==', fiscalMonth),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FinanceTransaction));
        setTransactions(data);
      } catch (e: any) {
        console.error('fetchByMonth transactions error:', e);
        toast({ title: 'خطأ', description: 'تعذر جلب الحركات المالية.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const upsertLocalOnly = useCallback((t: FinanceTransaction) => {
    const local = readLocal();
    const idx = local.findIndex((x) => x.id === t.id);
    const next = idx >= 0 ? local.map((x) => (x.id === t.id ? t : x)) : [...local, t];
    writeLocal(next);
    setTransactions(next);
  }, []);

  const addTransaction = useCallback(
    async (payload: Omit<FinanceTransaction, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const id = makeId(payload.residenceId, payload.fiscalMonth);
      const t: FinanceTransaction = {
        ...payload,
        id,
        createdBy: auth?.currentUser?.uid,
        createdAt: now,
        updatedAt: now,
      };

      if (!db) {
        upsertLocalOnly(t);
        toast({ title: 'تم الحفظ (محلياً)' });
        return;
      }

      try {
        await setDoc(doc(db as any, 'incomeExpenseTransactions', id), t, { merge: true });
        setTransactions((prev) => [...prev, t]);
        toast({ title: 'تم الحفظ ✓' });
      } catch (e: any) {
        console.error('addTransaction error:', e);
        toast({ title: 'خطأ في الحفظ', description: e?.message || 'Failed to save', variant: 'destructive' });
      }
    },
    [toast, upsertLocalOnly],
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Omit<FinanceTransaction, 'id'>>) => {
      const now = new Date().toISOString();
      if (!db) {
        const local = readLocal();
        const idx = local.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const next = local.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: now } : x));
        writeLocal(next);
        setTransactions(next);
        toast({ title: 'تم التحديث (محلياً)' });
        return;
      }

      try {
        await setDoc(doc(db as any, 'incomeExpenseTransactions', id), { ...updates, updatedAt: now }, { merge: true });
        setTransactions((prev) => prev.map((x) => (x.id === id ? { ...x, ...updates, updatedAt: now } : x)));
        toast({ title: 'تم التحديث ✓' });
      } catch (e: any) {
        console.error('updateTransaction error:', e);
        toast({ title: 'خطأ في التحديث', description: e?.message || 'Failed to update', variant: 'destructive' });
      }
    },
    [toast],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!db) {
        const local = readLocal();
        const next = local.filter((x) => x.id !== id);
        writeLocal(next);
        setTransactions(next);
        toast({ title: 'تم الحذف (محلياً)' });
        return;
      }

      try {
        await deleteDoc(doc(db as any, 'incomeExpenseTransactions', id));
        setTransactions((prev) => prev.filter((x) => x.id !== id));
        toast({ title: 'تم الحذف' });
      } catch (e: any) {
        console.error('deleteTransaction error:', e);
        toast({ title: 'خطأ في الحذف', description: e?.message || 'Failed to delete', variant: 'destructive' });
      }
    },
    [toast],
  );

  const value = useMemo(
    () => ({
      transactions,
      loading,
      fetchByMonth,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      upsertLocalOnly,
    }),
    [transactions, loading, fetchByMonth, addTransaction, updateTransaction, deleteTransaction, upsertLocalOnly],
  );

  return <FinanceTransactionsContext.Provider value={value}>{children}</FinanceTransactionsContext.Provider>;
}

export function useIncomeExpenseTransactions() {
  const ctx = useContext(FinanceTransactionsContext);
  if (!ctx) throw new Error('useIncomeExpenseTransactions must be used within IncomeExpenseTransactionsProvider');
  return ctx;
}

