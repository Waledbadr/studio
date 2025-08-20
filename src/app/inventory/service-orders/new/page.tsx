"use client";

import { useMemo, useRef, useState } from "react";
import { useServiceOrders } from "@/context/service-orders-context";
import { useResidences } from "@/context/residences-context";
import { useInventory } from "@/context/inventory-context";
import { useUsers } from "@/context/users-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { Button as UIButton } from "@/components/ui/button";
import { includesNormalized } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
// removed ChevronDown; infinite scroll now auto-expands

export default function NewServiceOrderPage() {
  const { createAndDispatchServiceOrder } = useServiceOrders();
  const { residences } = useResidences();
  const { items, getStockForResidence } = useInventory();
  const { currentUser } = useUsers();
  const router = useRouter();
  const { toast } = useToast();

  const [residenceId, setResidenceId] = useState("");
  const [destinationType, setDestinationType] = useState("ExternalWorkshop");
  const [destinationName, setDestinationName] = useState("");
  const [rows, setRows] = useState<Array<{ id: string; nameEn: string; nameAr: string; quantity: number }>>([]);

  const residence = useMemo(() => residences.find((r) => r.id === residenceId), [residences, residenceId]);
  const availableItems = useMemo(() => items, [items]);
  // Only show items that have stock > 0 in the selected residence (if any)
  const availableAtResidence = useMemo(() => {
    if (!residenceId) return availableItems;
    return availableItems.filter((it) => (getStockForResidence(it, residenceId) || 0) > 0);
  }, [availableItems, residenceId, getStockForResidence]);
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const onSearchChange = (val: string) => {
    setSearch(val);
    setVisibleCount(24);
  };

  // Infinite scroll: grow visibleCount as user scrolls to the bottom of the list
  const listRef = useRef<HTMLDivElement | null>(null);
  const onListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // When 1.5 rows from the end, load more
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      setVisibleCount((v) => v + 24);
    }
  };

  // Build a searchable blob for each item: names + keywords + variants + category + unit
  const searchIndex = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of availableItems) {
      const parts: string[] = [];
      parts.push(it.nameEn || (it as any).name || "");
      parts.push(it.nameAr || "");
      (it.keywordsEn || []).forEach(k => parts.push(k));
      (it.keywordsAr || []).forEach(k => parts.push(k));
      (it.variants || []).forEach(v => parts.push(v));
      if (it.category) parts.push(it.category);
      if (it.unit) parts.push(it.unit);
      map.set(it.id, parts.join(" \n "));
    }
    return map;
  }, [availableItems]);

  // Residences filtered to the current user's assigned list (fallback to all if none provided)
  const userResidenceIds = (currentUser?.assignedResidences || []).filter(Boolean);
  const allowedResidences = useMemo(() => {
    if (userResidenceIds.length > 0) return residences.filter((r) => userResidenceIds.includes(r.id));
    return residences;
  }, [residences, userResidenceIds]);

  const addRow = (id: string) => {
    const it = availableItems.find((x) => x.id === id);
    if (!it) return;
    if (rows.some((r) => r.id === id)) return;
    // Prevent adding items that have zero stock for the selected residence
    const curStock = residence ? getStockForResidence(it, residence.id) : 0;
    if (!residence || curStock <= 0) {
      toast({
        title: "غير متوفر في المخزون",
        description: "يرجى اختيار السكن ثم اختيار صنف متوفر في المخزون لهذا السكن.",
        variant: "destructive",
      });
      return;
    }
    setRows((prev) => [...prev, { id: it.id, nameEn: it.nameEn, nameAr: it.nameAr, quantity: 1 }]);
  };

  const updateQty = (id: string, q: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: Math.max(0, Number(q) || 0) } : r)));
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const handleAddItem = (id: string) => {
    addRow(id);
    setTimeout(() => setComboOpen(false), 0);
    setSearch("");
    setVisibleCount(24);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!residence) return;
    if (!destinationName.trim()) return;
    const invalid = rows.some((r) => r.quantity <= 0);
    if (invalid) {
      toast({ title: "كمية غير صالحة", description: "يرجى إدخال كمية أكبر من 0 لكل صنف.", variant: "destructive" });
      return;
    }

    // Validate stock before submit and show a clear message listing the problematic items
    const problems: { name: string; required: number; available: number }[] = [];
    for (const r of rows) {
      const it = availableItems.find((x) => x.id === r.id);
      const curStock = it ? getStockForResidence(it, residence.id) : 0;
      if (r.quantity > curStock) {
        problems.push({ name: `${r.nameEn} | ${r.nameAr}`, required: r.quantity, available: curStock });
      }
    }
    if (problems.length > 0) {
      const first = problems[0];
      const more = problems.length > 1 ? ` (+${problems.length - 1} عناصر أخرى)` : "";
      toast({
        title: "الكمية غير متوفرة في المخزون",
        description: `${first.name}: المطلوب ${first.required} والمتاح ${first.available}${more}`,
        variant: "destructive",
      });
      return;
    }
    const payload = {
      residenceId: residence.id,
      residenceName: residence.name,
      destination: { type: destinationType as any, name: destinationName },
      items: rows.filter((r) => r.quantity > 0),
      createdById: currentUser.id,
      dispatchedById: currentUser.id,
    };
    try {
      await createAndDispatchServiceOrder(payload as any);
      router.push("/inventory/service-orders");
    } catch (err: any) {
      console.error("Failed to create service order:", err);
      toast({ title: "فشل إنشاء أمر الصيانة", description: "تعذر إنشاء أمر الصيانة. يرجى المحاولة لاحقًا.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle>New Service Order</CardTitle>
          <CardDescription>Send items to maintenance/workshop and deduct stock.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Residence selection */}
          <div>
            <Label>Residence</Label>
            <Select value={residenceId} onValueChange={setResidenceId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select residence" /></SelectTrigger>
              <SelectContent>
                {allowedResidences.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
                {allowedResidences.length === 0 && (
                  <div className="px-2 py-2 text-sm text-muted-foreground">No residences assigned</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {!residence && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 text-yellow-900 text-sm px-3 py-2">
              اختر السكن لعرض الأصناف المتوفرة في المخزون
            </div>
          )}

          {/* Blocked wrapper until residence is selected */}
          <div className="relative">
            {!residence && (
              <div
                className="absolute inset-0 z-10 cursor-not-allowed"
                onClick={() => toast({ title: "يرجى اختيار السكن", description: "اختر السكن أولاً لتمكين باقي الحقول.", variant: "destructive" })}
              />
            )}
            <div className={!residence ? "opacity-50 pointer-events-none" : ""}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Destination Type</Label>
                  <Select value={destinationType} onValueChange={setDestinationType}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="InternalMaintenance">Internal Maintenance</SelectItem>
                      <SelectItem value="ExternalWorkshop">External Workshop</SelectItem>
                      <SelectItem value="Vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination Name</Label>
                  <Input value={destinationName} onChange={(e) => setDestinationName(e.target.value)} placeholder="Workshop name" />
                </div>
              </div>

          <div className="space-y-2">
            <Label>Items</Label>
    <div className="flex flex-wrap gap-2 items-end">
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
      <UIButton variant="outline" className="w-96 justify-between" disabled={!residence}>
                    Add item
                    <span className="text-xs text-muted-foreground">EN | AR</span>
                  </UIButton>
                </PopoverTrigger>
                <PopoverContent
                  className="w-96 p-0 z-50 max-h-[70vh] overflow-hidden"
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  collisionPadding={12}
                  avoidCollisions
                >
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search items (EN | AR | keywords)" value={search} onValueChange={onSearchChange} />
                    <CommandList ref={listRef} className="max-h-[68vh] overflow-y-auto overscroll-contain" onScroll={onListScroll}>
                        {/* Intentionally no empty state message */}
                        <CommandGroup>
                        {(() => {
                          const tokens = search.trim().split(/\s+/).filter(Boolean);
                          const selectedIds = new Set(rows.map(r => r.id));
                          const source = residence ? availableAtResidence : availableItems;
                          const list = tokens.length === 0
                            ? source
                            : source.filter((it) => {
                                const blob = searchIndex.get(it.id) || "";
                                return tokens.every((t) => includesNormalized(blob, t));
                              });
                          const remaining = list.filter((it) => !selectedIds.has(it.id));
                          const page = remaining.slice(0, visibleCount);
                          return page
                            .map((it) => (
                              <div
                                key={it.id}
                                role="button"
                                tabIndex={0}
                                className="relative flex select-none items-center rounded-sm px-2 py-2 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                onClick={() => handleAddItem(it.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") handleAddItem(it.id);
                                }}
                              >
                                <div className="flex flex-col w-full">
                                  <span className="text-sm">{it.nameEn || it.name} <span className="text-muted-foreground">| {it.nameAr}</span></span>
                                </div>
                              </div>
                            ));
                        })()}
                        </CommandGroup>
                      </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Qty Sent</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No items selected</TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => {
                    const it = availableItems.find((x) => x.id === r.id);
                    const curStock = it ? getStockForResidence(it, residence?.id || "") : 0;
                    const exceeds = r.quantity > curStock;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{r.nameEn} <span className="text-muted-foreground">| {r.nameAr}</span></span>
                            {residence && (
                              <span className={`text-xs ${curStock <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                Available: {curStock}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{residence ? curStock : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            className="w-28 ml-auto text-right"
                            type="number"
                            min={0}
                            value={r.quantity}
                            data-invalid={exceeds ? "true" : undefined}
                            onChange={(e) => updateQty(r.id, Number(e.target.value))}
                            style={exceeds ? { borderColor: "hsl(var(--destructive))" } : undefined}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" onClick={() => removeRow(r.id)}>Remove</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={handleSubmit} disabled={!residence || !destinationName.trim() || rows.every((r) => r.quantity <= 0)}>Dispatch</Button>
            </div>
            {/* End blocked content */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
