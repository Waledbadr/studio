'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FinancialsProvider, useFinancials } from '@/context/financials-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useLanguage } from '@/context/language-context';
import {
  INCOME_CATEGORIES,
  EXPENSE_GROUPS,
  MonthlyFinancial,
  calcTotalIncome,
  calcTotalExpenses,
  formatSAR,
  IncomeKey,
  ExpenseCategoryKey,
} from '@/types/financials';
import { getFiscalMonthForDate } from '@/lib/fiscal-month-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Save,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Building2,
  FileBarChart,
  ListOrdered,
} from 'lucide-react';
import Link from 'next/link';

// ─── Generate fiscal month list ─────────────────────────────────────────
function generateMonthList(): string[] {
  const start = '2026-03';
  const today = new Date();
  const end = getFiscalMonthForDate(today);
  const months: string[] = [];
  let cur = end;
  let itr = 0;
  while (cur >= start && itr < 120) {
    months.push(cur);
    const [y, m] = cur.split('-').map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    cur = `${py}-${String(pm).padStart(2, '0')}`;
    itr++;
  }
  return months;
}

// ─── Numeric Input Cell ─────────────────────────────────────────────────
function NumInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const [raw, setRaw] = useState(value !== undefined && value !== 0 ? String(value) : '');

  useEffect(() => {
    setRaw(value !== undefined && value !== 0 ? String(value) : '');
  }, [value]);

  return (
    <Input
      type="number"
      min={0}
      value={raw}
      onChange={e => {
        setRaw(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(isNaN(n) ? undefined : n);
      }}
      className="h-8 text-sm text-right tabIndex={0}"
      placeholder="0"
    />
  );
}

// ─── Main Content ────────────────────────────────────────────────────────
function IncomeExpensesContent() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { financials, loading, fetchByMonth, saveFinancial, getOrCreate } = useFinancials();

  const months = useMemo(() => generateMonthList(), []);
  const [fiscalMonth, setFiscalMonth] = useState(months[0] ?? '');
  const [residenceId, setResidenceId] = useState('');

  const activeResidences = useMemo(
    () => {
      const base = residences
        .filter((r) => !r.disabled)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      const assigned = currentUser?.assignedResidences || [];
      if (currentUser?.role === 'Admin') return base;
      if (!assigned.length) return base;
      return base.filter((r) => assigned.includes(r.id));
    },
    [residences, currentUser],
  );

  // Auto-select first residence (and re-select when assignments change)
  useEffect(() => {
    if (!activeResidences.length) {
      setResidenceId('');
      return;
    }
    if (!residenceId || !activeResidences.some((r) => r.id === residenceId)) {
      setResidenceId(activeResidences[0].id);
    }
  }, [activeResidences, residenceId]);

  // Fetch on month change
  useEffect(() => {
    if (fiscalMonth) fetchByMonth(fiscalMonth);
  }, [fiscalMonth, fetchByMonth]);

  // Current editable record
  const currentResidence = activeResidences.find(r => r.id === residenceId);
  const [draft, setDraft] = useState<MonthlyFinancial | null>(null);

  useEffect(() => {
    if (!residenceId || !fiscalMonth || !currentResidence) return;
    setDraft(getOrCreate(residenceId, currentResidence.name, fiscalMonth));
  }, [residenceId, fiscalMonth, financials, currentResidence, getOrCreate]);

  const setIncome = (key: IncomeKey, v: number | undefined) => {
    if (!draft) return;
    setDraft({ ...draft, income: { ...draft.income, [key]: v } });
  };

  const setExpense = (key: ExpenseCategoryKey, v: number | undefined) => {
    if (!draft) return;
    setDraft({ ...draft, expenses: { ...draft.expenses, [key]: v } });
  };

  const handleSave = async () => {
    if (!draft) return;
    await saveFinancial(draft);
  };

  const totalIncome = draft ? calcTotalIncome(draft.income) : 0;
  const totalExpenses = draft ? calcTotalExpenses(draft.expenses) : 0;
  const netIncome = totalIncome - totalExpenses;

  // Collapsible expense groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    buildings: true, assets: true, services: true, other: true,
  });
  const toggleGroup = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  if (!activeResidences.length) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              {isAr ? 'لا توجد سكنات متاحة لهذا المستخدم في النظام.' : 'No residences are available for the current user.'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isAr ? 'الدخل والمصروفات' : 'Income & Expenses'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'تدوين المصروفات والدخل الشهري لكل سكن' : 'Monthly income & expenses entry per residence'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/income-expenses/report">
              <FileBarChart className="w-4 h-4" />
              {isAr ? 'التقرير الشهري' : 'Monthly Report'}
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/income-expenses/transactions">
              <ListOrdered className="w-4 h-4" />
              {isAr ? 'إدخال الحركات' : 'Transactions'}
            </Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={!draft || loading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="w-4 h-4" />
            {isAr ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {isAr ? 'الشهر المالي' : 'Fiscal Month'}
              </label>
              <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m} value={m}>
                      {new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {isAr ? 'السكن' : 'Residence'}
              </label>
              <Select value={residenceId} onValueChange={setResidenceId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={isAr ? 'اختر السكن' : 'Select residence'} />
                </SelectTrigger>
                <SelectContent>
                  {activeResidences.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {isAr ? 'إجمالي الدخل' : 'Total Income'}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatSAR(totalIncome)} <span className="text-sm font-normal">SAR</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 dark:border-rose-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">
              {isAr ? 'إجمالي المصروفات' : 'Total Expenses'}
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {formatSAR(totalExpenses)} <span className="text-sm font-normal">SAR</span>
            </div>
          </CardContent>
        </Card>
        <Card className={netIncome >= 0 ? 'border-blue-200 dark:border-blue-900' : 'border-amber-200 dark:border-amber-900'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${netIncome >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {isAr ? 'صافي الدخل' : 'Net Income'}
            </CardTitle>
            <DollarSign className={`w-4 h-4 ${netIncome >= 0 ? 'text-blue-500' : 'text-amber-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {formatSAR(Math.abs(netIncome))} <span className="text-sm font-normal">SAR {netIncome < 0 ? '(خسارة)' : ''}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {draft && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ─── INCOME ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="bg-emerald-50/60 dark:bg-emerald-950/30 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                {isAr ? 'الدخل' : 'Income'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {INCOME_CATEGORIES.map((cat, i) => (
                    <tr
                      key={cat.key}
                      className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50/50 dark:bg-gray-900/30'}`}
                    >
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 w-3/5">
                        {isAr ? cat.labelAr : cat.labelEn}
                      </td>
                      <td className="px-3 py-1.5 w-2/5">
                        <NumInput
                          value={draft.income[cat.key as IncomeKey]}
                          onChange={v => setIncome(cat.key as IncomeKey, v)}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold">
                    <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                      {formatSAR(totalIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* ─── EXPENSES ────────────────────────────────────────── */}
          <Card>
            <CardHeader className="bg-rose-50/60 dark:bg-rose-950/30 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
                {isAr ? 'المصروفات' : 'Expenses'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {EXPENSE_GROUPS.map(group => (
                    <React.Fragment key={group.key}>
                      {/* Group header — clickable to collapse */}
                      <tr
                        className="bg-gray-100 dark:bg-gray-800 cursor-pointer select-none"
                        onClick={() => toggleGroup(group.key)}
                      >
                        <td colSpan={2} className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          {openGroups[group.key]
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                          {isAr ? group.labelAr : group.labelEn}
                        </td>
                      </tr>
                      {openGroups[group.key] && group.categories.map((cat, i) => (
                        <tr
                          key={cat.key}
                          className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50/50 dark:bg-gray-900/30'}`}
                        >
                          <td className="px-4 py-2 pl-8 text-gray-700 dark:text-gray-300 w-3/5">
                            {isAr ? cat.labelAr : cat.labelEn}
                          </td>
                          <td className="px-3 py-1.5 w-2/5">
                            <NumInput
                              value={draft.expenses[cat.key as ExpenseCategoryKey]}
                              onChange={v => setExpense(cat.key as ExpenseCategoryKey, v)}
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  <tr className="bg-rose-50 dark:bg-rose-950/40 font-bold">
                    <td className="px-4 py-3 text-rose-700 dark:text-rose-400">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-700 dark:text-rose-400">
                      {formatSAR(totalExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom save bar */}
      {draft && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            <Save className="w-5 h-5" />
            {isAr ? `حفظ بيانات ${currentResidence?.name ?? ''}` : `Save ${currentResidence?.name ?? ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function IncomeExpensesPage() {
  return (
    <FinancialsProvider>
      <IncomeExpensesContent />
    </FinancialsProvider>
  );
}
