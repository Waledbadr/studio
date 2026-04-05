"use client";

import React, { useEffect, useState, useMemo, useDeferredValue, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, DoorOpen, PlusCircle, Trash2, MapPin, Layers, Pencil, Plus, ConciergeBell, BedDouble, Bath, CookingPot, Warehouse, Users as UsersIcon, Search, Move, ChevronDown, Trees, Route, Shirt, Store, Stethoscope, Square } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/context/language-context';
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
  'yard': Trees,
  'corridor': Route,
  'laundry': Shirt,
  'shop': Store,
  'clinic': Stethoscope,
  'basement': Square,
  'hall': Square,
  'default': ConciergeBell
};

// Normalize possible legacy shapes (object maps) into arrays
const asArray = <T,>(val: any): T[] => Array.isArray(val) ? (val as T[]) : (val && typeof val === 'object' ? Object.values(val) as T[] : []);

// Simple component icons
const componentIcons: { [key: string]: string } = {
  'light': '💡',
  'outlet': '🔌', 
  'switch': '⚡',
  'fan': '🌀',
  'sensor': '📡',
  'other': '⚙️'
};

// Add Component Form
const AddComponentForm = ({ 
  facilityId, 
  onClose, 
  onAddComponent 
}: { 
  facilityId: string, 
  onClose: () => void,
  onAddComponent: (facilityId: string, component: any) => Promise<void>
}) => {
  const [componentName, setComponentName] = useState('');
  const [componentType, setComponentType] = useState('light');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentName.trim()) return;

    try {
      await onAddComponent(facilityId, {
        name: componentName.trim(),
        type: componentType,
        status: 'working', // Default status
        installDate: new Date().toISOString(),
        notes: ''
      });
      
      setComponentName('');
      setComponentType('light');
      onClose();
    } catch (error) {
      console.error('Error adding component:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="component-name">اسم المكون</Label>
        <Input
          id="component-name"
          value={componentName}
          onChange={(e) => setComponentName(e.target.value)}
          placeholder="مثل: إضاءة 1، مقبس 2"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="component-type">نوع المكون</Label>
        <select
          id="component-type"
          value={componentType}
          onChange={(e) => setComponentType(e.target.value)}
          className="w-full p-2 border rounded-md bg-background"
        >
          <option value="light">💡 إضاءة</option>
          <option value="outlet">🔌 مقبس كهربائي</option>
          <option value="switch">⚡ مفتاح</option>
          <option value="fan">🌀 مروحة</option>
          <option value="sensor">📡 حساس</option>
          <option value="other">⚙️ أخرى</option>
        </select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          إلغاء
        </Button>
        <Button type="submit">
          إضافة المكون
        </Button>
      </div>
    </form>
  );
};

const FacilityItem = React.memo(function FacilityItem({ 
  facility, 
  canEdit, 
  onDelete, 
  onDragStart, 
  onDragEnd, 
  showMoveBadge, 
  enableDelete, 
  onRename,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  enableInlineEdit
}: { 
  facility: Facility, 
  canEdit: boolean, 
  onDelete: () => void, 
  onDragStart?: (e: React.DragEvent) => void, 
  onDragEnd?: (e: React.DragEvent) => void, 
  showMoveBadge?: boolean, 
  enableDelete?: boolean, 
  onRename?: () => void,
  isEditing?: boolean,
  editingName?: string,
  onEditingNameChange?: (name: string) => void,
  onStartEdit?: () => void,
  onSaveEdit?: () => void,
  onCancelEdit?: () => void,
  enableInlineEdit?: boolean
}) {
  // Be defensive: some legacy facilities may not have a type
  const iconKey = String(facility.type || 'default').toLowerCase();
  const Icon = facilityIcons[iconKey] || facilityIcons.default;
  return (
    <div
      className="flex items-center justify-between p-2 bg-background rounded-md text-sm border"
      draggable={!!canEdit && !!showMoveBadge}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={canEdit ? 'Drag to move this facility' : undefined}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {isEditing ? (
          <Input 
            value={editingName || ''} 
            onChange={(e) => onEditingNameChange?.(e.target.value)}
            className="h-6 text-sm"
            autoFocus
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit?.();
              if (e.key === 'Escape') onCancelEdit?.();
            }}
          />
        ) : (
          <span 
            className={`${canEdit && onStartEdit && enableInlineEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
            onClick={canEdit && onStartEdit && enableInlineEdit ? onStartEdit : undefined}
            title={canEdit && onStartEdit && enableInlineEdit ? 'انقر للتعديل' : undefined}
          >
            {facility.name}
          </span>
        )}
        {canEdit && onRename && !onStartEdit && (
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onRename}>Rename</Button>
        )}
      </div>
      {showMoveBadge && (
        <Move className="h-3 w-3 text-muted-foreground mr-2" />
      )}
      {/* Show component count and manage button for facilities that can have components */}
      <div className="flex items-center gap-1">
        {facility.components && facility.components.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {facility.components.length} مكونات
          </span>
        )}
      </div>
      {canEdit && enableDelete && (
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
  canAdd,
  onAdd,
  onDelete,
  onRename,
  onItemDragStart,
  onItemDragEnd,
  onDrop,
  dragging,
  showMoveBadge,
  enableDelete,
  editingFacilityId,
  editingFacilityName,
  onEditingFacilityNameChange,
  onStartEditFacility,
  onSaveEditFacility,
  onCancelEditFacility,
  enableInlineEdit,
  onManageComponents,
  isEdit
}: { 
  facilities: Facility[] | undefined, 
  canEdit: boolean,
  canAdd?: boolean,
  onAdd: () => void, 
  onDelete: (facilityId: string) => void,
  onRename?: (facilityId: string) => void,
  onItemDragStart?: (facilityId: string, e: React.DragEvent) => void,
  onItemDragEnd?: (e: React.DragEvent) => void,
  onDrop?: () => void,
  dragging?: boolean,
  showMoveBadge?: boolean,
  enableDelete?: boolean,
  editingFacilityId?: string,
  editingFacilityName?: string,
  onEditingFacilityNameChange?: (name: string) => void,
  onStartEditFacility?: (facilityId: string) => void,
  onSaveEditFacility?: () => void,
  onCancelEditFacility?: () => void,
  enableInlineEdit?: boolean,
  onManageComponents?: (facilityId: string) => void,
  isEdit?: boolean
}) {
  return (
    <div
      className="space-y-2 mt-2"
      onDragOver={(e) => { if (canEdit && onDrop) { e.preventDefault(); e.stopPropagation(); } }}
      onDrop={(e) => { if (onDrop) { e.preventDefault(); e.stopPropagation(); onDrop(); } }}
    >
  <div className={`space-y-3 ${dragging ? 'ring-1 ring-primary/30 rounded-md p-1' : ''}`}>
        {(facilities || []).map(facility => (
          <div key={facility.id} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <FacilityItem
                  facility={facility}
                  canEdit={canEdit}
                  onDelete={() => onDelete(facility.id)}
                  onRename={onRename && !onStartEditFacility ? () => onRename(facility.id) : undefined}
                  onDragStart={(e) => onItemDragStart && onItemDragStart(facility.id, e)}
                  onDragEnd={(e) => onItemDragEnd && onItemDragEnd(e)}
                  showMoveBadge={showMoveBadge}
                  enableDelete={enableDelete}
                  isEditing={editingFacilityId === facility.id}
                  editingName={editingFacilityName}
                  onEditingNameChange={onEditingFacilityNameChange}
                  onStartEdit={onStartEditFacility ? () => onStartEditFacility(facility.id) : undefined}
                  onSaveEdit={onSaveEditFacility}
                  onCancelEdit={onCancelEditFacility}
                  enableInlineEdit={enableInlineEdit}
                />
              </div>
            </div>
            
            {/* Show components if any */}
    {facility.components && facility.components.length > 0 && (
              <div className="ml-4 pl-3 border-l-2 border-muted">
                <div className="grid grid-cols-3 gap-1 text-xs">
      {facility.components.map((component) => (
                    <div 
                      key={component.id}
                      className="flex items-center gap-1 p-1 bg-muted/50 rounded text-xs"
                      title={`${component.name} - ${component.status || 'working'}`}
                    >
                      <span>{componentIcons[component.type] || '⚙️'}</span>
                      <span className="truncate">{component.name}</span>
                      {component.status === 'broken' && <span className="text-red-500">❌</span>}
                      {component.status === 'needs_replacement' && <span className="text-yellow-500">⚠️</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add component button */}
            {canEdit && isEdit && onManageComponents && (
              <div className="ml-4 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs border-dashed border"
                  onClick={() => onManageComponents(facility.id)}
                >
                  <Plus className="h-3 w-3 mr-1"/> Add Component
                </Button>
              </div>
            )}
          </div>
        ))}
        
        {dragging && (facilities?.length || 0) === 0 && (
          <div className="flex items-center justify-center min-h-12 border-2 border-dashed rounded-md text-xs text-muted-foreground">
            Drop here
          </div>
        )}
        
        {canEdit && canAdd && (
          <Button variant="outline" size="sm" className="border-dashed" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2"/> Add Facility
          </Button>
        )}
      </div>
    </div>
  );
});

const RoomItem = React.memo(function RoomItem({ 
  room, 
  canEdit, 
  onDelete, 
  showCapacity, 
  onDragStart, 
  onDragEnd, 
  showMoveBadge, 
  enableDelete, 
  onRename,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit
}: { 
  room: Room, 
  canEdit: boolean, 
  onDelete: () => void, 
  showCapacity: boolean, 
  onDragStart?: (e: React.DragEvent) => void, 
  onDragEnd?: (e: React.DragEvent) => void, 
  showMoveBadge?: boolean, 
  enableDelete?: boolean, 
  onRename?: () => void,
  isEditing?: boolean,
  editingName?: string,
  onEditingNameChange?: (name: string) => void,
  onStartEdit?: () => void,
  onSaveEdit?: () => void,
  onCancelEdit?: () => void
}) {
  return (
    <div
      className="flex items-center justify-between p-2 bg-background rounded-md text-sm border"
      draggable={!!canEdit && !!showMoveBadge}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={canEdit ? 'Drag to move this room to another floor in the same building' : undefined}
    >
      <div className="flex items-center gap-2">
        <DoorOpen className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Input 
                value={editingName || ''} 
                onChange={(e) => onEditingNameChange?.(e.target.value)}
                className="h-6 text-sm"
                autoFocus
                onBlur={onSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit?.();
                  if (e.key === 'Escape') onCancelEdit?.();
                }}
              />
            ) : (
              <span 
                className={`${canEdit && onStartEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
                onClick={canEdit && onStartEdit ? onStartEdit : undefined}
                title={canEdit && onStartEdit ? 'انقر للتعديل' : undefined}
              >
                {room.name}
              </span>
            )}
            {canEdit && onRename && !onStartEdit && (
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onRename}>Rename</Button>
            )}
          </div>
          {showCapacity ? (
            <div className="text-xs text-muted-foreground">{room.area ? `${room.area} m² •` : ''} {room.capacity ? `Capacity: ${room.capacity}` : 'Capacity: -'}</div>
          ) : null}
        </div>
      </div>
      {showMoveBadge && (
        <Move className="h-3 w-3 text-muted-foreground mr-2" />
      )}
      {canEdit && enableDelete && (
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
type DialogType = 'addComplex' | 'editComplex' | 'addBuilding' | 'addFloor' | 'addRoom' | 'addMultipleRooms' | 'addFacility' | 'manageFacilityComponents';

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
                <SelectItem value="bathroom">Bathroom • حمام</SelectItem>
                <SelectItem value="kitchen">Kitchen • مطبخ</SelectItem>
                <SelectItem value="storeroom">Storeroom • مستودع</SelectItem>
                <SelectItem value="management">Management • إدارة</SelectItem>
                <SelectItem value="yard">Yard • حوش</SelectItem>
                <SelectItem value="corridor">Corridor • ممر</SelectItem>
                <SelectItem value="laundry">Laundry • مغسلة</SelectItem>
                <SelectItem value="shop">Shop • محل</SelectItem>
                <SelectItem value="clinic">Clinic • عيادة</SelectItem>
                <SelectItem value="basement">Basement • بدروم</SelectItem>
                <SelectItem value="hall">Hall • صالة</SelectItem>
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
  const { residences, loading, loadResidences, addComplex, addBuilding, addFloor, addRoom, deleteComplex, deleteBuilding, deleteFloor, deleteRoom, updateComplex, addMultipleRooms, addFacility, deleteFacility, setResidenceDisabled, checkResidenceHasStock, moveRoom, moveRoomAnywhere, moveFacility, updateRoomName, updateFacilityName, updateFloorName, updateBuildingName, addFacilityComponent } = useResidences();
  const { users, loadUsers: loadUsersContext, loading: usersLoading, currentUser } = useUsers();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'Admin';
  const { dict } = useLanguage();
  const [mode, setMode] = useState<'view' | 'move' | 'edit' | 'delete'>('view');
  const isMove = mode === 'move';
  const isEdit = mode === 'edit';
  const isDelete = mode === 'delete';
  const [viewMode, setViewMode] = useState<'cards' | 'tree' | 'board'>('cards');

  const clearDragImage = (e: React.DragEvent) => {
    // Minimize drag preview to reduce lag on some browsers
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

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
  
  // Track editing states
  const [editingBuilding, setEditingBuilding] = useState<{complexId: string, buildingId: string} | null>(null);
  const [editingFloor, setEditingFloor] = useState<{complexId: string, buildingId: string, floorId: string} | null>(null);
  const [editingRoom, setEditingRoom] = useState<{complexId: string, buildingId: string, floorId: string, roomId: string} | null>(null);
  const [editingFacility, setEditingFacility] = useState<{complexId: string, facilityId: string, level: 'complex' | 'building' | 'floor', buildingId?: string, floorId?: string} | null>(null);
  const [editingBuildingName, setEditingBuildingName] = useState('');
  const [editingFloorName, setEditingFloorName] = useState('');
  const [editingRoomName, setEditingRoomName] = useState('');
  const [editingFacilityName, setEditingFacilityName] = useState('');
  
  // Building editing functions
  const startEditingBuilding = useCallback((complexId: string, buildingId: string, currentName: string) => {
    setEditingBuilding({ complexId, buildingId });
    setEditingBuildingName(currentName);
  }, []);

  const saveEditingBuilding = useCallback(() => {
    if (editingBuilding && editingBuildingName.trim()) {
      updateBuildingName(editingBuilding.complexId, editingBuilding.buildingId, editingBuildingName.trim());
      setEditingBuilding(null);
      setEditingBuildingName('');
    }
  }, [editingBuilding, editingBuildingName, updateBuildingName]);

  const cancelEditingBuilding = useCallback(() => {
    setEditingBuilding(null);
    setEditingBuildingName('');
  }, []);

  // Floor editing functions
  const startEditingFloor = useCallback((complexId: string, buildingId: string, floorId: string, currentName: string) => {
    setEditingFloor({ complexId, buildingId, floorId });
    setEditingFloorName(currentName);
  }, []);

  const saveEditingFloor = useCallback(() => {
    if (editingFloor && editingFloorName.trim()) {
      updateFloorName(editingFloor.complexId, editingFloor.buildingId, editingFloor.floorId, editingFloorName.trim());
      setEditingFloor(null);
      setEditingFloorName('');
    }
  }, [editingFloor, editingFloorName, updateFloorName]);

  const cancelEditingFloor = useCallback(() => {
    setEditingFloor(null);
    setEditingFloorName('');
  }, []);

  // Room editing functions
  const startEditingRoom = useCallback((complexId: string, buildingId: string, floorId: string, roomId: string, currentName: string) => {
    setEditingRoom({ complexId, buildingId, floorId, roomId });
    setEditingRoomName(currentName);
  }, []);

  const saveEditingRoom = useCallback(() => {
    if (editingRoom && editingRoomName.trim()) {
      updateRoomName(editingRoom.complexId, editingRoom.buildingId, editingRoom.floorId, editingRoom.roomId, editingRoomName.trim());
      setEditingRoom(null);
      setEditingRoomName('');
    }
  }, [editingRoom, editingRoomName, updateRoomName]);

  const cancelEditingRoom = useCallback(() => {
    setEditingRoom(null);
    setEditingRoomName('');
  }, []);

  // Facility editing functions
  const startEditingFacility = useCallback((complexId: string, facilityId: string, level: 'complex' | 'building' | 'floor', currentName: string, buildingId?: string, floorId?: string) => {
    setEditingFacility({ complexId, facilityId, level, buildingId, floorId });
    setEditingFacilityName(currentName);
  }, []);

  const saveEditingFacility = useCallback(() => {
    if (editingFacility && editingFacilityName.trim()) {
      updateFacilityName(editingFacility.complexId, editingFacility.level, editingFacility.facilityId, editingFacilityName.trim(), editingFacility.buildingId, editingFacility.floorId);
      setEditingFacility(null);
      setEditingFacilityName('');
    }
  }, [editingFacility, editingFacilityName, updateFacilityName]);

  const cancelEditingFacility = useCallback(() => {
    setEditingFacility(null);
    setEditingFacilityName('');
  }, []);

  const setOpenForComplex = useCallback((complexId: string, values: string[]) => {
    setOpenByComplex(prev => ({ ...prev, [complexId]: values }));
  }, []);

  const toggleBuildingOpen = useCallback((complexId: string, buildingId: string) => {
    const key = `building-${buildingId}`;
    setOpenForComplex(
      complexId,
      (() => {
        const current = openByComplex[complexId] || [];
        return current.includes(key) ? current.filter(v => v !== key) : [...current, key];
      })()
    );
  }, [openByComplex, setOpenForComplex]);

  const [dialogStates, setDialogStates] = useState<Record<DialogType, boolean>>({
    addComplex: false,
    editComplex: false,
    addBuilding: false,
    addFloor: false,
    addRoom: false,
    addMultipleRooms: false,
    addFacility: false,
    manageFacilityComponents: false,
  });

  // Collapsible states
  const [openComplexIds, setOpenComplexIds] = useState<Record<string, boolean>>({});
  const toggleComplexOpen = useCallback((id: string) => {
    setOpenComplexIds(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  // Track open/closed floors per building: key = `${buildingId}:${floorId}`
  const [openFloorKeys, setOpenFloorKeys] = useState<Record<string, boolean>>({});
  const toggleFloorOpen = useCallback((buildingId: string, floorId: string) => {
    const key = `${buildingId}:${floorId}`;
    setOpenFloorKeys(prev => ({ ...prev, [key]: !(prev[key] ?? true) }));
  }, []);

  const [formData, setFormData] = useState({
    newComplexName: '',
    newComplexCity: '',
    newComplexManagerId: '',
    newBuildingName: '',
  newFloorName: '',
  newFloorQuantity: 1 as number,
  newRoomName: '',
  newRoomArea: '' as string,
  newRoomLength: '' as string,
  newRoomWidth: '' as string,
  });

  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const [contextIds, setContextIds] = useState<{ 
    level?: 'complex' | 'building' | 'floor', 
    complexId?: string, 
    buildingId?: string, 
    floorId?: string,
    facilityId?: string 
  } | null>(null);
  // New: State for managing facility components
  const [selectedFacilityForComponents, setSelectedFacilityForComponents] = useState<{
    facility: Facility;
    complexId: string;
    level: 'complex' | 'building' | 'floor';
    buildingId?: string;
    floorId?: string;
  } | null>(null);
  // Drag & Drop state for moving rooms between floors
  const [dragging, setDragging] = useState<{ roomId: string; complexId: string; buildingId: string; fromFloorId: string } | null>(null);
  const handleDragStart = useCallback((payload: { roomId: string; complexId: string; buildingId: string; fromFloorId: string }) => setDragging(payload), []);
  const handleDragEnd = useCallback(() => setDragging(null), []);
  const handleDropToFloor = useCallback(async (target: { complexId: string; buildingId: string; floorId: string }) => {
    if (!dragging) return;
    const sameComplex = dragging.complexId === target.complexId;
    if (!sameComplex) {
      toast({ title: 'غير مسموح', description: 'يمكن نقل الغرف داخل نفس المجمع فقط.', variant: 'destructive' });
      setDragging(null);
      return;
    }
    if (dragging.fromFloorId === target.floorId) {
      setDragging(null);
      return;
    }
    if (dragging.buildingId === target.buildingId) {
      await moveRoom(target.complexId, target.buildingId, dragging.fromFloorId, target.floorId, dragging.roomId);
    } else {
      await moveRoomAnywhere(
        { complexId: target.complexId, buildingId: dragging.buildingId, floorId: dragging.fromFloorId },
        { complexId: target.complexId, buildingId: target.buildingId, floorId: target.floorId },
        dragging.roomId
      );
    }
    setDragging(null);
  }, [dragging, moveRoom, moveRoomAnywhere, toast]);

  // Drag & Drop for facilities
  const [draggingFacility, setDraggingFacility] = useState<{
    facilityId: string;
    complexId: string;
    from: { level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string };
  } | null>(null);
  const handleFacilityDragStart = (facilityId: string, src: { complexId: string; level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string }, e?: React.DragEvent) => {
    if (e) clearDragImage(e);
    setDraggingFacility({ facilityId, complexId: src.complexId, from: { level: src.level, buildingId: src.buildingId, floorId: src.floorId } });
  };
  const handleFacilityDragEnd = () => setDraggingFacility(null);
  const handleFacilityDrop = async (target: { complexId: string; level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string }) => {
    if (!draggingFacility) return;
    if (draggingFacility.complexId !== target.complexId) {
      toast({ title: 'غير مسموح', description: 'يمكن نقل التجهيزات داخل نفس المجمع فقط حالياً.', variant: 'destructive' });
      setDraggingFacility(null);
      return;
    }
    await moveFacility(
      target.complexId,
      draggingFacility.from,
      { level: target.level, buildingId: target.buildingId, floorId: target.floorId },
      draggingFacility.facilityId
    );
    setDraggingFacility(null);
  };

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
        // If no search text, keep as-is
        if (!q) return complex;

        // If the complex itself matches, keep ALL its children (do not filter away buildings/floors/rooms)
        const complexMatch = includeText(complex.name) || includeText(complex.city);
        if (complexMatch) {
          return complex;
        }

        // Otherwise, search within the complex and only keep children that match (or contain matches)
        const filteredBuildings = (complex.buildings || [])
          .map(b => {
            const buildingMatch = includeText(b.name);
            if (buildingMatch) {
              // Building name matches -> keep all floors/rooms/facilities under it
              return b;
            }

            const filteredFloors = (b.floors || [])
              .map(f => {
                const floorMatch = includeText(f.name);
                if (floorMatch) {
                  // Floor name matches -> keep all rooms/facilities under it
                  return f;
                }

                const filteredRooms = (f.rooms || []).filter(r => includeText(r.name));
                const filteredFacilities = asArray<Facility>(f.facilities).filter(
                  fc => includeText(fc.name) || includeText(fc.type)
                );
                const keepFloor = filteredRooms.length > 0 || filteredFacilities.length > 0;
                return keepFloor ? { ...f, rooms: filteredRooms, facilities: filteredFacilities } : null;
              })
              .filter(Boolean) as Floor[];

            const buildingFacilities = asArray<Facility>(b.facilities).filter(
              fc => includeText(fc.name) || includeText(fc.type)
            );
            const keepBuilding = filteredFloors.length > 0 || buildingFacilities.length > 0;
            return keepBuilding ? { ...b, floors: filteredFloors, facilities: buildingFacilities } : null;
          })
          .filter(Boolean) as BuildingType[];

        const complexFacilities = asArray<Facility>(complex.facilities).filter(
          fc => includeText(fc.name) || includeText(fc.type)
        );

        const keepComplex = filteredBuildings.length > 0 || complexFacilities.length > 0;
        return keepComplex ? { ...complex, buildings: filteredBuildings, facilities: complexFacilities } : null;
      })
      .filter(Boolean) as Complex[];
  }, [activeResidences, deferredSearch, cityFilter, managerFilter]);

  const stats = useMemo(() => {
    return filteredResidences.reduce((acc, complex) => {
      acc.complexes += 1;
      const buildings = complex.buildings || [];
      acc.buildings += buildings.length;
      buildings.forEach(building => {
        const floors = building.floors || [];
        acc.floors += floors.length;
        acc.facilities += showFacilities ? asArray<Facility>(building.facilities).length : 0;
        floors.forEach(floor => {
          const rooms = floor.rooms || [];
          acc.rooms += rooms.length;
          acc.facilities += showFacilities ? asArray<Facility>(floor.facilities).length : 0;
        });
      });
      acc.facilities += showFacilities ? asArray<Facility>(complex.facilities).length : 0;
      return acc;
    }, { complexes: 0, buildings: 0, floors: 0, rooms: 0, facilities: 0 });
  }, [filteredResidences, showFacilities]);

  const openDialog = (type: DialogType, ids: Partial<{
    level?: 'complex' | 'building' | 'floor', 
    complexId?: string, 
    buildingId?: string, 
    floorId?: string,
    facilityId?: string 
  }> = {}) => {
    setDialogStates(prev => ({ ...prev, [type]: true }));
  // Important: Only override context when ids are provided; otherwise preserve existing context
  setContextIds(prev => (ids && Object.keys(ids).length > 0 ? ids : prev));
  };
  
  const closeDialog = (type: DialogType) => {
    setDialogStates(prev => ({ ...prev, [type]: false }));
    setContextIds(null);
  };

  const handleManageComponents = (facilityId: string, context?: { complexId: string; level: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string }) => {
    console.log('handleManageComponents called with:', { facilityId, context });
    if (context) {
      const newContextIds = { 
        facilityId, 
        complexId: context.complexId, 
        level: context.level, 
        buildingId: context.buildingId, 
        floorId: context.floorId 
      };
      console.log('Setting contextIds to:', newContextIds);
      setContextIds(newContextIds);
      openDialog('manageFacilityComponents');
    } else {
      // Fallback - try to find context from current state
      console.log('No context provided, inferring from residences tree');
      // Try to locate the facility within the currently visible residences
      let inferred: { complexId?: string; level?: 'complex' | 'building' | 'floor'; buildingId?: string; floorId?: string } = {};
      for (const complex of filteredResidences) {
        // Complex level facilities
        if (asArray<Facility>(complex.facilities).some(f => f.id === facilityId)) {
          inferred = { complexId: complex.id, level: 'complex' };
          break;
        }
        for (const building of complex.buildings) {
          // Building level facilities
          if (asArray<Facility>(building.facilities).some(f => f.id === facilityId)) {
            inferred = { complexId: complex.id, level: 'building', buildingId: building.id };
            break;
          }
          for (const floor of building.floors) {
            if (asArray<Facility>(floor.facilities).some(f => f.id === facilityId)) {
              inferred = { complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id };
              break;
            }
          }
          if (inferred.level) break;
        }
        if (inferred.level) break;
      }

      const newContextIds = { facilityId, ...inferred } as any;
      setContextIds(prev => ({ ...(prev || {}), ...newContextIds }));
      openDialog('manageFacilityComponents', newContextIds);
    }
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

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newFloorName.trim() || !contextIds?.complexId || !contextIds?.buildingId) return;
    const qty = Math.max(1, Number(formData.newFloorQuantity) || 1);
    if (qty === 1) {
      await addFloor(contextIds.complexId, contextIds.buildingId, formData.newFloorName.trim());
    } else {
      const base = formData.newFloorName.trim();
      for (let i = 1; i <= qty; i++) {
        const name = /{n}/i.test(base) ? base.replace(/\{n\}/gi, String(i)) : `${base} ${i}`;
        // eslint-disable-next-line no-await-in-loop
        await addFloor(contextIds.complexId, contextIds.buildingId, name);
      }
    }
    setFormData(prev => ({ ...prev, newFloorName: '', newFloorQuantity: 1 }));
    closeDialog('addFloor');
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newRoomName.trim() || !contextIds?.complexId || !contextIds?.buildingId || !contextIds?.floorId) return;
    let lengthNum = formData.newRoomLength ? Number(formData.newRoomLength) : undefined;
    let widthNum = formData.newRoomWidth ? Number(formData.newRoomWidth) : undefined;
    let areaNum = formData.newRoomArea ? Number(formData.newRoomArea) : undefined;
    
    // If no dimensions provided, use default 4x4 = 16m²
    if (!lengthNum && !widthNum && !areaNum) {
      lengthNum = 4;
      widthNum = 4;
    }
    
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
          <h1 className="text-2xl font-bold">{dict.residencesTitle}</h1>
          <p className="text-muted-foreground">{dict.residencesDescription}</p>
        </div>
  {isAdmin && (
            <Dialog open={dialogStates.addComplex} onOpenChange={(open) => open ? openDialog('addComplex') : closeDialog('addComplex')}>
        <DialogTrigger asChild>
  <Button disabled={!isEdit} title={!isEdit ? 'فعّل وضع التعديل لإضافة مجمع جديد' : undefined}>
        <PlusCircle className="mr-2 h-4 w-4" /> {dict.addComplex}
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

      {isAdmin && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 justify-between rounded-xl p-2 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/10 border border-white/20 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Move</span>
                <Switch checked={isMove} onCheckedChange={(v) => setMode(v ? 'move' : (isEdit ? 'edit' : isDelete ? 'delete' : 'view'))} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Edit</span>
                <Switch checked={isEdit} onCheckedChange={(v) => setMode(v ? 'edit' : (isMove ? 'move' : isDelete ? 'delete' : 'view'))} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Delete</span>
                <Switch checked={isDelete} onCheckedChange={(v) => setMode(v ? 'delete' : (isMove ? 'move' : isEdit ? 'edit' : 'view'))} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder={dict.searchResidencesPlaceholder}
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
            <div className="flex gap-1">
              <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')} title="عرض بطاقات">Grid</Button>
              <Button variant={viewMode === 'tree' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('tree')} title="عرض شجري">Tree</Button>
              <Button variant={viewMode === 'board' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('board')} title="عرض أعمدة (كانبان)">Board</Button>
            </div>
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

      {viewMode === 'cards' && Object.entries(filteredResidences.reduce((acc, complex) => {
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
                    <div className="flex items-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 mt-1"
                        onClick={() => toggleComplexOpen(complex.id)}
                        aria-label={openComplexIds[complex.id] ?? true ? 'Collapse complex' : 'Expand complex'}
                        title={openComplexIds[complex.id] ?? true ? 'طي المجمع' : 'توسيع المجمع'}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${((openComplexIds[complex.id] ?? true) ? '' : '-rotate-90')}`} />
                      </Button>
                      <div>
                        <CardTitle>{complex.name}</CardTitle>
                        <CardDescription>Manager: {getManagerName(complex.managerId)}</CardDescription>
                      </div>
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
                {(openComplexIds[complex.id] ?? true) && (
                <CardContent>
                  <Accordion type="multiple" className="w-full" value={openByComplex[complex.id] || []} onValueChange={(val) => setOpenForComplex(complex.id, val as string[])}>
                    {(complex.buildings || []).map((building: BuildingType) => {
                      const itemValue = `building-${building.id}`;
                      const isOpen = (openByComplex[complex.id] || []).includes(itemValue);
                      return (
                        <AccordionItem key={building.id} value={itemValue}>
                          <AccordionTrigger iconPosition="left">
                              <div className="flex items-center gap-2 flex-1">
                                  <Building className="h-5 w-5" />
                                  {editingBuilding?.complexId === complex.id && editingBuilding?.buildingId === building.id ? (
                                    <Input 
                                      value={editingBuildingName} 
                                      onChange={(e) => setEditingBuildingName(e.target.value)}
                                      className="h-7 text-sm font-medium"
                                      autoFocus
                                      onBlur={saveEditingBuilding}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditingBuilding();
                                        if (e.key === 'Escape') cancelEditingBuilding();
                                      }}
                                    />
                                  ) : (
                                    <span 
                                      className={`font-medium ${isEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
                                      onClick={isEdit ? (e) => {
                                        e.stopPropagation();
                                        startEditingBuilding(complex.id, building.id, building.name);
                                      } : undefined}
                                      title={isEdit ? 'انقر للتعديل' : undefined}
                                    >
                                      {building.name}
                                    </span>
                                  )}
                              </div>
                          </AccordionTrigger>
                          {isOpen && (
                            <AccordionContent>
                                  <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                                      {/* Mode switches moved to top toolbar */}
                                  {isAdmin && (
                                      <div className="flex justify-center gap-1 mb-2">
                                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addFloor', {complexId: complex.id, buildingId: building.id})}>
                                              <PlusCircle className="mr-1 h-3 w-3" /> Add Floor
                                          </Button>
                                          <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                  <Button variant="destructive" size="sm" className="h-7 w-7 p-0" disabled={!isEdit}><Trash2 className="h-3 w-3" /></Button>
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
                                  <div
                                    onDragOver={(e) => { if (isAdmin) { e.preventDefault(); e.stopPropagation(); } }}
                                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); /* Facility drop handled by FacilitySection */ }}
                                  >
                                    <Label className="text-xs text-muted-foreground">{(dict as any).buildingFacilitiesLabel || 'Building Facilities'}</Label>
                  {showFacilities && (
                                      <FacilitySection 
                                        facilities={asArray<Facility>(building.facilities)}
                                        canEdit={!!isAdmin}
                                        canAdd={isEdit}
                                        onAdd={() => openDialog('addFacility', { level: 'building', complexId: complex.id, buildingId: building.id })}
                                        onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'building', building.id)}
                    onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'building', buildingId: building.id }, e) : undefined}
                                        onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                                        onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'building', buildingId: building.id })}
                                        dragging={!!draggingFacility}
                                        showMoveBadge={isMove}
                                        enableDelete={isDelete}
                                        editingFacilityId={editingFacility?.level === 'building' && editingFacility?.complexId === complex.id && editingFacility?.buildingId === building.id ? editingFacility.facilityId : undefined}
                                        editingFacilityName={editingFacilityName}
                                        onEditingFacilityNameChange={setEditingFacilityName}
                                        onStartEditFacility={isEdit ? (facilityId) => {
                                          const current = asArray<Facility>(building.facilities).find(f => f.id === facilityId);
                                          if (current) startEditingFacility(complex.id, facilityId, 'building', current.name, building.id);
                                        } : undefined}
                                        onSaveEditFacility={saveEditingFacility}
                                        onCancelEditFacility={cancelEditingFacility}
                                        onRename={!isEdit ? (facilityId) => {
                                          const current = asArray<Facility>(building.facilities).find(f => f.id === facilityId);
                                          const val = prompt('Rename facility', current?.name || '');
                                          if (val && val.trim() && val.trim() !== current?.name) {
                                            updateFacilityName(complex.id, 'building', facilityId, val.trim(), building.id);
                                          }
                                        } : undefined}
                                        enableInlineEdit={isEdit}
                                        onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'building', buildingId: building.id })}
                                        isEdit={isEdit}
                                      />
                                    )}
                                  </div>
                                  {(building.floors || []).map((floor: Floor) => (
                                      <div
                                        key={floor.id}
                                        className={`p-3 rounded-md bg-muted/50 ${dragging ? 'ring-1 ring-primary/20' : ''}`}
                                        onDragOver={(e) => { if (isAdmin) { e.preventDefault(); e.stopPropagation(); } }}
                                      >
                                          <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2 font-semibold">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => toggleFloorOpen(building.id, floor.id)}
                                                    aria-label={(openFloorKeys[`${building.id}:${floor.id}`] ?? true) ? 'Collapse floor' : 'Expand floor'}
                                                    title={(openFloorKeys[`${building.id}:${floor.id}`] ?? true) ? 'طي الطابق' : 'توسيع الطابق'}
                                                  >
                                                    <ChevronDown className={`h-4 w-4 transition-transform ${((openFloorKeys[`${building.id}:${floor.id}`] ?? true) ? '' : '-rotate-90')}`} />
                                                  </Button>
                                                  <Layers className="h-4 w-4" />
                                                  {editingFloor?.complexId === complex.id && editingFloor?.buildingId === building.id && editingFloor?.floorId === floor.id ? (
                                                    <Input 
                                                      value={editingFloorName} 
                                                      onChange={(e) => setEditingFloorName(e.target.value)}
                                                      className="h-6 text-sm"
                                                      autoFocus
                                                      onBlur={saveEditingFloor}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEditingFloor();
                                                        if (e.key === 'Escape') cancelEditingFloor();
                                                      }}
                                                    />
                                                  ) : (
                                                    <span 
                                                      className={`${isEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
                                                      onClick={isEdit ? () => startEditingFloor(complex.id, building.id, floor.id, floor.name) : undefined}
                                                      title={isEdit ? 'انقر للتعديل' : undefined}
                                                    >
                                                      {floor.name}
                                                    </span>
                                                  )}
                                              </div>
                                              {isAdmin && (
                                                  <div className="flex justify-center gap-1">
                                                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addRoom', {complexId: complex.id, buildingId: building.id, floorId: floor.id})}>
                                                          <PlusCircle className="mr-1 h-3 w-3" /> Room
                                                      </Button>
                                                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addMultipleRooms', {level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id})}>
                                                          <Plus className="mr-1 h-3 w-3" /> Multi
                                                      </Button>
                                                      <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                              <Button variant="destructive" size="sm" className="h-6 w-6 p-0" disabled={!isEdit}><Trash2 className="h-3 w-3" /></Button>
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
                                          {(openFloorKeys[`${building.id}:${floor.id}`] ?? true) && (
                                          <div
                                            className={`pl-6 space-y-2`}
                                            onDragOver={(e) => {
                                              if (isAdmin) { e.preventDefault(); e.stopPropagation(); }
                                            }}
                                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropToFloor({ complexId: complex.id, buildingId: building.id, floorId: floor.id }); }}
                                          >
                                              <div className={`grid grid-cols-2 gap-2 ${dragging ? 'ring-1 ring-primary/30 rounded-md p-1' : ''}`}>
                                                  {(floor.rooms || []).map((room: Room) => (
                                                  <RoomItem
                                                      key={room.id}
                                                      room={room}
                                                      canEdit={!!isAdmin}
                                                      onDelete={() => deleteRoom(complex.id, building.id, floor.id, room.id)}
                                                    showCapacity={showCapacity}
                                                    onDragStart={isMove ? (e) => { clearDragImage(e); handleDragStart({ roomId: room.id, complexId: complex.id, buildingId: building.id, fromFloorId: floor.id }); } : undefined}
                                                    onDragEnd={isMove ? handleDragEnd : undefined}
                                                    showMoveBadge={isMove}
                                                    enableDelete={isDelete}
                                                    isEditing={editingRoom?.complexId === complex.id && editingRoom?.buildingId === building.id && editingRoom?.floorId === floor.id && editingRoom?.roomId === room.id}
                                                    editingName={editingRoomName}
                                                    onEditingNameChange={setEditingRoomName}
                                                    onStartEdit={isEdit ? () => startEditingRoom(complex.id, building.id, floor.id, room.id, room.name) : undefined}
                                                    onSaveEdit={saveEditingRoom}
                                                    onCancelEdit={cancelEditingRoom}
                                                    />
                                                  ))}
                                              </div>
                                              {dragging && floor.rooms.length === 0 && (
                                                <div className="mt-2 col-span-full flex items-center justify-center min-h-16 border-2 border-dashed rounded-md text-xs text-muted-foreground">
                                                  Drop room here
                                                </div>
                                              )}
                                              <div>
                                                <Label className="text-xs text-muted-foreground">{(dict as any).floorFacilitiesLabel || 'Floor Facilities'}</Label>
                                                {showFacilities && (
                                                  <FacilitySection 
                                                    facilities={asArray<Facility>(floor.facilities)}
                                                    canEdit={!!isAdmin}
                                                    canAdd={isEdit}
                                                    onAdd={() => openDialog('addFacility', { level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id })}
                                                    onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'floor', building.id, floor.id)}
                                                    onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id }, e) : undefined}
                                                    onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                                                    onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id })}
                                                    dragging={!!draggingFacility}
                                                    showMoveBadge={isMove}
                                                    enableDelete={isDelete}
                                                    editingFacilityId={editingFacility?.level === 'floor' && editingFacility?.complexId === complex.id && editingFacility?.buildingId === building.id && editingFacility?.floorId === floor.id ? editingFacility.facilityId : undefined}
                                                    editingFacilityName={editingFacilityName}
                                                    onEditingFacilityNameChange={setEditingFacilityName}
                                                    onStartEditFacility={isEdit ? (facilityId) => {
                                                      const current = asArray<Facility>(floor.facilities).find(f => f.id === facilityId);
                                                      if (current) startEditingFacility(complex.id, facilityId, 'floor', current.name, building.id, floor.id);
                                                    } : undefined}
                                                    onSaveEditFacility={saveEditingFacility}
                                                    onCancelEditFacility={cancelEditingFacility}
                                                    onRename={!isEdit ? (facilityId) => {
                                                      const current = asArray<Facility>(floor.facilities).find(f => f.id === facilityId);
                                                      const val = prompt('Rename facility', current?.name || '');
                                                      if (val && val.trim() && val.trim() !== current?.name) {
                                                        updateFacilityName(complex.id, 'floor', facilityId, val.trim(), building.id, floor.id);
                                                      }
                                                    } : undefined}
                                                    enableInlineEdit={isEdit}
                                                    onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id })}
                                                    isEdit={isEdit}
                                                  />
                                                )}
                                              </div>
                                          </div>
                                          )}
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
                        <h4 className="text-md font-semibold mb-2 flex items-center gap-2"><ConciergeBell className="h-5 w-5 text-primary" /> {(dict as any).generalFacilitiesLabel || 'Residence Facilities'}</h4>
            {showFacilities && (
                          <FacilitySection 
                            facilities={asArray<Facility>(complex.facilities)}
                            canEdit={!!isAdmin}
                            canAdd={isEdit}
                            onAdd={() => openDialog('addFacility', { level: 'complex', complexId: complex.id })}
                            onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'complex')}
              onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'complex' }, e) : undefined}
                            onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                            onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'complex' })}
                            dragging={!!draggingFacility}
                            showMoveBadge={isMove}
                            enableDelete={isDelete}
                            onRename={isEdit ? (facilityId) => {
                              const current = asArray<Facility>(complex.facilities).find(f => f.id === facilityId);
                              const val = prompt('Rename facility', current?.name || '');
                              if (val && val.trim() && val.trim() !== current?.name) {
                                updateFacilityName(complex.id, 'complex', facilityId, val.trim());
                              }
                            } : undefined}
                            enableInlineEdit={isEdit}
                            onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'complex' })}
                            isEdit={isEdit}
                          />
                        )}
                      </>
                  ) : null}
                </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {viewMode === 'tree' && Object.entries(filteredResidences.reduce((acc, complex) => {
        const city = complex.city || 'Uncategorized';
        if (!acc[city]) acc[city] = [] as Complex[];
        acc[city].push(complex);
        return acc;
      }, {} as Record<string, Complex[]>)).map(([city, complexes]) => (
        <div key={city}>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {city}</h2>
          <div className="rounded-md border divide-y">
            {complexes.map((complex) => {
              const complexOpen = openComplexIds[complex.id] ?? true;
              return (
                <div key={complex.id} className="">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleComplexOpen(complex.id)}>
                        <ChevronDown className={`h-4 w-4 transition-transform ${complexOpen ? '' : '-rotate-90'}`} />
                      </Button>
                      <div className="font-semibold">{complex.name}</div>
                      <div className="text-xs text-muted-foreground">Manager: {getManagerName(complex.managerId)}</div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog('addBuilding', {complexId: complex.id})}><PlusCircle className="h-4 w-4 mr-1" /> Add Building</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(complex)}><Pencil className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                  {complexOpen && (
                    <div className="pl-8 pr-3 pb-3 space-y-4">
                      {(complex.buildings || []).map((building) => {
                        const bKey = `building-${building.id}`;
                        const bOpen = (openByComplex[complex.id] || []).includes(bKey);
                        const floorsCount = (building.floors || []).length;
                        const roomsCount = (building.floors || []).reduce((acc, f) => acc + (f.rooms || []).length, 0);
                        return (
                          <div key={building.id} className="border rounded-md">
            <div className="flex items-center justify-between p-2">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleBuildingOpen(complex.id, building.id)}>
                                  <ChevronDown className={`h-4 w-4 transition-transform ${bOpen ? '' : '-rotate-90'}`} />
                                </Button>
                                <Building className="h-4 w-4 text-muted-foreground" />
                                {editingBuilding?.complexId === complex.id && editingBuilding?.buildingId === building.id ? (
                                  <Input 
                                    value={editingBuildingName} 
                                    onChange={(e) => setEditingBuildingName(e.target.value)}
                                    className="h-6 text-sm font-medium"
                                    autoFocus
                                    onBlur={saveEditingBuilding}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditingBuilding();
                                      if (e.key === 'Escape') cancelEditingBuilding();
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className={`font-medium ${isEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
                                    onClick={isEdit ? () => startEditingBuilding(complex.id, building.id, building.name) : undefined}
                                    title={isEdit ? 'انقر للتعديل' : undefined}
                                  >
                                    {building.name}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">{floorsCount} floors • {roomsCount} rooms</div>
                              </div>
                              {isAdmin && (
                                <div className="flex justify-center gap-1">
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addFloor', {complexId: complex.id, buildingId: building.id})}><PlusCircle className="h-3 w-3 mr-1" /> Floor</Button>
                                </div>
                              )}
                            </div>
                            {bOpen && (
                              <div className="pl-8 pr-3 pb-3 space-y-4">
                                {(building.floors || []).map((floor) => {
                                  const fKey = `${building.id}:${floor.id}`;
                                  const fOpen = openFloorKeys[fKey] ?? true;
                                  return (
                                    <div key={floor.id} className="rounded-md bg-muted/30">
                                      <div className="flex items-center justify-between p-2">
                                        <div className="flex items-center gap-2 font-semibold">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleFloorOpen(building.id, floor.id)}>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${fOpen ? '' : '-rotate-90'}`} />
                                          </Button>
                                          <Layers className="h-4 w-4" />
                                          {editingFloor?.complexId === complex.id && editingFloor?.buildingId === building.id && editingFloor?.floorId === floor.id ? (
                                            <Input 
                                              value={editingFloorName} 
                                              onChange={(e) => setEditingFloorName(e.target.value)}
                                              className="h-6 text-sm"
                                              autoFocus
                                              onBlur={saveEditingFloor}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEditingFloor();
                                                if (e.key === 'Escape') cancelEditingFloor();
                                              }}
                                            />
                                          ) : (
                                            <span 
                                              className={`${isEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
                                              onClick={isEdit ? () => startEditingFloor(complex.id, building.id, floor.id, floor.name) : undefined}
                                              title={isEdit ? 'انقر للتعديل' : undefined}
                                            >
                                              {floor.name}
                                            </span>
                                          )}
                                        </div>
                                        {isAdmin && (
                                          <div className="flex justify-center gap-1">
                                            <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addRoom', {complexId: complex.id, buildingId: building.id, floorId: floor.id})}><PlusCircle className="h-3 w-3 mr-1" /> Room</Button>
                                            <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addMultipleRooms', {level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id})}><Plus className="h-3 w-3 mr-1" /> Multi</Button>
                                          </div>
                                        )}
                                      </div>
                                      {fOpen && (
                                        <div className="p-3 space-y-3">
                                          {/* Reuse the same room grid and facilities from card view to keep features consistent */}
                                          <div
                                            className={`pl-0 space-y-2`}
                                            onDragOver={(e) => { if (isAdmin) { e.preventDefault(); e.stopPropagation(); } }}
                                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropToFloor({ complexId: complex.id, buildingId: building.id, floorId: floor.id }); }}
                                          >
                                            <div className={`grid grid-cols-2 gap-2 ${dragging ? 'ring-1 ring-primary/30 rounded-md p-1' : ''}`}>
                                              {(floor.rooms || []).map((room: Room) => (
                                                <RoomItem
                                                  key={room.id}
                                                  room={room}
                                                  canEdit={!!isAdmin}
                                                  onDelete={() => deleteRoom(complex.id, building.id, floor.id, room.id)}
                                                  showCapacity={showCapacity}
                                                  onDragStart={isMove ? (e) => { clearDragImage(e); handleDragStart({ roomId: room.id, complexId: complex.id, buildingId: building.id, fromFloorId: floor.id }); } : undefined}
                                                  onDragEnd={isMove ? handleDragEnd : undefined}
                                                  showMoveBadge={isMove}
                                                  enableDelete={isDelete}
                                                  isEditing={editingRoom?.complexId === complex.id && editingRoom?.buildingId === building.id && editingRoom?.floorId === floor.id && editingRoom?.roomId === room.id}
                                                  editingName={editingRoomName}
                                                  onEditingNameChange={setEditingRoomName}
                                                  onStartEdit={isEdit ? () => startEditingRoom(complex.id, building.id, floor.id, room.id, room.name) : undefined}
                                                  onSaveEdit={saveEditingRoom}
                                                  onCancelEdit={cancelEditingRoom}
                                                />
                                              ))}
                                            </div>
                                            {dragging && floor.rooms.length === 0 && (
                                              <div className="mt-2 col-span-full flex items-center justify-center min-h-16 border-2 border-dashed rounded-md text-xs text-muted-foreground">
                                                Drop room here
                                              </div>
                                            )}
                                            <div>
                                              <Label className="text-xs text-muted-foreground">{(dict as any).floorFacilitiesLabel || 'Floor Facilities'}</Label>
                                              {showFacilities && (
                                                <FacilitySection 
                                                  facilities={asArray<Facility>(floor.facilities)}
                                                  canEdit={!!isAdmin}
                                                  canAdd={isEdit}
                                                  onAdd={() => openDialog('addFacility', { level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id })}
                                                  onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'floor', building.id, floor.id)}
                                                  onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id }, e) : undefined}
                                                  onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                                                  onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id })}
                                                  dragging={!!draggingFacility}
                                                  showMoveBadge={isMove}
                                                  enableDelete={isDelete}
                                                  editingFacilityId={editingFacility?.level === 'floor' && editingFacility?.complexId === complex.id && editingFacility?.buildingId === building.id && editingFacility?.floorId === floor.id ? editingFacility.facilityId : undefined}
                                                  editingFacilityName={editingFacilityName}
                                                  onEditingFacilityNameChange={setEditingFacilityName}
                                                  onStartEditFacility={isEdit ? (facilityId) => {
                                                    const current = asArray<Facility>(floor.facilities).find(f => f.id === facilityId);
                                                    if (current) startEditingFacility(complex.id, facilityId, 'floor', current.name, building.id, floor.id);
                                                  } : undefined}
                                                  onSaveEditFacility={saveEditingFacility}
                                                  onCancelEditFacility={cancelEditingFacility}
                                                  enableInlineEdit={isEdit}
                                                  onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id })}
                                                  isEdit={isEdit}
                                                />
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                <div>
                                  <Label className="text-xs text-muted-foreground">{(dict as any).buildingFacilitiesLabel || 'Building Facilities'}</Label>
                                  {showFacilities && (
                                    <FacilitySection 
                                      facilities={asArray<Facility>(building.facilities)}
                                      canEdit={!!isAdmin}
                                      canAdd={isEdit}
                                      onAdd={() => openDialog('addFacility', { level: 'building', complexId: complex.id, buildingId: building.id })}
                                      onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'building', building.id)}
                                      onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'building', buildingId: building.id }, e) : undefined}
                                      onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                                      onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'building', buildingId: building.id })}
                                      dragging={!!draggingFacility}
                                      showMoveBadge={isMove}
                                      enableDelete={isDelete}
                                      editingFacilityId={editingFacility?.level === 'building' && editingFacility?.complexId === complex.id && editingFacility?.buildingId === building.id ? editingFacility.facilityId : undefined}
                                      editingFacilityName={editingFacilityName}
                                      onEditingFacilityNameChange={setEditingFacilityName}
                                      onStartEditFacility={isEdit ? (facilityId) => {
                                        const current = asArray<Facility>(building.facilities).find(f => f.id === facilityId);
                                        if (current) startEditingFacility(complex.id, facilityId, 'building', current.name, building.id);
                                      } : undefined}
                                      onSaveEditFacility={saveEditingFacility}
                                      onCancelEditFacility={cancelEditingFacility}
                                      enableInlineEdit={isEdit}
                                      onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'building', buildingId: building.id })}
                                      isEdit={isEdit}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(complex.facilities && complex.facilities.length > 0) || isAdmin ? (
                        <div className="pt-2">
                          <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><ConciergeBell className="h-4 w-4 text-primary" /> {(dict as any).generalFacilitiesLabel || 'Residence Facilities'}</h4>
                          {showFacilities && (
                            <FacilitySection 
                              facilities={asArray<Facility>(complex.facilities)}
                              canEdit={!!isAdmin}
                              canAdd={isEdit}
                              onAdd={() => openDialog('addFacility', { level: 'complex', complexId: complex.id })}
                              onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'complex')}
                              onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'complex' }, e) : undefined}
                              onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                              onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'complex' })}
                              dragging={!!draggingFacility}
                              showMoveBadge={isMove}
                              enableDelete={isDelete}
                              editingFacilityId={editingFacility?.level === 'complex' && editingFacility?.complexId === complex.id ? editingFacility.facilityId : undefined}
                              editingFacilityName={editingFacilityName}
                              onEditingFacilityNameChange={setEditingFacilityName}
                              onStartEditFacility={isEdit ? (facilityId) => {
                                const current = asArray<Facility>(complex.facilities).find(f => f.id === facilityId);
                                if (current) startEditingFacility(complex.id, facilityId, 'complex', current.name);
                              } : undefined}
                              onSaveEditFacility={saveEditingFacility}
                              onCancelEditFacility={cancelEditingFacility}
                              enableInlineEdit={isEdit}
                              onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'complex' })}
                              isEdit={isEdit}
                            />
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {viewMode === 'board' && Object.entries(filteredResidences.reduce((acc, complex) => {
        const city = complex.city || 'Uncategorized';
        if (!acc[city]) acc[city] = [] as Complex[];
        acc[city].push(complex);
        return acc;
      }, {} as Record<string, Complex[]>)).map(([city, complexes]) => (
        <div key={city}>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {city}</h2>
          {complexes.map((complex) => (
            <div key={complex.id} className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleComplexOpen(complex.id)}
                    aria-label={(openComplexIds[complex.id] ?? true) ? 'Collapse complex' : 'Expand complex'}
                    title={(openComplexIds[complex.id] ?? true) ? 'طي المجمع' : 'توسيع المجمع'}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${((openComplexIds[complex.id] ?? true) ? '' : '-rotate-90')}`} />
                  </Button>
                  <div className="font-semibold text-lg">{complex.name}</div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog('addBuilding', {complexId: complex.id})}><PlusCircle className="h-4 w-4 mr-1" /> Add Building</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(complex)}><Pencil className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              {(openComplexIds[complex.id] ?? true) && (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-max">
                  {(complex.buildings || []).map((building) => {
                    const floorsCount = (building.floors || []).length;
                    const roomsCount = (building.floors || []).reduce((acc, f) => acc + (f.rooms || []).length, 0);
                    return (
                      <div key={building.id} className="w-80 shrink-0 rounded-lg border bg-background">
                        <div className="p-3 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {editingBuilding?.complexId === complex.id && editingBuilding?.buildingId === building.id ? (
                              <Input 
                                value={editingBuildingName} 
                                onChange={(e) => setEditingBuildingName(e.target.value)}
                                className="h-6 text-sm font-medium"
                                autoFocus
                                onBlur={saveEditingBuilding}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingBuilding();
                                  if (e.key === 'Escape') cancelEditingBuilding();
                                }}
                              />
                            ) : (
                              <div 
                                className={`font-medium ${isEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
                                onClick={isEdit ? () => startEditingBuilding(complex.id, building.id, building.name) : undefined}
                                title={isEdit ? 'انقر للتعديل' : undefined}
                              >
                                {building.name}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{floorsCount}F • {roomsCount}R</div>
                        </div>
                        <div className="p-3 space-y-4">
                          {(building.floors || []).map((floor) => (
                            <div key={floor.id} className="rounded-md bg-muted/30 border">
                              <div className="px-3 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2 font-semibold">
                                  <Layers className="h-4 w-4" />
                                  {editingFloor?.complexId === complex.id && editingFloor?.buildingId === building.id && editingFloor?.floorId === floor.id ? (
                                    <Input 
                                      value={editingFloorName} 
                                      onChange={(e) => setEditingFloorName(e.target.value)}
                                      className="h-6 text-sm"
                                      autoFocus
                                      onBlur={saveEditingFloor}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditingFloor();
                                        if (e.key === 'Escape') cancelEditingFloor();
                                      }}
                                    />
                                  ) : (
                                    <span 
                                      className={`${isEdit ? 'cursor-pointer px-1 py-0.5 rounded border border-blue-400 hover:border-blue-600' : ''}`}
                                      onClick={isEdit ? () => startEditingFloor(complex.id, building.id, floor.id, floor.name) : undefined}
                                      title={isEdit ? 'انقر للتعديل' : undefined}
                                    >
                                      {floor.name}
                                    </span>
                                  )}
                                </div>
                                {isAdmin && (
                                  <div className="flex justify-center gap-1">
                                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addRoom', {complexId: complex.id, buildingId: building.id, floorId: floor.id})}><PlusCircle className="h-3 w-3 mr-1" /> Room</Button>
                                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!isEdit} onClick={() => openDialog('addMultipleRooms', {level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id})}><Plus className="h-3 w-3 mr-1" /> Multi</Button>
                                  </div>
                                )}
                              </div>
                              <div
                                className={`px-3 pb-3 space-y-2`}
                                onDragOver={(e) => { if (isAdmin) { e.preventDefault(); e.stopPropagation(); } }}
                                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropToFloor({ complexId: complex.id, buildingId: building.id, floorId: floor.id }); }}
                              >
                                <div className={`grid grid-cols-2 gap-2 ${dragging ? 'ring-1 ring-primary/30 rounded-md p-1' : ''}`}>
                                  {(floor.rooms || []).map((room: Room) => (
                                    <RoomItem
                                      key={room.id}
                                      room={room}
                                      canEdit={!!isAdmin}
                                      onDelete={() => deleteRoom(complex.id, building.id, floor.id, room.id)}
                                      showCapacity={showCapacity}
                                      onDragStart={isMove ? (e) => { clearDragImage(e); handleDragStart({ roomId: room.id, complexId: complex.id, buildingId: building.id, fromFloorId: floor.id }); } : undefined}
                                      onDragEnd={isMove ? handleDragEnd : undefined}
                                      showMoveBadge={isMove}
                                      enableDelete={isDelete}
                                      isEditing={editingRoom?.complexId === complex.id && editingRoom?.buildingId === building.id && editingRoom?.floorId === floor.id && editingRoom?.roomId === room.id}
                                      editingName={editingRoomName}
                                      onEditingNameChange={setEditingRoomName}
                                      onStartEdit={isEdit ? () => startEditingRoom(complex.id, building.id, floor.id, room.id, room.name) : undefined}
                                      onSaveEdit={saveEditingRoom}
                                      onCancelEdit={cancelEditingRoom}
                                    />
                                  ))}
                                </div>
                                {dragging && floor.rooms.length === 0 && (
                                  <div className="mt-2 col-span-full flex items-center justify-center min-h-16 border-2 border-dashed rounded-md text-xs text-muted-foreground">
                                    Drop room here
                                  </div>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">{(dict as any).floorFacilitiesLabel || 'Floor Facilities'}</Label>
                                {showFacilities && (
                                  <FacilitySection 
                                    facilities={asArray<Facility>(floor.facilities)}
                                    canEdit={!!isAdmin}
                                    canAdd={isEdit}
                                    onAdd={() => openDialog('addFacility', { level: 'floor', complexId: complex.id, buildingId: building.id, floorId: floor.id })}
                                    onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'floor', building.id, floor.id)}
                                    onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id }, e) : undefined}
                                    onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                                    onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id })}
                                    dragging={!!draggingFacility}
                                    showMoveBadge={isMove}
                                    enableDelete={isDelete}
                                    editingFacilityId={editingFacility?.level === 'floor' && editingFacility?.complexId === complex.id && editingFacility?.buildingId === building.id && editingFacility?.floorId === floor.id ? editingFacility.facilityId : undefined}
                                    editingFacilityName={editingFacilityName}
                                    onEditingFacilityNameChange={setEditingFacilityName}
                                    onStartEditFacility={isEdit ? (facilityId) => {
                                      const current = asArray<Facility>(floor.facilities).find(f => f.id === facilityId);
                                      if (current) startEditingFacility(complex.id, facilityId, 'floor', current.name, building.id, floor.id);
                                    } : undefined}
                                    onSaveEditFacility={saveEditingFacility}
                                    onCancelEditFacility={cancelEditingFacility}
                                    enableInlineEdit={isEdit}
                                    onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'floor', buildingId: building.id, floorId: floor.id })}
                                    isEdit={isEdit}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                          <div>
                            <Label className="text-xs text-muted-foreground">{(dict as any).buildingFacilitiesLabel || 'Building Facilities'}</Label>
                            {showFacilities && (
                              <FacilitySection 
                                facilities={asArray<Facility>(building.facilities)}
                                canEdit={!!isAdmin}
                                canAdd={isEdit}
                                onAdd={() => openDialog('addFacility', { level: 'building', complexId: complex.id, buildingId: building.id })}
                                onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'building', building.id)}
                                onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'building', buildingId: building.id }, e) : undefined}
                                onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                                onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'building', buildingId: building.id })}
                                dragging={!!draggingFacility}
                                showMoveBadge={isMove}
                                enableDelete={isDelete}
                                editingFacilityId={editingFacility?.level === 'building' && editingFacility?.complexId === complex.id && editingFacility?.buildingId === building.id ? editingFacility.facilityId : undefined}
                                editingFacilityName={editingFacilityName}
                                onEditingFacilityNameChange={setEditingFacilityName}
                                onStartEditFacility={isEdit ? (facilityId) => {
                                  const current = asArray<Facility>(building.facilities).find(f => f.id === facilityId);
                                  if (current) startEditingFacility(complex.id, facilityId, 'building', current.name, building.id);
                                } : undefined}
                                onSaveEditFacility={saveEditingFacility}
                                onCancelEditFacility={cancelEditingFacility}
                                enableInlineEdit={isEdit}
                                onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'building', buildingId: building.id })}
                                isEdit={isEdit}
                              />
                            )}
                          </div>
                          {isAdmin && isEdit && (
                            <div className="pt-1">
                              <Button variant="outline" size="sm" onClick={() => openDialog('addFloor', {complexId: complex.id, buildingId: building.id})}><PlusCircle className="h-4 w-4 mr-1" /> Add Floor</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(complex.facilities && complex.facilities.length > 0) || isAdmin ? (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2"><ConciergeBell className="h-4 w-4 text-primary" /> {(dict as any).generalFacilitiesLabel || 'Residence Facilities'}</h4>
                    {showFacilities && (
                      <FacilitySection 
                        facilities={asArray<Facility>(complex.facilities)}
                        canEdit={!!isAdmin}
                        canAdd={isEdit}
                        onAdd={() => openDialog('addFacility', { level: 'complex', complexId: complex.id })}
                        onDelete={(facilityId) => handleDeleteFacility(complex.id, facilityId, 'complex')}
                        onItemDragStart={isMove ? (facilityId, e) => handleFacilityDragStart(facilityId, { complexId: complex.id, level: 'complex' }, e) : undefined}
                        onItemDragEnd={isMove ? handleFacilityDragEnd : undefined}
                        onDrop={() => handleFacilityDrop({ complexId: complex.id, level: 'complex' })}
                        dragging={!!draggingFacility}
                        showMoveBadge={isMove}
                        editingFacilityId={editingFacility?.level === 'complex' && editingFacility?.complexId === complex.id ? editingFacility.facilityId : undefined}
                        editingFacilityName={editingFacilityName}
                        onEditingFacilityNameChange={setEditingFacilityName}
                        onStartEditFacility={isEdit ? (facilityId) => {
                          const current = asArray<Facility>(complex.facilities).find(f => f.id === facilityId);
                          if (current) startEditingFacility(complex.id, facilityId, 'complex', current.name);
                        } : undefined}
                        onSaveEditFacility={saveEditingFacility}
                        onCancelEditFacility={cancelEditingFacility}
                        enableInlineEdit={isEdit}
                        enableDelete={isDelete}
                        onManageComponents={(facilityId) => handleManageComponents(facilityId, { complexId: complex.id, level: 'complex' })}
                        isEdit={isEdit}
                        onRename={isEdit ? (facilityId) => {
                          const current = asArray<Facility>(complex.facilities).find(f => f.id === facilityId);
                          const val = prompt('Rename facility', current?.name || '');
                          if (val && val.trim() && val.trim() !== current?.name) {
                            updateFacilityName(complex.id, 'complex', facilityId, val.trim());
                          }
                        } : undefined}
                      />
                    )}
                  </div>
                ) : null}
              </div>
              )}
            </div>
          ))}
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
                Enter a floor name. Use {'{n}'} to insert numbers when adding multiple (e.g., "Floor {'{n}'}").
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="floor-name" className="text-right">Name</Label>
                <Input id="floor-name" placeholder="e.g., Floor 3" className="col-span-3" value={formData.newFloorName} onChange={(e) => setFormData(prev => ({ ...prev, newFloorName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="floor-qty" className="text-right">Quantity</Label>
                <Input id="floor-qty" type="number" min="1" className="col-span-3" value={formData.newFloorQuantity} onChange={(e) => setFormData(prev => ({ ...prev, newFloorQuantity: Math.max(1, Number(e.target.value) || 1) }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Floor(s)</Button>
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
                Enter the name for the new room. Default size: 4x4m (16m², capacity: 4)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-name" className="text-right">Name</Label>
                <Input id="room-name" placeholder="e.g., Room 301" className="col-span-3" value={formData.newRoomName} onChange={(e) => setFormData(prev => ({ ...prev, newRoomName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-length" className="text-right">Length (m)</Label>
                <Input id="room-length" placeholder="Default: 4" className="col-span-3" value={formData.newRoomLength} onChange={(e) => setFormData(prev => ({ ...prev, newRoomLength: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-width" className="text-right">Width (m)</Label>
                <Input id="room-width" placeholder="Default: 4" className="col-span-3" value={formData.newRoomWidth} onChange={(e) => setFormData(prev => ({ ...prev, newRoomWidth: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-area" className="text-right">Or Area (m²)</Label>
                <Input id="room-area" placeholder="Default: 16" className="col-span-3" value={formData.newRoomArea} onChange={(e) => setFormData(prev => ({ ...prev, newRoomArea: e.target.value }))} />
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
      {contextIds?.complexId && contextIds.level && (
        <AddFacilityDialog 
            isOpen={dialogStates.addFacility}
            onOpenChange={(open) => open ? openDialog('addFacility') : closeDialog('addFacility')}
            context={{
              level: contextIds.level,
              complexId: contextIds.complexId,
              buildingId: contextIds.buildingId,
              floorId: contextIds.floorId,
            }}
            onAdd={addFacility}
        />
      )}

      {/* Manage Facility Components Dialog */}
      <Dialog open={dialogStates.manageFacilityComponents} onOpenChange={(open) => open ? openDialog('manageFacilityComponents') : closeDialog('manageFacilityComponents')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مكون جديد</DialogTitle>
            <DialogDescription>أضف مكون جديد إلى هذا التجهيز</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {contextIds?.facilityId && contextIds?.complexId && contextIds?.level ? (
              <AddComponentForm
                facilityId={contextIds.facilityId}
                onClose={() => closeDialog('manageFacilityComponents')}
                onAddComponent={async (facilityId, component) => {
                  await addFacilityComponent(
                    contextIds.complexId!,
                    facilityId,
                    contextIds.level as 'complex' | 'building' | 'floor',
                    component,
                    contextIds.buildingId,
                    contextIds.floorId
                  );
                }}
              />
            ) : (
              <div className="text-red-500">
                Missing context: {JSON.stringify(contextIds)}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
