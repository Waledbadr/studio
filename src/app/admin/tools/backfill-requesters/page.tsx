'use client';

import React, { useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, limit, query, orderBy } from 'firebase/firestore';
import { useUsers } from '@/context/users-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BackfillRequesterNamesPage() {
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const isAdmin = currentUser?.role === 'Admin';

  const disabled = useMemo(() => !db || !isAdmin || busy, [isAdmin, busy]);

  const runBackfill = async () => {
    if (!db) return;
    if (!isAdmin) {
      toast({ title: 'Not allowed', description: 'Admins only.' , variant: 'destructive'});
      return;
    }
    setBusy(true);
    try {
      // Fetch recent orders first; can be adjusted
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('date', 'desc'), limit(200)));
      let updated = 0;
      for (const od of ordersSnap.docs) {
        const odata = od.data() as any;
        if (odata.requestedByName && odata.requestedByEmail) continue; // already filled
        const requesterId: string | undefined = odata.requestedById;
        if (!requesterId) continue;
        // Try users/{requestedById}
        try {
          const usnap = await getDoc(doc(db, 'users', requesterId));
          let name: string | undefined = undefined;
          let email: string | undefined = undefined;
          if (usnap.exists()) {
            const u = usnap.data() as any;
            name = u?.name || undefined;
            email = u?.email || undefined;
          }
          // If nothing found, but order already has an email, keep it
          email = email || odata.requestedByEmail || undefined;
          if (name || email) {
            await updateDoc(doc(db, 'orders', od.id), {
              requestedByName: name || odata.requestedByName || null,
              requestedByEmail: email || odata.requestedByEmail || null,
            });
            updated++;
          }
        } catch {}
      }
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
