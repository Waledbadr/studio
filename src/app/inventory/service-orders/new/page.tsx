"use client";

import { useMemo, useState } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button as UIButton } from "@/components/ui/button";
import { includesNormalized } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function NewServiceOrderPage() {
  const { createAndDispatchServiceOrder } = useServiceOrders();
  const { residences } = useResidences();
  const { items, getStockForResidence } = useInventory();
  const { currentUser } = useUsers();
  const router = useRouter();

  const [residenceId, setResidenceId] = useState("");
  const [destinationType, setDestinationType] = useState("ExternalWorkshop");
  const [destinationName, setDestinationName] = useState("");
  const [rows, setRows] = useState<Array<{ id: string; nameEn: string; nameAr: string; quantity: number }>>([]);

  const residence = useMemo(() => residences.find((r) => r.id === residenceId), [residences, residenceId]);
  const availableItems = useMemo(() => items, [items]);
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const onSearchChange = (val: string) => {
    setSearch(val);
    setVisibleCount(12);
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
    setRows((prev) => [...prev, { id: it.id, nameEn: it.nameEn, nameAr: it.nameAr, quantity: 1 }]);
  };

  const updateQty = (id: string, q: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: Math.max(0, Number(q) || 0) } : r)));
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!residence) return;
    if (!destinationName.trim()) return;
    const invalid = rows.some((r) => r.quantity <= 0);
    if (invalid) return;
    const payload = {
      residenceId: residence.id,
      residenceName: residence.name,
      destination: { type: destinationType as any, name: destinationName },
      items: rows.filter((r) => r.quantity > 0),
      createdById: currentUser.id,
      dispatchedById: currentUser.id,
    };
  await createAndDispatchServiceOrder(payload as any);
    router.push("/inventory/service-orders");
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle>New Service Order</CardTitle>
          <CardDescription>Send items to maintenance/workshop and deduct stock.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <UIButton variant="outline" className="w-96 justify-between">
                    Add item
                    <span className="text-xs text-muted-foreground">EN | AR</span>
                  </UIButton>
                </PopoverTrigger>
        <PopoverContent className="w-96 p-0" side="bottom" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search items (EN | AR | keywords)" value={search} onValueChange={onSearchChange} />
          <CommandList className="max-h-[60vh] overflow-y-auto">
                        <CommandEmpty>No matches</CommandEmpty>
                        <CommandGroup>
                        {(() => {
                          const tokens = search.trim().split(/\s+/).filter(Boolean);
                          const selectedIds = new Set(rows.map(r => r.id));
                          const list = tokens.length === 0
                            ? availableItems
                            : availableItems.filter((it) => {
                                const blob = searchIndex.get(it.id) || "";
                                return tokens.every((t) => includesNormalized(blob, t));
                              });
                          const remaining = list.filter((it) => !selectedIds.has(it.id));
                          const page = remaining.slice(0, visibleCount);
                          return page
                            .map((it) => (
                              <CommandItem
                                key={it.id}
                                value={(it.nameEn || it.name || "") + " " + (it.nameAr || "")}
                                onSelect={() => {
                                  addRow(it.id);
                                  setTimeout(() => setComboOpen(false), 0);
                                  setSearch("");
                                  setVisibleCount(12);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm">{it.nameEn || it.name} <span className="text-muted-foreground">| {it.nameAr}</span></span>
                                </div>
                              </CommandItem>
                            ));
                        })()}
                        {(() => {
                          const tokens = search.trim().split(/\s+/).filter(Boolean);
                          const list = tokens.length === 0 ? availableItems : availableItems.filter((it) => {
                            const blob = searchIndex.get(it.id) || "";
                            return tokens.every((t) => includesNormalized(blob, t));
                          });
                          const selectedIds = new Set(rows.map(r => r.id));
                          const remainingCount = list.filter((it) => !selectedIds.has(it.id)).length - visibleCount;
                          if (remainingCount > 0) {
                            return (
                              <div className="flex justify-center py-2">
                                <UIButton size="icon" variant="ghost" onClick={() => setVisibleCount((v) => v + 12)} aria-label="Show more">
                                  <ChevronDown className="h-5 w-5" />
                                </UIButton>
                              </div>
                            );
                          }
                          return null;
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
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{r.nameEn} <span className="text-muted-foreground">| {r.nameAr}</span></span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{residence ? curStock : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            className="w-28 ml-auto text-right"
                            type="number"
                            min={0}
                            value={r.quantity}
                            onChange={(e) => updateQty(r.id, Number(e.target.value))}
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

          <div className="flex justify-end gap-2">
            <Button onClick={handleSubmit} disabled={!residence || !destinationName.trim() || rows.every((r) => r.quantity <= 0)}>Dispatch</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
