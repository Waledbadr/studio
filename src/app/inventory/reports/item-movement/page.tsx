"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventory, type InventoryTransaction } from "@/context/inventory-context";
import { useResidences } from "@/context/residences-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

function ItemMovementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    getInventoryTransactions,
    items,
    loading: inventoryLoading,
    getStockForResidence,
    getMRVById,
    getMIVById,
    getReconciliationItems,
  } = useInventory();
  const { residences, loading: residencesLoading } = useResidences();

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<InventoryTransaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [docDetails, setDocDetails] = useState<any>(null);
  const [reconItems, setReconItems] = useState<any[]>([]);

  const itemId = searchParams.get("itemId");
  const residenceId = searchParams.get("residenceId");

  const item = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);
  const residence = useMemo(
    () => residences.find((r) => r.id === residenceId),
    [residences, residenceId]
  );

  useEffect(() => {
    if (itemId && !inventoryLoading && !residencesLoading) {
      setTransactionsLoading(true);
      if (residenceId) {
        // Single residence
        getInventoryTransactions(itemId, residenceId).then((data) => {
          const sortedData = data.sort(
            (a, b) => a.date.toMillis() - b.date.toMillis()
          );
          setTransactions(sortedData);
          setTransactionsLoading(false);
        });
      } else {
        // All residences
        Promise.all(
          residences.map((residence) =>
            getInventoryTransactions(itemId, residence.id)
          )
        ).then((results) => {
          const allTransactions = results.flat();
          const sortedData = allTransactions.sort(
            (a, b) => a.date.toMillis() - b.date.toMillis()
          );
          setTransactions(sortedData);
          setTransactionsLoading(false);
        });
      }
    }
  }, [itemId, residenceId, getInventoryTransactions, inventoryLoading, residencesLoading, residences]);

  const currentStock = useMemo(() => {
    if (!item) return 0;
    if (residenceId) {
      return getStockForResidence(item, residenceId);
    }
    return item.stock;
  }, [item, residenceId, getStockForResidence]);

  const getRelatedResidenceName = (relatedId: string | undefined) => {
    if (!relatedId) return "";
    return residences.find((r) => r.id === relatedId)?.name || "Unknown";
  };

  const getTransactionResidenceName = (transactionResidenceId: string) => {
    return (
      residences.find((r) => r.id === transactionResidenceId)?.name || "Unknown"
    );
  };

  const transactionsWithBalance = useMemo(
    (): Array<InventoryTransaction & { balance: number }> => {
      if (transactionsLoading || !item) return [] as any;

      const netMovement = transactions.reduce((acc, tx) => {
        const quantity =
          tx.type === "IN" || tx.type === "TRANSFER_IN" ? tx.quantity : -tx.quantity;
        return acc + quantity;
      }, 0);

      const startingBalance = (currentStock || 0) - netMovement;

      let runningBalance = startingBalance;
      return transactions
        .map((tx) => {
          runningBalance +=
            tx.type === "IN" || tx.type === "TRANSFER_IN"
              ? tx.quantity
              : -tx.quantity;
          return { ...(tx as any), balance: runningBalance };
        })
        .sort((a, b) => b.date.toMillis() - a.date.toMillis());
    },
    [transactions, item, currentStock, transactionsLoading]
  );

  const renderSkeleton = () => {
    const colSpan = residenceId ? 5 : 6;
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell colSpan={colSpan}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      </TableRow>
    ));
  };

  if (!item || (residenceId && !residence)) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">
          {!item ? "Item not found." : "Residence not found."}
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const renderTransactionDetails = (tx: InventoryTransaction) => {
    switch (tx.type) {
      case "IN":
        return `Received via MRV: ${tx.referenceDocId}`;
      case "OUT":
        return `Issued to: ${tx.locationName || "N/A"}`;
      case "TRANSFER_IN":
        return `Transfer from: ${getRelatedResidenceName(tx.relatedResidenceId)}`;
      case "TRANSFER_OUT":
        return `Transfer to: ${getRelatedResidenceName(tx.relatedResidenceId)}`;
      default:
        return tx.referenceDocId;
    }
  };

  const renderTransactionType = (tx: InventoryTransaction) => {
    switch (tx.type) {
      case "IN":
        return <Badge variant="secondary">Received</Badge>;
      case "OUT":
        return <Badge variant="destructive">Issued</Badge>;
      case "TRANSFER_IN":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-500/80">Transfer In</Badge>
        );
      case "TRANSFER_OUT":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-500/80">Transfer Out</Badge>
        );
      default:
        return <Badge>{(tx as any).type}</Badge>;
    }
  };

  const canOpenDocLink = (tx: InventoryTransaction) => {
    if (!tx?.referenceDocId) return null;
    if (tx.type === "IN") return `/inventory/receive/receipts/${tx.referenceDocId}`;
    if (tx.type === "OUT") {
      return tx.referenceDocId.startsWith("MIV-")
        ? `/inventory/issue-history/${tx.referenceDocId}`
        : null;
    }
    if (tx.type === "ADJUSTMENT") {
      const id = tx.referenceDocId;
      return id.startsWith("CON-")
        ? `/inventory/reports/reconciliations/${id}`
        : null;
    }
    return null;
  };

  const openTxDetails = async (tx: InventoryTransaction) => {
    setSelectedTx(tx);
    setDocDetails(null);
    setReconItems([]);
    setDetailOpen(true);
    try {
      setDetailLoading(true);
      if (tx.type === "IN" && tx.referenceDocId) {
        const d = await getMRVById(tx.referenceDocId);
        setDocDetails(d);
      } else if (
        tx.type === "OUT" &&
        tx.referenceDocId &&
        tx.referenceDocId.startsWith("MIV-")
      ) {
        const d = await getMIVById(tx.referenceDocId);
        setDocDetails(d);
      } else if (tx.type === "ADJUSTMENT" && tx.referenceDocId) {
        const items = await getReconciliationItems(tx.referenceDocId);
        setReconItems(items || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
          </Button>
          <h1 className="text-2xl font-bold mt-2">Item Movement Report (Ledger)</h1>
          <p className="text-muted-foreground">
            Showing history for <span className="font-semibold text-primary">{item.nameEn} / {item.nameAr}</span>{" "}
            {residenceId ? (
              <span>
                at <span className="font-semibold text-primary">{residence?.name}</span>
              </span>
            ) : (
              <span className="font-semibold text-primary">across all residences</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {residenceId ? "Current Stock" : "Total System Stock"}
          </p>
          <div className="text-3xl font-bold">
            {inventoryLoading || transactionsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              currentStock
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Type</TableHead>
                {!residenceId && <TableHead>Residence</TableHead>}
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading ? (
                renderSkeleton()
              ) : (
                <>
                  {transactionsWithBalance.length > 0 ? (
                    transactionsWithBalance.map((tx) => (
                      <TableRow
                        key={`${tx.id}-${tx.residenceId}-${tx.date.toMillis()}`}
                        className="cursor-pointer hover:bg-accent/30"
                        onClick={() => openTxDetails(tx)}
                      >
                        <TableCell>{format(tx.date.toDate(), "PPP p")}</TableCell>
                        <TableCell className="font-medium">
                          {renderTransactionDetails(tx)}
                        </TableCell>
                        <TableCell>{renderTransactionType(tx)}</TableCell>
                        {!residenceId && (
                          <TableCell className="font-medium">
                            {getTransactionResidenceName(tx.residenceId)}
                          </TableCell>
                        )}
                        <TableCell
                          className={`text-center font-semibold ${
                            tx.type === "IN" || tx.type === "TRANSFER_IN"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {`${
                            tx.type === "IN" || tx.type === "TRANSFER_IN" ? "+" : "-"
                          }${tx.quantity}`}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {(tx as any).balance}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={residenceId ? 5 : 6}
                        className="h-48 text-center text-muted-foreground"
                      >
                        {residenceId
                          ? "No movement history found for this item in this residence."
                          : "No movement history found for this item across all residences."}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Movement details</DialogTitle>
          </DialogHeader>
          {selectedTx ? (
            <div className="text-sm text-muted-foreground space-y-1 mb-3">
              <div>
                Type: <span className="font-medium text-foreground">{selectedTx.type}</span>
              </div>
              <div>
                Date: {selectedTx.date?.toDate ? format(selectedTx.date.toDate(), "PPP p") : ""}
              </div>
              <div>
                Reference: <span className="font-mono">{selectedTx.referenceDocId || "—"}</span>
              </div>
              <div>Residence: {getTransactionResidenceName(selectedTx.residenceId)}</div>
              {selectedTx.locationName ? <div>Location: {selectedTx.locationName}</div> : null}
            </div>
          ) : null}
          {detailLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : selectedTx?.type === "IN" && docDetails ? (
            <div className="space-y-3">
              <div className="text-sm">
                Supplier: {docDetails.supplierName || "—"} · Invoice: {docDetails.invoiceNo || "—"}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docDetails.items?.map((it: any, i: number) => (
                      <TableRow key={`${it.itemId}-${i}`}>
                        <TableCell>{it.itemNameEn || it.itemNameAr}</TableCell>
                        <TableCell className="text-right">{it.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {canOpenDocLink(selectedTx) && (
                <div className="pt-2">
                  <Button asChild>
                    <Link href={canOpenDocLink(selectedTx)!}>Open MRV</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : selectedTx?.type === "OUT" && docDetails ? (
            <div className="space-y-3">
              <div className="text-sm">
                Location: {Object.keys(docDetails.locations || {}).join(", ") || selectedTx.locationName || "—"}
              </div>
              {canOpenDocLink(selectedTx) && (
                <div className="pt-2">
                  <Button asChild>
                    <Link href={canOpenDocLink(selectedTx)!}>Open MIV</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : selectedTx?.type === "ADJUSTMENT" ? (
            <div className="space-y-3">
              {reconItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">No reconciliation lines found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reconItems.map((it: any, i: number) => (
                        <TableRow key={`${it.id || it.itemId || 'row'}-${i}`}>
                          <TableCell>{it.itemNameEn || it.itemNameAr}</TableCell>
                          <TableCell>{it.adjustmentDirection || "—"}</TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!!selectedTx.referenceDocId && (
                <div className="pt-2">
                  <Button asChild variant="secondary">
                    <Link href={`/inventory/reports/reconciliations/${selectedTx.referenceDocId}`}>
                      Open Reconciliation
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No additional details available for this movement.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ItemMovementPage() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <ItemMovementContent />
    </Suspense>
  );
}
