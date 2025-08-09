'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useInventory } from '@/context/inventory-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function ReconciliationsListPage() {
  const { getAllReconciliations } = useInventory();
  const { currentUser } = useUsers();

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reconciliations</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All reconciliations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No reconciliations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Date</TableHead>
                    <TableHead className="text-left">Reference</TableHead>
                    <TableHead className="text-left">Residence</TableHead>
                    <TableHead className="text-left">Items</TableHead>
                    <TableHead className="text-left">Increase</TableHead>
                    <TableHead className="text-left">Decrease</TableHead>
                    <TableHead className="text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const d = r.date?.toDate?.() ? r.date.toDate() : new Date();
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{d.toLocaleString()}</TableCell>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{String(r.residenceId)}</TableCell>
                        <TableCell>{r.itemCount}</TableCell>
                        <TableCell className="text-green-700">{r.totalIncrease}</TableCell>
                        <TableCell className="text-red-700">{r.totalDecrease}</TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/inventory/reports/reconciliations/${r.id}`}>View</Link>
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
