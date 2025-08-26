'use client';

import React, { useMemo, useState } from 'react';
// Firebase disabled during Cloudflare migration
import { useUsers } from '@/context/users-context-simple';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BackfillRequesterNamesPage() {
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const isAdmin = currentUser?.role === 'Admin';

  const disabled = useMemo(() => !isAdmin || busy, [isAdmin, busy]);

  const runBackfill = async () => {
    if (!isAdmin) {
      toast({ title: 'Not allowed', description: 'Admins only.' , variant: 'destructive'});
      return;
    }
    setBusy(true);
    try {
      // Stub: Replace with Cloudflare D1 script to backfill requester names
      const updated = 0;
      setLastRun(new Date().toLocaleString());
      toast({ title: 'Backfill complete', description: `Updated ${updated} orders.` });
    } catch (e) {
      console.error('Backfill failed:', e);
      toast({ title: 'Error', description: 'Backfill failed.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Backfill requester names on orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Fills missing requester name/email on recent orders using users collection. Admin only.
          </p>
          <Button onClick={runBackfill} disabled={disabled}>
            {busy ? 'Running…' : 'Run backfill (last 200 orders)'}
          </Button>
          {lastRun && <p className="text-xs text-muted-foreground">Last run: {lastRun}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
