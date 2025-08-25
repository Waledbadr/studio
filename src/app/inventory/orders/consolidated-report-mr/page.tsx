'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, LayoutGrid, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type AggregatedItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  unit: string;
  totalQuantity: number;
  variant?: string;
  note?: string;
};

export default function ConsolidatedReportMRPage() {
  const router = useRouter();
  const { orders, loading, loadOrders } = useOrders();
  const { currentUser } = useUsers();

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const data = useMemo(() => {
    if (loading) return null;

    const pending = orders.filter(o => o.status === 'Pending');
    const residenceNames = new Set<string>();
    const map = new Map<string, AggregatedItem>();

    const clean = (s?: string) => (s || '').includes(' - ') ? (s || '').split(' - ')[0] : (s || '');

    for (const o of pending) {
      if (o?.residence) residenceNames.add(o.residence);
      for (const it of o.items || []) {
        if (!it) continue;
        const variant = it.id && String(it.id).includes('-') ? String(it.id).split('-').slice(1).join('-') : undefined;
        const nameAr = clean(it.nameAr) || clean(it.nameEn) || '—';
        const nameEn = clean(it.nameEn) || clean(it.nameAr) || '—';
        const note = (it.notes || '').trim() || undefined;
        const keyBase = it.id || `${nameEn}-${nameAr}`;
        const key = note ? `${keyBase}__note:${note}` : keyBase;
        const existing = map.get(key);
        if (existing) {
          existing.totalQuantity += it.quantity || 0;
        } else {
          map.set(key, {
            id: key,
            nameAr,
            nameEn,
            category: (it.category || 'Uncategorized').trim(),
            unit: it.unit || '',
            totalQuantity: it.quantity || 0,
            variant,
            note,
          });
        }
      }
    }

    const items = Array.from(map.values()).sort((a, b) =>
      (a.category || '').localeCompare(b.category || '') || (a.nameAr || a.nameEn || '').localeCompare(b.nameAr || b.nameEn || '', 'ar')
    );

    const grouped = items.reduce((acc, it) => {
      const k = it.category || 'Uncategorized';
      (acc[k] ||= []).push(it);
      return acc;
    }, {} as Record<string, AggregatedItem[]>);

    return {
      grouped,
      totalAggregated: items.length,
      residences: Array.from(residenceNames),
    };
  }, [orders, loading]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Access Denied.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!data || Object.keys(data.grouped).length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No pending material requests found.</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @page { size: A4 portrait; margin: 5mm; }
        @media print {
          html, body { height: auto !important; }
          body {
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            font-size: 13px !important; line-height: 1.25 !important;
            margin: 0 !important; padding: 0 !important;
          }
          .printable-area { position: static; width: 100%; height: auto; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; background: #fff !important; }
          .no-print { display: none !important; }

          .print-compact-table { border-collapse: collapse !important; width: 100% !important; }
          .print-compact-table thead th {
            font-weight: 700 !important; font-size: 10px !important; padding: 4px 6px !important;
            background: #f2f3f5 !important; border-bottom: 1px solid #e2e8f0 !important; color: #111 !important; white-space: nowrap !important;
          }
          .print-compact-table tbody td { font-size: 10px !important; padding: 3px 6px !important; border-top: 1px solid #f1f5f9 !important; vertical-align: middle !important; }
          .print-compact-table .category-row td { padding-top: 4px !important; padding-bottom: 4px !important; background: #fafafa !important; color: #0f766e !important; font-weight: 700 !important; border-top: 1px solid #e2e8f0 !important; border-bottom: 1px solid #e2e8f0 !important; }
          .print-header-title { font-size: 16px !important; margin-bottom: 2px !important; }
          .print-subtle { font-size: 10px !important; color: #4b5563 !important; }
          .print-badge { font-size: 10px !important; padding: 2px 8px !important; }
          .print-total { margin-top: 6px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; font-size: 11px !important; }
          .print-signatures { margin-top: 8px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; }
          .print-signatures .slot { width: 120px !important; margin-top: 6px !important; }
          .print-signatures .label { font-size: 10px !important; color: #111 !important; }
          .print-signatures .line { border-top: 1px solid #000 !important; width: 90px !important; margin-top: 6px !important; }
          .print-notes { max-width: 240px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
        }
      `}</style>

      <div className="flex items-center justify-between no-print mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/inventory/orders/consolidated-report')}
            title="عرض التقرير الشبكي"
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            التقرير الشبكي
          </Button>
          <Button onClick={handlePrint} title="طباعة التقرير العادي">
            <Printer className="mr-2 h-4 w-4" />
            طباعة العادي
          </Button>
        </div>
      </div>

      <Card className="printable-area">
        <CardHeader className="border-b print:border-b-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl print-header-title">تقرير طلبات المواد المجمعة • Consolidated Materials Request</CardTitle>
              <CardDescription className="text-lg print-subtle">Date: {format(new Date(), 'PPP')}</CardDescription>
            </div>
            <div className="text-right">
              <Badge className="mt-2 print-badge" variant="secondary">Pending</Badge>
              {data.residences.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 justify-end">
                  {data.residences.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#e9f2ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{r}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Table className="print-compact-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">الصنف • Item</TableHead>
                <TableHead className="w-[30%]">ملاحظات • Notes</TableHead>
                <TableHead className="w-[10%]">وحدة • Unit</TableHead>
                <TableHead className="w-[15%] text-right">الكمية الإجمالية • Total Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.grouped).map(([category, items]) => (
                <React.Fragment key={category}>
                  <TableRow key={`cat-${category}`} className="bg-muted/50 hover:bg-muted/50 category-row">
                    <TableCell colSpan={4} className="font-semibold text-primary capitalize py-2">{category}</TableCell>
                  </TableRow>
                  {items.map((it) => {
                    const detail = [it.variant, it.note].filter(Boolean).join(' • ');
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.nameEn} | {it.nameAr}</TableCell>
                        <TableCell className="text-xs text-muted-foreground print-notes">{detail || '-'}</TableCell>
                        <TableCell>{it.unit}</TableCell>
                        <TableCell className="text-right font-semibold">{it.totalQuantity}</TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 text-right font-bold text-lg pr-4 border-t pt-4 print-total">
            Total Aggregated Items: {data.totalAggregated}
          </div>
        </CardContent>

        <CardFooter className="mt-8 pt-4 border-t print-signatures">
          <div className="grid grid-cols-3 gap-8 w-full">
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground label">Requested By</p>
              <div className="mt-2 border-t-2 w-48 mx-auto line slot"></div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground label">Approved By</p>
              <div className="mt-2 border-t-2 w-48 mx-auto line slot"></div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground label">Received By</p>
              <div className="mt-2 border-t-2 w-48 mx-auto line slot"></div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
