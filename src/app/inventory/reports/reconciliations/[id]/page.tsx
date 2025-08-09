'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useInventory } from '@/context/inventory-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function ReconciliationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { getReconciliationById, getReconciliationItems } = useInventory();

  const [header, setHeader] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      const [h, tx] = await Promise.all([
        getReconciliationById(id),
        getReconciliationItems(id),
      ]);
      if (!cancelled) {
        setHeader(h);
        setItems(tx);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, getReconciliationById, getReconciliationItems]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reconciliation {id}</h1>
        <Button asChild variant="outline"><Link href="/inventory/reports/reconciliations">Back</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {!header ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><div className="text-xs text-muted-foreground">Residence</div><div className="font-medium">{String(header.residenceId)}</div></div>
              <div><div className="text-xs text-muted-foreground">Date</div><div className="font-medium">{header.date?.toDate?.()?.toLocaleString?.() || ''}</div></div>
              <div><div className="text-xs text-muted-foreground">Items</div><div className="font-medium">{header.itemCount}</div></div>
              <div><div className="text-xs text-muted-foreground">Increase</div><div className="font-medium text-green-700">{header.totalIncrease}</div></div>
              <div><div className="text-xs text-muted-foreground">Decrease</div><div className="font-medium text-red-700">{header.totalDecrease}</div></div>
              <div><div className="text-xs text-muted-foreground">By</div><div className="font-medium">{header.performedById || '—'}</div></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No items found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Item</TableHead>
                    <TableHead className="text-left">Qty</TableHead>
                    <TableHead className="text-left">Direction</TableHead>
                    <TableHead className="text-left">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.itemNameEn || it.itemNameAr}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{it.adjustmentDirection || '—'}</TableCell>
                      <TableCell>{it.adjustmentReason || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
