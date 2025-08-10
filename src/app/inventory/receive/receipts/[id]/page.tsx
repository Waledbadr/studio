'use client';

import React, { useEffect, useState } from 'react';
import { useInventory } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useResidences } from '@/context/residences-context';

export default function MRVDetailsPage() {
  const { getMRVById } = useInventory();
  const { residences, loadResidences } = useResidences();
  const params = useParams();
  const router = useRouter();
  const mrvId = (params?.id as string) || '';

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (residences.length === 0) loadResidences();
    if (!mrvId) return;
    (async () => {
      setLoading(true);
      try {
        const d = await getMRVById(mrvId);
        setData(d);
      } finally {
        setLoading(false);
      }
    })();
  }, [mrvId, getMRVById, residences.length, loadResidences]);

  const residenceName = (id: string) => residences.find(r => r.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receipt {mrvId}</h1>
          <p className="text-muted-foreground">Details and items received.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
          <CardDescription>Meta info</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">Date</div>
            <div className="font-medium">{data?.date ? format(data.date.toDate(), 'PPpp') : '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Residence</div>
            <div className="font-medium">{residenceName(data?.residenceId)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Supplier</div>
            <div className="font-medium">{data?.supplierName || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Invoice No.</div>
            <div className="font-medium">{data?.invoiceNo || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Lines received</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items?.length ? data.items.map((it: any, idx: number) => (
                <TableRow key={`${it.itemId}-${idx}`}>
                  <TableCell className="font-medium">{it.itemNameAr} / {it.itemNameEn}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-40 text-center text-muted-foreground">No items</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data?.attachmentUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Attachment</CardTitle>
            <CardDescription>Download or preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <a href={data.attachmentUrl} target="_blank" rel="noreferrer" className="underline text-primary">Open Attachment</a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
