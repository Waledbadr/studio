'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, Loader2, Search, ChevronDown } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, orderBy, query, setDoc, Timestamp } from 'firebase/firestore';
import { useUsers } from '@/context/users-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';

// MRV with Admin approval, UI similar to New Order
export default function NewMRVApprovalPage() {
  const { items, loading, categories, addItem, getStockForResidence, updateItem } = useInventory();
  const { residences, loadResidences } = useResidences();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const router = useRouter();

  const [residenceId, setResidenceId] = useState('');
  const [lines, setLines] = useState<Record<string, number>>({});
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (residences.length === 0) loadResidences();
  }, [loadResidences, residences.length]);

  const filteredResidences = useMemo(() => {
    const ids = currentUser?.assignedResidences || [];
    return residences.filter(r => ids.includes(r.id));
  }, [residences, currentUser]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    const matches = (it: InventoryItem) => {
      if (tokens.length === 0) return true;
      const hay = [
        it.nameEn?.toLowerCase?.() || '',
        it.nameAr?.toLowerCase?.() || '',
        it.category?.toLowerCase?.() || '',
        it.unit?.toLowerCase?.() || '',
        ...(it.variants || []).map(v => (v || '').toLowerCase()),
        ...(it.keywordsAr || []).map(k => (k || '').toLowerCase()),
        ...(it.keywordsEn || []).map(k => (k || '').toLowerCase()),
      ].join(' ');
      return tokens.every(t => hay.includes(t));
    };
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesCategory && matches(item);
    });
  }, [items, selectedCategory, searchQuery]);

  // Determine if the typed name already exists (exact match AR/EN)
  const canQuickAdd = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    const exists = items.some(it => (it.nameEn || '').toLowerCase() === q || (it.nameAr || '').toLowerCase() === q);
    return !exists;
  }, [items, searchQuery]);

  const setQty = (id: string, q: number) => setLines(prev => ({ ...prev, [id]: Math.max(0, isNaN(q) ? 0 : q) }));
  const addOne = (item: InventoryItem) => setQty(item.id, (lines[item.id] || 0) + 1);
  const removeLine = (id: string) => setLines(({ [id]: _, ...rest }) => rest);

  const selectedLines = useMemo(() => Object.entries(lines)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([id, qty]) => {
      const it = items.find(x => x.id === id)!;
      return { id, nameAr: it.nameAr, nameEn: it.nameEn, unit: it.unit, category: it.category, quantity: Number(qty) };
    }), [lines, items]);

  const totalQty = selectedLines.reduce((s, l) => s + l.quantity, 0);

  // Per-line stock check (for the selected residence)
  const lineWarnings = useMemo(() => {
    const map: Record<string, { stock: number; noNeed: boolean }> = {};
    for (const line of selectedLines) {
      const it = items.find(i => i.id === line.id);
      const stock = residenceId && it ? (getStockForResidence?.(it as any, residenceId) || 0) : 0;
      const noNeed = !!residenceId && stock >= line.quantity && line.quantity > 0;
      map[line.id] = { stock, noNeed };
    }
    return map;
  }, [selectedLines, items, residenceId, getStockForResidence]);

  const hasBlockingLines = useMemo(() => Object.values(lineWarnings).some(w => w.noNeed), [lineWarnings]);

  const handleSubmit = async () => {
    if (!db) {
      toast({ title: 'Error', description: 'Firestore not configured.', variant: 'destructive' });
      return;
    }
    if (!residenceId) {
      toast({ title: 'Error', description: 'Choose a residence.', variant: 'destructive' });
      return;
    }
    if (!supplierName.trim() || !invoiceNo.trim()) {
      toast({ title: 'Error', description: 'Supplier and Invoice No. are required.', variant: 'destructive' });
      return;
    }
    if (!file) {
      toast({ title: 'Error', description: 'Invoice attachment is required.', variant: 'destructive' });
      return;
    }
    if (selectedLines.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one quantity.', variant: 'destructive' });
      return;
    }

    // Prevent submission if any selected line quantity is already available in stock
    if (hasBlockingLines) {
      const first = selectedLines.find(l => lineWarnings[l.id]?.noNeed);
      if (first) {
        const stock = lineWarnings[first.id]?.stock || 0;
        toast({ title: 'لا حاجة للشراء', description: `${first.nameAr} متوفر في المخزون (الكمية: ${stock}). عدّل الكمية أو احذف الصنف.`, variant: 'destructive' });
      } else {
        toast({ title: 'لا حاجة للشراء', description: 'بعض الأصناف متوفرة بالمخزون. عدّل الكميات أو احذف الأصناف.', variant: 'destructive' });
      }
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentPath: string | null = null;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/uploads/mrv-invoice', { method: 'POST', body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Upload failed');
        }
        const data = await res.json();
        attachmentUrl = data.url;
        attachmentPath = data.path;
      }
      const reqRef = doc(collection(db, 'mrvRequests'));
      await setDoc(reqRef, {
        id: reqRef.id,
        residenceId,
        items: selectedLines.map(l => ({ id: l.id, nameEn: l.nameEn, nameAr: l.nameAr, quantity: l.quantity })),
        supplierName,
        invoiceNo,
        attachmentUrl,
        attachmentPath,
        notes: notes || null,
        status: 'Pending',
        requestedById: currentUser?.id || null,
        requestedAt: Timestamp.now(),
      });

      toast({ title: 'Submitted', description: 'MRV request submitted for admin approval.' });
      router.push('/inventory/receive');
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e?.message || 'Failed to submit MRV request.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New MRV (Requires Admin Approval)</h1>
          <p className="text-muted-foreground">Create a receipt request with supplier and invoice attachment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAddItemOpen(true)}>+ Add New Item</Button>
          <Button onClick={handleSubmit} disabled={submitting || !residenceId || hasBlockingLines}>
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : `Submit (${totalQty})`}
          </Button>
        </div>
      </div>
      {hasBlockingLines && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <div className="font-medium text-destructive">تنبيه</div>
          <div className="text-muted-foreground">هناك أصناف لا حاجة لشرائها لأن الكمية المطلوبة متوفرة في المخزون. عدّل الكميات أو احذف الأصناف المظللة باللون الأحمر.</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
          <CardDescription>Residence and supplier details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Residence</Label>
            <select className="border rounded h-10 px-3 bg-background" value={residenceId} onChange={(e) => setResidenceId(e.target.value)}>
              <option value="">Select residence</option>
              {filteredResidences.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Required" />
          </div>
          <div className="space-y-2">
            <Label>Invoice No.</Label>
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Required" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Invoice Attachment</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Available Inventory</CardTitle>
            <CardDescription>Add items to the receipt</CardDescription>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search items..." className="pl-8 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[450px] overflow-auto pr-2">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading items…</div>
              ) : filteredItems.length > 0 ? (
                <>
                  {canQuickAdd && (
                    <div className="flex items-center justify-between p-2 rounded-md border border-dashed bg-muted/10">
                      <div className="text-sm">
                        لم يتم العثور على "{searchQuery}" كصنف مطابق.
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setAddItemOpen(true)}>+ إضافة صنف جديد</Button>
                    </div>
                  )}
                  {filteredItems.map(it => (
                    <div key={it.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                      <div>
                        <p className="font-medium">{it.nameAr} / {it.nameEn}</p>
                        <p className="text-sm text-muted-foreground">{it.category} • {it.unit} {residenceId ? `• المتوفر: ${getStockForResidence?.(it as any, residenceId) || 0}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={0} className="w-24 text-center" value={lines[it.id] ?? 0} onChange={(e) => setQty(it.id, parseInt(e.target.value, 10))} />
                        <Button size="sm" variant="outline" onClick={() => addOne(it)}>+1</Button>
                        {Array.isArray(it.variants) && it.variants.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="px-2" aria-label="Add by variant">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {it.variants.map((v) => (
                                <DropdownMenuItem key={v} onSelect={(e) => { e.preventDefault(); addOne(it); }}>
                                  Add: {v}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        
                        <Button size="sm" variant="ghost" onClick={() => { setItemToEdit(it); setEditItemOpen(true); }}>Edit</Button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-10 space-y-3">
                  <div>لا توجد أصناف مطابقة للبحث.</div>
                  {canQuickAdd && (
                    <Button size="sm" onClick={() => setAddItemOpen(true)}>+ إضافة "{searchQuery}" كصنف جديد</Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Receipt</CardTitle>
            <CardDescription>Review and adjust selected items</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[150px] text-center">Quantity</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedLines.length > 0 ? selectedLines.map(line => (
                  <TableRow key={line.id} className={lineWarnings[line.id]?.noNeed ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{line.nameAr} / {line.nameEn}<div className="text-xs text-muted-foreground">{line.category}</div></TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <Input type="number" min={0} className="w-24 text-center mx-auto" value={line.quantity} onChange={(e) => setQty(line.id, parseInt(e.target.value, 10))} />
                        {residenceId && (
                          <div className={`text-[11px] ${lineWarnings[line.id]?.noNeed ? 'text-destructive' : 'text-muted-foreground'}`}>
                            المتوفر: {lineWarnings[line.id]?.stock || 0}
                            {lineWarnings[line.id]?.noNeed && ' • لا حاجة للشراء'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { const it = items.find(i => i.id === line.id); if (it) { setItemToEdit(it); setEditItemOpen(true); } }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)}>Remove</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-60 text-center text-muted-foreground">No items selected.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Dialog */}
      <AddItemDialog
        isOpen={addItemOpen}
        onOpenChange={setAddItemOpen}
        onItemAdded={addItem}
        initialName={searchQuery}
        onItemAddedAndOrdered={(newItem) => {
          // When user clicks "Save & Add to Order", prefill quantity 1 and scroll to receipt
          setLines(prev => ({ ...prev, [newItem.id]: (prev[newItem.id] || 0) + 1 }));
          setAddItemOpen(false);
        }}
      />

      <EditItemDialog
        isOpen={editItemOpen}
        onOpenChange={(open) => { setEditItemOpen(open); if (!open) setItemToEdit(null); }}
        onItemUpdated={updateItem}
        item={itemToEdit}
      />
    </div>
  );
}
