'use client';

import { useEffect, useMemo, useState } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, FileText, ListFilter, RefreshCw, Save } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function StockReconciliationPage() {
  const { items, categories, loading, getStockForResidence, reconcileStock, getReconciliations } = useInventory();
  const { residences, loading: residencesLoading } = useResidences();
  const { currentUser } = useUsers();
  const { toast } = useToast();

  const [residenceId, setResidenceId] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(true);
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);
  const [newStock, setNewStock] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reconciliation history state
  type Rec = { id: string; residenceId: string; date: any; itemCount: number; totalIncrease: number; totalDecrease: number; performedById?: string };
  const [recons, setRecons] = useState<Rec[]>([]);
  const [reconsLoading, setReconsLoading] = useState(false);

  const safeCategories = useMemo(() => (categories || []).filter((c): c is string => !!c), [categories]);
  const safeResidences = useMemo(() => {
    const list = (residences || []).filter(r => !r.disabled);
    if (!currentUser) return list;
    const allowed = new Set(currentUser.assignedResidences || []);
    return list.filter(r => allowed.has(r.id));
  }, [residences, currentUser]);

  // Reset per-residence state
  useEffect(() => {
    setNewStock({});
    setReasons({});
  }, [residenceId]);

  // Load reconciliation history for the selected residence
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!residenceId) {
        setRecons([]);
        return;
      }
      setReconsLoading(true);
      try {
        const list = await getReconciliations(residenceId);
        if (!cancelled) setRecons(list as unknown as Rec[]);
      } catch (e) {
        // toast handled in context on error
      } finally {
        if (!cancelled) setReconsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [residenceId, getReconciliations]);

  const itemsForResidence = useMemo(() => {
    if (!residenceId) return [] as typeof items;
    const list = items.filter((it) => {
      const current = getStockForResidence(it, residenceId);
      if (showOnlyWithStock) return current > 0;
      return true;
    });
    return list;
  }, [items, residenceId, showOnlyWithStock, getStockForResidence]);

  const filtered = useMemo(() => {
    let list = itemsForResidence;
    if (categoryFilter) list = list.filter((it) => it.category === categoryFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (it) => it.nameAr?.toLowerCase().includes(q) || it.nameEn?.toLowerCase().includes(q)
      );
    }
    if (showOnlyChanged) {
      list = list.filter((it) => {
        if (!residenceId) return false;
        const current = getStockForResidence(it, residenceId);
        const next = Number(newStock[it.id] ?? NaN);
        return !Number.isNaN(next) && next !== current;
      });
    }
    return list.sort((a, b) => (a.nameAr || a.nameEn).localeCompare(b.nameAr || b.nameEn));
  }, [itemsForResidence, categoryFilter, query, showOnlyChanged, newStock, residenceId, getStockForResidence]);

  const summary = useMemo(() => {
    if (!residenceId) return { changed: 0, increase: 0, decrease: 0 };
    let changed = 0;
    let increase = 0;
    let decrease = 0;
    for (const it of itemsForResidence) {
      const curr = getStockForResidence(it, residenceId);
      const val = Number(newStock[it.id]);
      if (!Number.isFinite(val)) continue;
      if (val !== curr) {
        changed++;
        if (val > curr) increase += val - curr;
        else decrease += curr - val;
      }
    }
    return { changed, increase, decrease };
  }, [itemsForResidence, newStock, residenceId, getStockForResidence]);

  const applyReconciliation = async () => {
    if (!residenceId) {
      toast({ title: 'Please select a residence/building', variant: 'destructive' });
      return;
    }
    const adjustments = itemsForResidence
      .map((it) => {
        const curr = getStockForResidence(it, residenceId);
        const ns = Number(newStock[it.id]);
        if (!Number.isFinite(ns) || ns === curr) return null;
        return { itemId: it.id, newStock: Math.max(0, Math.trunc(ns)), reason: reasons[it.id] };
      })
      .filter(Boolean) as { itemId: string; newStock: number; reason?: string }[];

    if (adjustments.length === 0) {
      toast({ title: 'No changes to apply', description: 'Enter new quantities different from the system stock.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const ref = await reconcileStock(residenceId, adjustments, currentUser?.id);
      setNewStock({});
      setReasons({});
      toast({ title: 'Stock reconciled', description: `Movement recorded (Ref: ${ref}).` });
      // Refresh reconciliation list after reconcile
      const list = await getReconciliations(residenceId);
      setRecons(list as unknown as Rec[]);
    } catch (e: any) {
      // inventory context already toasts on error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || residencesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-6 border border-emerald-100 dark:border-emerald-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Stock Reconciliation</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Adjust per-residence stock quickly and log movements automatically
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Residence / Building</Label>
              <Select value={residenceId} onValueChange={(v) => setResidenceId(v)}>
                <SelectTrigger disabled={safeResidences.length === 0}>
                  <SelectValue placeholder={safeResidences.length === 0 ? 'No assigned residences' : 'Select residence'} />
                </SelectTrigger>
                <SelectContent>
                  {safeResidences.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">No assigned residences</div>
                  ) : (
                    safeResidences.map((r) => (
                      <SelectItem key={String(r.id)} value={String(r.id)}>{r.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter ?? 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {safeCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by Arabic or English name"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>View options</Label>
              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2">
                  <Checkbox checked={showOnlyWithStock} onCheckedChange={(v) => setShowOnlyWithStock(!!v)} />
                  <span className="text-sm">Show items with stock only</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox checked={showOnlyChanged} onCheckedChange={(v) => setShowOnlyChanged(!!v)} />
                  <span className="text-sm">Show changed only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-gray-600">Items changed</p><p className="text-2xl font-bold">{summary.changed}</p></div><ListFilter className="h-6 w-6 text-blue-500" /></CardContent></Card>
            <Card className="border-l-4 border-l-green-500"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-gray-600">Total increase</p><p className="text-2xl font-bold text-green-600">{summary.increase}</p></div><CheckCircle className="h-6 w-6 text-green-500" /></CardContent></Card>
            <Card className="border-l-4 border-l-red-500"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-gray-600">Total decrease</p><p className="text-2xl font-bold text-red-600">{summary.decrease}</p></div><AlertCircle className="h-6 w-6 text-red-500" /></CardContent></Card>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!residenceId ? (
            <div className="p-8 text-center text-gray-600">Select a residence to show items</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Item</TableHead>
                    <TableHead className="text-left">Category</TableHead>
                    <TableHead className="text-left">Unit</TableHead>
                    <TableHead className="text-left">System stock</TableHead>
                    <TableHead className="text-left">New stock</TableHead>
                    <TableHead className="text-left">Difference</TableHead>
                    <TableHead className="text-left">Reason (optional)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((it) => {
                    if (!residenceId) return null;
                    const curr = getStockForResidence(it, residenceId);
                    const valStr = newStock[it.id] ?? '';
                    const val = Number(valStr);
                    const valid = Number.isFinite(val);
                    const diff = valid ? val - curr : 0;
                    const changed = valid && val !== curr;
                    return (
                      <TableRow key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="font-medium">{it.nameEn || it.nameAr}</div>
                          <div className="text-xs text-gray-500">{it.nameAr && it.nameEn ? `${it.nameAr}` : ''}</div>
                        </TableCell>
                        <TableCell>{it.category}</TableCell>
                        <TableCell>{it.unit}</TableCell>
                        <TableCell className="font-medium">{curr}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={valStr}
                            onChange={(e) => {
                              const v = e.target.value;
                              setNewStock((s) => ({ ...s, [it.id]: v }));
                            }}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          {changed ? (
                            <Badge className={diff > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                              {diff > 0 ? `+${diff}` : diff}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={reasons[it.id] ?? ''}
                            onChange={(e) => setReasons((r) => ({ ...r, [it.id]: e.target.value }))}
                            placeholder="e.g. Damaged, Lost, Correction"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation history */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation history</CardTitle>
        </CardHeader>
        <CardContent>
          {!residenceId ? (
            <div className="text-sm text-gray-600">Select a residence to view reconciliations.</div>
          ) : reconsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : recons.length === 0 ? (
            <div className="text-sm text-gray-600">No reconciliations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Date</TableHead>
                    <TableHead className="text-left">Reference</TableHead>
                    <TableHead className="text-left">Items adjusted</TableHead>
                    <TableHead className="text-left">Total increase</TableHead>
                    <TableHead className="text-left">Total decrease</TableHead>
                    <TableHead className="text-left">By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recons.map((r) => {
                    const d = r.date?.toDate?.() ? r.date.toDate() : new Date();
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{d.toLocaleString()}</TableCell>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.itemCount}</TableCell>
                        <TableCell className="text-green-700">{r.totalIncrease}</TableCell>
                        <TableCell className="text-red-700">{r.totalDecrease}</TableCell>
                        <TableCell>{r.performedById || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {summary.changed > 0 ? (
            <span>{summary.changed} change(s) will be applied</span>
          ) : (
            <span>No changes</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setNewStock({});
              setReasons({});
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset values
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={applyReconciliation}
            disabled={!residenceId || summary.changed === 0 || isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Apply reconciliation & log
          </Button>
        </div>
      </div>
    </div>
  );
}
