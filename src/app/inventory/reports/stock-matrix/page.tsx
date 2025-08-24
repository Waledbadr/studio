"use client";

import { useMemo, useState, useEffect, Fragment } from "react";
import { useInventory } from "@/context/inventory-context";
import { useResidences } from "@/context/residences-context";
import { useUsers } from "@/context/users-context";
import { useLanguage } from "@/context/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, Grid3X3 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { normalizeText, includesNormalized } from "@/lib/utils";
import { AR_SYNONYMS, buildNormalizedSynonyms } from "@/lib/aliases";

export default function StockMatrixReportPage() {
  const { items, loading, getAllInventoryTransactions } = useInventory() as any;
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { dict, locale } = useLanguage() as any;

  const [hideEmptyItems, setHideEmptyItems] = useState(true);
  const [search, setSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<any | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txItem, setTxItem] = useState<any | null>(null);
  const [txResidenceId, setTxResidenceId] = useState<string | null>(null);
  const [txRows, setTxRows] = useState<any[]>([]);
  const normalizedSynonyms = useMemo(() => buildNormalizedSynonyms(AR_SYNONYMS), []);

  // Format numbers: replace 0 with '-'
  const formatQty = (n: number) => (Number(n) === 0 ? '-' : Number(n).toLocaleString());

  // Determine visible residences for the user
  const visibleResidences = useMemo(() => {
    let arr = (residences || []).filter((r: any) => !r?.disabled);
    if (currentUser && currentUser.role !== "Admin") {
      const allowed = new Set(currentUser.assignedResidences || []);
      arr = arr.filter((r: any) => allowed.has(r.id));
    }
    // Stable sort by name
    const collator = new Intl.Collator(["ar", "en"], { sensitivity: "base", numeric: true });
    return [...arr].sort((a: any, b: any) => collator.compare(a?.name || "", b?.name || ""));
  }, [residences, currentUser]);

  // Build categories and items matrix view
  const { grouped, residenceTotals, grandTotal, totalItemsShown } = useMemo(() => {
    const collator = new Intl.Collator(["ar", "en"], { sensitivity: "base", numeric: true });
  const normalizedSearch = search.trim();
    const group: Record<string, any[]> = {};

  const filteredItems = (items || []).filter((it: any) => {
      // Optional normalized search (same approach as Inventory page, plus a few extra fields)
      if (normalizedSearch) {
        const qN = normalizeText(normalizedSearch);
        const item: any = it as any;
        const cand = [
          item.nameEn,
          item.nameAr,
          item.category,
          ...(item.keywordsAr || []),
          ...(item.keywordsEn || []),
          ...(item.variants || []),
          // extras: descriptions/details/specs/notes and codes
          item.details,
          item.description,
          item.notes,
          item.specs,
          item.detailsAr,
          item.detailsEn,
          item.descriptionAr,
          item.descriptionEn,
          item.notesAr,
          item.notesEn,
          item.specsAr,
          item.specsEn,
          item.sku,
          item.code,
          item.barcode,
        ]
          .filter(Boolean)
          .join(' ');

        if (includesNormalized(cand, qN)) {
          // direct match
        } else {
          // try synonyms (Arabic): if the query is an alias, match canonical term against key fields
          let synonymMatched = false;
          for (const [canonN, aliasSet] of normalizedSynonyms.entries()) {
            if (aliasSet.has(qN)) {
              const itemMatchesCanon =
                includesNormalized(item.nameAr, canonN) ||
                includesNormalized(item.nameEn, canonN) ||
                (item.keywordsAr || []).some((k: string) => includesNormalized(k, canonN)) ||
                (item.keywordsEn || []).some((k: string) => includesNormalized(k, canonN)) ||
                (item.variants || []).some((v: string) => includesNormalized(v, canonN));
              if (itemMatchesCanon) {
                synonymMatched = true;
                break;
              }
            }
          }
          if (!synonymMatched) return false;
        }
      }
      // Hide items that are all zero across the visible residences
      if (hideEmptyItems) {
        const hasStock = visibleResidences.some((r) => {
          const qty = Number((it as any).stockByResidence?.[r.id] || 0);
          return qty > 0;
        });
        if (!hasStock) return false;
      }
      return true;
    });

    // Group by category
    for (const it of filteredItems) {
      const cat = (it as any).category || "Uncategorized";
      if (!group[cat]) group[cat] = [];
      group[cat].push(it);
    }

    // Sort categories and items
    const groupedEntries = Object.entries(group)
      .sort((a, b) => collator.compare(a[0], b[0]))
      .map(([cat, rows]) => [cat, [...rows].sort((a: any, b: any) => collator.compare(a?.nameAr || a?.nameEn || "", b?.nameAr || b?.nameEn || ""))]);

    // Compute totals per residence and grand total based on displayed items
    const resTotals = new Map<string, number>();
    let grand = 0;
    for (const [, rows] of groupedEntries as any) {
      for (const it of rows as any[]) {
        for (const res of visibleResidences) {
          const q = Number(it.stockByResidence?.[res.id] || 0);
          if (!resTotals.has(res.id)) resTotals.set(res.id, 0);
          resTotals.set(res.id, resTotals.get(res.id)! + q);
          grand += q;
        }
      }
    }

    return {
      grouped: groupedEntries as [string, any[]][],
      residenceTotals: resTotals,
      grandTotal: grand,
      totalItemsShown: filteredItems.length,
    };
  }, [items, visibleResidences, hideEmptyItems, search]);

  useEffect(() => {
    // Ensure inventory and residences are loaded on first mount
  }, []);

  const printPage = () => {
    window.print();
  };

  const openDetails = (item: any) => {
    setDetailsItem(item);
    setDetailsOpen(true);
  };

  const movementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN': return dict.stockIn;
      case 'OUT': return dict.stockOut;
      case 'TRANSFER_IN': return (dict as any).transferIn;
      case 'TRANSFER_OUT': return (dict as any).transferOut;
      case 'ADJUSTMENT': return dict.adjustmentLabel;
      case 'RETURN': return dict.returnLabel;
      case 'DEPRECIATION': return dict.depreciationLabel;
      case 'AUDIT': return dict.auditAdjustmentLabel;
      case 'SCRAP': return dict.scrapLabel;
      default: return type;
    }
  };

  const openTxDialog = async (item: any, residenceId: string) => {
    try {
      setTxItem(item);
      setTxResidenceId(residenceId);
      setTxRows([]);
      setTxLoading(true);
      setTxOpen(true);
      const allTx = await getAllInventoryTransactions();
      const filtered = (allTx || []).filter((t: any) => t?.itemId === item?.id && t?.residenceId === residenceId);
      const sorted = filtered.sort((a: any, b: any) => {
        const aMs = typeof a.date?.toMillis === 'function' ? a.date.toMillis() : a.date?.toDate?.().getTime?.() ?? 0;
        const bMs = typeof b.date?.toMillis === 'function' ? b.date.toMillis() : b.date?.toDate?.().getTime?.() ?? 0;
        return bMs - aMs;
      });
      setTxRows(sorted);
    } catch (e) {
      setTxRows([]);
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/10 dark:to-rose-900/10 rounded-lg p-6 border border-amber-100 dark:border-amber-900/40">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide text-foreground mb-2">
              {dict.stockMatrixReportTitle}
            </h1>
            <p className="text-muted-foreground text-lg">{dict.stockMatrixReportDescription}</p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center shadow-inner">
              <Grid3X3 className="h-8 w-8 text-amber-700 dark:text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="shadow-lg print:hidden">
        <CardHeader className="bg-muted/30 dark:bg-card border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">{dict.displaySettingsTitle}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={printPage} className="border-amber-300">
                <Printer className="mr-2 h-4 w-4" /> {dict.printLabel}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <input
                className="h-10 rounded-md border px-3 bg-background"
                placeholder={dict.searchItemsArEnPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="size-4"
                checked={hideEmptyItems}
                onChange={(e) => setHideEmptyItems(e.target.checked)}
              />
              <span className="text-sm text-foreground">{dict.hideZeroStockItemsLabel}</span>
            </label>
            <div className="ml-auto text-sm text-muted-foreground">
              {dict.itemsShownLabel ? (
                <>
                  {dict.itemsShownLabel}: <span className="font-semibold text-foreground">{totalItemsShown}</span>
                </>
              ) : (
                <>
                  Items shown: <span className="font-semibold text-foreground">{totalItemsShown}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printable content */}
      <div className="print:p-0">
        {/* Print Header (only in print) */}
        <div className="hidden print:block">
          <div className="text-center mb-4">
            <div className="font-extrabold text-2xl tracking-widest text-amber-700">{"EstateCare"}</div>
            <div className="mt-1 text-xl font-bold">{"تقرير مخزون حسب السكن"}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {new Date().toLocaleString()}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-6" />
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 dark:bg-card border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground">
                {dict.stockMatrixReportTitle}
              </CardTitle>
              <div className="text-sm text-muted-foreground">{new Date().toLocaleString()}</div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/40 dark:bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[220px]">{dict.categoryItemHeader}</TableHead>
                  {visibleResidences.map((r) => (
                    <TableHead key={r.id} className="text-center">
                      {r.name || r.id}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">{dict.grandTotalLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleResidences.length + 2} className="text-center text-muted-foreground py-10">
                      {dict.noDataToDisplay}
                    </TableCell>
                  </TableRow>
                ) : (
                  grouped.map(([cat, rows]) => {
                    return (
                      <Fragment key={`grp-${cat}`}>
                        <TableRow>
                          <TableCell colSpan={visibleResidences.length + 2} className="bg-amber-50/60 dark:bg-amber-900/20 font-bold text-amber-900 dark:text-amber-200">
                            {cat}
                          </TableCell>
                        </TableRow>
                        {(rows as any[]).map((it: any) => {
                          const rowTotal = visibleResidences.reduce((sum, r) => sum + Number(it.stockByResidence?.[r.id] || 0), 0);
                          return (
                            <TableRow key={it.id} className="hover:bg-muted/40">
                              <TableCell>
                                <button
                                  type="button"
                                  className="font-medium text-left text-foreground dark:text-white hover:underline focus:outline-none"
                                  onClick={() => openDetails(it)}
                                  title={dict.details}
                                >
                                  {`${it?.nameEn || ""}${it?.nameEn && it?.nameAr ? " | " : ""}${it?.nameAr || ""}`}
                                </button>
                              </TableCell>
                              {visibleResidences.map((r) => (
                                <TableCell key={`${it.id}-${r.id}`} className="text-center tabular-nums">
                                  <button
                                    type="button"
                                    className="text-foreground dark:text-white hover:underline focus:outline-none"
                                    title={(dict.viewHistoryLabel || 'View History') as string}
                                    onClick={() => openTxDialog(it, r.id)}
                                  >
                                    {formatQty(Number(it.stockByResidence?.[r.id] || 0))}
                                  </button>
                                </TableCell>
                              ))}
                              <TableCell className="text-center font-semibold tabular-nums text-foreground dark:text-white">
                                {formatQty(rowTotal)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </Fragment>
                    );
                  })
                )}
                {/* Totals row */}
                <TableRow>
                  <TableCell className="text-right font-bold bg-muted/40">{dict.totalLabel}</TableCell>
                  {visibleResidences.map((r) => (
                    <TableCell key={`total-${r.id}`} className="text-center font-bold tabular-nums bg-muted/40 text-foreground dark:text-white">
                      {formatQty(residenceTotals.get(r.id) || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-extrabold tabular-nums bg-muted/40 text-foreground dark:text-white">
                    {formatQty(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Elegant print styles */}
      <style jsx global>{`
        @page {
          size: auto;
          margin: 0;
        }
        @media print {
          :root { color-scheme: light; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print\\:hidden { display: none !important; }
          /* Hide app chrome in print */
          header, nav, aside, footer { display: none !important; }
          /* Remove sticky behavior that can shift content in print */
          .sticky { position: static !important; }
          .shadow-lg, .shadow { box-shadow: none !important; }
          .border { border-color: #d4af37 !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dict.itemLabel}: {locale === 'ar' ? (detailsItem?.nameAr || detailsItem?.nameEn) : (detailsItem?.nameEn || detailsItem?.nameAr)}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.residenceLabel}</TableHead>
                  <TableHead className="text-right">{dict.quantity}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResidences.map((r) => {
                  const q = Number(detailsItem?.stockByResidence?.[r.id] || 0);
                  return (
                    <TableRow key={`det-${r.id}`}>
                      <TableCell>{r.name || r.id}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatQty(q)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-semibold">{dict.totalLabel}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatQty(
                      visibleResidences.reduce((sum, r) => sum + Number(detailsItem?.stockByResidence?.[r.id] || 0), 0)
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {(dict.movementDetailsTitle || 'Movements') as string}: {txItem ? `${txItem?.nameEn || ''}${txItem?.nameEn && txItem?.nameAr ? ' | ' : ''}${txItem?.nameAr || ''}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            {txLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : txRows.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">{dict.noResultsFoundTitle || 'No results found'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.movementTypeLabel}</TableHead>
                    <TableHead className="text-right">{dict.quantity}</TableHead>
                    <TableHead>{dict.date}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txRows.map((t: any, idx: number) => (
                    <TableRow key={`${t.id || t.referenceDocId || 'row'}-${idx}`}>
                      <TableCell>{movementTypeLabel(t.type)}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(t.quantity).toLocaleString()}</TableCell>
                      <TableCell>{t.date?.toDate ? new Date(t.date.toDate()).toLocaleString() : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
