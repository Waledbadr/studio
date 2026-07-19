'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders, type Order } from '@/context/orders-context';
import { useResidences, type FacilityComponent } from '@/context/residences-context';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ConciergeBell, Edit, Loader2, MapPin, Search, Trash2, Building as BuildingIcon, Clock, Plus, MessageSquare } from 'lucide-react';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

type PlanLine = { id: string; detail?: string; quantity: number; overrideReason?: string | null };
type PlanLocation = { locationId: string; locationName: string; isFacility: boolean; items: PlanLine[] };

export default function EditPlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getOrderById, updateOrder } = useOrders();
  const { residences } = useResidences();
  const { items: allItems, getStockForResidence, checkItemLifespanAtLocation, updateItem } = useInventory();
  const { currentUser } = useUsers();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local working copy of the plan
  const [plan, setPlan] = useState<PlanLocation[]>([]);

  // Location selection (single target)
  const [residenceId, setResidenceId] = useState('');
  const selectedResidence = useMemo(() => residences.find(r => r.id === residenceId), [residences, residenceId]);
  const [locationType, setLocationType] = useState<'unit' | 'facility'>('unit');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [componentId, setComponentId] = useState('');
  // Multi-location selection
  const [multiMode, setMultiMode] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<{ id: string; name: string; isFacility: boolean }[]>([]);

  // Inventory browsing
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // Justification dialog state
  const [justOpen, setJustOpen] = useState(false);
  const [justText, setJustText] = useState('');
  const [justTarget, setJustTarget] = useState<{ locationId: string; itemId: string; detail?: string } | null>(null);
  const askForJustification = async (): Promise<string | null> => {
    setJustText('');
    return new Promise((resolve) => {
      const handle = (val: string | null) => resolve(val);
      // temporary store resolver on window to avoid extra state; cleared on close
      (window as any).__ec_resolver = handle;
      setJustOpen(true);
    });
  };

  // Derived structure helpers
  const buildings = selectedResidence?.buildings || [];
  const floors = buildings.find(b => b.id === buildingId)?.floors || [];
  const rooms = floors.find(f => f.id === floorId)?.rooms || [];
  const availableFacilities = useMemo(() => {
    if (!selectedResidence) return [];
    if (floorId) return floors.find(f => f.id === floorId)?.facilities || [];
    if (buildingId) return buildings.find(b => b.id === buildingId)?.facilities || [];
    return selectedResidence.facilities || [];
  }, [selectedResidence, buildings, floors, buildingId, floorId]);
  // Progressive hiding parity with Request-Issue
  const visibleFacilities = useMemo(() => {
    if (multiMode) return availableFacilities;
    if (!facilityId) return availableFacilities;
    return availableFacilities.filter(f => f.id === facilityId);
  }, [availableFacilities, facilityId, multiMode]);
  const visibleBuildings = useMemo(() => {
    if (!buildingId) return buildings;
    if (floorId || roomId || facilityId) return buildings.filter(b => b.id === buildingId);
    return buildings;
  }, [buildings, buildingId, floorId, roomId, facilityId]);
  const visibleFloors = useMemo(() => {
    if (!buildingId) return [];
    if (!floorId) return floors;
    if (roomId || facilityId || componentId) return floors.filter(f => f.id === floorId);
    return floors;
  }, [floors, buildingId, floorId, roomId, facilityId, componentId]);
  const availableComponents = useMemo<FacilityComponent[]>(() => {
    if (!facilityId) return [];
    const fac = availableFacilities.find(f => f.id === facilityId);
    return ((fac as any)?.components || []) as FacilityComponent[];
  }, [facilityId, availableFacilities]);

  const isLocationSelected = useMemo(() => {
    if (!residenceId) return false;
    if (multiMode) return selectedTargets.length > 0;
    if (locationType === 'unit') return !!(buildingId && floorId && roomId);
    return !!facilityId; // component is optional
  }, [residenceId, multiMode, selectedTargets.length, locationType, buildingId, floorId, roomId, facilityId]);

  const currentLocation = useMemo(() => {
    if (!selectedResidence || !isLocationSelected) return null as null | { id: string; name: string; isFacility: boolean };
    if (multiMode) return null;
    if (locationType === 'unit') {
      const b = buildings.find(b => b.id === buildingId);
      const f = floors.find(f => f.id === floorId);
      const r = rooms.find(r => r.id === roomId);
      if (!b || !f || !r) return null;
      return { id: r.id, name: `${selectedResidence.name} -> ${b.name} -> ${f.name} -> ${r.name}` , isFacility: false };
    }
    const fac = availableFacilities.find(fl => fl.id === facilityId);
    if (!fac) return null;
    const parts = [selectedResidence.name];
    const b = buildings.find(b => b.id === buildingId); if (b) parts.push(b.name);
    const f = floors.find(f => f.id === floorId); if (f) parts.push(f.name);
    parts.push(fac.name);
    if (componentId) {
      const comp = availableComponents.find(c => c.id === componentId);
      if (comp) { parts.push(comp.name); return { id: comp.id, name: parts.join(' -> '), isFacility: true }; }
    }
    return { id: fac.id, name: parts.join(' -> '), isFacility: true };
  }, [selectedResidence, isLocationSelected, multiMode, locationType, buildings, floors, rooms, availableFacilities, buildingId, floorId, roomId, facilityId, componentId, availableComponents]);

  const availableInventory = useMemo(() => {
    const base = selectedCategory === 'all' ? allItems : allItems.filter(i => i.category === selectedCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(i => `${i.nameAr} ${i.nameEn} ${i.category} ${(i.keywordsAr||[]).join(' ')} ${(i.keywordsEn||[]).join(' ')} ${(i.variants||[]).join(' ')}`.toLowerCase().includes(q));
  }, [allItems, selectedCategory, searchQuery]);

  useEffect(() => {
    const run = async () => {
      if (typeof id !== 'string') return;
      setLoading(true);
      const o = await getOrderById(id);
      if (!o) { setOrder(null); setLoading(false); return; }
      setOrder(o);
      setResidenceId(o.residenceId);
      const initial = Array.isArray(o.plannedDistribution) ? o.plannedDistribution.map(loc => ({
        locationId: loc.locationId,
        locationName: loc.locationName,
        isFacility: !!loc.isFacility,
        items: (Array.isArray(loc.items) ? loc.items : []).map(it => ({ id: it.id, detail: it.detail, quantity: Number(it.quantity)||0, overrideReason: (it as any).overrideReason ?? null }))
      })) : [];
      setPlan(initial);
      setLoading(false);
      try {
        const raw = localStorage.getItem('recentMaterialRequestItems') || '[]';
        const ids = JSON.parse(raw) as string[];
        const recent = ids.map(i => allItems.find(it => it.id === i)).filter((x): x is InventoryItem => !!x).slice(0,5);
        setRecentItems(recent);
      } catch {}
    };
    run();
  }, [id, getOrderById, allItems]);

  // Reset selections appropriately on hierarchy changes
  useEffect(() => { setSelectedTargets([]); }, [buildingId]);
  useEffect(() => { setSelectedTargets([]); }, [floorId]);
  useEffect(() => { if (!multiMode) setSelectedTargets([]); }, [multiMode]);

  const addToPlan = async (item: InventoryItem, qty: number = 1) => {
    const targets = multiMode ? selectedTargets : (currentLocation ? [currentLocation] : []);
    if (!targets || targets.length === 0) { toast({ title: 'Select location', description: 'Choose a target location first.', variant: 'destructive' }); return; }
    // Constraint check: justification required if stock exists OR lifespan within at any target
    let requireJustification = false;
    try { if (getStockForResidence(item, residenceId) > 0) requireJustification = true; } catch {}
    try {
      const lifeResults = await Promise.all(targets.map(t => checkItemLifespanAtLocation(item.id, t.id).catch(() => null)));
      if (lifeResults.some(life => life && life.lifespanDays && life.withinLifespan)) requireJustification = true;
    } catch {}

    let providedReason: string | null = null;
    if (requireJustification) {
      providedReason = await askForJustification();
      if (!providedReason || providedReason.trim().length < 3) {
        toast({ title: 'Justification required', description: 'Provide a clear justification to add this item.', variant: 'destructive' });
        return;
      }
    }

    setPlan(prev => {
      const next = [...prev];
      for (const t of targets) {
        let idx = next.findIndex(l => l.locationId === t.id);
        if (idx === -1) { next.push({ locationId: t.id, locationName: t.name, isFacility: t.isFacility, items: [] }); idx = next.length - 1; }
        const loc = { ...next[idx] };
        const found = loc.items.find(i => i.id === item.id && (!i.detail || !i.detail.length));
        if (!found) loc.items = [...loc.items, { id: item.id, detail: undefined, quantity: Math.max(1, qty), overrideReason: providedReason ?? null }];
        else {
          found.quantity = found.quantity + Math.max(1, qty);
          if (requireJustification && providedReason) found.overrideReason = providedReason;
        }
        next[idx] = loc;
      }
      return next;
    });
  };

  const handleItemUpdated = async (updated: InventoryItem) => {
    try {
      await updateItem(updated);
      setEditDialogOpen(false);
      setItemToEdit(null);
    } catch (e) {
      console.error('Failed to update item from edit-plan page', e);
    }
  };

  const updateQty = (locationId: string, itemId: string, nextQty: number, detail?: string) => {
    setPlan(prev => prev.map(loc => loc.locationId !== locationId ? loc : ({ ...loc, items: loc.items.map(it => (it.id === itemId && it.detail === detail) ? { ...it, quantity: Math.max(1, nextQty) } : it) })));
  };

  const removeLine = (locationId: string, itemId: string, detail?: string) => {
    setPlan(prev => prev.map(loc => loc.locationId !== locationId ? loc : ({ ...loc, items: loc.items.filter(it => !(it.id === itemId && it.detail === detail)) })).filter(loc => loc.items.length > 0));
  };

  const removeLocation = (locationId: string) => {
    setPlan(prev => prev.filter(l => l.locationId !== locationId));
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      // Validate justifications for lines requiring override (parallel lifespan checks)
      const needCheck: Array<{ loc: PlanLocation; line: PlanLine }> = [];
      for (const loc of plan) {
        for (const line of loc.items) {
          if (line.overrideReason && line.overrideReason.trim().length >= 3) continue;
          needCheck.push({ loc, line });
        }
      }
      const stockCache = new Map<string, number>();
      for (const { line } of needCheck) {
        if (!stockCache.has(line.id)) {
          const inv = allItems.find(i => i.id === line.id);
          try { stockCache.set(line.id, inv ? getStockForResidence(inv, residenceId) : 0); } catch { stockCache.set(line.id, 0); }
        }
      }
      const lifeResults = await Promise.all(needCheck.map(({ line, loc }) => checkItemLifespanAtLocation(line.id, loc.locationId).catch(() => null)));
      for (let i = 0; i < needCheck.length; i++) {
        const { loc, line } = needCheck[i];
        const stock = stockCache.get(line.id) || 0;
        const life = lifeResults[i];
        const requires = (stock > 0) || (!!life && life.lifespanDays && life.withinLifespan);
        if (requires && (!line.overrideReason || line.overrideReason.trim().length < 3)) {
          toast({ title: 'Justification required', description: `Provide justification for ${allItems.find(i=>i.id===line.id)?.nameEn || line.id} at ${loc.locationName}.`, variant: 'destructive' });
          setSaving(false);
          return;
        }
      }

      await updateOrder(order.id, {
        items: order.items,
        residence: order.residence,
        residenceId: order.residenceId,
        notes: order.notes,
        plannedDistribution: plan.map(loc => ({
          locationId: loc.locationId,
          locationName: loc.locationName,
          isFacility: !!loc.isFacility,
          items: loc.items.map(i => ({ id: i.id, detail: i.detail, quantity: i.quantity, overrideReason: i.overrideReason ?? null }))
        }))
      });
      toast({ title: 'Saved', description: 'Distribution plan updated.' });
      router.push(`/inventory/orders/${order.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };
  // Hooks must run unconditionally before any return
  const categories = useMemo(() => Array.from(new Set(allItems.map(i => i.category).filter(Boolean))), [allItems]);

  if (loading) return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!order) return (
    <div className="p-6">
      <p className="mb-4 text-muted-foreground">Request not found.</p>
      <Button onClick={() => router.push('/inventory/orders')}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
    </div>
  );

  const PathDisplay = ({ path }: { path?: string | null }) => {
    if (!path) return null;
    const arrow = '\u200E→\u200E';
    const segs = String(path).split('->').map(s => s.trim()).filter(Boolean);
    return (
      <span dir="ltr">
        {segs.map((s, i) => (
          <span key={i} className="inline"><span dir="auto">{s}</span>{i < segs.length - 1 ? <span className="mx-1">{arrow}</span> : null}</span>
        ))}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Distribution Plan</h1>
          <p className="text-muted-foreground">MR #{order.id} · {order.residence}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/inventory/orders/${order.id}`)}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
          <Button onClick={handleSave} disabled={saving}><Loader2 className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : 'hidden'}`} />Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/> Select location & items</CardTitle>
            <CardDescription>Select residence and locations, then add and distribute items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">Residence:</Label>
                  <Select value={residenceId} onValueChange={setResidenceId} disabled>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{residences.map(r => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Location Type</h3>
                  <RadioGroup value={locationType} onValueChange={(v)=>{ const val = v as 'unit'|'facility'; setLocationType(val); if (val==='unit') { setFacilityId(''); setComponentId(''); } else { setRoomId(''); } }} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unit" id="lp_unit" />
                      <Label htmlFor="lp_unit" className="flex items-center gap-2"><BuildingIcon className="h-4 w-4"/> Unit</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="facility" id="lp_facility" />
                      <Label htmlFor="lp_facility" className="flex items-center gap-2"><ConciergeBell className="h-4 w-4"/> Facility</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Switch id="multi-locations" checked={multiMode} onCheckedChange={(v)=>{ setMultiMode(Boolean(v)); setSelectedTargets([]); }} disabled={!residenceId} />
                  <Label htmlFor="multi-locations" className="text-sm">Select multiple locations</Label>
                  {multiMode && selectedTargets.length > 0 && (
                    <span className="text-xs text-muted-foreground">• Selected: {selectedTargets.length}</span>
                  )}
                  {multiMode && selectedTargets.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTargets([])}>Clear</Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Building</Label>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                      {visibleBuildings.map(b => (
                        <div key={b.id} onClick={() => setBuildingId(buildingId===b.id?'':b.id)} className={`p-2 rounded-md border cursor-pointer transition-colors ${buildingId===b.id?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted/50 border-border'}`}>
                          <div className="flex items-center gap-2"><BuildingIcon className="h-4 w-4"/><span className="text-sm font-medium">{b.name}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Floor</Label>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                      {visibleFloors.map(f => (
                        <div key={f.id} onClick={() => setFloorId(floorId===f.id?'':f.id)} className={`p-2 rounded-md border cursor-pointer transition-colors ${floorId===f.id?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted/50 border-border'}`}>
                          <div className="text-center"><span className="text-sm font-medium">{f.name}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    {locationType==='unit' ? (
                      <>
                        <Label className="text-sm font-medium mb-2 block">Room</Label>
                        <div className="space-y-2 max-h-[320px] overflow-y-auto">
                          {rooms.map(r => (
                            <div key={r.id} onClick={() => {
                              if (!multiMode) { setRoomId(roomId===r.id?'':r.id); return; }
                              const id = r.id;
                              const parts = [selectedResidence?.name];
                              const b = buildings.find(b => b.id === buildingId); if (b) (parts as any).push(b.name);
                              const f = floors.find(f => f.id === floorId); if (f) (parts as any).push(f.name);
                              (parts as any).push(r.name);
                              const name = (parts as any).filter(Boolean).join(' -> ') || r.name;
                              setSelectedTargets(prev => {
                                const exists = prev.some(t => t.id === id);
                                return exists ? prev.filter(t => t.id !== id) : [...prev, { id, name, isFacility: false }];
                              });
                            }} className={`p-2 rounded-md border cursor-pointer transition-colors ${(!multiMode && roomId===r.id) || (multiMode && selectedTargets.some(t => t.id===r.id))?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted/50 border-border'}`}>
                              <div className="text-center"><span className="text-sm font-medium">{r.name}</span></div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <Label className="text-sm font-medium mb-2 block">Facility</Label>
                        <div className="space-y-2 max-h-[320px] overflow-y-auto">
                          {visibleFacilities.map(f => (
              <div key={f.id} onClick={() => {
                              if (!multiMode) { setFacilityId(facilityId===f.id?'':f.id); return; }
                              // In multi-mode, also set facilityId for component browsing context
                              setFacilityId(prev => prev===f.id ? prev : f.id);
                              const id = f.id;
                              const parts = [selectedResidence?.name];
                              const b = buildings.find(b => b.id === buildingId); if (b) (parts as any).push(b.name);
                              const fl = floors.find(fl => fl.id === floorId); if (fl) (parts as any).push(fl.name);
                              (parts as any).push(f.name);
                              const name = (parts as any).filter(Boolean).join(' -> ') || f.name;
                              setSelectedTargets(prev => {
                // Remove any selected components under this facility; then toggle base facility
                const componentIds = Array.isArray((f as any).components) ? ((f as any).components as any[]).map(c => c.id) : [];
                let next = prev.filter(t => !componentIds.includes(t.id));
                const exists = next.some(t => t.id === id);
                next = exists ? next.filter(t => t.id !== id) : [...next, { id, name, isFacility: true }];
                return next;
                              });
                            }} className={`p-2 rounded-md border cursor-pointer transition-colors ${(!multiMode && facilityId===f.id) || (multiMode && selectedTargets.some(t => t.id===f.id))?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted/50 border-border'}`}>
                              <div className="flex items-center gap-2"><ConciergeBell className="h-4 w-4"/><span className="text-sm font-medium" dir="ltr">{f.name}</span></div>
                            </div>
                          ))}
                        </div>
                        {/* Component selection moved below grid for parity */}
                      </>
                    )}
                  </div>
                </div>

        {(currentLocation || (multiMode && selectedTargets.length>0)) && (
                  <div className="p-3 bg-muted/50 rounded-md border-l-4 border-l-primary">
          <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary"/><span className="font-medium">Selected Location:</span></div>
                    {!multiMode ? (
                      <p className="text-sm text-muted-foreground mt-1"><span dir="ltr"><PathDisplay path={currentLocation?.name} /></span></p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{selectedTargets.length} selected</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Available Inventory</h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search items..." className="pl-8 w-full" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue placeholder="Filter by category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Array.from(new Set(allItems.map(i => i.category).filter(Boolean))).map(cat => (<SelectItem key={cat} value={cat!} className="capitalize">{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
                <ScrollArea className="h-[300px] border rounded-md">
                  {residenceId ? (
                    <div className="p-2 space-y-2">
                      {recentItems.length>0 && !searchQuery && selectedCategory==='all' && (
                        <div className="border-b pb-2 mb-2">
                          <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-muted-foreground"/><h4 className="text-sm font-medium text-muted-foreground">Recently Used Items</h4></div>
                          <div className="space-y-2">
                            {recentItems.map(item => {
                              const stock = getStockForResidence(item, residenceId);
                              return (
                                <div key={`recent-${item.id}`} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                                  <div>
                                    <p className="font-medium text-sm">{item.nameAr} / {item.nameEn}</p>
                                    <p className="text-xs text-muted-foreground">{item.category} - Stock: {stock} {item.unit}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => { setItemToEdit(item); setEditDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" onClick={() => addToPlan(item)}><Plus className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {availableInventory.length>0 ? availableInventory.map(item => {
                        const stock = residenceId ? getStockForResidence(item, residenceId) : 0;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                            <div>
                              <p className="font-medium text-sm">{item.nameAr} / {item.nameEn}</p>
                              <p className="text-xs text-muted-foreground">{item.category} - Stock: {stock} {item.unit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setItemToEdit(item); setEditDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                              <Button variant="outline" size="icon" onClick={() => addToPlan(item)}><Plus className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        )
                      }) : (
                        <div className="text-center text-muted-foreground py-10">{searchQuery? 'No items match your search.':'Start typing to search for items.'}</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Select a residence to see items.</div>
                  )}
                </ScrollArea>
              </div>
            </div>
            {locationType==='facility' && (facilityId || multiMode) && availableComponents.length>0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-1 block">Select Component (Optional)</Label>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                    {availableComponents.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (!multiMode) { setComponentId(componentId===c.id?'':c.id); return; }
                          const id = c.id;
                          const parts = [selectedResidence?.name];
                          const b = buildings.find(b => b.id === buildingId); if (b) (parts as any).push(b.name);
                          const fl = floors.find(fl => fl.id === floorId); if (fl) (parts as any).push(fl.name);
                          const fac = visibleFacilities.find(f => f.id === facilityId) || visibleFacilities[0];
                          if (fac) (parts as any).push(fac.name);
                          (parts as any).push(c.name);
                          const name = (parts as any).filter(Boolean).join(' -> ') || c.name;
setSelectedTargets(prev => {
                            // Remove base facility if selecting a component
                            const next = prev.filter(t => t.id !== facilityId);
                            const exists = next.some(t => t.id === id);
                            return exists ? next.filter(t => t.id !== id) : [...next, { id, name, isFacility: true }];
                          });
                        }}
                        className={`p-2 rounded-md border cursor-pointer text-xs transition-colors flex items-center gap-2 ${(componentId===c.id && !multiMode) || (multiMode && selectedTargets.some(t => t.id===c.id))?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted/50 border-border'}`}
                      >
                        <span className="text-sm">{(c as any).type==='light'?'💡':(c as any).type==='outlet'?'🔌':(c as any).type==='switch'?'⚡':(c as any).type==='fan'?'🌀':'⚙️'}</span>
                        <span className="font-medium truncate" title={c.name}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution plan</CardTitle>
            <CardDescription>Adjust quantities, remove lines, or remove locations.</CardDescription>
          </CardHeader>
          <CardContent>
            {plan.length === 0 ? (
              <div className="text-sm text-muted-foreground">No plan yet. Add items to a selected location.</div>
            ) : (
              <div className="space-y-4">
                {plan.map(loc => (
                  <div key={loc.locationId} className="rounded-md border">
                    <div className="flex items-center justify-between border-b p-3">
                      <div className="font-medium"><span dir="ltr"><PathDisplay path={loc.locationName} /></span></div>
                      <Button variant="ghost" size="icon" onClick={() => removeLocation(loc.locationId)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                    <div className="divide-y">
                      {loc.items.map((line, idx) => (
                        <div key={`${loc.locationId}:${line.id}:${line.detail||''}:${idx}`} className="flex items-center justify-between p-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {allItems.find(i => i.id === line.id)?.nameEn || line.id}
                              {line.detail ? ` - ${line.detail}` : ''}
                            </div>
                            {!!line.overrideReason && <div className="text-xs text-amber-700">Override: {line.overrideReason}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" title="Set justification" onClick={() => { setJustTarget({ locationId: loc.locationId, itemId: line.id, detail: line.detail }); setJustText(line.overrideReason || ''); setJustOpen(true); }}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <QuantityStepper value={line.quantity} min={1} onValueChange={(v)=>updateQty(loc.locationId, line.id, v, line.detail)} />
                            <Button variant="destructive" size="icon" onClick={() => removeLine(loc.locationId, line.id, line.detail)}><Trash2 className="h-4 w-4"/></Button>
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
      {/* Justification dialog */}
      <Dialog open={justOpen} onOpenChange={(v) => { setJustOpen(v); if (!v) { (window as any).__ec_resolver?.(null); (window as any).__ec_resolver = null; setJustTarget(null); } }}>
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
            <Button variant="ghost" onClick={() => { setJustOpen(false); (window as any).__ec_resolver?.(null); (window as any).__ec_resolver = null; }}>Cancel</Button>
            <Button onClick={() => {
              const val = justText.trim();
              if (val.length < 3) return;
              if (justTarget) {
                setPlan(prev => prev.map(loc => (
                  loc.locationId !== justTarget.locationId
                    ? loc
                    : ({
                        ...loc,
                        items: loc.items.map(it => (
                          it.id === justTarget.itemId && it.detail === justTarget.detail
                            ? { ...it, overrideReason: val }
                            : it
                        )),
                      })
                )));
              }
              (window as any).__ec_resolver?.(val);
              (window as any).__ec_resolver = null;
              setJustOpen(false);
              setJustTarget(null);
            }} disabled={justText.trim().length < 3}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit item dialog for modifying inventory items inline */}
      <EditItemDialog
        isOpen={editDialogOpen}
        onOpenChange={(v) => { setEditDialogOpen(v); if (!v) setItemToEdit(null); }}
        onItemUpdated={handleItemUpdated}
        item={itemToEdit}
      />
    </div>
  );
}
