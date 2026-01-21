"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAccommodation } from '@/context/accommodation-context';
import { useToast } from '@/hooks/use-toast';
import { CreateTransferDialog } from '@/components/accommodation/create-transfer-dialog';
import { ArrowRightLeft, SlidersHorizontal, X } from 'lucide-react';
import type { Occupant, Worker } from '@/context/accommodation-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WorkersPage() {
  const ctx = useAccommodation();
  const { toast } = useToast();
  const workers: Worker[] = ctx.workers || [];
  const occupants: Occupant[] = ctx.occupants || [];
  const residences = ctx.residences || [];
  const saveWorker = ctx.saveWorker;
  const deleteWorker = ctx.deleteWorker;
  const migrate = ctx.migrateLocalWorkersToFirestore;

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ id: '', name: '', employeeId: '', idNumber: '', nationality: '', company: '', role: 'Worker' });
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedWorkersForTransfer, setSelectedWorkersForTransfer] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignment, setFilterAssignment] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [filterResidenceId, setFilterResidenceId] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState<number>(1);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  useEffect(() => { if (!editing) setForm({ id: '', name: '', employeeId: '', idNumber: '', nationality: '', company: '', role: 'Worker' }); }, [editing]);

  const activeOccupantByWorkerId = useMemo(() => {
    const map = new Map<string, Occupant>();
    for (const o of occupants) {
      // Active occupant: no `until` or explicit null.
      if (o?.workerId && (o.until == null || o.until === '')) {
        map.set(o.workerId, o);
      }
    }
    return map;
  }, [occupants]);

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    for (const w of workers) {
      const c = (w.company || '').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [workers]);

  function normalizeSearch(value: string) {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCompany('all');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterAssignment('all');
    setFilterResidenceId('all');
    setPageSize(50);
    setPage(1);
  };

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onClear: () => void }> = [];

    if (normalizeSearch(searchQuery)) {
      items.push({
        key: 'q',
        label: `بحث: ${searchQuery.trim()}`,
        onClear: () => setSearchQuery(''),
      });
    }

    if (filterCompany !== 'all') {
      items.push({
        key: 'company',
        label: `الشركة: ${filterCompany}`,
        onClear: () => setFilterCompany('all'),
      });
    }

    if (filterRole !== 'all') {
      items.push({
        key: 'role',
        label: `الدور: ${filterRole}`,
        onClear: () => setFilterRole('all'),
      });
    }

    if (filterStatus !== 'all') {
      items.push({
        key: 'status',
        label: `الحالة: ${filterStatus}`,
        onClear: () => setFilterStatus('all'),
      });
    }

    if (filterAssignment !== 'all') {
      const assignmentLabel = filterAssignment === 'assigned' ? 'مسكّن' : 'غير مسكّن';
      items.push({
        key: 'assignment',
        label: `التسكين: ${assignmentLabel}`,
        onClear: () => setFilterAssignment('all'),
      });
    }

    if (filterResidenceId !== 'all') {
      const residenceName = residences.find((r) => r.id === filterResidenceId)?.name || filterResidenceId;
      items.push({
        key: 'residence',
        label: `السكن: ${residenceName}`,
        onClear: () => setFilterResidenceId('all'),
      });
    }

    return items;
  }, [searchQuery, filterCompany, filterRole, filterStatus, filterAssignment, filterResidenceId, residences]);

  const filteredWorkers = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    const hasQuery = q.length > 0;
    const isNumericQuery = hasQuery && /\d/.test(q);

    return workers.filter((w) => {
      if (filterCompany !== 'all') {
        if ((w.company || '').trim() !== filterCompany) return false;
      }
      if (filterRole !== 'all') {
        if ((w.role || 'Worker') !== filterRole) return false;
      }
      if (filterStatus !== 'all') {
        if ((w.status || 'Active') !== filterStatus) return false;
      }

      const occ = activeOccupantByWorkerId.get(w.id);
      const isAssigned = !!occ;
      if (filterAssignment === 'assigned' && !isAssigned) return false;
      if (filterAssignment === 'unassigned' && isAssigned) return false;
      if (filterResidenceId !== 'all') {
        if (!occ || occ.residenceId !== filterResidenceId) return false;
      }

      if (!hasQuery) return true;

      const name = normalizeSearch(w.name);
      const employeeId = normalizeSearch(w.employeeId || '');
      const idNumber = normalizeSearch(w.idNumber || '');

      if (name.includes(q)) return true;
      if (employeeId && employeeId.includes(q)) return true;
      if (idNumber && idNumber.includes(q)) return true;

      // If user typed numbers, also allow loose matching after stripping non-digits.
      if (isNumericQuery) {
        const qDigits = q.replace(/\D+/g, '');
        if (!qDigits) return false;
        const employeeDigits = employeeId.replace(/\D+/g, '');
        const idDigits = idNumber.replace(/\D+/g, '');
        if (employeeDigits.includes(qDigits)) return true;
        if (idDigits.includes(qDigits)) return true;
      }

      return false;
    });
  }, [workers, searchQuery, filterCompany, filterRole, filterStatus, filterAssignment, filterResidenceId, activeOccupantByWorkerId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterCompany, filterRole, filterStatus, filterAssignment, filterResidenceId, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredWorkers.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedWorkers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredWorkers.slice(start, start + pageSize);
  }, [filteredWorkers, safePage, pageSize]);

  function startAdd() { setEditing('new'); setForm({ id: `w${Date.now()}`, name: '', employeeId: '', idNumber: '', nationality: '', company: '', role: 'Worker' }); }
  function startEdit(w: any) { setEditing(w.id); setForm({ id: w.id, name: w.name, employeeId: w.employeeId || '', idNumber: w.idNumber || '', nationality: w.nationality, company: w.company || '', role: w.role || 'Worker' }); }

  async function submit() {
    if (!saveWorker) {
      toast({ title: 'Not configured', description: 'Backend not configured and context helper missing.', variant: 'destructive' });
      return;
    }
    try {
      await saveWorker({
        id: form.id,
        name: form.name,
        employeeId: form.employeeId,
        idNumber: form.idNumber,
        nationality: form.nationality,
        company: form.company,
        role: form.role as any
      });
      toast({ title: 'Saved', description: 'Worker saved.' });
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save worker.', variant: 'destructive' });
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete worker?')) return;
    if (!deleteWorker) {
      // fallback local removal
      try {
        const raw = localStorage.getItem('ac_workers') || '[]';
        const arr = JSON.parse(raw).filter((w: any) => w.id !== id);
        localStorage.setItem('ac_workers', JSON.stringify(arr));
        toast({ title: 'Deleted (local)', description: 'Worker removed locally.' });
      } catch (e) { console.error(e); toast({ title: 'Error', description: 'Failed to delete locally.', variant: 'destructive' }); }
      return;
    }
    try {
      await deleteWorker(id);
      toast({ title: 'Deleted', description: 'Worker removed.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to delete worker.', variant: 'destructive' });
    }
  }

  const handleCreateTransfer = (workerIds: string[]) => {
    setSelectedWorkersForTransfer(workerIds);
    setTransferDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workers • العمال</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة بيانات العمال</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/accommodation/workers/import"
            className="rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            استيراد من Excel
          </Link>
          <Button onClick={startAdd} variant="outline">إضافة عامل</Button>
          <Button onClick={() => handleCreateTransfer([])} variant="outline" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            طلب نقل
          </Button>
          <Link href="/accommodation/assign" className="rounded-md bg-primary text-primary-foreground px-3 py-1 hover:bg-primary/90">التسكين</Link>
          <button onClick={async () => {
            if (!migrate) { toast({ title: 'Not configured', description: 'Migration requires Firestore configured.', variant: 'destructive' }); return; }
            const res = await migrate({ removeLocal: false });
            toast({ title: 'Migration completed', description: `${res.migrated} migrated, ${res.skipped} skipped, ${res.errors} errors.` });
          }} className="rounded-md border border-border bg-background px-3 py-1 hover:bg-accent">Migrate local → Firestore</button>
        </div>
      </div>

      <CreateTransferDialog
        isOpen={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        preSelectedWorkers={selectedWorkersForTransfer}
      />

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-right">
              <CardTitle className="text-lg">بحث وفلاتر</CardTitle>
              <div className="text-sm text-muted-foreground">
                عرض {pagedWorkers.length} من {filteredWorkers.length} (إجمالي {workers.length})
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={activeFilters.length === 0 && pageSize === 50 && safePage === 1}
              >
                مسح الكل
              </Button>

              <CollapsibleTrigger asChild>
                <Button variant="secondary" size="sm" className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  فلاتر متقدمة
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 justify-end">
              {activeFilters.map((f) => (
                <Badge
                  key={f.key}
                  variant="secondary"
                  className="gap-2 pr-1 pl-2 py-1 rounded-full flex items-center"
                >
                  <span className="text-xs">{f.label}</span>
                  <button
                    type="button"
                    onClick={f.onClear}
                    className="rounded-full p-1 hover:bg-background/60"
                    aria-label={`إزالة فلتر: ${f.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label className="block text-right mb-1">بحث (بالاسم / رقم الموظف / رقم الهوية)</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عامل..."
                dir="auto"
              />
            </div>

            <div>
              <Label className="block text-right mb-1">التسكين</Label>
              <Tabs value={filterAssignment} onValueChange={(v) => setFilterAssignment(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">الكل</TabsTrigger>
                  <TabsTrigger value="assigned">مسكّن</TabsTrigger>
                  <TabsTrigger value="unassigned">غير مسكّن</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <CollapsibleContent>
            <Separator className="my-4" />

            <div className="grid gap-3 md:grid-cols-5">
                <div>
                  <Label className="block text-right mb-1">الشركة</Label>
                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {uniqueCompanies.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-right mb-1">الدور</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="Worker">Worker</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Engineer">Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-right mb-1">الحالة</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Transferring">Transferring</SelectItem>
                      <SelectItem value="Vacation">Vacation</SelectItem>
                      <SelectItem value="Exit">Exit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="block text-right mb-1">السكن</Label>
                  <Select value={filterResidenceId} onValueChange={setFilterResidenceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {residences.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
          </CollapsibleContent>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 justify-end">
              <Label className="text-sm text-muted-foreground">حجم الصفحة</Label>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={safePage <= 1}>الأولى</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>السابق</Button>
              <div className="text-sm text-muted-foreground">صفحة {safePage} / {totalPages}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>التالي</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>الأخيرة</Button>
            </div>
          </div>

        {editing === null ? (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Click Add to create a new worker, or Edit on an existing one.</div>
          </div>
        ) : null}

        {editing !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">System ID</label>
              <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="w12345" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">رقم الموظف (Employee ID)</label>
              <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="37433" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">اسم العامل (Name)</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="Akram Naimu Deen" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">رقم الهوية (Iqama No)</label>
              <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="2326188378" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الجنسية (Nationality)</label>
              <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="Indian" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الشركة (Company)</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="SACODECO" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الدور (Role)</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full">
                <option>Worker</option>
                <option>Supervisor</option>
                <option>Engineer</option>
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button onClick={submit} className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 flex-1">حفظ (Save)</button>
              <button onClick={() => setEditing(null)} className="rounded-md border border-border bg-background px-4 py-2 hover:bg-accent flex-1">إلغاء (Cancel)</button>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right p-3 text-sm font-semibold text-foreground">رقم الموظف<br /><span className="text-xs font-normal text-muted-foreground">C_Number</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">اسم العامل<br /><span className="text-xs font-normal text-muted-foreground">Name</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">رقم الهوية<br /><span className="text-xs font-normal text-muted-foreground">Iqama No</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">الجنسية<br /><span className="text-xs font-normal text-muted-foreground">Nationality</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">الشركة<br /><span className="text-xs font-normal text-muted-foreground">Company</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">الدور<br /><span className="text-xs font-normal text-muted-foreground">Role</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">الحالة<br /><span className="text-xs font-normal text-muted-foreground">Status</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">السكن الحالي<br /><span className="text-xs font-normal text-muted-foreground">Residence</span></th>
                <th className="text-center p-3 text-sm font-semibold text-foreground">الإجراءات<br /><span className="text-xs font-normal text-muted-foreground">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {pagedWorkers.length ? pagedWorkers.map((w: Worker) => {
                const occ = activeOccupantByWorkerId.get(w.id);
                const residenceName = occ ? (residences.find(r => r.id === occ.residenceId)?.name || occ.residenceId) : '-';
                return (
                <tr key={w.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-sm text-foreground">{w.employeeId || '-'}</td>
                  <td className="p-3 text-sm font-medium text-foreground">{w.name}</td>
                  <td className="p-3 text-sm text-foreground font-mono">{w.idNumber || '-'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{w.nationality || '-'}</td>
                  <td className="p-3 text-sm text-foreground">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {w.company || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{w.role || 'Worker'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{w.status || 'Active'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{residenceName}</td>
                  <td className="p-3 text-sm">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => startEdit(w)} className="text-sm underline text-primary hover:text-primary/80 px-2 py-1">تعديل</button>
                      <button onClick={() => remove(w.id)} className="text-sm text-destructive hover:text-destructive/80 px-2 py-1">حذف</button>
                    </div>
                  </td>
                </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    {workers.length ? 'لا توجد نتائج مطابقة • No matching workers' : 'لا يوجد عمال • No workers'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>
      </Collapsible>
    </div>
  );
}
