"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useServiceOrders, type ServiceOrder } from "@/context/service-orders-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useUsers } from "@/context/users-context";
import { Printer, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ServiceOrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { getServiceOrderById, getServiceOrderByCode, receiveServiceOrder } = useServiceOrders();
  const { currentUser, getUserById } = useUsers();
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

  const handlePrint = () => {
    window.print();
  };

  const createdByName = order?.createdById ? getUserById(order.createdById)?.name : '';
  const receivedByName = order?.receivedById ? getUserById(order.receivedById)?.name : '';

  if (loading) return <div>Loading...</div>;
  if (!order) return <div className="text-center text-muted-foreground">Service Order not found.</div>;

  return (
    <div className="space-y-6">
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

          /* Compact table for printing */
          .print-compact-table { border-collapse: collapse !important; width: 100% !important; }
          .print-compact-table thead th {
            font-weight: 700 !important;
            font-size: 10px !important;
            padding: 4px 6px !important;
            background: #f2f3f5 !important;
            border-bottom: 1px solid #e2e8f0 !important;
            color: #111 !important;
            white-space: nowrap !important;
          }
          .print-compact-table tbody td {
            font-size: 10px !important;
            padding: 3px 6px !important;
            border-top: 1px solid #f1f5f9 !important;
            vertical-align: middle !important;
          }

          /* Tighten header area */
          .print-header-title { font-size: 22px !important; margin-bottom: 2px !important; font-weight: 800 !important; }
          .print-id { font-size: 16px !important; font-weight: 700 !important; color: #1f2937 !important; }
          .print-subtle { font-size: 10px !important; color: #4b5563 !important; }
          .print-badge { font-size: 10px !important; padding: 2px 8px !important; }

          /* Hide status badge on print */
          .status-badge { display: none !important; }

          /* Header right block: residence and date sizes */
          .print-residence-title { font-size: 22px !important; font-weight: 800 !important; }
          .print-date { font-size: 14px !important; color: #1f2937 !important; }

          /* Total row */
          .print-total { margin-top: 6px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; font-size: 11px !important; }

          /* Signatures compact */
          .print-signatures { margin-top: 8px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; }
          .print-signatures .slot { width: 120px !important; margin-top: 6px !important; }
          .print-signatures .label { font-size: 10px !important; color: #111 !important; }
          .print-signatures .line { border-top: 1px solid #000 !important; width: 90px !important; margin-top: 6px !important; }
        }
      `}</style>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print mb-6">
        <Button variant="outline" onClick={() => router.push('/inventory/service-orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Service Orders
        </Button>
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Service Order
        </Button>
      </div>

      <Card className="printable-area">
        <CardHeader className="border-b print:border-b-2">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-3xl print-title print-header-title">Service Order</CardTitle>
                    <CardDescription className="text-lg print-id">ID: #{order.codeShort}</CardDescription>
                </div>
                <div className="text-right">
                    <p className="font-semibold print-residence-title" style={{ fontWeight: 700 }}>{order.residenceName}</p>
                    <p className="text-sm text-muted-foreground print-date">
                        {order.dateCreated ? format(order.dateCreated.toDate(), "PPP") : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground print-date">
                        To: {order.destination?.name}
                    </p>
                    <Badge className="mt-2 print-badge status-badge" variant="outline">
                        {order.status}
                    </Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table className="print-compact-table">
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead className="text-right">Scrapped</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right no-print">Receive Return</TableHead>
                <TableHead className="text-right no-print">Record Scrap</TableHead>
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
                    <TableCell className="font-medium">{ln.itemNameEn} | {ln.itemNameAr}</TableCell>
                    <TableCell className="text-right">{ln.qtySent}</TableCell>
                    <TableCell className="text-right">{ln.qtyReturned}</TableCell>
                    <TableCell className="text-right">{ln.qtyScrapped}</TableCell>
                    <TableCell className="text-right">{out}</TableCell>
                    <TableCell className="text-right no-print">
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
                    <TableCell className="text-right no-print">
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

          <div className="flex justify-end mt-4 no-print">
            <Button onClick={submitReceive} disabled={order.status === "COMPLETED" || Object.values(deltas).every((d) => (d.addReturned || 0) + (d.addScrapped || 0) === 0)}>Post Receipt</Button>
          </div>

          <CardFooter className="mt-8 pt-4 border-t print-signatures hidden print:flex">
            <div className="grid grid-cols-2 gap-8 w-full">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground label">Created By:</p>
                    <p className="font-semibold print-subtle" style={{ fontWeight: 700 }}>{createdByName}</p>
                    <div className="mt-2 border-t-2 w-48 line slot"></div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground label">Received By:</p>
                    <p className="font-semibold print-subtle" style={{ fontWeight: 700 }}>{receivedByName}</p>
                    <div className="mt-2 border-t-2 w-48 line slot"></div>
                </div>
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}
