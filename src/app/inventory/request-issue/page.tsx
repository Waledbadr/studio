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
import { MapPin, Building as BuildingIcon, ConciergeBell, Loader2, Search, Plus, Trash2, Edit, ChevronDown, Clock, PlusCircle, ShoppingCart, Package, ArrowRight, Check, X, AlertCircle, FileText } from 'lucide-react';
import { normalizeText, includesNormalized } from '@/lib/utils';
import { AR_SYNONYMS, buildNormalizedSynonyms } from '@/lib/aliases';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type IssueLine = { id: string; nameEn?: string; nameAr?: string; issueQuantity: number; overrideReason?: string | null };
type LocationEntry = { locationId: string; locationName: string; isFacility: boolean; items: IssueLine[] };

export default function RequestIssuePage() {
  const { items: allItems, getStockForResidence, checkItemLifespanAtLocation, addItem, updateItem } = useInventory();
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const { createOrder } = useOrders();
  const [isPending, startTransition] = useTransition();

  // Resizable columns state
  const [leftColWidth, setLeftColWidth] = useState(320);
  const [rightColWidth, setRightColWidth] = useState(350);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStateRef.current) return;
      
      const { startX, startWidth } = resizeStateRef.current;
      const delta = e.clientX - startX;

      if (isResizingLeft) {
        // Left column: dragging right increases width
        const newWidth = Math.max(250, Math.min(600, startWidth + delta));
        setLeftColWidth(newWidth);
      } else if (isResizingRight) {
        // Right column: dragging left increases width (delta is negative when moving left)
        // Wait, the right column is on the right side.
        // If I drag the handle (which is on the left of the right column) to the left, the right column grows.
        // So delta < 0 -> width increases.
        const newWidth = Math.max(250, Math.min(600, startWidth - delta));
        setRightColWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      resizeStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

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

  // Hide non-selected facilities after a facility is chosen (applies to single and multi)
  const visibleFacilities = useMemo(() => {
    if (!facilityId) return availableFacilities;
    return availableFacilities.filter(f => f.id === facilityId);
  }, [availableFacilities, facilityId]);

  // Compact view: hide non-selected ancestors after picking deeper levels (single mode only)
  const visibleBuildings = useMemo(() => {
    if (!buildingId) return buildings;
    // After selecting next level (floor/room/facility), keep only the chosen building (applies to single and multi)
    if (floorId || roomId || facilityId) return buildings.filter(b => b.id === buildingId);
    return buildings;
  }, [buildings, buildingId, floorId, roomId, facilityId]);

  const visibleFloors = useMemo(() => {
    if (!buildingId) return [];
    if (!floorId) return floors;
    // After selecting room or facility/component, keep only the chosen floor (applies to single and multi)
    if (roomId || facilityId || componentId) return floors.filter(f => f.id === floorId);
    return floors;
  }, [floors, buildingId, floorId, roomId, facilityId, componentId]);

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

  // Show only residences assigned to the current user (admins see all)
  const userResidences = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences]);

  const filteredResidences = useMemo(() => userResidences.filter(r => r.id !== 'main-warehouse'), [userResidences]);
  
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
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Materials Request
          </h1>
          <p className="text-xs text-muted-foreground">Create and distribute material requests across locations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border">
            <span className="text-xs font-medium text-muted-foreground">Issue From:</span>
            <Select value={residenceId} onValueChange={setResidenceId}>
              <SelectTrigger className="h-7 w-[180px] border-0 bg-transparent focus:ring-0 p-0 text-sm font-semibold">
                <SelectValue placeholder="Select Residence" />
              </SelectTrigger>
              <SelectContent>
                {filteredResidences.map(r => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => submit()} disabled={isSubmitting || voucherLocations.length === 0} size="sm">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Submit Request
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Selection & Catalog */}
        <div className="flex-1 flex flex-row min-w-0 border-r bg-muted/10" style={{}}>
          
          {/* Location Selector Section - Left Column */}
          <div style={{ width: leftColWidth }} className="flex flex-col border-r bg-card shrink-0">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Target Location
                </h2>
                <div className="flex items-center gap-2">
                  <Label htmlFor="multi-mode" className="text-xs cursor-pointer">Multi-select</Label>
                  <Switch id="multi-mode" checked={multiMode} onCheckedChange={(v) => { setMultiMode(Boolean(v)); setSelectedTargets([]); }} disabled={!residenceId} className="scale-75" />
                </div>
              </div>

              <Tabs value={locationType} onValueChange={(v) => setLocationType(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="unit" className="text-xs">Unit / Room</TabsTrigger>
                  <TabsTrigger value="facility" className="text-xs">Facility / Common Area</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-hidden p-4 space-y-4 flex flex-col">
              {locationType === 'unit' ? (
                <>
                  {/* Building Selection */}
                  <div className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${buildingId ? 'h-24 flex-none' : 'flex-1'}`}>
                    <Label className="text-xs font-medium mb-2 text-muted-foreground">Building</Label>
                    <ScrollArea className="flex-1 border rounded-md bg-background">
                      <div className="p-1 space-y-1">
                        {!residenceId ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">Select residence</div>
                        ) : visibleBuildings.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">No buildings</div>
                        ) : (
                          visibleBuildings.map(b => (
                            <div
                              key={b.id}
                              onClick={() => setBuildingId(buildingId === b.id ? '' : b.id)}
                              className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-colors flex items-center gap-2 ${
                                buildingId === b.id 
                                  ? 'bg-primary text-primary-foreground font-medium' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <BuildingIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{b.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Floor Selection */}
                  <div className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${floorId ? 'h-24 flex-none' : 'flex-1'}`}>
                    <Label className="text-xs font-medium mb-2 text-muted-foreground">Floor</Label>
                    <ScrollArea className="flex-1 border rounded-md bg-background">
                      <div className="p-1 space-y-1">
                        {!buildingId ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">Select building</div>
                        ) : visibleFloors.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">No floors</div>
                        ) : (
                          visibleFloors.map(f => (
                            <div
                              key={f.id}
                              onClick={() => setFloorId(floorId === f.id ? '' : f.id)}
                              className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-colors text-center ${
                                floorId === f.id 
                                  ? 'bg-primary text-primary-foreground font-medium' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {f.name}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Room Selection */}
                  <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 ease-in-out">
                    <Label className="text-xs font-medium mb-2 text-muted-foreground">Room</Label>
                    <ScrollArea className="flex-1 border rounded-md bg-background">
                      <div className="p-1 space-y-1">
                        {!floorId ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">Select floor</div>
                        ) : rooms.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">No rooms</div>
                        ) : (
                          rooms.map(r => (
                            <div
                              key={r.id}
                              onClick={() => {
                                if (!multiMode) { setRoomId(roomId === r.id ? '' : r.id); return; }
                                const id = r.id;
                                const name = `${selectedResidence?.name || ''} -> ${buildings.find(b=>b.id===buildingId)?.name || ''} -> ${floors.find(f=>f.id===floorId)?.name || ''} -> ${r.name}`;
                                setSelectedTargets(prev => prev.some(t => t.id === id) ? prev.filter(t => t.id !== id) : [...prev, { id, name, isFacility: false }]);
                              }}
                              className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-colors text-center ${
                                (!multiMode && roomId === r.id) || (multiMode && selectedTargets.some(t => t.id === r.id))
                                  ? 'bg-primary text-primary-foreground font-medium' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {r.name}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              ) : (
                <>
                  {/* Building Selection (Facility) */}
                  <div className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${buildingId ? 'h-24 flex-none' : 'flex-1'}`}>
                    <Label className="text-xs font-medium mb-2 text-muted-foreground">Building (Optional)</Label>
                    <ScrollArea className="flex-1 border rounded-md bg-background">
                      <div className="p-1 space-y-1">
                        {!residenceId ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">Select residence</div>
                        ) : visibleBuildings.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">No buildings</div>
                        ) : (
                          visibleBuildings.map(b => (
                            <div
                              key={b.id}
                              onClick={() => setBuildingId(buildingId === b.id ? '' : b.id)}
                              className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-colors flex items-center gap-2 ${
                                buildingId === b.id 
                                  ? 'bg-primary text-primary-foreground font-medium' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <BuildingIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{b.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Floor Selection (Facility) */}
                  <div className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${floorId ? 'h-24 flex-none' : 'flex-1'}`}>
                    <Label className="text-xs font-medium mb-2 text-muted-foreground">Floor (Optional)</Label>
                    <ScrollArea className="flex-1 border rounded-md bg-background">
                      <div className="p-1 space-y-1">
                        {!buildingId ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">Select building first</div>
                        ) : visibleFloors.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">No floors</div>
                        ) : (
                          visibleFloors.map(f => (
                            <div
                              key={f.id}
                              onClick={() => setFloorId(floorId === f.id ? '' : f.id)}
                              className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-colors text-center ${
                                floorId === f.id 
                                  ? 'bg-primary text-primary-foreground font-medium' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {f.name}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Facility Selection */}
                  <div className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${facilityId ? 'h-24 flex-none' : 'flex-1'}`}>
                    <Label className="text-xs font-medium mb-2 text-muted-foreground">Facility</Label>
                    <ScrollArea className="flex-1 border rounded-md bg-background">
                      <div className="p-1 space-y-1">
                        {!residenceId ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">Select residence</div>
                        ) : visibleFacilities.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2 text-center">No facilities</div>
                        ) : (
                          visibleFacilities.map(f => (
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
                                setSelectedTargets(prev => {
                                  const exists = prev.some(t => t.id === id);
                                  let next = exists ? prev.filter(t => t.id !== id) : [...prev, { id, name, isFacility: true }];
                                  if (!exists) {
                                    const compIds = (availableComponents || []).map(c => c.id);
                                    next = next.filter(t => !compIds.includes(t.id));
                                  }
                                  return next;
                                });
                                setFacilityId(prev => prev === f.id ? '' : f.id);
                              }}
                              className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-colors flex items-center gap-2 ${
                                (!multiMode && facilityId === f.id) || (multiMode && selectedTargets.some(t => t.id === f.id))
                                  ? 'bg-primary text-primary-foreground font-medium' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <ConciergeBell className="h-3 w-3 shrink-0" />
                              <span className="truncate" dir="auto">{f.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Component Selection */}
                  <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 ease-in-out">
                    <Label className="text-xs font-medium mb-2 text-muted-foreground">Component (Optional)</Label>
                    <ScrollArea className="flex-1 border rounded-md bg-background">
                      <div className="p-1 grid grid-cols-2 gap-1">
                        {!facilityId ? (
                          <div className="col-span-2 text-xs text-muted-foreground p-2 text-center">Select facility</div>
                        ) : availableComponents.length === 0 ? (
                          <div className="col-span-2 text-xs text-muted-foreground p-2 text-center">No components</div>
                        ) : (
                          availableComponents.map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (!multiMode) {
                                  setComponentId(componentId === c.id ? '' : c.id);
                                  return;
                                }
                                const id = c.id;
                                const parts = [selectedResidence?.name];
                                const b = buildings.find(b => b.id === buildingId); if (b) (parts as any)?.push(b.name);
                                const fl = floors.find(fl => fl.id === floorId); if (fl) (parts as any)?.push(fl.name);
                                const fac = availableFacilities.find(f => f.id === facilityId); if (fac) (parts as any)?.push(fac.name);
                                (parts as any)?.push(c.name);
                                const name = (parts as any)?.filter(Boolean).join(' -> ') || c.name;
                                setSelectedTargets(prev => {
                                  const exists = prev.some(t => t.id === id);
                                  let next = exists ? prev.filter(t => t.id !== id) : [...prev, { id, name, isFacility: true }];
                                  if (facilityId) {
                                    next = next.filter(t => t.id !== facilityId);
                                  }
                                  return next;
                                });
                              }}
                              className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-colors flex items-center gap-1 border ${
                                (!multiMode && componentId === c.id) || (multiMode && selectedTargets.some(t => t.id === c.id))
                                  ? 'bg-primary text-primary-foreground border-primary font-medium' 
                                  : 'hover:bg-muted border-transparent'
                              }`}
                            >
                              <span className="shrink-0">
                                {c.type === 'light' ? '💡' : 
                                 c.type === 'outlet' ? '🔌' : 
                                 c.type === 'switch' ? '⚡' : 
                                 c.type === 'fan' ? '🌀' : '⚙️'}
                              </span>
                              <span className="truncate">{c.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
              
              {/* Selected Location Indicator */}
              <div className="mt-auto p-2 bg-primary/5 rounded border border-primary/20 flex items-center justify-between min-h-[2.5rem]">
                <div className="flex items-center gap-2 text-sm overflow-hidden">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {multiMode ? (
                    <span className="font-medium truncate">{selectedTargets.length} locations selected</span>
                  ) : (
                    <span className="font-medium truncate text-primary">
                      {currentLocation ? <PathDisplay path={currentLocation.name} /> : <span className="text-muted-foreground italic">No location selected</span>}
                    </span>
                  )}
                </div>
                {multiMode && selectedTargets.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedTargets([])}>Clear</Button>
                )}
              </div>
            </div>
          </div>

          {/* Drag Handle Left */}
          <div
            className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-50 bg-border/30"
            onMouseDown={(e) => {
              setIsResizingLeft(true);
              resizeStateRef.current = { startX: e.clientX, startWidth: leftColWidth };
            }}
          />

          {/* Item Catalog Section - Middle Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            <div className="p-3 border-b flex items-center gap-3 bg-card">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search items..." 
                  className="pl-9 h-9" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 overflow-auto p-0">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[40%] min-w-[200px]">Item Name</TableHead>
                    <TableHead className="w-[20%] min-w-[100px]">Category</TableHead>
                    <TableHead className="w-[15%] min-w-[80px] text-center">Unit</TableHead>
                    <TableHead className="w-[15%] min-w-[80px] text-right">Stock</TableHead>
                    <TableHead className="w-[10%] min-w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!residenceId ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Select a residence to view inventory</TableCell></TableRow>
                  ) : availableInventory.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No items found</TableCell></TableRow>
                  ) : (
                    availableInventory.map(item => {
                      const stock = getStockForResidence(item, residenceId);
                      const allocated = getAggregateIssuedQty(item.id);
                      const remaining = Math.max(0, stock - allocated);
                      return (
                        <TableRow key={item.id} className="group h-12">
                          <TableCell className="font-medium align-middle">
                            <div className="flex flex-col justify-center">
                              <span className="leading-tight">{item.nameEn}</span>
                              <span className="text-[10px] text-muted-foreground leading-tight">{item.nameAr}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle"><Badge variant="outline" className="font-normal text-xs">{item.category}</Badge></TableCell>
                          <TableCell className="align-middle text-center text-xs text-muted-foreground">{item.unit || '-'}</TableCell>
                          <TableCell className="text-right font-mono align-middle">
                            <div className="flex flex-col items-end justify-center">
                              <span className={`text-sm font-bold ${remaining === 0 ? "text-destructive" : "text-foreground"}`}>{remaining}</span>
                              <span className="text-[10px] text-muted-foreground">of {stock}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setItemToEdit(item); setEditDialogOpen(true); }}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <AddItemButton item={item} disabled={!isLocationSelected} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Drag Handle Right */}
        <div
          className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-50 bg-border/30"
          onMouseDown={(e) => {
            setIsResizingRight(true);
            resizeStateRef.current = { startX: e.clientX, startWidth: rightColWidth };
          }}
        />

        {/* Right Panel: Voucher / Cart */}
        <div style={{ width: rightColWidth }} className="border-l bg-card flex flex-col shadow-xl z-20 shrink-0">
          <div className="p-4 border-b bg-muted/10">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Request Voucher
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {voucherLocations.reduce((acc, loc) => acc + loc.items.length, 0)} items across {voucherLocations.length} locations
            </p>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {voucherLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg m-2">
                <Package className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Voucher is empty</p>
                <p className="text-xs">Select location & add items</p>
              </div>
            ) : (
              <div className="space-y-6">
                {voucherLocations.map((loc, i) => (
                  <div key={loc.locationId} className="relative pl-4 border-l-2 border-primary/20">
                    <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold text-primary leading-tight">
                        <PathDisplay path={loc.locationName} />
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {loc.items.map(line => (
                        <div key={`${loc.locationId}-${line.id}`} className="bg-muted/30 p-2 rounded-md text-sm group hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{line.nameEn || line.nameAr}</p>
                              {line.overrideReason && (
                                <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                                  <AlertCircle className="h-3 w-3" /> {line.overrideReason}
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-1"
                              onClick={() => removeLine(loc.locationId, line.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">Qty:</span>
                            <QuantityStepper 
                              value={line.issueQuantity} 
                              min={1} 
                              onValueChange={(v) => updateLineQty(loc.locationId, line.id, v)} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t bg-muted/10">
             <Button className="w-full" onClick={() => submit()} disabled={isSubmitting || voucherLocations.length === 0}>
               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
               Proceed to Approval
             </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddItemDialog
        isOpen={isAddDialogVisible}
        onOpenChange={setAddDialogVisible}
        onItemAdded={addItem}
        onItemAddedAndOrdered={handleNewItemAdded}
        initialName={searchQuery}
      />
      <EditItemDialog isOpen={editDialogOpen} onOpenChange={(v) => { setEditDialogOpen(v); if (!v) setItemToEdit(null); }} onItemUpdated={handleItemUpdated} item={itemToEdit} />
      
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
