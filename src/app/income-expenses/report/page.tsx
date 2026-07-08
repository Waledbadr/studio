'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FinancialsProvider, useFinancials } from '@/context/financials-context';
import { useResidences } from '@/context/residences-context';
import { useLanguage } from '@/context/language-context';
import {
  INCOME_CATEGORIES,
  EXPENSE_GROUPS,
  IncomeKey,
  ExpenseCategoryKey,
  MonthlyFinancial,
  calcTotalIncome,
  calcTotalExpenses,
  formatSAR,
} from '@/types/financials';
import { getFiscalMonthForDate } from '@/lib/fiscal-month-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Building2,
  Printer,
  TrendingDown,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

function formatMoney(v?: number) {
  if (v === undefined) return '-';
  return v.toLocaleString('en-US');
}

function IncomeExpensesReportContent() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { residences } = useResidences();
  const { financials, loading, fetchByMonth, getOrCreate } = useFinancials();

  const months = useMemo(() => generateMonthList(), []);
  const [fiscalMonth, setFiscalMonth] = useState(months[0] ?? '');
  const [residenceId, setResidenceId] = useState('');

  const activeResidences = useMemo(
    () =>
      residences
        .filter((r) => !r.disabled)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [residences],
  );

  useEffect(() => {
    if (activeResidences.length > 0 && !residenceId) {
      setResidenceId(activeResidences[0].id);
    }
  }, [activeResidences, residenceId]);

  useEffect(() => {
    if (fiscalMonth) fetchByMonth(fiscalMonth);
  }, [fiscalMonth, fetchByMonth]);

  const currentResidence = activeResidences.find((r) => r.id === residenceId);
  const [draft, setDraft] = useState<MonthlyFinancial | null>(null);

  useEffect(() => {
    if (!residenceId || !fiscalMonth || !currentResidence) return;
    setDraft(getOrCreate(residenceId, currentResidence.name, fiscalMonth));
  }, [residenceId, fiscalMonth, financials, currentResidence, getOrCreate]);

  const totalIncome = draft ? calcTotalIncome(draft.income) : 0;
  const totalExpenses = draft ? calcTotalExpenses(draft.expenses) : 0;
  const netIncome = totalIncome - totalExpenses;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    buildings: true,
    assets: true,
    services: true,
    other: true,
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const printPage = () => window.print();

  if (!fiscalMonth || !residenceId) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isAr ? 'تقرير الدخل والمصروفات الشهري' : 'Monthly Income & Expenses Report'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'تفصيل الدخل والمصروفات لكل سكن للشهر المختار' : 'Breakdown of income/expenses per residence for selected month'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={printPage}
            variant="outline"
            className="gap-2 border-amber-300"
          >
            <Printer className="w-4 h-4" />
            {isAr ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </div>

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
                  {months.map((m) => (
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
                  {activeResidences.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading || !draft ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
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
                  {formatMoney(totalIncome)} <span className="text-sm font-normal">SAR</span>
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
                  {formatMoney(totalExpenses)} <span className="text-sm font-normal">SAR</span>
                </div>
              </CardContent>
            </Card>

            <Card
              className={
                netIncome >= 0
                  ? 'border-blue-200 dark:border-blue-900'
                  : 'border-amber-200 dark:border-amber-900'
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle
                  className={`text-sm font-medium ${
                    netIncome >= 0
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {isAr ? 'صافي الدخل' : 'Net Income'}
                </CardTitle>
                <DollarSign
                  className={`w-4 h-4 ${
                    netIncome >= 0 ? 'text-blue-500' : 'text-amber-500'
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    netIncome >= 0
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {formatMoney(Math.abs(netIncome))}{' '}
                  <span className="text-sm font-normal">
                    SAR {netIncome < 0 ? (isAr ? '(خسارة)' : '(Loss)') : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Income */}
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
                        className={`border-b last:border-0 ${
                          i % 2 === 0
                            ? 'bg-white dark:bg-gray-950'
                            : 'bg-gray-50/50 dark:bg-gray-900/30'
                        }`}
                      >
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300 w-3/5">
                          {isAr ? cat.labelAr : cat.labelEn}
                        </td>
                        <td className="px-3 py-1.5 w-2/5 text-right tabular-nums">
                          {formatMoney(draft.income[cat.key as IncomeKey])}{' '}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold">
                      <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400">
                        {isAr ? 'الإجمالي' : 'Total'}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatMoney(totalIncome)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Expenses */}
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
                    {EXPENSE_GROUPS.map((group) => (
                      <React.Fragment key={group.key}>
                        <tr
                          className="bg-gray-100 dark:bg-gray-800 cursor-pointer select-none"
                          onClick={() => toggleGroup(group.key)}
                        >
                          <td
                            colSpan={2}
                            className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                          >
                            {openGroups[group.key] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            {isAr ? group.labelAr : group.labelEn}
                          </td>
                        </tr>
                        {openGroups[group.key] &&
                          group.categories.map((cat, i) => (
                            <tr
                              key={cat.key}
                              className={`border-b last:border-0 ${
                                i % 2 === 0
                                  ? 'bg-white dark:bg-gray-950'
                                  : 'bg-gray-50/50 dark:bg-gray-900/30'
                              }`}
                            >
                              <td className="px-4 py-2 pl-8 text-gray-700 dark:text-gray-300 w-3/5">
                                {isAr ? cat.labelAr : cat.labelEn}
                              </td>
                              <td className="px-3 py-1.5 w-2/5 text-right tabular-nums">
                                {formatMoney(draft.expenses[cat.key as ExpenseCategoryKey])}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))}
                    <tr className="bg-rose-50 dark:bg-rose-950/40 font-bold">
                      <td className="px-4 py-3 text-rose-700 dark:text-rose-400">
                        {isAr ? 'الإجمالي' : 'Total'}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-700 dark:text-rose-400 tabular-nums">
                        {formatMoney(totalExpenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <style jsx global>{`
            @media print {
              /* Hide app chrome in print */
              header,
              nav,
              aside,
              footer {
                display: none !important;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default function IncomeExpensesReportPage() {
  return (
    <FinancialsProvider>
      <IncomeExpensesReportContent />
    </FinancialsProvider>
  );
}

