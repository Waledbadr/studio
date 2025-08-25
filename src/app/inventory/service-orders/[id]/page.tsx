"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useServiceOrders, type ServiceOrder } from "@/context/service-orders-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useUsers } from "@/context/users-context";

export default function ServiceOrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { getServiceOrderById, getServiceOrderByCode, receiveServiceOrder } = useServiceOrders();
  const { currentUser } = useUsers();
  const router = useRouter();

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [deltas, setDeltas] = useState<Record<string, { addReturned: number; addScrapped: number }>>({});
  // deltas holds per-line return/scrap values

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      // Allow opening by document id or by code short (e.g., SVC-2581)
      let o = await getServiceOrderById(id);
      if (!o && /^SVC-/i.test(id)) {
        o = await getServiceOrderByCode(id);
      }
      setOrder(o || null);
      setLoading(false);
    })();
  }, [id, getServiceOrderById, getServiceOrderByCode]);

  const setVal = (itemId: string, key: "addReturned" | "addScrapped", v: number, outstanding?: number) => {
    const raw = Math.max(0, Number(v) || 0);
    setDeltas((prev) => {
      const existing = prev[itemId] || { addReturned: 0, addScrapped: 0 };
      const proposed = { ...existing, [key]: raw } as { addReturned: number; addScrapped: number };
      if (typeof outstanding === 'number') {
        const total = (proposed.addReturned || 0) + (proposed.addScrapped || 0);
        if (total > outstanding) {
          const other = key === 'addReturned' ? (proposed.addScrapped || 0) : (proposed.addReturned || 0);
          proposed[key] = Math.max(0, outstanding - other);
        }
      }
      return { ...prev, [itemId]: proposed };
    });
  };

  const submitReceive = async () => {
    if (!order || !currentUser) return;
    const updates = Object.entries(deltas)
      .map(([itemId, d]) => ({ itemId, addReturned: d.addReturned || 0, addScrapped: d.addScrapped || 0 }))
      .filter((u) => (u.addReturned || 0) > 0 || (u.addScrapped || 0) > 0);
    if (updates.length === 0) return;
  await receiveServiceOrder(order.id, updates, currentUser.id);
  // Clear inputs and go back to list
  setDeltas({});
  router.push('/inventory/service-orders');
  };

  if (loading) return <div>Loading...</div>;
  if (!order) return <div className="text-center text-muted-foreground">Service Order not found.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Order {order.codeShort}</CardTitle>
          <CardDescription>
            {order.dateCreated ? format(order.dateCreated.toDate(), "PPP p") : ""} — {order.residenceName} → {order.destination?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead className="text-right">Scrapped</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Receive Return</TableHead>
                <TableHead className="text-right">Record Scrap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((ln) => {
                const out = (ln.qtySent || 0) - (ln.qtyReturned || 0) - (ln.qtyScrapped || 0);
                const delta = deltas[ln.itemId] || { addReturned: 0, addScrapped: 0 };
                const disabled = order.status === "COMPLETED" || out <= 0;
                const valReturned = disabled ? '' : (delta.addReturned || '');
                const valScrapped = disabled ? '' : (delta.addScrapped || '');
                return (
                  <TableRow key={ln.itemId}>
                    <TableCell>{ln.itemNameEn}</TableCell>
                    <TableCell className="text-right">{ln.qtySent}</TableCell>
                    <TableCell className="text-right">{ln.qtyReturned}</TableCell>
                    <TableCell className="text-right">{ln.qtyScrapped}</TableCell>
                    <TableCell className="text-right">{out}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        className={cn("w-24 ml-auto text-right")}
                        type="number"
                        min={0}
                        max={out}
                        value={valReturned}
                        disabled={disabled}
                        onChange={(e) => setVal(ln.itemId, "addReturned", Number(e.target.value), out)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        className={cn("w-24 ml-auto text-right")}
                        type="number"
                        min={0}
                        max={out}
                        value={valScrapped}
                        disabled={disabled}
                        onChange={(e) => setVal(ln.itemId, "addScrapped", Number(e.target.value), out)}
                        placeholder="0"
                      />
                      {/* We clamp to outstanding, so no error should appear */}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4">
            <Button onClick={submitReceive} disabled={order.status === "COMPLETED" || Object.values(deltas).every((d) => (d.addReturned || 0) + (d.addScrapped || 0) === 0)}>Post Receipt</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
