'use client';

import React, { useEffect, useState } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function MRVReceiptsPage() {
  const { getMRVs } = useInventory();
  const { residences, loadResidences } = useResidences();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (residences.length === 0) loadResidences();
    (async () => {
      setLoading(true);
      try {
        const data = await getMRVs();
        setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [getMRVs, residences.length, loadResidences]);

  const residenceName = (id: string) => residences.find(r => r.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material Receipts</h1>
          <p className="text-muted-foreground">Latest MRVs posted to stock.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receipts</CardTitle>
          <CardDescription>{rows.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Residence</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
              ) : rows.length > 0 ? rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.id}</TableCell>
                  <TableCell>{r.date ? format(r.date.toDate(), 'PPP') : '-'}</TableCell>
                  <TableCell>{residenceName(r.residenceId)}</TableCell>
                  <TableCell>{r.itemCount ?? '-'}</TableCell>
                  <TableCell>{r.supplierName || '-'}</TableCell>
                  <TableCell>{r.invoiceNo || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/inventory/receive/receipts/${r.id}`)}>View</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">No receipts found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
