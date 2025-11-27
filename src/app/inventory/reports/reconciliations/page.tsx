'use client';


import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useInventory } from '@/context/inventory-context';
import { useUsers } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PrintLayout } from '@/components/reports/print-layout';


export default function ReconciliationsListPage() {
  const { getAllReconciliations } = useInventory();
  const { currentUser } = useUsers();
  const { residences } = useResidences();
  const { dict } = useLanguage();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role === 'Admin';
  const allowed = new Set(currentUser?.assignedResidences || []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const recs = await getAllReconciliations();
      if (!cancelled) setData(recs);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [getAllReconciliations]);

  const filtered = useMemo(() => {
    if (isAdmin) return data;
    return data.filter((r) => allowed.has(String(r.residenceId)));
  }, [data, allowed, isAdmin]);

  const residenceNameById = useMemo(() => {
    const map = new Map<string, string>();
    (residences || []).forEach((r) => map.set(String(r.id), r.nameEn || r.nameAr || r.name || dict.unknownResidence));
    return map;
  }, [residences, dict.unknownResidence]);

  const exportToCSV = () => {
    const headers = [dict.date, dict.referenceLabel, dict.residenceLabel, dict.itemsLabel, dict.increaseLabel, dict.decreaseLabel];
    const rows = filtered.map((r) => {
      const d = r.date?.toDate?.() ? r.date.toDate() : new Date();
      const residenceName = residenceNameById.get(String(r.residenceId)) || String(r.residenceId);
      return [
        `"${d.toLocaleString()}"`,
        `"${r.id}"`,
        `"${residenceName}"`,
        r.itemCount,
        r.totalIncrease,
        r.totalDecrease
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliations-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PrintLayout title={dict.reconciliationsTitle}>
        <div className="flex justify-center items-center h-64">
          <Skeleton className="h-24 w-full" />
        </div>
      </PrintLayout>
    );
  }

  return (
    <PrintLayout title={dict.reconciliationsTitle} description={dict.allReconciliations}>
      <div className="flex justify-end mb-4 print:hidden">
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> {dict.exportCsvButton || 'Export CSV'}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">{dict.date}</TableHead>
              <TableHead className="text-left">{dict.referenceLabel}</TableHead>
              <TableHead className="text-left">{dict.residenceLabel}</TableHead>
              <TableHead className="text-left">{dict.itemsLabel}</TableHead>
              <TableHead className="text-left">{dict.increaseLabel}</TableHead>
              <TableHead className="text-left">{dict.decreaseLabel}</TableHead>
              <TableHead className="text-left">{dict.viewLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground h-32">{dict.noReconciliationsFound}</TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const d = r.date?.toDate?.() ? r.date.toDate() : new Date();
                const residenceName = residenceNameById.get(String(r.residenceId)) || String(r.residenceId);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{d.toLocaleString()}</TableCell>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{residenceName}</TableCell>
                    <TableCell>{r.itemCount}</TableCell>
                    <TableCell className="text-green-700">{r.totalIncrease}</TableCell>
                    <TableCell className="text-red-700">{r.totalDecrease}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/inventory/reports/reconciliations/${r.id}`}>{dict.viewLabel}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .shadow-lg, .shadow, .border { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </PrintLayout>
  );
}
