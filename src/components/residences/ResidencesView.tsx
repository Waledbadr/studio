"use client";

import React, { useEffect, useState, useMemo, useDeferredValue, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, DoorOpen, PlusCircle, Trash2, MapPin, Layers, Pencil, Plus, ConciergeBell, BedDouble, Bath, CookingPot, Warehouse, Users as UsersIcon, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useResidences, type Complex, type Building as BuildingType, type Floor, type Room, type Facility } from '@/context/residences-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/context/users-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AddMultipleRoomsDialog } from '@/components/residences';
import { Separator } from '@/components/ui/separator';

// Memoized UI pieces to reduce re-renders
const facilityIcons: { [key: string]: React.ElementType } = {
  'bathroom': Bath,
  'kitchen': CookingPot,
  'storeroom': Warehouse,
  'management': UsersIcon,
  'default': ConciergeBell
};

// Normalize possible legacy shapes (object maps) into arrays
const asArray = <T,>(val: any): T[] => Array.isArray(val) ? (val as T[]) : (val && typeof val === 'object' ? Object.values(val) as T[] : []);

const FacilityItem = React.memo(function FacilityItem({ facility, canEdit, onDelete }: { facility: Facility, canEdit: boolean, onDelete: () => void }) {
  const Icon = facilityIcons[facility.type.toLowerCase()] || facilityIcons.default;
  return (
    <div className="flex items-center justify-between p-2 bg-background rounded-md text-sm border">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {facility.name}
      </div>
      {canEdit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100"><Trash2 className="h-3 w-3 text-destructive" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will delete facility "{facility.name}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
});

const FacilitySection = React.memo(function FacilitySection({ 
  facilities, 
  canEdit,
  onAdd,
  onDelete
}: { 
  facilities: Facility[] | undefined, 
  canEdit: boolean,
  onAdd: () => void, 
  onDelete: (facilityId: string) => void 
}) {
  return (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {(facilities || []).map(facility => (
          <FacilityItem key={facility.id} facility={facility} canEdit={canEdit} onDelete={() => onDelete(facility.id)} />
        ))}
        {canEdit && (
          <Button variant="outline" size="sm" className="h-full border-dashed" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2"/> Add
          </Button>
        )}
      </div>
    </div>
  );
});

const RoomItem = React.memo(function RoomItem({ room, canEdit, onDelete, showCapacity }: { room: Room, canEdit: boolean, onDelete: () => void, showCapacity: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-background rounded-md text-sm border">
      <div className="flex items-center gap-2">
        <DoorOpen className="h-4 w-4 text-muted-foreground" />
        <div>
          <div>{room.name}</div>
          {showCapacity ? (
            <div className="text-xs text-muted-foreground">{room.area ? `${room.area} m² •` : ''} {room.capacity ? `Capacity: ${room.capacity}` : 'Capacity: -'}</div>
          ) : null}
        </div>
      </div>
      {canEdit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100"><Trash2 className="h-3 w-3 text-destructive" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will delete room "{room.name}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
});

// Add missing DialogType
type DialogType = 'addComplex' | 'editComplex' | 'addBuilding' | 'addFloor' | 'addRoom' | 'addMultipleRooms' | 'addFacility';

// Re-introduce AddFacilityDialog component
const AddFacilityDialog = ({ 
  isOpen, 
  onOpenChange, 
  context, 
  onAdd 
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
  context: { level: 'complex' | 'building' | 'floor', complexId: string, buildingId?: string, floorId?: string };
  onAdd: (complexId: string, level: 'complex' | 'building' | 'floor', name: string, type: string, quantity: number, buildingId?: string, floorId?: string) => void;
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('default');
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(context.complexId, context.level, name.trim(), type, quantity, context.buildingId, context.floorId);
      setName('');
      setType('default');
      setQuantity(1);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => onOpenChange(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Facility</DialogTitle>
          <DialogDescription>
            Add a new facility to the selected level. Use quantity for numbered items (e.g., Bathroom #3 becomes Bathroom 1, 2, 3).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="facility-name">Facility Name</Label>
            <Input id="facility-name" placeholder="e.g., Guest Bathroom" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facility-type">Facility Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="facility-type">
                <SelectValue placeholder="Select type"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">General</SelectItem>
                <SelectItem value="bathroom">Bathroom</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="storeroom">Storeroom</SelectItem>
                <SelectItem value="management">Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facility-quantity">Quantity</Label>
            <Input id="facility-quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add Facility</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ResidencesView({ showFacilities = true, showCapacity = true }: { showFacilities?: boolean, showCapacity?: boolean }) {
  const { residences, loading, loadResidences, addComplex, addBuilding, addFloor, addRoom, deleteComplex, deleteBuilding, deleteFloor, deleteRoom, updateComplex, addMultipleRooms, addFacility, deleteFacility, setResidenceDisabled, checkResidenceHasStock } = useResidences();
  const { users, loadUsers: loadUsersContext, loading: usersLoading, currentUser } = useUsers();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    loadResidences();
    loadUsersContext();
  }, [loadResidences, loadUsersContext]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const selectedManager = useMemo(() => users.find(u => u.id === managerFilter), [users, managerFilter]);

  // Track expanded buildings per complex to lazy-mount contents
  const [openByComplex, setOpenByComplex] = useState<Record<string, string[]>>({});
  const setOpenForComplex = useCallback((complexId: string, values: string[]) => {
    setOpenByComplex(prev => ({ ...prev, [complexId]: values }));
  }, []);

  const [dialogStates, setDialogStates] = useState<Record<DialogType, boolean>>({
    addComplex: false,
    editComplex: false,
    addBuilding: false,
    addFloor: false,
    addRoom: false,
    addMultipleRooms: false,
    addFacility: false,
  });

  const [formData, setFormData] = useState({
    newComplexName: '',
    newComplexCity: '',
    newComplexManagerId: '',
    newBuildingName: '',
    newFloorName: '',
  newRoomName: '',
  newRoomArea: '' as string,
  newRoomLength: '' as string,
  newRoomWidth: '' as string,
  });

  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const [contextIds, setContextIds] = useState<{ level: 'complex' | 'building' | 'floor', complexId: string, buildingId?: string, floorId?: string } | null>(null);

  const userVisibleResidences = useMemo(() => {
    if (!currentUser) return [];
    const visible = isAdmin ? residences : residences.filter(r => currentUser.assignedResidences.includes(r.id));
    return visible;
  }, [currentUser, residences, isAdmin]);

  const activeResidences = useMemo(() => userVisibleResidences.filter(r => !r.disabled), [userVisibleResidences]);
  const disabledResidences = useMemo(() => userVisibleResidences.filter(r => r.disabled), [userVisibleResidences]);

  const cities = useMemo(() => {
    const s = new Set<string>();
    activeResidences.forEach(c => { if (c.city) s.add(c.city); });
    return Array.from(s).sort();
  }, [activeResidences]);

  const filteredResidences = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const includeText = (t?: string) => !!q && !!t && t.toLowerCase().includes(q);

    return activeResidences
      .filter(c => cityFilter === 'all' || c.city === cityFilter)
      .filter(c => {
        if (managerFilter === 'all') return true;
        // Robust matching: support legacy fields (manager name or object) in existing docs
        const matchesId = c.managerId === managerFilter;
        const selectedName = selectedManager?.name || '';
        const managerUserName = users.find(u => u.id === c.managerId)?.name || '';
        const matchesName = selectedName && managerUserName && selectedName === managerUserName;
        const legacy: any = c as any;
        const legacyManager = legacy.manager; // could be id or name or object
        const legacyManagerName = legacy.managerName as string | undefined;
        const legacyObjId = typeof legacyManager === 'object' && legacyManager ? legacyManager.id : undefined;
        const legacyIsId = typeof legacyManager === 'string' && legacyManager === managerFilter;
        const legacyIsName = typeof legacyManager === 'string' && selectedName && legacyManager === selectedName;
        const legacyObjMatch = legacyObjId && legacyObjId === managerFilter;
        const legacyNameMatch = legacyManagerName && selectedName && legacyManagerName === selectedName;
        return !!(matchesId || matchesName || legacyIsId || legacyIsName || legacyObjMatch || legacyNameMatch);
      })
      .map(complex => {
        if (!q) return complex;

        const complexNameMatch = includeText(complex.name) || includeText(complex.city);

        // Filter buildings/floors/rooms by query
        const filteredBuildings = complex.buildings.map(b => {
          const buildingMatch = includeText(b.name);

          const filteredFloors = b.floors.map(f => {
            const floorMatch = includeText(f.name);
            const filteredRooms = f.rooms.filter(r => includeText(r.name));
            const filteredFacilities = asArray<Facility>(f.facilities).filter(fc => includeText(fc.name) || includeText(fc.type));
            const keepFloor = floorMatch || filteredRooms.length > 0 || filteredFacilities.length > 0;
            return keepFloor ? { ...f, rooms: filteredRooms.length ? filteredRooms : f.rooms.filter(() => false), facilities: filteredFacilities } : null;
          }).filter(Boolean) as Floor[];

          const buildingFacilities = asArray<Facility>(b.facilities).filter(fc => includeText(fc.name) || includeText(fc.type));
          const keepBuilding = buildingMatch || filteredFloors.length > 0 || buildingFacilities.length > 0;
          return keepBuilding ? { ...b, floors: filteredFloors, facilities: buildingFacilities } : null;
        }).filter(Boolean) as BuildingType[];

        const complexFacilities = asArray<Facility>(complex.facilities).filter(fc => includeText(fc.name) || includeText(fc.type));

        const keepComplex = complexNameMatch || filteredBuildings.length > 0 || complexFacilities.length > 0;
        return keepComplex ? { ...complex, buildings: filteredBuildings, facilities: complexFacilities } : null;
      })
      .filter(Boolean) as Complex[];
  }, [activeResidences, deferredSearch, cityFilter, managerFilter]);

  const stats = useMemo(() => {
    return filteredResidences.reduce((acc, complex) => {
      acc.complexes += 1;
      acc.buildings += complex.buildings.length;
      complex.buildings.forEach(building => {
        acc.floors += building.floors.length;
        acc.facilities += showFacilities ? asArray<Facility>(building.facilities).length : 0;
        building.floors.forEach(floor => {
          acc.rooms += floor.rooms.length;
          acc.facilities += showFacilities ? asArray<Facility>(floor.facilities).length : 0;
        });
      });
      acc.facilities += showFacilities ? asArray<Facility>(complex.facilities).length : 0;
      return acc;
    }, { complexes: 0, buildings: 0, floors: 0, rooms: 0, facilities: 0 });
  }, [filteredResidences, showFacilities]);

  const openDialog = (type: DialogType, ids: Partial<typeof contextIds> = {}) => {
    setDialogStates(prev => ({ ...prev, [type]: true }));
    setContextIds(ids as any);
  };
  
  const closeDialog = (type: DialogType) => {
    setDialogStates(prev => ({ ...prev, [type]: false }));
    setContextIds(null);
  };

  const handleAddComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newComplexName.trim() || !formData.newComplexCity.trim() || !formData.newComplexManagerId) {
        toast({ title: 'Error', description: 'Please fill all fields, including manager.', variant: 'destructive' });
        return;
    }
    addComplex(formData.newComplexName, formData.newComplexCity, formData.newComplexManagerId);
    setFormData(prev => ({ ...prev, newComplexName: '', newComplexCity: '', newComplexManagerId: '' }));
    closeDialog('addComplex');
  };
  
  const handleOpenEditDialog = (complex: Complex) => {
    setEditingComplex(complex);
    openDialog('editComplex');
  };
  
  const handleUpdateComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplex) return;
    if (!editingComplex.name.trim() || !editingComplex.city.trim() || !editingComplex.managerId) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    updateComplex(editingComplex.id, {
        name: editingComplex.name,
        city: editingComplex.city,
        managerId: editingComplex.managerId,
    });
    closeDialog('editComplex');
    setEditingComplex(null);
  };
  
  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newBuildingName.trim() || !contextIds?.complexId) return;
    addBuilding(contextIds.complexId, formData.newBuildingName);
    setFormData(prev => ({ ...prev, newBuildingName: '' }));
    closeDialog('addBuilding');
  };

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newFloorName.trim() || !contextIds?.complexId || !contextIds?.buildingId) return;
    addFloor(contextIds.complexId, contextIds.buildingId, formData.newFloorName);
    setFormData(prev => ({ ...prev, newFloorName: '' }));
    closeDialog('addFloor');
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newRoomName.trim() || !contextIds?.complexId || !contextIds?.buildingId || !contextIds?.floorId) return;
    const lengthNum = formData.newRoomLength ? Number(formData.newRoomLength) : undefined;
    const widthNum = formData.newRoomWidth ? Number(formData.newRoomWidth) : undefined;
    const areaNum = formData.newRoomArea ? Number(formData.newRoomArea) : undefined;
    // prefer length/width if provided
    if ((lengthNum && !isNaN(lengthNum) && lengthNum > 0) || (widthNum && !isNaN(widthNum) && widthNum > 0) || (areaNum && !isNaN(areaNum))) {
      addRoom(contextIds.complexId, contextIds.buildingId, contextIds.floorId, formData.newRoomName, lengthNum, widthNum, areaNum);
      setFormData(prev => ({ ...prev, newRoomName: '', newRoomArea: '', newRoomLength: '', newRoomWidth: '' }));
      closeDialog('addRoom');
    } else {
      toast({ title: 'Error', description: 'Please provide either length & width or area for the room.', variant: 'destructive' });
    }
  };

  const handleDeleteFacility = (complexId: string, facilityId: string, level: 'complex' | 'building' | 'floor', buildingId?: string, floorId?: string) => {
      deleteFacility(complexId, facilityId, level, buildingId, floorId);
  };

  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : "N/A";
  };

  if (loading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Residences</h1>
          <p className="text-muted-foreground">Manage your residential complexes, buildings, and units.</p>
        </div>
        {isAdmin && (
            <Dialog open={dialogStates.addComplex} onOpenChange={(open) => open ? openDialog('addComplex') : closeDialog('addComplex')}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Complex
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleAddComplex}>
                <DialogHeader>
                    <DialogTitle>Add New Complex</DialogTitle>
                    <DialogDescription>Enter the details for the new residential complex.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="complex-name" className="text-right">Name</Label>
                      <Input id="complex-name" placeholder="e.g., Seaside Residences" className="col-span-3" value={formData.newComplexName} onChange={(e) => setFormData(prev => ({ ...prev, newComplexName: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="complex-city" className="text-right">City</Label>
                      <Input id="complex-city" placeholder="e.g., Dubai" className="col-span-3" value={formData.newComplexCity} onChange={(e) => setFormData(prev => ({ ...prev, newComplexCity: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="complex-manager" className="text-right">Manager</Label>
                        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, newComplexManagerId: value }))} value={formData.newComplexManagerId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save Complex</Button>
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>
        )}
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search complexes, buildings, floors, rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardHeader className="p-4"><CardTitle className="text-sm">Complexes</CardTitle><CardDescription className="text-2xl font-bold">{stats.complexes}</CardDescription></CardHeader></Card>
        <Card><CardHeader className="p-4"><CardTitle className="text-sm">Buildings</CardTitle><CardDescription className="text-2xl font-bold">{stats.buildings}</CardDescription></CardHeader></Card>
        <Card><CardHeader className="p-4"><CardTitle className="text-sm">Floors</CardTitle><CardDescription className="text-2xl font-bold">{stats.floors}</CardDescription></CardHeader></Card>
        <Card><CardHeader className="p-4"><CardTitle className="text-sm">Rooms</CardTitle><CardDescription className="text-2xl font-bold">{stats.rooms}</CardDescription></CardHeader></Card>
        <Card><CardHeader className="p-4"><CardTitle className="text-sm">Facilities</CardTitle><CardDescription className="text-2xl font-bold">{stats.facilities}</CardDescription></CardHeader></Card>
      </div>

      {Object.entries(filteredResidences.reduce((acc, complex) => {
        const city = complex.city || 'Uncategorized';
        if (!acc[city]) acc[city] = [] as Complex[];
        acc[city].push(complex);
        return acc;
      }, {} as Record<string, Complex[]>)).map(([city, complexes]) => (
        <div key={city}>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {city}</h2>
          <div className="space-y-4">
            {complexes.map((complex) => (
              <Card key={complex.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{complex.name}</CardTitle>
                      <CardDescription>Manager: {getManagerName(complex.managerId)}</CardDescription>
                    </div>
                     {isAdmin && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openDialog('addBuilding', {complexId: complex.id})}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Building
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="secondary" size="sm">Disable</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Disable residence?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Disabling hides this residence from active lists and new requests. You must zero its stock first.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => setResidenceDisabled(complex.id, true)}>Disable</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(complex)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the complex "{complex.name}" and all its associated buildings, floors, and rooms. This cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteComplex(complex.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                     )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full" value={openByComplex[complex.id] || []} onValueChange={(val) => setOpenForComplex(complex.id, val as string[])}>
                    {complex.buildings.map((building: BuildingType) => {
                      const itemValue = `building-${building.id}`;
                      const isOpen = (openByComplex[complex.id] || []).includes(itemValue);
                      return (
                        <AccordionItem key={building.id} value={itemValue}>
                          <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                  <Building className="h-5 w-5" />
                                  <span className="font-medium">{building.name}</span>
                              </div>
                          </AccordionTrigger>
                          {isOpen && (
                            <AccordionContent>
                              <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                                  {isAdmin && (
                                      <div className="flex justify-end gap-2 mb-2">
                                          <Button variant="outline" size="sm" onClick={() => openDialog('addFloor', {complexId: complex.id, buildingId: building.id})}>
                                              <PlusCircle className="mr-2 h-4 w-4" /> Add Floor
                                          </Button>
                                          <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                  <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                  <AlertDialogDescription>This will delete "{building.name}" and all its contents.</AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => deleteBuilding(complex.id, building.id)}>Delete</AlertDialogAction>
                                                  </AlertDialogFooter>
                                              </AlertDialogContent>
                                          </AlertDialog>
                                      </div>
                                  )}
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Building Facilities</Label>
                                    {showFacilities && (
                                      <FacilitySection 
                                        facilities={asArray<Facility>(building.facilities)}
                                        canEdit={!!isAdmin}
                                        onAdd={() => openDialog('addFacility', { level: 'building', complexId: complex.id, buildingId: building.id })}
                                        onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'building', building.id)}
                                      />
                                    )}
                                  </div>
                                  {building.floors.map((floor: Floor) => (
                                      <div key={floor.id} className="p-3 rounded-md bg-muted/50">
                                          <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2 font-semibold">
                                                  <Layers className="h-4 w-4" />
                                                  {floor.name}
                                              </div>
                                              {isAdmin && (
                                                  <div className="flex gap-2">
                                                      <Button variant="outline" size="sm" onClick={() => openDialog('addRoom', {complexId: complex.id, buildingId: building.id, floorId: floor.id})}>
                                                          <PlusCircle className="mr-2 h-4 w-4" /> Add Room
                                                      </Button>
                                                      <Button variant="outline" size="sm" onClick={() => openDialog('addMultipleRooms', {level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id})}>
                                                          <Plus className="mr-2 h-4 w-4" /> Add Multiple Rooms
                                                      </Button>
                                                      <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                              <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                              <AlertDialogHeader>
                                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                              <AlertDialogDescription>This will delete "{floor.name}" and all its contents.</AlertDialogDescription>
                                                              </AlertDialogHeader>
                                                              <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => deleteFloor(complex.id, building.id, floor.id)}>Delete</AlertDialogAction>
                                                              </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                      </AlertDialog>
                                                  </div>
                                              )}
                                          </div>
                                          <div className="pl-6 space-y-2">
                                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                  {floor.rooms.map((room: Room) => (
                                                  <RoomItem
                                                      key={room.id}
                                                      room={room}
                                                      canEdit={!!isAdmin}
                                                      onDelete={() => deleteRoom(complex.id, building.id, floor.id, room.id)}
                                                    showCapacity={showCapacity}
                                                    />
                                                  ))}
                                              </div>
                                              <div>
                                                <Label className="text-xs text-muted-foreground">Floor Facilities</Label>
                                                {showFacilities && (
                                                  <FacilitySection 
                                                    facilities={asArray<Facility>(floor.facilities)}
                                                    canEdit={!!isAdmin}
                                                    onAdd={() => openDialog('addFacility', { level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id })}
                                                    onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'floor', building.id, floor.id)}
                                                  />
                                                )}
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                            </AccordionContent>
                          )}
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                  {(complex.facilities && complex.facilities.length > 0) || isAdmin ? (
                      <>
                        <Separator className="my-4" />
                        <h4 className="text-md font-semibold mb-2 flex items-center gap-2"><ConciergeBell className="h-5 w-5 text-primary" /> General Facilities</h4>
                        {showFacilities && (
                          <FacilitySection 
                            facilities={asArray<Facility>(complex.facilities)}
                            canEdit={!!isAdmin}
                            onAdd={() => openDialog('addFacility', { level: 'complex', complexId: complex.id })}
                            onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'complex')}
                          />
                        )}
                      </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {isAdmin && disabledResidences.length > 0 && (
        <div>
          <Separator className="my-6" />
          <h2 className="text-xl font-semibold mb-3">Disabled Residences</h2>
          <div className="grid gap-3">
            {disabledResidences.map(dis => (
              <Card key={dis.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{dis.name}</div>
                    <div className="text-sm text-muted-foreground">{dis.city}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setResidenceDisabled(dis.id, false)}>Enable</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete residence?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the residence and all its contents.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteComplex(dis.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Building Dialog */}
      <Dialog open={dialogStates.addBuilding} onOpenChange={(open) => open ? openDialog('addBuilding') : closeDialog('addBuilding')}>
        <DialogContent>
          <form onSubmit={handleAddBuilding}>
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
              <DialogDescription>
                Enter the name for the new building. It will be added to the selected complex.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="building-name" className="text-right">Name</Label>
                <Input id="building-name" placeholder="e.g., Building C" className="col-span-3" value={formData.newBuildingName} onChange={(e) => setFormData(prev => ({ ...prev, newBuildingName: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Building</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Floor Dialog */}
      <Dialog open={dialogStates.addFloor} onOpenChange={(open) => open ? openDialog('addFloor') : closeDialog('addFloor')}>
        <DialogContent>
          <form onSubmit={handleAddFloor}>
            <DialogHeader>
              <DialogTitle>Add New Floor</DialogTitle>
              <DialogDescription>
                Enter the name for the new floor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="floor-name" className="text-right">Name</Label>
                <Input id="floor-name" placeholder="e.g., Floor 3" className="col-span-3" value={formData.newFloorName} onChange={(e) => setFormData(prev => ({ ...prev, newFloorName: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Floor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={dialogStates.addRoom} onOpenChange={(open) => open ? openDialog('addRoom') : closeDialog('addRoom')}>
        <DialogContent>
          <form onSubmit={handleAddRoom}>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>
                Enter the name for the new room.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-name" className="text-right">Name</Label>
                <Input id="room-name" placeholder="e.g., Room 301" className="col-span-3" value={formData.newRoomName} onChange={(e) => setFormData(prev => ({ ...prev, newRoomName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-length" className="text-right">Length (m)</Label>
                <Input id="room-length" placeholder="e.g., 5" className="col-span-3" value={formData.newRoomLength} onChange={(e) => setFormData(prev => ({ ...prev, newRoomLength: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-width" className="text-right">Width (m)</Label>
                <Input id="room-width" placeholder="e.g., 4" className="col-span-3" value={formData.newRoomWidth} onChange={(e) => setFormData(prev => ({ ...prev, newRoomWidth: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-area" className="text-right">Or Area (m²)</Label>
                <Input id="room-area" placeholder="e.g., 20" className="col-span-3" value={formData.newRoomArea} onChange={(e) => setFormData(prev => ({ ...prev, newRoomArea: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Room</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Multiple Rooms Dialog */}
      <AddMultipleRoomsDialog
        isOpen={dialogStates.addMultipleRooms}
        onOpenChange={(open) => {
          if (!open) closeDialog('addMultipleRooms');
        }}
        floorInfo={contextIds && contextIds.complexId && contextIds.buildingId && contextIds.floorId ? { complexId: contextIds.complexId!, buildingId: contextIds.buildingId!, floorId: contextIds.floorId! } : null}
        onAddRooms={addMultipleRooms}
      />
      
      {/* Edit Complex Dialog */}
      <Dialog open={dialogStates.editComplex} onOpenChange={(open) => open ? openDialog('editComplex') : closeDialog('editComplex')}>
          <DialogContent>
              <form onSubmit={handleUpdateComplex}>
                  <DialogHeader>
                      <DialogTitle>Edit Complex</DialogTitle>
                      <DialogDescription>Update the details for the residential complex.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-complex-name" className="text-right">Name</Label>
                          <Input 
                              id="edit-complex-name" 
                              className="col-span-3" 
                              value={editingComplex?.name || ''} 
                              onChange={(e) => editingComplex && setEditingComplex({...editingComplex, name: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-complex-city" className="text-right">City</Label>
                          <Input 
                              id="edit-complex-city" 
                              className="col-span-3" 
                              value={editingComplex?.city || ''} 
                              onChange={(e) => editingComplex && setEditingComplex({...editingComplex, city: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-complex-manager" className="text-right">Manager</Label>
                          <Select 
                              onValueChange={(managerId) => editingComplex && setEditingComplex({...editingComplex, managerId})} 
                              value={editingComplex?.managerId}
                          >
                              <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select a manager" />
                              </SelectTrigger>
                              <SelectContent>
                                  {users.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => closeDialog('editComplex')}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
      {/* Add Facility Dialog */}
      {contextIds && (
        <AddFacilityDialog 
            isOpen={dialogStates.addFacility}
            onOpenChange={(open) => open ? openDialog('addFacility') : closeDialog('addFacility')}
            context={contextIds}
            onAdd={addFacility}
        />
      )}
    </div>
  );
}
