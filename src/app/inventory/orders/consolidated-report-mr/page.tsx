'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { useInventory } from '@/context/inventory-context';
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
  note?: string; // kept for compatibility, not used in grouping/display
};

export default function ConsolidatedReportMRPage() {
  const router = useRouter();
  const { orders, loading, loadOrders } = useOrders();
  const { currentUser } = useUsers();
  const { getStockForResidence, items: allItems } = useInventory();

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const data = useMemo(() => {
    if (loading) return null;

  // Include common active statuses in the consolidated view
  const activeStatuses = new Set(['Pending', 'Approved', 'Partially Delivered'] as const);
  const pending = orders.filter(o => activeStatuses.has(o.status as any));
    const residenceNames = new Set<string>();
    const map = new Map<string, AggregatedItem>();

    const clean = (s?: string) => (s || '').includes(' - ') ? (s || '').split(' - ')[0] : (s || '');

    for (const o of pending) {
      if (o?.residence) residenceNames.add(o.residence);
      for (const it of o.items || []) {
        if (!it) continue;
        const nameAr = clean(it.nameAr) || clean(it.nameEn) || '—';
        const nameEn = clean(it.nameEn) || clean(it.nameAr) || '—';
        // Group by base item identity WITHIN SAME CATEGORY; ignore notes completely.
        // Try to derive a baseId by stripping known variant delimiters from id.
        const rawId = (it as any).id ?? (it as any).itemId;
        let baseId: string | undefined = rawId ? String(rawId) : undefined;
        if (baseId && baseId.includes('::')) baseId = baseId.split('::')[0];
        if (baseId && baseId.includes('-')) baseId = baseId.split('-')[0];
        const category = (it.category || 'Uncategorized').trim();
        const nameKey = `${(nameEn || '').toLowerCase()}__${(nameAr || '').toLowerCase()}`;
        const key = (baseId ? `${baseId}__cat:${category}` : `${nameKey}__cat:${category}`);
        const existing = map.get(key);
        if (existing) {
          existing.totalQuantity += it.quantity || 0;
          // keep first non-empty unit
          if (!existing.unit && it.unit) existing.unit = it.unit;
        } else {
          map.set(key, {
            id: key,
            nameAr,
            nameEn,
            category,
            unit: it.unit || '',
            totalQuantity: it.quantity || 0,
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

  // Pending orders list for print appendix
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'Pending'), [orders]);

  // Helper to format legacy IDs like in MR page
  const formatOrderId = (id: string) => {
    if (!id) return id;
    if (id.startsWith('MR-')) return id;
    const m = id.match(/^(\d{2})-(\d{2})-(\d{3})$/);
    if (m) {
      const yy = m[1];
      const mmNoPad = String(parseInt(m[2], 10));
      const seq = String(parseInt(m[3], 10));
      return `MR-${yy}${mmNoPad}${seq}`;
    }
    return id;
  };

  // Group pending orders by residence for appendix and build MR id list per residence for header
  const residenceMRs = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const o of pendingOrders) {
      const key = o.residence || '—';
      const arr = m.get(key) || [];
      arr.push(formatOrderId(o.id));
      m.set(key, arr);
    }
    return m;
  }, [pendingOrders]);

  const handlePrint = () => window.print();

  // Helper: split name into base and detail using " - " convention (used by appendix MR tables)
  const splitNameDetail = (name?: string): { base: string; detail: string } => {
    const raw = (name || '').trim();
    if (!raw) return { base: '', detail: '' };
    const parts = raw.split(' - ');
    if (parts.length <= 1) return { base: raw, detail: '' };
    return { base: parts[0].trim(), detail: parts.slice(1).join(' - ').trim() };
  };

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
        .only-print { display: none; }
        @media print {
          /* Notes bidi handling for appendix */
          .notes-cell { direction: rtl; text-align: left; unicode-bidi: isolate; }
          .notes-cell .bidi-notes { direction: rtl; unicode-bidi: plaintext; }
          html, body { height: auto !important; }
          body {
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            font-size: 13px !important; line-height: 1.25 !important;
            margin: 0 !important; padding: 0 !important;
          }
          /* Ensure high-contrast text when printing */
          .printable-area, .printable-area * { color: #000 !important; }
          .text-muted-foreground { color: #000 !important; }
          .printable-area { position: static; width: 100%; height: auto; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; background: #fff !important; }
          .no-print { display: none !important; }
          .only-print { display: block !important; }
          .page-break-before { break-before: page; page-break-before: always; }
          .order-page { break-inside: avoid; page-break-inside: avoid; margin-bottom: 8px !important; }
          .print-date { font-size: 14px !important; font-weight: 700 !important; color: #000 !important; }
          .status-badge { background: #f3f4f6 !important; color: #374151 !important; border: 1px solid #e5e7eb !important; }

          .print-compact-table { border-collapse: collapse !important; width: 100% !important; }
          .print-compact-table thead th {
            font-weight: 800 !important; font-size: 10px !important; padding: 4px 6px !important;
            background: #e5e7eb !important; border-bottom: 1px solid #9ca3af !important; color: #000 !important; white-space: nowrap !important;
          }
          .print-compact-table tbody td { font-size: 10px !important; padding: 3px 6px !important; border-top: 1px solid #d1d5db !important; vertical-align: middle !important; color: #000 !important; }
          .print-compact-table tbody td:first-child { font-weight: 700 !important; color: #000 !important; }
          .print-compact-table .category-row td { padding-top: 3px !important; padding-bottom: 3px !important; background: #f3f4f6 !important; color: #000 !important; font-weight: 800 !important; font-size: 11px !important; border-top: 1px solid #9ca3af !important; border-bottom: 1px solid #9ca3af !important; }
          .print-header-title { font-size: 22px !important; margin-bottom: 2px !important; font-weight: 800 !important; color: #000 !important; }
          .print-subtle { font-size: 10px !important; color: #000 !important; }
          .print-badge { font-size: 10px !important; padding: 2px 8px !important; }
          .residence-chip { font-size: 10px !important; padding: 1px 6px !important; }
          .print-total { margin-top: 4px !important; padding-top: 4px !important; border-top: 1px solid #e5e7eb !important; font-size: 11px !important; }
          .print-signatures { margin-top: 6px !important; padding-top: 4px !important; border-top: 1px solid #e5e7eb !important; }
          .print-signatures .slot { width: 120px !important; margin-top: 6px !important; }
          .print-signatures .label { font-size: 10px !important; color: #111 !important; }
          .print-signatures .line { border-top: 1px solid #000 !important; width: 90px !important; margin-top: 6px !important; }
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
              <CardTitle className="text-3xl print-header-title">Consolidated Materials Request • تقرير طلبات المواد المجمعة</CardTitle>
              {data.residences.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-3 items-start">
                  {data.residences.map((r) => (
                    <div key={r} className="flex flex-col items-start">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs residence-chip"
                        style={{ background: '#e9f2ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                      >
                        {r}
                      </span>
                      {residenceMRs.get(r) && residenceMRs.get(r)!.length > 0 && (
                        <div className="text-[10px] mt-1 text-gray-700 print-subtle" style={{ lineHeight: 1.1 }}>
                          {residenceMRs.get(r)!.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold print-date">{format(new Date(), 'PPP')}</div>
              <Badge className="mt-2 print-badge status-badge bg-gray-100 text-gray-700 border border-gray-300" variant="secondary">Pending</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Table className="print-compact-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Item</TableHead>
                <TableHead className="w-[15%]">Unit</TableHead>
                <TableHead className="w-[25%] text-right">Total Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.grouped).map(([category, items]) => (
                <React.Fragment key={category}>
                  <TableRow key={`cat-${category}`} className="bg-muted/50 hover:bg-muted/50 category-row">
                    <TableCell colSpan={3} className="font-bold text-primary capitalize py-2">{category}</TableCell>
                  </TableRow>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.nameEn} | {it.nameAr}</TableCell>
                      <TableCell>{it.unit}</TableCell>
                      <TableCell className="text-right font-semibold">{it.totalQuantity}</TableCell>
                    </TableRow>
                  ))}
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

      {/* Print-only appendix: list each Pending order with full MR-style table */}
  {/* Removed detailed per-residence appendix as requested: keep consolidated only */}
    </div>
  );
}
