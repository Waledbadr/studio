'use client';

import { useEffect, useState, useMemo, useTransition, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useResidences, type FacilityComponent } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useInventory, type InventoryItem, type LocationWithItems as IVoucherLocation } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Trash2, MapPin, PackagePlus, Loader2, History, ConciergeBell, Building, Archive, ChevronDown, ChevronUp, FileText, CheckCircle, XCircle, Clock, Truck, Search, Zap, Copy, Save, ScanBarcode as Barcode, Keyboard, Command } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { differenceInDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/language-context';
import { useOrders, type Order } from '@/context/orders-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LocationBreadcrumb } from '@/components/ui/location-breadcrumb';


interface IssuedItem extends InventoryItem {
    issueQuantity: number;
}

interface VoucherLocation {
    locationId: string;
    locationName: string;
    isFacility: boolean;
    buildingId?: string;
    buildingName?: string;
    floorId?: string;
    floorName?: string;
    roomId?: string;
    roomName?: string;
    facilityId?: string;
    items: IssuedItem[];
}


export default function IssueMaterialPage() {
    const { currentUser } = useUsers();
    const { residences, loading: residencesLoading } = useResidences();
    const { items: allItems, loading: inventoryLoading, getStockForResidence, issueItemsFromStock, getLastIssueDateForItemAtLocation, getMIVs } = useInventory();
    const { toast } = useToast();
    const router = useRouter();
    const { dict } = useLanguage();
    const { orders, loadOrders } = useOrders();
    const [isPending, startTransition] = useTransition();
    
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    
    const [locationType, setLocationType] = useState<'unit' | 'facility'>('unit');
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedFacilityId, setSelectedFacilityId] = useState('');
    const [selectedComponentId, setSelectedComponentId] = useState('');

    const [voucherLocations, setVoucherLocations] = useState<VoucherLocation[]>([]);
    const [selectedMrId, setSelectedMrId] = useState('');
    
    // Quick add mode: auto-add items with quantity 1
    const [quickAddMode, setQuickAddMode] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
    
    // Bulk operations
    const [bulkQuantity, setBulkQuantity] = useState<number>(1);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    
    const userResidences = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'Admin') return residences;
        return residences.filter(r => currentUser.assignedResidences.includes(r.id));
    }, [currentUser, residences]);

    const filteredResidences = useMemo(() => {
        return userResidences.filter(r => r.id !== 'main-warehouse');
    }, [userResidences]);

    const selectedComplex = useMemo(() => residences.find(c => c.id === selectedComplexId), [selectedComplexId, residences]);
    const selectedBuilding = useMemo(() => selectedComplex?.buildings.find(b => b.id === selectedBuildingId), [selectedBuildingId, selectedComplex]);
    const selectedFloor = useMemo(() => selectedBuilding?.floors.find(f => f.id === selectedFloorId), [selectedFloorId, selectedBuilding]);
    
    const availableFacilities = useMemo(() => {
        if (!selectedComplex) return [];
        // Show only the most specific facilities available
        if (selectedFloorId) {
            return selectedFloor?.facilities || [];
        }
        if (selectedBuildingId) {
            return selectedBuilding?.facilities || [];
        }
        return selectedComplex.facilities || [];
    }, [selectedComplex, selectedBuildingId, selectedFloorId, selectedFloor, selectedBuilding]);

    // Components for selected facility (if any)
    const availableComponents = useMemo<FacilityComponent[]>(() => {
        if (!selectedFacilityId) return [];
        const fac = availableFacilities.find((f: any) => f.id === selectedFacilityId) as any;
        return (fac?.components || []) as FacilityComponent[];
    }, [selectedFacilityId, availableFacilities]);

    // Ensure orders are loaded so MR dropdown is populated
    useEffect(() => {
        loadOrders?.();
        // Also refresh when user identity changes
    }, [loadOrders]);
    useEffect(() => {
        if (currentUser?.id) {
            loadOrders?.();
        }
    }, [currentUser?.id, loadOrders]);

    // Calculate if voucher can be submitted (needed before keyboard shortcuts)
    const isVoucherSubmittable = useMemo(() => {
        return voucherLocations.length > 0 && voucherLocations.every(loc => loc.items.length > 0);
    }, [voucherLocations]);

    // Handle submit voucher (needed before keyboard shortcuts)
    const handleSubmitVoucher = useCallback(async () => {
        if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor')) {
            toast({ title: 'Insufficient permissions', description: 'Only Admins or Supervisors can submit issue vouchers.', variant: 'destructive' });
            return;
        }
        if (!selectedComplexId || !isVoucherSubmittable) {
            toast({ title: "Cannot Submit", description: "Voucher is empty or residence is not selected.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await issueItemsFromStock(selectedComplexId, voucherLocations);
            toast({ title: "Success", description: "Material Issue Voucher has been processed and stock updated." });
            setVoucherLocations([]);
            setSelectedBuildingId('');
            setSelectedFloorId('');
            setSelectedRoomId('');
            setSelectedFacilityId('');
            setLocationType('unit');
            router.push('/inventory/issue-history');
        } catch (error) {
            console.error("Failed to submit voucher:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error has occurred";
            toast({ title: "Submission Error", description: `An error occurred: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }, [currentUser, selectedComplexId, isVoucherSubmittable, toast, issueItemsFromStock, voucherLocations, router]);

    // ================ KEYBOARD SHORTCUTS ================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // Ctrl/Cmd + Enter: Submit voucher
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (isVoucherSubmittable && !isSubmitting) {
                    handleSubmitVoucher();
                }
            }
            // Ctrl/Cmd + /: Toggle keyboard shortcuts dialog
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setShowKeyboardShortcuts(true);
            }
            // Escape: Clear search
            if (e.key === 'Escape' && searchQuery) {
                e.preventDefault();
                setSearchQuery('');
            }
            // Ctrl/Cmd + Q: Toggle quick add mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
                e.preventDefault();
                setQuickAddMode(prev => !prev);
                toast({ 
                    title: quickAddMode ? 'Quick Add Disabled' : 'Quick Add Enabled',
                    description: quickAddMode ? 'Click items to add normally' : 'Click items to instantly add quantity 1',
                    duration: 2000
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchQuery, isVoucherSubmittable, isSubmitting, quickAddMode, toast, handleSubmitVoucher]);


    // Consider a location selected when at least the building is chosen for units.
    // We allow targeting building-level, floor-level, or room-level locations.
    const isLocationSelected = useMemo(() => {
        if (locationType === 'unit') {
            // allow building or floor or room to be a valid target
            return !!(selectedComplexId && selectedBuildingId);
        }
        return !!(selectedComplexId && selectedFacilityId);
    }, [locationType, selectedComplexId, selectedBuildingId, selectedFloorId, selectedRoomId, selectedFacilityId]);

    const availableInventory = useMemo(() => {
        if (!selectedComplexId) return [];
        const q = searchQuery.toLowerCase();
        return allItems
            .filter(item => {
                const stock = getStockForResidence(item, selectedComplexId);
                if (stock <= 0) return false;
                // Remaining allocatable = stock - already allocated across voucher locations
                const allocated = voucherLocations.reduce((sum, loc) => {
                    const found = loc.items.find(i => i.id === item.id);
                    return sum + (found ? found.issueQuantity : 0);
                }, 0);
                return stock - allocated > 0;
            })
            .filter(item => 
                item.nameEn.toLowerCase().includes(q) || 
                item.nameAr.toLowerCase().includes(q)
            );
    }, [selectedComplexId, allItems, getStockForResidence, searchQuery, voucherLocations]);


    useEffect(() => {
        setVoucherLocations([]);
        setSelectedBuildingId('');
        setLocationType('unit');
    }, [selectedComplexId]);
    
    useEffect(() => {
        setSelectedFloorId('');
        setSelectedFacilityId('');
    }, [selectedBuildingId]);

    useEffect(() => {
        setSelectedRoomId('');
        // Also reset facility/component when floor changes
        if(locationType === 'facility') {
            setSelectedFacilityId('');
            setSelectedComponentId('');
        }
    }, [selectedFloorId, locationType]);
    useEffect(() => { setSelectedComponentId(''); }, [selectedFacilityId]);
    
    const getAggregateIssuedQty = (itemId: string): number => {
        return voucherLocations.reduce((sum, loc) => {
            const found = loc.items.find(i => i.id === itemId);
            return sum + (found ? found.issueQuantity : 0);
        }, 0);
    };

    // ================ OPTIMIZED ADD ITEM WITH QUICK MODE ================
    const handleAddItemToLocation = useCallback((itemToAdd: InventoryItem, quantity: number = 1) => {
        if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor')) {
            toast({ title: 'Insufficient permissions', description: 'Only Admins or Supervisors can issue materials.', variant: 'destructive' });
            return;
        }
        startTransition(async () => {
            if (!isLocationSelected || !selectedComplex) {
                toast({ title: "No Location Selected", description: "Please select a location or facility first.", variant: "destructive"});
                return;
            }

            const stock = getStockForResidence(itemToAdd, selectedComplexId);
            if (stock < 1) {
                toast({ title: "Out of stock", description: "This item is currently out of stock.", variant: "destructive" });
                return;
            }

            // Client-side guard: prevent aggregated over-issuing across multiple locations
            const currentAgg = getAggregateIssuedQty(itemToAdd.id);
            if (currentAgg >= stock) {
                toast({ title: "Stock limit reached", description: `You already allocated ${currentAgg} of ${stock} available.`, variant: "destructive" });
                return;
            }

            let locationId: string, locationName: string, isFacility: boolean;
            let newLocationDetails: Partial<VoucherLocation> = {};

            if (locationType === 'unit') {
                // Prefer most specific selection: room -> floor -> building
                const selectedRoom = selectedFloor?.rooms.find(r => r.id === selectedRoomId);
                if (selectedRoom) {
                    locationId = selectedRoom.id;
                    locationName = `${selectedComplex.name} -> ${selectedBuilding?.name || ''} -> ${selectedFloor?.name || ''} -> ${selectedRoom.name}`;
                    isFacility = false;
                    newLocationDetails = {
                        buildingId: selectedBuildingId,
                        buildingName: selectedBuilding?.name,
                        floorId: selectedFloorId,
                        floorName: selectedFloor?.name,
                        roomId: selectedRoomId,
                        roomName: selectedRoom.name,
                    };
                } else if (selectedFloor) {
                    // Fall back to floor-level target
                    locationId = selectedFloor.id;
                    locationName = `${selectedComplex.name} -> ${selectedBuilding?.name || ''} -> ${selectedFloor.name}`;
                    isFacility = false;
                    newLocationDetails = {
                        buildingId: selectedBuildingId,
                        buildingName: selectedBuilding?.name,
                        floorId: selectedFloorId,
                        floorName: selectedFloor.name,
                    };
                } else if (selectedBuilding) {
                    // Fall back to building-level target
                    locationId = selectedBuilding.id;
                    locationName = `${selectedComplex.name} -> ${selectedBuilding.name}`;
                    isFacility = false;
                    newLocationDetails = {
                        buildingId: selectedBuildingId,
                        buildingName: selectedBuilding.name,
                    };
                } else {
                    toast({ title: "Location not found", description: "Please select at least a building.", variant: "destructive"});
                    return;
                }
            } else {
                const selectedFacility = availableFacilities.find(f => f.id === selectedFacilityId);
                 if (!selectedFacility) {
                    toast({ title: "Facility not found", description: "An error occurred with the selected facility.", variant: "destructive"});
                    return;
                }
                // If a component is selected, use it as the location target
                const selectedComponent = availableComponents.find((c: FacilityComponent) => c.id === selectedComponentId);
                locationId = selectedComponent ? selectedComponent.id : selectedFacility.id;
                // Build a hierarchical name for facilities as well, include component when chosen
                // e.g., Residence -> Building -> (Floor ->) Facility -> Component
                const parts: string[] = [selectedComplex.name];
                if (selectedBuilding) parts.push(selectedBuilding.name);
                if (selectedFloor) parts.push(selectedFloor.name);
                parts.push(selectedFacility.name);
                if (selectedComponent) parts.push(selectedComponent.name);
                locationName = parts.join(' -> ');
                isFacility = true;
                newLocationDetails = {
                    facilityId: selectedFacilityId,
                    locationId: selectedFacilityId,
                    // component context is implicit in locationId when set
                    // Include building/floor context for facilities when available
                    ...(selectedBuilding ? { buildingId: selectedBuildingId, buildingName: selectedBuilding.name } : {}),
                    ...(selectedFloor ? { floorId: selectedFloorId, floorName: selectedFloor.name } : {}),
                };
            }
            
            // Lifespan check
            if (itemToAdd.lifespanDays && itemToAdd.lifespanDays > 0) {
                const lastIssueDate = await getLastIssueDateForItemAtLocation(itemToAdd.id, locationId);
                if (lastIssueDate) {
                    const daysSinceLastIssue = differenceInDays(new Date(), lastIssueDate.toDate());
                    if (daysSinceLastIssue < itemToAdd.lifespanDays) {
                        toast({
                            title: "Lifespan Warning",
                            description: `"${itemToAdd.nameEn}" was issued to this location ${daysSinceLastIssue} days ago. Its lifespan is ${itemToAdd.lifespanDays} days. Please ensure replacement is justified.`,
                            variant: "default",
                            duration: 8000,
                            className: "bg-yellow-100 border-yellow-400 text-yellow-800"
                        });
                    }
                }
            }
            
            setVoucherLocations(prevLocations => {
                const existingLocationIndex = prevLocations.findIndex(l => l.locationId === locationId);
                
                if (existingLocationIndex > -1) {
                    const newLocations = [...prevLocations];
                    const targetLocation = { ...newLocations[existingLocationIndex] };
                    const existingItemIndex = targetLocation.items.findIndex(i => i.id === itemToAdd.id);

                    if (existingItemIndex > -1) {
                        const currentQty = targetLocation.items[existingItemIndex].issueQuantity;
                        // Compute residence-wide remaining stock allowance for this item
                        const allocatedElsewhere = getAggregateIssuedQty(itemToAdd.id) - currentQty;
                        const remaining = stock - allocatedElsewhere;
                        if(currentQty < remaining) {
                            // Increment quantity without reordering when item already exists
                            const updatedItems = [...targetLocation.items];
                            updatedItems[existingItemIndex] = {
                                ...updatedItems[existingItemIndex],
                                issueQuantity: Math.min(currentQty + 1, remaining),
                            };
                            targetLocation.items = updatedItems;
                        } else {
                            toast({ title: "Stock limit reached", description: `Cannot allocate more than ${stock} available across locations.`, variant: "destructive"});
                        }
                        // keep locations order as is when just incrementing existing item
                        newLocations[existingLocationIndex] = targetLocation;
                        return newLocations;
                    } else {
                        // New item: place it at the top of the item's list
                        const allocatedElsewhere = getAggregateIssuedQty(itemToAdd.id);
                        const canAdd = Math.max(0, stock - allocatedElsewhere);
                        if (canAdd <= 0) {
                            toast({ title: "Stock limit reached", description: `Cannot allocate more than ${stock} available across locations.`, variant: "destructive"});
                            return prevLocations;
                        }
                        targetLocation.items = [ { ...itemToAdd, issueQuantity: Math.min(quantity, canAdd) }, ...targetLocation.items ];
                        // Move this location to the top since a new item was added here
                        newLocations.splice(existingLocationIndex, 1);
                        return [ targetLocation, ...newLocations ];
                    }
                } else {
                    const newLocation: VoucherLocation = {
                        ...newLocationDetails,
                        locationId,
                        locationName,
                        isFacility,
                        items: [{ ...itemToAdd, issueQuantity: Math.min(quantity, stock) }]
                    };
                    // New location: place at the top
                    return [ newLocation, ...prevLocations ];
                }
            });
            
            // In quick mode, show minimal toast
            if (quickAddMode) {
                toast({ 
                    title: `Added ${itemToAdd.nameEn}`, 
                    description: `Qty: ${quantity}`,
                    duration: 1500 
                });
            }
        });
    }, [currentUser, isLocationSelected, selectedComplex, selectedComplexId, getStockForResidence, getAggregateIssuedQty, locationType, selectedBuildingId, selectedFloorId, selectedRoomId, selectedBuilding, selectedFloor, selectedFacilityId, availableFacilities, availableComponents, selectedComponentId, getLastIssueDateForItemAtLocation, toast, quickAddMode, voucherLocations]);

    // Apply planned distribution from an order object
    const applyPlanFromOrder = useCallback((order: Order) => {
        if (!order || !order.plannedDistribution || !Array.isArray(order.plannedDistribution) || order.plannedDistribution.length === 0) {
            toast({ title: 'No distribution', description: 'This order has no saved distribution plan.' });
            return;
        }
        if (!selectedComplexId || selectedComplexId !== order.residenceId) {
            setSelectedComplexId(order.residenceId);
        }
        const allocatedByItem = new Map<string, number>();
        const transformed: VoucherLocation[] = order.plannedDistribution.map(loc => {
            // Safety check for location object
            if (!loc || typeof loc !== 'object') return null;
            
            const items: IssuedItem[] = [];
            const locationItems = Array.isArray(loc.items) ? loc.items : [];
            for (const pi of locationItems) {
                if (!pi || typeof pi !== 'object') continue;
                
                const inv = allItems.find(i => i.id === pi.id);
                if (!inv) continue;
                
                // Match order line by id and detail in notes; use decisions if present
                const orderItems = Array.isArray(order.items) ? order.items : [];
                const line = orderItems.find(li => li && li.id === pi.id && (li.notes || '').includes(pi.detail || ''));
                if (line?.justificationDecision === 'rejected') continue;
                
                const stock = getStockForResidence(inv, order.residenceId);
                const already = allocatedByItem.get(inv.id) ?? 0;
                const remaining = Math.max(0, stock - already);
                const plannedQty = typeof line?.approvedQuantity === 'number' ? line!.approvedQuantity : (pi.quantity || 0);
                const qty = Math.min(plannedQty, remaining);
                if (qty > 0) {
                    items.push({ ...inv, issueQuantity: qty });
                    allocatedByItem.set(inv.id, already + qty);
                }
            }
            return { 
                locationId: loc.locationId || '', 
                locationName: loc.locationName || 'Unknown Location', 
                isFacility: !!loc.isFacility, 
                items 
            } as VoucherLocation;
        }).filter((l): l is VoucherLocation => l !== null && l.items.length > 0);

        if (transformed.length === 0) {
            toast({ title: 'Nothing to load', description: 'No items available in stock for this plan.', variant: 'destructive' });
            return;
        }
        setVoucherLocations(transformed);
        toast({ title: 'Distribution loaded', description: `Loaded plan from ${order.id}.` });
    }, [allItems, getStockForResidence, selectedComplexId, toast]);

    const handleSelectMr = useCallback((id: string) => {
        setSelectedMrId(id);
        if (!Array.isArray(orders)) {
            toast({ title: 'No orders', description: 'Orders list is not available.', variant: 'destructive' });
            return;
        }
        const order = orders.find(o => o && o.id === id);
        if (!order) {
            toast({ title: 'Not found', description: `No order found for ${id}.`, variant: 'destructive' });
            return;
        }
        applyPlanFromOrder(order);
    }, [orders, toast, applyPlanFromOrder]);

    // ================ BULK ADD ITEMS ================
    const handleBulkAddItems = useCallback((selectedItems: InventoryItem[]) => {
        if (selectedItems.length === 0) return;
        
        selectedItems.forEach(item => {
            handleAddItemToLocation(item, bulkQuantity);
        });
        
        toast({
            title: 'Bulk Add Complete',
            description: `Added ${selectedItems.length} items with quantity ${bulkQuantity}`,
        });
        setShowBulkDialog(false);
    }, [bulkQuantity, handleAddItemToLocation, toast]);


    const handleQuantityChange = useCallback((locationId: string, itemId: string, newQuantity: number) => {
         const itemInfo = allItems.find(i => i.id === itemId);
        if (!itemInfo || !selectedComplexId) return;

        const stock = getStockForResidence(itemInfo, selectedComplexId);

        let quantity = newQuantity;
        if (quantity < 1) {
            quantity = 1;
        } else if (quantity > stock) {
            quantity = stock;
            toast({ title: "Stock limit reached", description: `Cannot issue more than the available ${stock} units.`, variant: "destructive"});
        }

        // Additional client-side guard: cap by residence-wide remaining allowance considering other locations
        const allocatedElsewhere = voucherLocations.reduce((sum, loc) => {
            if (loc.locationId === locationId) return sum;
            const found = loc.items.find(i => i.id === itemId);
            return sum + (found ? found.issueQuantity : 0);
        }, 0);
        const remaining = Math.max(0, stock - allocatedElsewhere);
        if (quantity > remaining) {
            quantity = remaining;
            toast({ title: "Stock limit reached", description: `Only ${remaining} left available for this item across locations.`, variant: "destructive"});
        }
        
        setVoucherLocations(prev => prev.map(loc => 
            loc.locationId === locationId 
            ? { ...loc, items: loc.items.map(item => item.id === itemId ? {...item, issueQuantity: quantity} : item) }
            : loc
        ));
    }, [allItems, selectedComplexId, getStockForResidence, voucherLocations, toast]);

    const handleRemoveItem = useCallback((locationId: string, itemId: string) => {
        setVoucherLocations(prev => {
            const newLocations = prev.map(loc => {
                if (loc.locationId === locationId) {
                    return { ...loc, items: loc.items.filter(item => item.id !== itemId) };
                }
                return loc;
            });
            return newLocations.filter(loc => loc.items.length > 0);
        });
    }, []);
    
    // Orders with saved distribution for the selected residence
    const mrWithPlanForResidence = useMemo(() => {
        if (!selectedComplexId || !Array.isArray(orders)) return [] as Order[];
        return orders.filter(o => o && o.residenceId === selectedComplexId && (o.plannedDistribution && Array.isArray(o.plannedDistribution) && o.plannedDistribution.length > 0));
    }, [orders, selectedComplexId]);

    if (residencesLoading || inventoryLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <TooltipProvider>
        <div className="space-y-4">
            {/* Header with Enhanced Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {dict.mivTitle}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKeyboardShortcuts(true)}>
                                    <Keyboard className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Keyboard Shortcuts (Ctrl+/)</TooltipContent>
                        </Tooltip>
                    </h1>
                    <p className="text-muted-foreground">{dict.mivDescription}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant={quickAddMode ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => {
                                    setQuickAddMode(!quickAddMode);
                                    toast({ 
                                        title: !quickAddMode ? 'Quick Add Enabled' : 'Quick Add Disabled',
                                        description: !quickAddMode ? 'Click items to instantly add qty 1' : 'Normal mode restored',
                                        duration: 2000
                                    });
                                }}
                            >
                                <Zap className={`h-4 w-4 mr-2 ${quickAddMode ? 'animate-pulse' : ''}`} />
                                Quick Add
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quick Add Mode (Ctrl+Q)</TooltipContent>
                    </Tooltip>
                    <Button variant="outline" size="sm" onClick={() => router.push('/inventory/issue-history')}>
                        <History className="mr-2 h-4 w-4"/> {dict.viewHistoryLabel}
                    </Button>
                    <Button 
                        onClick={handleSubmitVoucher} 
                        disabled={!isVoucherSubmittable || isSubmitting || (!!currentUser && !(currentUser.role === 'Admin' || currentUser.role === 'Supervisor'))}
                        size="sm"
                        className="min-w-[120px]"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {dict.submitVoucher}
                    </Button>
                </div>
            </div>

            {/* Enhanced Header Section */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                <div className="flex items-center gap-2 flex-1">
                    <Label className="whitespace-nowrap font-semibold text-sm">Issue From:</Label>
                    <Select value={selectedComplexId} onValueChange={setSelectedComplexId} disabled={isSubmitting}>
                        <SelectTrigger className="w-[220px] font-medium">
                            <SelectValue placeholder="Select residence..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredResidences.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 flex-1">
                    <Label className="whitespace-nowrap font-semibold text-sm">Load MR plan:</Label>
                    <Select value={selectedMrId} onValueChange={handleSelectMr} disabled={!selectedComplexId || mrWithPlanForResidence.length === 0}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder={selectedComplexId ? (mrWithPlanForResidence.length ? 'Select MR…' : 'No MRs with plan') : 'Select residence first'} />
                        </SelectTrigger>
                        <SelectContent>
                            {mrWithPlanForResidence.map(o => (
                                <SelectItem key={o.id} value={o.id}>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        {o.id} · {o.items.length} items
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Statistics Bar */}
            {voucherLocations.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Total Locations</div>
                        <div className="text-2xl font-bold">{voucherLocations.length}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Total Items</div>
                        <div className="text-2xl font-bold">{voucherLocations.reduce((sum, loc) => sum + loc.items.length, 0)}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Total Units</div>
                        <div className="text-2xl font-bold">{voucherLocations.reduce((sum, loc) => sum + loc.items.reduce((s, i) => s + i.issueQuantity, 0), 0)}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Quick Actions</div>
                        <div className="flex gap-1 mt-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={() => setVoucherLocations([])}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Clear All</TooltipContent>
                            </Tooltip>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start" style={{height: 'calc(100vh - 18rem)'}}>
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="h-5 w-5 text-primary"/> Select Location & Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 overflow-hidden flex flex-col p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    Location Type
                                    {isLocationSelected && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                                </h3>
                                <div className="flex gap-2">
                                    <Button 
                                        variant={locationType === 'unit' ? 'default' : 'outline'} 
                                        size="sm"
                                        onClick={() => setLocationType('unit')}
                                        disabled={!selectedComplexId}
                                        className="flex items-center gap-2 flex-1"
                                    >
                                        <Building className="h-4 w-4" /> Unit
                                    </Button>
                                    <Button 
                                        variant={locationType === 'facility' ? 'default' : 'outline'} 
                                        size="sm"
                                        onClick={() => setLocationType('facility')}
                                        disabled={!selectedComplexId}
                                        className="flex items-center gap-2 flex-1"
                                    >
                                        <ConciergeBell className="h-4 w-4" /> Facility
                                    </Button>
                                </div>
                                
                                <div className="space-y-3 pt-1">
                                    {/* Buildings */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Building</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedComplex?.buildings.map(b => (
                                                <Button
                                                    key={b.id}
                                                    variant={selectedBuildingId === b.id ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBuildingId(b.id);
                                                        setSelectedFloorId('');
                                                        setSelectedRoomId('');
                                                        setSelectedFacilityId('');
                                                    }}
                                                    disabled={!selectedComplexId}
                                                    className="justify-start h-9"
                                                >
                                                    <Building className="h-3 w-3 mr-2" />
                                                    <span className="truncate">{b.name}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Floors */}
                                    {selectedBuildingId && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Floor</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedBuilding?.floors.map(f => (
                                                    <Button
                                                        key={f.id}
                                                        variant={selectedFloorId === f.id ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedFloorId(f.id);
                                                            setSelectedRoomId('');
                                                            setSelectedFacilityId('');
                                                        }}
                                                        className="justify-start h-9"
                                                    >
                                                        <span className="truncate">{f.name}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rooms or Facilities */}
                                    {selectedFloorId && locationType === 'unit' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Room</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedFloor?.rooms.map(r => (
                                                    <Button
                                                        key={r.id}
                                                        variant={selectedRoomId === r.id ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setSelectedRoomId(r.id)}
                                                        className="justify-start h-9"
                                                    >
                                                        <span className="truncate">{r.name}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {locationType === 'facility' && selectedComplexId && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Facility</h4>
                                            {/* Responsive multi-column grid to fit more facilities */}
                                            <div className="grid gap-2 grid-cols-1">
                                                {availableFacilities.map(f => (
                                                    <Button
                                                        key={f.id}
                                                        variant={selectedFacilityId === f.id ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setSelectedFacilityId(f.id)}
                                                        className="justify-start overflow-hidden h-9"
                                                    >
                                                        <ConciergeBell className="h-3 w-3 mr-2 flex-shrink-0" />
                                                        <span dir="ltr" className="truncate">{f.name}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                            {/* Component selection (optional) */}
                                            {selectedFacilityId && availableComponents.length > 0 && (
                                                <div className="mt-2 p-3 border rounded-md bg-muted/20">
                                                    <Label className="text-xs font-medium mb-2 block">Select Component (Optional)</Label>
                                                    <div className="text-xs text-muted-foreground mb-2">If no component is selected, issuing will target the facility itself.</div>
                                                    {/* Responsive grid for components as well */}
                                                    <div className="grid gap-2 max-h-56 overflow-y-auto grid-cols-1">
                                                        {availableComponents.map((c: FacilityComponent) => (
                                                            <Button
                                                                key={c.id}
                                                                variant={selectedComponentId === c.id ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => setSelectedComponentId(c.id)}
                                                                className="justify-start overflow-hidden h-9"
                                                            >
                                                                <span className="truncate text-xs" title={c.name}>{c.name}</span>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3 flex-1 flex flex-col">
                                <h3 className="font-semibold text-sm flex items-center justify-between">
                                    <span>Available Inventory</span>
                                    {availableInventory.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">{availableInventory.length} items</Badge>
                                    )}
                                </h3>
                                <div className="relative flex-shrink-0">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        ref={searchInputRef}
                                        type="search"
                                        placeholder="Search items... (Ctrl+K)"
                                        className="pl-8 w-full h-9"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        disabled={!selectedComplexId}
                                    />
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1 h-7 w-7"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                                <ScrollArea className="flex-1 border rounded-md min-h-0">
                                    {selectedComplexId ? (
                                        <div className="p-2 space-y-1">
                                            {availableInventory.length > 0 ? availableInventory.map(item => {
                                                const stock = getStockForResidence(item, selectedComplexId);
                                                const allocated = voucherLocations.reduce((sum, loc) => {
                                                    const f = loc.items.find(i => i.id === item.id);
                                                    return sum + (f ? f.issueQuantity : 0);
                                                }, 0);
                                                const remaining = Math.max(0, stock - allocated);
                                                const isLowStock = remaining < stock * 0.2;
                                                
                                                return (
                                                    <div 
                                                        key={item.id} 
                                                        className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-primary/5 border transition-all group cursor-pointer"
                                                        onClick={() => quickAddMode && isLocationSelected ? handleAddItemToLocation(item, 1) : null}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{item.nameAr} / {item.nameEn}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge variant="outline" className="text-xs">{item.category}</Badge>
                                                                <span className={`text-xs font-medium ${isLowStock ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                                                    {remaining}/{stock} {item.unit}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            size="icon" 
                                                            variant="outline" 
                                                            className="h-8 w-8 flex-shrink-0 ml-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddItemToLocation(item, 1);
                                                            }}
                                                            disabled={!isLocationSelected || isPending || remaining <= 0}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            }) : (
                                                <div className="text-center text-muted-foreground p-8 text-sm">
                                                    <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    No inventory found.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8">
                                            <Building className="h-12 w-12 mb-3 opacity-30" />
                                            <p>Select a residence to see items</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PackagePlus className="h-5 w-5 text-primary"/> Voucher Items
                        </CardTitle>
                        <CardDescription>Review all items and locations before submitting (Ctrl+Enter)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
                        <ScrollArea className="flex-1 min-h-0">
                        {voucherLocations.length > 0 ? (
                            <Accordion type="multiple" defaultValue={voucherLocations.map(l => l.locationId)} className="space-y-2">
                                {voucherLocations.map(location => {
                                    const totalQty = location.items.reduce((sum, i) => sum + i.issueQuantity, 0);
                                    return (
                                        <AccordionItem key={location.locationId} value={location.locationId} className="border rounded-lg px-4 bg-card">
                                            <AccordionTrigger className="font-semibold text-sm hover:no-underline py-3">
                                                <div className="flex items-center justify-between w-full pr-2">
                                                    <span className="truncate"><LocationBreadcrumb path={location.locationName} /></span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">{location.items.length} items</Badge>
                                                        <Badge variant="outline">{totalQty} units</Badge>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-2">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="text-xs">Item</TableHead>
                                                            <TableHead className="w-[160px] text-center text-xs">Quantity</TableHead>
                                                            <TableHead className="w-[40px] text-right"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {location.items.map(item => (
                                                            <TableRow key={item.id} className="group">
                                                                <TableCell className="py-2">
                                                                    <p className="font-medium text-sm">{item.nameAr} / {item.nameEn}</p>
                                                                    <p className="text-xs text-muted-foreground">{item.category}</p>
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="icon" 
                                                                            className="h-7 w-7" 
                                                                            onClick={() => handleQuantityChange(location.locationId, item.id, item.issueQuantity - 1)}
                                                                        >
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                        <Input 
                                                                            type="number" 
                                                                            value={item.issueQuantity} 
                                                                            onChange={(e) => handleQuantityChange(location.locationId, item.id, parseInt(e.target.value, 10) || 1)} 
                                                                            className="w-14 h-7 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                                        />
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="icon" 
                                                                            className="h-7 w-7" 
                                                                            onClick={() => handleQuantityChange(location.locationId, item.id, item.issueQuantity + 1)}
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right py-2">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={() => handleRemoveItem(location.locationId, item.id)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3 text-destructive"/>
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        ) : (
                            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                                <PackagePlus className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-sm font-medium">No items added to the voucher yet</p>
                                <p className="text-xs mt-1">Select a location and add items to get started</p>
                            </div>
                        )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Keyboard Shortcuts Dialog */}
            <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Keyboard className="h-5 w-5" />
                            Keyboard Shortcuts
                        </DialogTitle>
                        <DialogDescription>Speed up your workflow with these shortcuts</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Navigation</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Focus Search</span>
                                    <Badge variant="secondary" className="font-mono">Ctrl+K</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Clear Search</span>
                                    <Badge variant="secondary" className="font-mono">Esc</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Show Shortcuts</span>
                                    <Badge variant="secondary" className="font-mono">Ctrl+/</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Actions</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Submit Voucher</span>
                                    <Badge variant="secondary" className="font-mono">Ctrl+Enter</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Toggle Quick Add</span>
                                    <Badge variant="secondary" className="font-mono">Ctrl+Q</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                            <strong>Quick Add Mode:</strong> When enabled, clicking on an item instantly adds it with quantity 1 to the selected location.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        </TooltipProvider>
    );
}
