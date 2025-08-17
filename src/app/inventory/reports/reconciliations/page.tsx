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

export default function ReconciliationsListPage() {
  const { getAllReconciliations } = useInventory();
  const { currentUser } = useUsers();
  const { residences } = useResidences();

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
    (residences || []).forEach((r) => map.set(String(r.id), r.name));
    return map;
  }, [residences]);

  const { dict } = useLanguage();

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{dict.reconciliationsTitle}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.allReconciliations}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">{dict.noReconciliationsFound}</div>
          ) : (
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
                  {filtered.map((r) => {
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
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
