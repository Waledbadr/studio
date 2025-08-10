'use client';

import React, { useMemo, useState } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function NewMRVPage() {
  const { items, createMRV, loading } = useInventory();
  const { residences } = useResidences();
  const { toast } = useToast();
  const router = useRouter();

  const [residenceId, setResidenceId] = useState('');
  const [lines, setLines] = useState<Record<string, number>>({});
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');

  const filteredItems = useMemo(() => items.sort((a, b) => a.nameEn.localeCompare(b.nameEn)), [items]);

  const handleQtyChange = (id: string, q: number) => {
    setLines(prev => ({ ...prev, [id]: Math.max(0, isNaN(q) ? 0 : q) }));
  };

  const handleSubmit = async () => {
    if (!residenceId) {
      toast({ title: 'Error', description: 'Choose a residence.', variant: 'destructive' });
      return;
    }
    const itemsToReceive = filteredItems
      .map(i => ({ id: i.id, nameEn: i.nameEn, nameAr: i.nameAr, quantity: Number(lines[i.id] || 0) }))
      .filter(l => l.quantity > 0);

    if (itemsToReceive.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one quantity.', variant: 'destructive' });
      return;
    }

    try {
      const id = await createMRV({
        residenceId,
        items: itemsToReceive,
        meta: { supplierName: supplierName || undefined, invoiceNo: invoiceNo || undefined }
      });
      router.push(`/inventory/receive`);
    } catch (e: any) {
      // error handled in context toast
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New MRV</h1>
          <p className="text-muted-foreground">Receive materials directly into stock.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Residence</Label>
            <select
              className="border rounded h-10 px-3 bg-background"
              value={residenceId}
              onChange={(e) => setResidenceId(e.target.value)}
            >
              <option value="">Select residence</option>
              {residences.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label>Invoice No.</Label>
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Optional" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-[160px] text-center">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(it => (
                <TableRow key={it.id}>
                  <TableCell>
                    <div className="font-medium">{it.nameAr} / {it.nameEn}</div>
                    <div className="text-xs text-muted-foreground">{it.category} • {it.unit}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min={0}
                      className="w-28 mx-auto text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={lines[it.id] ?? 0}
                      onChange={(e) => handleQtyChange(it.id, parseInt(e.target.value, 10))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>Create MRV</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
