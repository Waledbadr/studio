'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useInventory } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useResidences } from '@/context/residences-context';
import { Printer } from 'lucide-react';

export default function MRVDetailsPage() {
  const { getMRVById, items: inventoryItems } = useInventory();
  const { residences, loadResidences } = useResidences();
  const params = useParams();
  const router = useRouter();
  const mrvId = (params?.id as string) || '';

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

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

  // Merge duplicate items by itemId and attach unit from inventory
  const mergedItems = useMemo(() => {
    const list = data?.items || [];
    const byId = new Map<string, { itemId: string; itemNameEn: string; itemNameAr: string; quantity: number; unit?: string }>();
    const getUnit = (itemId: string): string | undefined => {
      const exact = inventoryItems?.find(i => i.id === itemId);
      if (exact) return exact.unit;
      const baseId = itemId.split('-')[0];
      const base = inventoryItems?.find(i => i.id === baseId);
      return base?.unit;
    };
    for (const it of list) {
      const key = it.itemId;
      const existing = byId.get(key);
      if (existing) {
        existing.quantity += Number(it.quantity || 0);
      } else {
        byId.set(key, {
          itemId: it.itemId,
          itemNameEn: it.itemNameEn,
          itemNameAr: it.itemNameAr,
          quantity: Number(it.quantity || 0),
          unit: getUnit(it.itemId) || undefined,
        });
      }
    }
    // Sort by name EN for stable print order
    return Array.from(byId.values()).sort((a, b) => (a.itemNameEn || '').localeCompare(b.itemNameEn || ''));
  }, [data?.items, inventoryItems]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Material Receive Voucher</h1>
          <p className="text-muted-foreground">MRV: {mrvId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print MRV
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
        </div>
      </div>
      <style jsx global>{`
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
            @media print {
              html, body { height: auto !important; }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-size: 13px !important;
                line-height: 1.25 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .text-muted-foreground { color: #111 !important; }
              .printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background-color: white !important;
                color: black !important;
              }
              .no-print { display: none !important; }
              .print-compact-table { border-collapse: collapse !important; width: 100% !important; }
              .print-compact-table thead th {
                font-weight: 700 !important;
                font-size: 10px !important;
                padding: 3px 6px !important;
                background: #f2f3f5 !important;
                border-bottom: 1px solid #e2e8f0 !important;
                color: #111 !important;
                white-space: nowrap !important;
              }
              .print-compact-table tbody td {
                font-size: 10px !important;
                padding: 2px 6px !important;
                border-top: 1px solid #f1f5f9 !important;
                vertical-align: middle !important;
              }
              .print-header-title { font-size: 22px !important; margin-bottom: 2px !important; font-weight: 800 !important; }
              .print-id { font-size: 16px !important; font-weight: 700 !important; color: #1f2937 !important; }
              .print-residence-title { font-size: 22px !important; font-weight: 800 !important; }
              .print-date { font-size: 14px !important; color: #1f2937 !important; }
              .print-total { margin-top: 6px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; font-size: 11px !important; }
              .print-signatures { margin-top: 8px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; }
              .print-signatures .slot { width: 120px !important; margin-top: 6px !important; }
              .print-signatures .label { font-size: 10px !important; color: #111 !important; }
              .print-signatures .line { border-top: 1px solid #000 !important; width: 90px !important; margin-top: 6px !important; }
            }
          `}</style>

      <Card className="printable-area">
        <CardHeader className="border-b print:border-b-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl print-header-title">Material Receive Voucher (MRV)</CardTitle>
              <CardDescription className="text-lg print-id">MRV: #{mrvId}</CardDescription>
            </div>
            <div className="text-right">
              <p className="font-semibold print-residence-title" style={{ fontWeight: 700 }}>{residenceName(data?.residenceId)}</p>
              <p className="text-sm text-muted-foreground print-date">{data?.date ? format(data.date.toDate(), 'PPP') : '-'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* MRV Meta in two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Date • التاريخ:</span><span className="font-medium">{data?.date ? format(data.date.toDate(), 'PPpp') : '-'}</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Residence • الموقع:</span><span className="font-medium">{residenceName(data?.residenceId)}</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Supplier • المورد:</span><span className="font-medium">{data?.supplierName || '-'}</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Invoice No. • رقم الفاتورة:</span><span className="font-medium">{data?.invoiceNo || '-'}</span></div>
          </div>

          {/* Items table (merged duplicates) */}
          <div className="mt-6">
            <Table className="print-compact-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">الصنف • Item</TableHead>
                  <TableHead className="w-[15%] text-center">الوحدة • Unit</TableHead>
                  <TableHead className="w-[25%] text-right">الكمية • Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedItems.length ? mergedItems.map((it: any) => (
                  <TableRow key={it.itemId} className="text-[10px]">
                    <TableCell className="font-medium py-1">{it.itemNameEn} | {it.itemNameAr}</TableCell>
                    <TableCell className="text-center py-1">{it.unit || '-'}</TableCell>
                    <TableCell className="text-right font-medium py-1">{it.quantity}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-40 text-center text-muted-foreground">No items</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 text-right font-bold text-lg pr-4 border-t pt-4 print-total">
            Total Qty: {mergedItems.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0)}
          </div>
        </CardContent>

        <CardFooter className="mt-8 pt-4 border-t print-signatures">
          <div className="grid grid-cols-2 gap-8 w-full">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground label">Received By:</p>
              <div className="mt-2 border-t-2 w-48 line slot"></div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground label">Checked By:</p>
              <div className="mt-2 border-t-2 w-48 line slot"></div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
