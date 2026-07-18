'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { IncomeExpenseTransactionsProvider, useIncomeExpenseTransactions } from '@/context/income-expense-transactions-context';
import {
  FINANCE_TRANSACTION_TYPES,
  FINANCE_GROUPS,
  getTransactionTypeDef,
  type FinanceTransaction,
  type FinanceTransactionKind,
  type FinanceTransactionTypeKey,
  formatMoneySAr,
} from '@/types/income-expense-transactions';

import { getFiscalMonthForDate } from '@/lib/fiscal-month-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil } from 'lucide-react';

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

function toISODateLocal(d: Date) {
  // YYYY-MM-DD without timezone shifting issues
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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
      step="0.01"
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(Number.isFinite(n) ? n : undefined);
      }}
      className="h-8 text-sm text-right tabIndex={0}"
      placeholder="0"
    />
  );
}

function transactionSubtitle(tx: FinanceTransaction) {
  const def = getTransactionTypeDef(tx.typeKey);
  if (def?.buildSubtitle) return def.buildSubtitle(tx.details || {});
  if (tx.details?.description) return String(tx.details.description);
  return '-';
}

function IncomeExpenseTransactionsContent() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { transactions, loading, fetchByMonth, addTransaction, updateTransaction, deleteTransaction } = useIncomeExpenseTransactions();
  const isAdmin = currentUser?.role === 'Admin';

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

  useEffect(() => {
    if (!activeResidences.length) {
      setResidenceId('');
      return;
    }
    if (!residenceId || !activeResidences.some((r) => r.id === residenceId)) {
      setResidenceId(activeResidences[0].id);
    }
  }, [activeResidences, residenceId]);

  useEffect(() => {
    if (!residenceId || !fiscalMonth) return;
    fetchByMonth(residenceId, fiscalMonth);
  }, [residenceId, fiscalMonth, fetchByMonth]);

  const [kind, setKind] = useState<FinanceTransactionKind>('expense');

  const kindTypes = useMemo(() => FINANCE_TRANSACTION_TYPES.filter((t) => t.kind === kind), [kind]);
  const groupedTypeOptions = useMemo(() => {
    type GroupOption = {
      group: { key: string; labelAr: string; labelEn: string };
      items: (typeof kindTypes)[number][];
    };
    const grouped = FINANCE_GROUPS.map((g) => ({
      group: g,
      items: kindTypes.filter((t) => t.groupKey === g.key),
    })).filter((x) => x.items.length > 0);
    const noGroup = kindTypes.filter((t) => !t.groupKey);
    if (noGroup.length > 0) {
      const extra: GroupOption = {
        group: { key: 'ungrouped', labelAr: 'غير مصنف', labelEn: 'Ungrouped' },
        items: noGroup,
      };
      grouped.push(extra);
    }
    return grouped;
  }, [kindTypes]);

  const [typeKey, setTypeKey] = useState<FinanceTransactionTypeKey>(kindTypes[0]?.key as FinanceTransactionTypeKey);
  useEffect(() => {
    const current = kindTypes.find((t) => t.key === typeKey);
    if (!current && kindTypes[0]) setTypeKey(kindTypes[0].key as FinanceTransactionTypeKey);
  }, [kind, kindTypes, typeKey]);

  const typeDef = useMemo(() => getTransactionTypeDef(typeKey), [typeKey]);

  const blankDetails = () => {
    const res: Record<string, any> = {};
    for (const f of typeDef?.fields ?? []) {
      if (f.type === 'number') res[f.key] = undefined;
      else res[f.key] = '';
    }
    return res;
  };

  const today = useMemo(() => toISODateLocal(new Date()), []);
  const [transactionDate, setTransactionDate] = useState(today);
  const [details, setDetails] = useState<Record<string, any>>(() => blankDetails());
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!typeDef) return;
    if (editingId) return; // don't reset during edit
    setDetails(blankDetails());
    setNotes('');
  }, [typeDef, editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const computedAmount = useMemo(() => {
    if (!typeDef) return 0;
    const d = { ...details };
    // notes are not part of compute in the current schema, but we keep them in details for storage
    if (notes.trim()) d.notes = notes.trim();
    return Math.round(typeDef.computeAmount(d) * 100) / 100;
  }, [typeDef, details, notes]);

  const validate = () => {
    if (!typeDef) return isAr ? 'اختر نوع الحركة' : 'Choose a transaction type';

    for (const f of typeDef.fields) {
      if (!f.required) continue;
      const v = details[f.key];
      if (f.type === 'text' || f.type === 'textarea') {
        const s = String(v ?? '').trim();
        if (!s) return isAr ? `الرجاء إدخال: ${f.labelAr}` : `Please enter: ${f.labelEn}`;
      }
      if (f.type === 'number') {
        const n = Number(v);
        if (!Number.isFinite(n)) return isAr ? `الرجاء إدخال: ${f.labelAr}` : `Please enter: ${f.labelEn}`;
        if (n < 0) return isAr ? `القيمة لا يمكن أن تكون سالبة: ${f.labelAr}` : `${f.labelEn} cannot be negative`;
      }
    }

    if (!Number.isFinite(computedAmount) || computedAmount <= 0) {
      return isAr ? 'المبلغ يجب أن يكون أكبر من صفر' : 'Amount must be greater than zero';
    }
    return null;
  };

  const handleSubmit = async () => {
    if (editingId && !isAdmin) return;
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    if (!residenceId || !fiscalMonth) return;
    if (!typeDef) return;

    const payloadBase = {
      residenceId,
      residenceName: activeResidences.find((r) => r.id === residenceId)?.name,
      fiscalMonth,
      kind,
      typeKey,
      transactionDate,
      amount: computedAmount,
      details: notes.trim() ? { ...details, notes: notes.trim() } : { ...details },
    };

    if (editingId) {
      await updateTransaction(editingId, payloadBase);
      setEditingId(null);
      setNotes('');
      setDetails(blankDetails());
      return;
    }

    await addTransaction(payloadBase);
    setDetails(blankDetails());
    setNotes('');
    setTransactionDate(today);
  };

  const sortedTx = useMemo(() => {
    const list = transactions
      .filter((t) => t.kind === kind)
      .slice()
      .sort((a, b) => String(b.transactionDate).localeCompare(String(a.transactionDate)));
    return list;
  }, [transactions, kind]);

  const handleEdit = (tx: FinanceTransaction) => {
    if (!isAdmin) return;
    setEditingId(tx.id);
    setKind(tx.kind);
    setTypeKey(tx.typeKey);
    setTransactionDate(tx.transactionDate);
    setDetails(tx.details || {});
    setNotes(String(tx.details?.notes || ''));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDetails(blankDetails());
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm(isAr ? 'هل تريد حذف هذه الحركة؟' : 'Delete this transaction?')) return;
    await deleteTransaction(id);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isAr ? 'حركات الدخل والمصروفات' : 'Income & Expenses Transactions'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? 'أضف تفاصيل كل حركة حسب نوعها (سيارات/مكيفات/مياه/غاز/بنزين/إيرادات...)'
              : 'Add transaction details by type (cars/AC/water/gas/gasoline/income...)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              await handleSubmit();
            }}
            disabled={!residenceId || !fiscalMonth || loading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4" />
            {editingId ? (isAr ? 'تحديث الحركة' : 'Update') : isAr ? 'إضافة حركة' : 'Add'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
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

      <Tabs value={kind} onValueChange={(v) => setKind(v as FinanceTransactionKind)}>
        <TabsList className="w-full justify-start md:w-auto">
          <TabsTrigger value="expense">{isAr ? 'المصروفات' : 'Expenses'}</TabsTrigger>
          <TabsTrigger value="income">{isAr ? 'الإيرادات' : 'Income'}</TabsTrigger>
        </TabsList>

        <TabsContent value="expense">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? 'إدخال مصروف' : 'Add expense'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{isAr ? 'نوع الحركة' : 'Transaction Type'}</label>
                  <Select value={typeKey} onValueChange={(v) => setTypeKey(v as FinanceTransactionTypeKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedTypeOptions.map((g, gi) => (
                        <React.Fragment key={g.group.key}>
                          <SelectGroup>
                            <SelectLabel>{isAr ? g.group.labelAr : g.group.labelEn}</SelectLabel>
                            {g.items.map((t) => (
                              <SelectItem key={t.key} value={t.key}>
                                {isAr ? t.labelAr : t.labelEn}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          {gi < groupedTypeOptions.length - 1 ? <SelectSeparator /> : null}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{isAr ? 'تاريخ الحركة' : 'Transaction Date'}</label>
                  <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                </div>
              </div>

              {!!typeDef?.detailsHelpAr && (
                <div className="text-xs text-muted-foreground">
                  {isAr ? typeDef.detailsHelpAr : typeDef.detailsHelpEn}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {typeDef?.fields.map((f) => {
                  const v = details[f.key];
                  if (f.type === 'textarea') {
                    return (
                      <div key={f.key} className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">{isAr ? f.labelAr : f.labelEn}</label>
                        <Textarea
                          value={String(v ?? '')}
                          onChange={(e) => setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={isAr ? f.placeholderAr : f.placeholderEn}
                        />
                      </div>
                    );
                  }

                  if (f.type === 'text') {
                    return (
                      <div key={f.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{isAr ? f.labelAr : f.labelEn}</label>
                        <Input
                          value={String(v ?? '')}
                          onChange={(e) => setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={isAr ? f.placeholderAr : f.placeholderEn}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{isAr ? f.labelAr : f.labelEn}</label>
                      <NumInput value={typeof v === 'number' ? v : v === undefined ? undefined : Number(v)} onChange={(n) => setDetails((prev) => ({ ...prev, [f.key]: n }))} />
                    </div>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">{isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isAr ? 'مثل: فاتورة رقم...' : 'e.g. Invoice #...'} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  {isAr ? 'المبلغ المحسوب' : 'Computed Amount'}
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatMoneySAr(computedAmount)} SAR
                </div>
              </div>

              {editingId ? (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    {isAr ? 'إلغاء التعديل' : 'Cancel'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? 'إدخال إيراد' : 'Add income'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* نفس نموذج الإدخال (مختلف فقط نوع الحركة) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{isAr ? 'نوع الحركة' : 'Transaction Type'}</label>
                  <Select value={typeKey} onValueChange={(v) => setTypeKey(v as FinanceTransactionTypeKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedTypeOptions.map((g, gi) => (
                        <React.Fragment key={g.group.key}>
                          <SelectGroup>
                            <SelectLabel>{isAr ? g.group.labelAr : g.group.labelEn}</SelectLabel>
                            {g.items.map((t) => (
                              <SelectItem key={t.key} value={t.key}>
                                {isAr ? t.labelAr : t.labelEn}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          {gi < groupedTypeOptions.length - 1 ? <SelectSeparator /> : null}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{isAr ? 'تاريخ الحركة' : 'Transaction Date'}</label>
                  <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                </div>
              </div>

              {!!typeDef?.detailsHelpAr && (
                <div className="text-xs text-muted-foreground">
                  {isAr ? typeDef.detailsHelpAr : typeDef.detailsHelpEn}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {typeDef?.fields.map((f) => {
                  const v = details[f.key];
                  if (f.type === 'textarea') {
                    return (
                      <div key={f.key} className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">{isAr ? f.labelAr : f.labelEn}</label>
                        <Textarea
                          value={String(v ?? '')}
                          onChange={(e) => setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={isAr ? f.placeholderAr : f.placeholderEn}
                        />
                      </div>
                    );
                  }

                  if (f.type === 'text') {
                    return (
                      <div key={f.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{isAr ? f.labelAr : f.labelEn}</label>
                        <Input
                          value={String(v ?? '')}
                          onChange={(e) => setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={isAr ? f.placeholderAr : f.placeholderEn}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{isAr ? f.labelAr : f.labelEn}</label>
                      <NumInput value={typeof v === 'number' ? v : v === undefined ? undefined : Number(v)} onChange={(n) => setDetails((prev) => ({ ...prev, [f.key]: n }))} />
                    </div>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">{isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isAr ? 'مثل: إيصال رقم...' : 'e.g. Receipt #...'} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  {isAr ? 'المبلغ المحسوب' : 'Computed Amount'}
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatMoneySAr(computedAmount)} SAR
                </div>
              </div>

              {editingId ? (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    {isAr ? 'إلغاء التعديل' : 'Cancel'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">{isAr ? 'قائمة الحركات' : 'Transactions List'}</CardTitle>
          <Badge variant="secondary" className="gap-2">
            {loading ? (isAr ? 'جاري التحميل...' : 'Loading...') : `${sortedTx.length} ${isAr ? 'حركة' : 'items'}`}
          </Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sortedTx.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">{isAr ? 'لا توجد حركات لهذا الشهر.' : 'No transactions for this month.'}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? 'النوع' : 'Kind'}</TableHead>
                  <TableHead>{isAr ? 'التفاصيل' : 'Details'}</TableHead>
                  <TableHead className="text-right">{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="text-right">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                  <TableHead className="text-right">{isAr ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTx.map((tx) => {
                  const def = getTransactionTypeDef(tx.typeKey);
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={tx.kind === 'expense' ? 'destructive' : 'secondary'} className="font-semibold">
                            {tx.kind === 'expense' ? (isAr ? 'مصروف' : 'Expense') : isAr ? 'إيراد' : 'Income'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{isAr ? def?.labelAr : def?.labelEn}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[36ch]">{transactionSubtitle(tx)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{tx.transactionDate}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoneySAr(tx.amount)} SAR
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(tx)} aria-label="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(tx.id)}
                            aria-label="Delete"
                            className="border-rose-300 text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function IncomeExpenseTransactionsPage() {
  return (
    <IncomeExpenseTransactionsProvider>
      <IncomeExpenseTransactionsContent />
    </IncomeExpenseTransactionsProvider>
  );
}

