'use client';

import { useEffect, useMemo, useState, useTransition, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { useOrders } from '@/context/orders-context';
import { useResidences, type FacilityComponent } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Building as BuildingIcon, ConciergeBell, Loader2, Search, Plus, Trash2, Edit, ChevronDown, Clock, PlusCircle } from 'lucide-react';
import { normalizeText, includesNormalized } from '@/lib/utils';
import { AR_SYNONYMS, buildNormalizedSynonyms } from '@/lib/aliases';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

type IssueLine = { id: string; nameEn?: string; nameAr?: string; issueQuantity: number; overrideReason?: string | null };
type LocationEntry = { locationId: string; locationName: string; isFacility: boolean; items: IssueLine[] };

export default function RequestIssuePage() {
  const { items: allItems, getStockForResidence, checkItemLifespanAtLocation, addItem, updateItem } = useInventory();
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const { createOrder } = useOrders();
  const [isPending, startTransition] = useTransition();

  // Residence (issue-from)
  const [residenceId, setResidenceId] = useState('');

  // Location selectors, matching distribution style
  const [locationType, setLocationType] = useState<'unit' | 'facility'>('unit');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [componentId, setComponentId] = useState(''); // New: للمكونات الفرعية للممر
  // New: Multi-location selection mode and selected targets
  const [multiMode, setMultiMode] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<{ id: string; name: string; isFacility: boolean }[]>([]);

  // UI helpers
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [isAddDialogVisible, setAddDialogVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const variantSelectionsRef = useRef<Record<string, Record<string, boolean>>>({});
  const [, setVariantTick] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canOverride = (currentUser?.role === 'Admin' || currentUser?.role === 'Supervisor');
  // Justification dialog state (per-add, per-item)
  const [justOpen, setJustOpen] = useState(false);
  const [justText, setJustText] = useState('');
  const justificationResolver = useRef<((val: string | null) => void) | null>(null);
  const askForJustification = useCallback(async (): Promise<string | null> => {
    setJustText('');
    return new Promise((resolve) => {
      justificationResolver.current = resolve;
      setJustOpen(true);
    });
  }, []);

  // Right panel: voucher (current request)
  const [voucherLocations, setVoucherLocations] = useState<LocationEntry[]>([]);

  // Helper to render mixed-direction paths consistently with LTR arrows
  const PathDisplay = ({ path }: { path?: string | null }) => {
    if (!path) return null;
    const arrow = '\u200E→\u200E';
    const segs = String(path).split('->').map(s => s.trim()).filter(Boolean);
    return (
      <span dir="ltr">
        {segs.map((s, i) => (
          <span key={i} className="inline">
            <span dir="auto">{s}</span>
            {i < segs.length - 1 ? <span className="mx-1">{arrow}</span> : null}
          </span>
        ))}
      </span>
    );
  };

  const selectedResidence = useMemo(() => residences.find(r => r.id === residenceId), [residences, residenceId]);
  const buildings = selectedResidence?.buildings || [];
  const floors = buildings.find(b => b.id === buildingId)?.floors || [];
  const rooms = floors.find(f => f.id === floorId)?.rooms || [];
  const availableFacilities = useMemo(() => {
    if (!selectedResidence) return [];
    if (floorId) return floors.find(f => f.id === floorId)?.facilities || [];
    if (buildingId) return buildings.find(b => b.id === buildingId)?.facilities || [];
    return selectedResidence.facilities || [];
  }, [selectedResidence, buildings, floors, buildingId, floorId]);

  // Get available components for selected facility
  const availableComponents = useMemo<FacilityComponent[]>(() => {
    if (!facilityId) return [];
    const facility = availableFacilities.find(f => f.id === facilityId);
    // Components live under `components` on Facility
    return ((facility as any)?.components || []) as FacilityComponent[];
  }, [facilityId, availableFacilities]);

  // Reset cascading selects when residence changes
  useEffect(() => { setBuildingId(''); setFloorId(''); setRoomId(''); setFacilityId(''); setComponentId(''); setVoucherLocations([]); setSelectedTargets([]); }, [residenceId]);
  useEffect(() => { setFloorId(''); setRoomId(''); setFacilityId(''); setComponentId(''); setSelectedTargets([]); }, [buildingId]);
  useEffect(() => { setRoomId(''); if (locationType === 'facility') { setFacilityId(''); setComponentId(''); } setSelectedTargets([]); }, [floorId, locationType]);
  useEffect(() => { setComponentId(''); }, [facilityId]); // Reset component when facility changes

  // Remaining stock per item after current allocations
  const getAggregateIssuedQty = (itemId: string) => voucherLocations.reduce((sum, loc) => {
    const found = loc.items.find(i => i.id === itemId);
    return sum + (found ? found.issueQuantity : 0);
  }, 0);

  const normalizedSynonyms = useMemo(() => buildNormalizedSynonyms(AR_SYNONYMS), []);
  const searchN = normalizeText(searchQuery);
  
  // Memoized categories for the filter select
  const categories = useMemo(() => Array.from(new Set(allItems.map(i => i.category).filter(Boolean))), [allItems]);
  
  const availableInventory = useMemo(() => {
    const base = selectedCategory === 'all' ? allItems : allItems.filter(i => i.category === selectedCategory);
    if (!searchN) return base;
    return base.filter(item => {
      const cand = [
        item.nameEn,
        item.nameAr,
        item.category,
        ...(item.keywordsAr || []),
        ...(item.keywordsEn || []),
        ...(item.variants || []),
      ].filter(Boolean).join(' ');
      if (includesNormalized(cand, searchN)) return true;
      for (const [canonN, aliasSet] of normalizedSynonyms.entries()) {
        if (aliasSet.has(searchN)) {
          const matches =
            includesNormalized(item.nameAr, canonN) ||
            includesNormalized(item.nameEn, canonN) ||
            (item.keywordsAr || []).some(k => includesNormalized(k, canonN)) ||
            (item.keywordsEn || []).some(k => includesNormalized(k, canonN)) ||
            (item.variants || []).some(v => includesNormalized(v, canonN));
          if (matches) return true;
        }
      }
      return false;
    });
  }, [allItems, selectedCategory, searchN, normalizedSynonyms]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentMaterialRequestItems') || '[]';
      const ids = JSON.parse(raw) as string[];
      const recent = ids.map(id => allItems.find(i => i.id === id)).filter((i): i is InventoryItem => !!i).slice(0, 5);
      setRecentItems(recent);
    } catch {}
  }, [allItems]);

  const addToRecentItems = useCallback((item: InventoryItem) => {
    try {
      const raw = localStorage.getItem('recentMaterialRequestItems') || '[]';
      const ids = JSON.parse(raw) as string[];
      const filtered = ids.filter(id => id !== item.id);
      const updated = [item.id, ...filtered].slice(0, 10);
      localStorage.setItem('recentMaterialRequestItems', JSON.stringify(updated));
      const recent = updated.map(id => allItems.find(i => i.id === id)).filter((i): i is InventoryItem => !!i).slice(0, 5);
      setRecentItems(recent);
    } catch {}
  }, [allItems]);

  const isLocationSelected = useMemo(() => {
    if (!residenceId) return false;
    if (multiMode) return selectedTargets.length > 0;
    if (locationType === 'unit') return !!(buildingId && floorId && roomId);
    return !!facilityId;
  }, [residenceId, multiMode, selectedTargets.length, locationType, buildingId, floorId, roomId, facilityId]);

  const currentLocation = useMemo(() => {
    if (!selectedResidence || !isLocationSelected) return null as null | { id: string; name: string; isFacility: boolean };
    if (multiMode) return null; // handled via selectedTargets
    if (locationType === 'unit') {
      const b = buildings.find(b => b.id === buildingId);
      const f = floors.find(f => f.id === floorId);
      const r = rooms.find(r => r.id === roomId);
      if (!b || !f || !r) return null;
      return { id: r.id, name: `${selectedResidence.name} -> ${b.name} -> ${f.name} -> ${r.name}`, isFacility: false };
    }
    const fac = availableFacilities.find(fl => fl.id === facilityId);
    if (!fac) return null;
    const parts = [selectedResidence.name];
    const b = buildings.find(b => b.id === buildingId); if (b) parts.push(b.name);
    const f = floors.find(f => f.id === floorId); if (f) parts.push(f.name);
    parts.push(fac.name);
    
    // If component is selected, add it to the location name
    if (componentId) {
  const component = availableComponents.find((c: FacilityComponent) => c.id === componentId);
      if (component) {
        parts.push(component.name);
        // Use component ID as the location ID for more specific tracking
        return { id: componentId, name: parts.join(' -> '), isFacility: true };
      }
    }
    
    return { id: fac.id, name: parts.join(' -> '), isFacility: true };
  }, [selectedResidence, isLocationSelected, multiMode, locationType, buildings, floors, rooms, availableFacilities, buildingId, floorId, roomId, facilityId, componentId, availableComponents]);

  const handleAddToVoucher = (itemToAdd: InventoryItem, variant?: string, qty: number = 1) => {
    if (!isLocationSelected || !currentLocation) {
      if (!multiMode || selectedTargets.length === 0) {
        toast({ title: 'Select a location', description: 'Pick residence and location before adding items.', variant: 'destructive' });
        return;
      }
    }
    startTransition(async () => {
      const targets = multiMode ? selectedTargets : (currentLocation ? [currentLocation] : []);
      const nameEn = variant ? `${itemToAdd.nameEn || ''} - ${variant}`.trim() : itemToAdd.nameEn;
      const nameAr = variant ? `${itemToAdd.nameAr || ''} - ${variant}`.trim() : itemToAdd.nameAr;

      // Check if justification is required (stock exists in residence OR lifespan within at any target)
      let requireJustification = false;
      try { if (getStockForResidence(itemToAdd, residenceId) > 0) requireJustification = true; } catch {}
      try {
        const lifeResults = await Promise.all(targets.map(t => checkItemLifespanAtLocation(itemToAdd.id, t.id).catch(() => null)));
        if (lifeResults.some(life => life && life.lifespanDays && life.withinLifespan)) requireJustification = true;
      } catch {}

      let providedReason: string | null = null;
      if (requireJustification) {
        providedReason = await askForJustification();
        if (!providedReason || providedReason.trim().length < 3) {
          toast({ title: 'Justification required', description: 'A clear justification is required to add this item.', variant: 'destructive' });
          return;
        }
      }

      setVoucherLocations(prev => {
        let next = [...prev];
        for (const target of targets) {
          let idx = next.findIndex(l => l.locationId === target.id);
          if (idx === -1) {
            next.push({ locationId: target.id, locationName: target.name, isFacility: target.isFacility, items: [] });
            idx = next.length - 1;
          }
          const loc = { ...next[idx] };
          const found = loc.items.find(i => i.id === itemToAdd.id && (i.nameEn === nameEn || i.nameAr === nameAr));
          if (!found) {
            loc.items = [...loc.items, { id: itemToAdd.id, nameEn, nameAr, issueQuantity: Math.max(1, qty), overrideReason: requireJustification ? providedReason : null }];
          } else {
            found.issueQuantity = found.issueQuantity + Math.max(1, qty);
            if (requireJustification && providedReason) found.overrideReason = providedReason;
          }
          next[idx] = loc;
        }
        return next;
      });

      addToRecentItems(itemToAdd);
    });
  };

  const updateLineQty = (locationId: string, itemId: string, next: number) => {
    setVoucherLocations(prev => prev.map(loc => {
      if (loc.locationId !== locationId) return loc;
      return { ...loc, items: loc.items.map(it => it.id === itemId ? { ...it, issueQuantity: Math.max(1, next) } : it) };
    }));
  };

  const removeLine = (locationId: string, itemId: string) => {
    setVoucherLocations(prev => prev.map(loc => loc.locationId === locationId ? { ...loc, items: loc.items.filter(i => i.id !== itemId) } : loc).filter(loc => loc.items.length > 0));
  };

  const submit = async () => {
    if (!residenceId || voucherLocations.length === 0) {
      toast({ title: 'Incomplete', description: 'Select a residence and add items.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Ensure lines that require justification have one before aggregation (parallelized)
      {
        const stockCache = new Map<string, number>();
        const needCheck: Array<{locName: string; item: InventoryItem; line: IssueLine; locationId: string}> = [];
        for (const loc of voucherLocations) {
          for (const line of loc.items) {
            const item = allItems.find(i => i.id === line.id);
            if (!item) continue;
            if (line.overrideReason && line.overrideReason.trim().length >= 3) continue; // already justified
            needCheck.push({ locName: loc.locationName, item, line, locationId: loc.locationId });
          }
        }
        // Preload stock per item
        for (const { item } of needCheck) {
          if (!stockCache.has(item.id)) {
            try { stockCache.set(item.id, getStockForResidence(item, residenceId)); } catch { stockCache.set(item.id, 0); }
          }
        }
        // Run lifespan checks in parallel
        const lifeResults = await Promise.all(
          needCheck.map(({ item, locationId }) =>
            checkItemLifespanAtLocation(item.id, locationId).catch(() => null)
          )
        );
        for (let i = 0; i < needCheck.length; i++) {
          const { locName, item, line } = needCheck[i];
          const stock = stockCache.get(item.id) || 0;
          const life = lifeResults[i];
          const requires = (stock > 0) || (!!life && life.lifespanDays && life.withinLifespan);
          if (requires && (!line.overrideReason || line.overrideReason.trim().length < 3)) {
            toast({ title: 'Justification required', description: `Provide justification for ${item.nameEn || item.nameAr} at ${locName}.`, variant: 'destructive' });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // MR creation: aggregate by item (old behavior) -> one line per item with total quantity
      // Group by item + detail to separate variants into distinct lines
      const aggMap = new Map<string, { inv: any; qty: number; reasons: Set<string>; detail: string }>();
      for (const loc of voucherLocations) {
        for (const line of loc.items) {
          const inv = allItems.find(i => i.id === line.id);
          if (!inv) continue;
          // Extract variant detail from name (Base - Detail)
          const extractDetail = (s?: string) => {
            if (!s) return '';
            const idx = s.indexOf(' - ');
            return idx >= 0 ? s.slice(idx + 3).trim() : '';
          };
          const det = extractDetail(line.nameEn) || extractDetail(line.nameAr);
          const key = `${inv.id}::${det || ''}`;
          if (!aggMap.has(key)) {
            aggMap.set(key, { inv, qty: 0, reasons: new Set<string>(), detail: det });
          }
          const entry = aggMap.get(key)!;
          entry.qty += Number(line.issueQuantity) || 0;
          const r = (line.overrideReason || '').trim();
          if (r) entry.reasons.add(r);
        }
      }
      const lines = Array.from(aggMap.values()).map(({ inv, qty, reasons, detail }) => ({
        ...inv,
        quantity: qty,
        // Notes contain the detail, matching older requests
        notes: (detail && detail.length > 0) ? detail : undefined,
        overrideReason: reasons.size > 0 ? Array.from(reasons).join(' | ') : null,
        // Default: if there is a justification, leave decision undefined (pending); otherwise mark approved
        justificationDecision: (reasons.size > 0) ? undefined : 'approved',
      }));
      const residenceName = selectedResidence?.name || '';
      // Build plannedDistribution to reuse later in Issue page
      const plannedDistribution = voucherLocations.map(loc => ({
        locationId: loc.locationId,
        locationName: loc.locationName,
        isFacility: loc.isFacility,
        items: loc.items.map(line => {
          const extractDetail = (s?: string) => {
            if (!s) return '';
            const idx = s.indexOf(' - ');
            return idx >= 0 ? s.slice(idx + 3).trim() : '';
          };
          const detail = extractDetail(line.nameEn) || extractDetail(line.nameAr) || undefined;
          return {
            id: line.id,
            detail,
            quantity: line.issueQuantity,
            overrideReason: line.overrideReason ?? null,
          };
        })
      }));

      const orderId = await createOrder({
        residence: residenceName,
        residenceId,
        requestedById: currentUser?.id || 'unknown',
        items: lines as any,
        notes: undefined,
        plannedDistribution,
      });
      if (!orderId) throw new Error('Failed to create material request');
  toast({ title: 'تم إنشاء الطلب', description: `تم إرسال طلب المواد #${orderId} للموافقة.`, variant: 'default' });
      setVoucherLocations([]);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e?.message || 'Operation failed.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemUpdated = async (updated: InventoryItem) => {
    try {
      await updateItem(updated);
      setEditDialogOpen(false);
      setItemToEdit(null);
      addToRecentItems(updated);
    } catch {}
  };

  const handleNewItemAdded = (newItemWithId: InventoryItem) => {
    handleAddToVoucher(newItemWithId);
    addToRecentItems(newItemWithId);
    setSearchQuery('');
  };

  function AddItemButton({ item, disabled }: { item: InventoryItem; disabled?: boolean }) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const allowCloseRef = useRef(false);
    const [, setTick] = useState(0);
  const [qtyPerLocation, setQtyPerLocation] = useState(1);
    const optionList = useMemo(() => {
      const set = new Set<string>();
      (item.variants || []).forEach(v => { const s = (v || '').trim(); if (s) set.add(s); });
      const arr = Array.from(set);
      const collator = new Intl.Collator(['ar', 'en'], { sensitivity: 'base', numeric: true });
      arr.sort((a, b) => collator.compare(a, b));
      return arr;
    }, [item.variants]);

    if (!optionList || optionList.length === 0) {
      return (
        <Button size="icon" variant="outline" onClick={() => handleAddToVoucher(item)} disabled={disabled}>
          <Plus className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Popover
        open={popoverOpen}
        onOpenChange={(v) => {
          if (v) { setPopoverOpen(true); return; }
          if (allowCloseRef.current) { allowCloseRef.current = false; setPopoverOpen(false); }
          else { setPopoverOpen(true); }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            disabled={disabled}
            onClick={() => { if (popoverOpen) allowCloseRef.current = true; }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <ScrollArea className="h-80 max-h-[60vh]">
            <div className="p-1">
              {optionList.map((variant) => {
                const selected = Boolean((variantSelectionsRef.current[item.id] || {})[variant]);
                return (
                  <div key={variant} className="relative flex w-full select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm hover:bg-accent hover:text-accent-foreground">
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(v) => {
                          const map = { ...(variantSelectionsRef.current[item.id] || {}) } as Record<string, boolean>;
                          if (Boolean(v)) map[variant] = true; else delete map[variant];
                          variantSelectionsRef.current = { ...variantSelectionsRef.current, [item.id]: map };
                          setTick(t => t + 1);
                        }}
                      />
                    </span>
                    <span className="truncate">{variant}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t p-2 bg-white/60 dark:bg-black/20 backdrop-blur">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { variantSelectionsRef.current[item.id] = {}; setTick(t => t + 1); }}>Clear</Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Qty/location</span>
                <QuantityStepper value={qtyPerLocation} min={1} onValueChange={setQtyPerLocation} />
              </div>
            </div>
            <Button size="sm" onClick={() => {
              const map = variantSelectionsRef.current[item.id] || {};
              const entries = Object.entries(map);
              if (entries.length === 0) { handleAddToVoucher(item, optionList?.[0], qtyPerLocation); allowCloseRef.current = true; setPopoverOpen(false); return; }
              if (entries.length === 1) { const [variant] = entries[0]; handleAddToVoucher(item, variant, qtyPerLocation); variantSelectionsRef.current[item.id] = {}; setTick(t => t + 1); allowCloseRef.current = true; setPopoverOpen(false); return; }
              const combinedLabel = entries.map(([variant]) => variant).join(', ');
              handleAddToVoucher(item, combinedLabel, qtyPerLocation);
              variantSelectionsRef.current[item.id] = {};
              setTick(t => t + 1);
              allowCloseRef.current = true;
              setPopoverOpen(false);
            }}>Add selected</Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materials Request (MR) — with distribution</h1>
          <p className="text-muted-foreground">Prepare a materials request distributed to one or more locations. If stock exists or lifespan is not reached, a justification is required.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => submit()} disabled={isSubmitting || voucherLocations.length === 0}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send for approval
          </Button>
        </div>
      </div>

  <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6 items-start">
  {/* Left: Location selection + Available Inventory */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Select location & items</CardTitle>
                <CardDescription>Select residence and locations, then add and distribute items.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Issue from:</Label>
                <Select value={residenceId} onValueChange={setResidenceId}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select residence" /></SelectTrigger>
                  <SelectContent>
                    {residences.filter(r => r.id !== 'main-warehouse').map(r => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Location Type</h3>
                <RadioGroup value={locationType} onValueChange={(value) => setLocationType(value as 'unit' | 'facility')} className="flex gap-4" disabled={!residenceId}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unit" id="r_unit" />
                    <Label htmlFor="r_unit" className="flex items-center gap-2"><BuildingIcon className="h-4 w-4" /> Unit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="facility" id="r_facility" />
                    <Label htmlFor="r_facility" className="flex items-center gap-2"><ConciergeBell className="h-4 w-4" /> Facility</Label>
                  </div>
                </RadioGroup>
                <div className="flex items-center gap-2 pt-1">
                  <Switch id="multi-locations" checked={multiMode} onCheckedChange={(v) => { setMultiMode(Boolean(v)); setSelectedTargets([]); }} disabled={!residenceId} />
                  <Label htmlFor="multi-locations" className="text-sm">Select multiple locations</Label>
                  {multiMode && selectedTargets.length > 0 && (
                    <span className="text-xs text-muted-foreground">• Selected: {selectedTargets.length}</span>
                  )}
                  {multiMode && selectedTargets.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTargets([])}>Clear</Button>
                  )}
                </div>
                
                {/* Selected Location Display */}
                {(currentLocation || (multiMode && selectedTargets.length > 0)) && (
                  <div className="p-3 bg-muted/50 rounded-md border-l-4 border-l-primary">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Selected Location:</span>
                    </div>
                    {!multiMode ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        <PathDisplay path={currentLocation?.name} />
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{selectedTargets.length} selected</p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Building Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Building</Label>
                    {!residenceId ? (
                      <div className="text-xs text-muted-foreground mb-2">Select a residence first.</div>
                    ) : buildings.length === 0 ? (
                      <div className="text-xs text-muted-foreground mb-2">No buildings available.</div>
                    ) : (
                      <div className="space-y-2 max-h-[480px] overflow-y-auto">
                        {buildings.map(b => (
                          <div
                            key={b.id}
                            onClick={() => setBuildingId(buildingId === b.id ? '' : b.id)}
                            className={`p-2 rounded-md border cursor-pointer transition-colors ${
                              buildingId === b.id 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-background hover:bg-muted/50 border-border'
                            } ${!residenceId ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <BuildingIcon className="h-4 w-4" />
                              <span className="text-sm font-medium">{b.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Floor Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Floor</Label>
                    {!buildingId ? (
                      <div className="text-xs text-muted-foreground mb-2">Select a building first.</div>
                    ) : floors.length === 0 ? (
                      <div className="text-xs text-muted-foreground mb-2">No floors available.</div>
                    ) : (
                      <div className="space-y-2 max-h-[480px] overflow-y-auto">
                        {floors.map(f => (
                          <div
                            key={f.id}
                            onClick={() => setFloorId(floorId === f.id ? '' : f.id)}
                            className={`p-2 rounded-md border cursor-pointer transition-colors ${
                              floorId === f.id 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-background hover:bg-muted/50 border-border'
                            } ${!buildingId ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <div className="text-center">
                              <span className="text-sm font-medium">{f.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Room/Facility Selection */}
                  <div>
                    {locationType === 'unit' ? (
                      <>
                        <Label className="text-sm font-medium mb-2 block">Room</Label>
                        {!floorId ? (
                          <div className="text-xs text-muted-foreground mb-2">Select a floor first.</div>
                        ) : rooms.length === 0 ? (
                          <div className="text-xs text-muted-foreground mb-2">No rooms available.</div>
                        ) : (
                          <div className="space-y-2 max-h-[480px] overflow-y-auto">
                            {rooms.map(r => (
                              <div
                                key={r.id}
                                onClick={() => {
                                  if (!multiMode) { setRoomId(roomId === r.id ? '' : r.id); return; }
                                  const id = r.id;
                                  const name = `${selectedResidence?.name || ''} -> ${buildings.find(b=>b.id===buildingId)?.name || ''} -> ${floors.find(f=>f.id===floorId)?.name || ''} -> ${r.name}`;
                                  setSelectedTargets(prev => prev.some(t => t.id === id) ? prev.filter(t => t.id !== id) : [...prev, { id, name, isFacility: false }]);
                                }}
                                className={`p-2 rounded-md border cursor-pointer transition-colors ${
                                  (!multiMode && roomId === r.id) || (multiMode && selectedTargets.some(t => t.id === r.id))
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : 'bg-background hover:bg-muted/50 border-border'
                                } ${!floorId ? 'opacity-50 pointer-events-none' : ''}`}
                              >
                                <div className="text-center">
                                  <span className="text-sm font-medium">{r.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Label className="text-sm font-medium mb-2 block">Facility</Label>
                        {!residenceId ? (
                          <div className="text-xs text-muted-foreground mb-2">Select a residence first.</div>
                        ) : availableFacilities.length === 0 ? (
                          <div className="text-xs text-muted-foreground mb-2">No facilities available.</div>
                        ) : (
                          <div className="space-y-2 max-h-[480px] overflow-y-auto">
                            {availableFacilities.map(f => (
                              <div
                                key={f.id}
                                onClick={() => {
                                  if (!multiMode) { setFacilityId(facilityId === f.id ? '' : f.id); return; }
                                  const id = f.id;
                                  const parts = [selectedResidence?.name];
                                  const b = buildings.find(b => b.id === buildingId); if (b) parts?.push(b.name);
                                  const fl = floors.find(fl => fl.id === floorId); if (fl) parts?.push(fl.name);
                                  parts?.push(f.name);
                                  const name = parts?.filter(Boolean).join(' -> ') || f.name;
                                  setSelectedTargets(prev => prev.some(t => t.id === id) ? prev.filter(t => t.id !== id) : [...prev, { id, name, isFacility: true }]);
                                }}
                                className={`p-2 rounded-md border cursor-pointer transition-colors ${
                                  (!multiMode && facilityId === f.id) || (multiMode && selectedTargets.some(t => t.id === f.id))
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : 'bg-background hover:bg-muted/50 border-border'
                                } ${!residenceId ? 'opacity-50 pointer-events-none' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <ConciergeBell className="h-4 w-4" />
                                  <span className="text-sm font-medium"><span dir="ltr">{f.name}</span></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Component Selection - Show only when a facility is selected and has components */}
                        {!multiMode && facilityId && availableComponents.length > 0 && (
                          <div className="mt-4">
                            <Label className="text-sm font-medium mb-1 block">Select Component (Optional)</Label>
                            {/* helper text removed per request */}
                            <div className="space-y-2 max-h-[260px] overflow-y-auto">
                              {availableComponents.map((component: FacilityComponent) => (
                                <div
                                  key={component.id}
                                  onClick={() => setComponentId(componentId === component.id ? '' : component.id)}
                                  className={`p-2 rounded-md border cursor-pointer text-xs transition-colors flex items-center gap-2 ${
                                    componentId === component.id 
                                      ? 'bg-primary text-primary-foreground border-primary' 
                                      : 'bg-background hover:bg-muted/50 border-border'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm flex-shrink-0">
                                      {component.type === 'light' ? '💡' : 
                                       component.type === 'outlet' ? '🔌' : 
                                       component.type === 'switch' ? '⚡' : 
                                       component.type === 'fan' ? '🌀' : '⚙️'}
                                    </span>
                                    <span className="font-medium truncate" title={component.name}>{component.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Available Inventory</h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search items..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
                  <SelectTrigger><SelectValue placeholder="Filter by category" /></SelectTrigger>
                  <SelectContent className="z-50" position="popper" side="bottom" sideOffset={4}>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allItems && allItems.length > 0 ? (
                      categories.map(cat => (
                        <SelectItem key={cat} value={cat!} className="capitalize">{cat}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <ScrollArea className="h-[300px] border rounded-md">
                  {residenceId ? (
                    <div className="p-2 space-y-2">
                      {recentItems.length > 0 && !searchQuery && selectedCategory === 'all' && (
                        <div className="border-b pb-2 mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-medium text-muted-foreground">Recently Used Items</h4>
                          </div>
                          <div className="space-y-2">
                            {recentItems.map(item => {
                              const stock = getStockForResidence(item, residenceId);
                              const allocated = getAggregateIssuedQty(item.id);
                              const remaining = Math.max(0, stock - allocated);
                              return (
                                <div key={`recent-${item.id}`} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                                  <div>
                                    <p className="font-medium text-sm">{item.nameAr} / {item.nameEn}</p>
                                    <p className="text-xs text-muted-foreground">{item.category} - Stock: {remaining} / {stock} {item.unit}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setItemToEdit(item)}><Edit className="h-4 w-4" /></Button>
                                    <AddItemButton item={item} disabled={!isLocationSelected} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {availableInventory.length > 0 ? availableInventory.map(item => {
                        const stock = getStockForResidence(item, residenceId);
                        const allocated = getAggregateIssuedQty(item.id);
                        const remaining = Math.max(0, stock - allocated);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                            <div>
                              <p className="font-medium text-sm">{item.nameAr} / {item.nameEn}</p>
                              <p className="text-xs text-muted-foreground">{item.category} - Stock: {remaining} / {stock} {item.unit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setItemToEdit(item)}><Edit className="h-4 w-4" /></Button>
                              <AddItemButton item={item} disabled={!isLocationSelected} />
                            </div>
                          </div>
                        );
                      }) : (
                        searchQuery || selectedCategory !== 'all' ? (
                          <div className="text-center text-muted-foreground py-10">
                            <p className="mb-4">No items found matching your criteria.</p>
                            {searchQuery && <Button onClick={() => setAddDialogVisible(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add "{searchQuery}"</Button>}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-10">Start typing to search for items.</div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Select a residence to see items.
                    </div>
                  )}
                </ScrollArea>

                {/* Per-line justification captured during add; no global field needed. */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Voucher Items (like MR/Issue) */}
        <Card>
          <CardHeader>
            <CardTitle>Voucher items</CardTitle>
            <CardDescription>Review items per location before submitting.</CardDescription>
          </CardHeader>
          <CardContent>
            {voucherLocations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items added yet.</div>
            ) : (
              <div className="space-y-4">
                {voucherLocations.map(loc => (
                  <div key={loc.locationId} className="rounded-md border">
                    <div className="flex items-center justify-between border-b p-3">
                      <div className="font-medium"><PathDisplay path={loc.locationName} /></div>
                    </div>
                    <div className="divide-y">
                      {loc.items.map(line => (
                        <div key={line.id} className="flex items-center justify-between p-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{line.nameEn || line.nameAr || line.id}</div>
                            {!!line.overrideReason && <div className="text-xs text-amber-700">Override: {line.overrideReason}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <QuantityStepper value={line.issueQuantity} min={1} onValueChange={(v) => updateLineQty(loc.locationId, line.id, v)} />
                            <Button variant="destructive" size="icon" onClick={() => removeLine(loc.locationId, line.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  <AddItemDialog isOpen={isAddDialogVisible} onOpenChange={setAddDialogVisible} onItemAdded={addItem} onItemAddedAndOrdered={handleNewItemAdded} initialName={searchQuery} />
  <EditItemDialog isOpen={editDialogOpen} onOpenChange={(v) => { setEditDialogOpen(v); if (!v) setItemToEdit(null); }} onItemUpdated={handleItemUpdated} item={itemToEdit} />
  {/* Justification dialog */}
  <Dialog open={justOpen} onOpenChange={(v) => { setJustOpen(v); if (!v && justificationResolver.current) { justificationResolver.current(null); justificationResolver.current = null; } }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Justification required</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="just-text">Provide a clear justification for this item.</Label>
        <Input id="just-text" value={justText} onChange={(e) => setJustText(e.target.value)} placeholder="Enter justification..." />
        <p className="text-xs text-muted-foreground">Required when stock exists in residence and/or lifespan not reached.</p>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => { setJustOpen(false); if (justificationResolver.current) { justificationResolver.current(null); justificationResolver.current = null; } }}>Cancel</Button>
        <Button onClick={() => { if (justText.trim().length >= 3) { setJustOpen(false); if (justificationResolver.current) { justificationResolver.current(justText.trim()); justificationResolver.current = null; } } }} disabled={justText.trim().length < 3}>Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
    </div>
  );
}
