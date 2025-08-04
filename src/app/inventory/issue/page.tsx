
'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useInventory, type InventoryItem, type LocationWithItems as IVoucherLocation } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Trash2, MapPin, PackagePlus, Loader2, History, ConciergeBell, Building, Archive, ChevronDown, ChevronUp, FileText, CheckCircle, XCircle, Clock, Truck, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { differenceInDays } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';


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
    const [isPending, startTransition] = useTransition();
    
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [locationType, setLocationType] = useState<'unit' | 'facility'>('unit');
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedFacilityId, setSelectedFacilityId] = useState('');

    const [voucherLocations, setVoucherLocations] = useState<VoucherLocation[]>([]);
    
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


    const isLocationSelected = useMemo(() => {
        if (locationType === 'unit') {
            return !!(selectedComplexId && selectedBuildingId && selectedFloorId && selectedRoomId);
        }
        return !!(selectedComplexId && selectedFacilityId);
    }, [locationType, selectedComplexId, selectedBuildingId, selectedFloorId, selectedRoomId, selectedFacilityId]);

    const availableInventory = useMemo(() => {
        if (!selectedComplexId) return [];
        return allItems
            .filter(item => getStockForResidence(item, selectedComplexId) > 0)
            .filter(item => 
                item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.nameAr.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [selectedComplexId, allItems, getStockForResidence, searchQuery]);


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
        // Also reset facility ID when floor changes
        if(locationType === 'facility') {
            setSelectedFacilityId('');
        }
    }, [selectedFloorId, locationType]);
    
    const handleAddItemToLocation = (itemToAdd: InventoryItem) => {
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

            let locationId: string, locationName: string, isFacility: boolean;
            let newLocationDetails: Partial<VoucherLocation> = {};

            if (locationType === 'unit') {
                const selectedRoom = selectedFloor?.rooms.find(r => r.id === selectedRoomId);
                if (!selectedBuilding || !selectedFloor || !selectedRoom) {
                    toast({ title: "Location not found", description: "An error occurred with the selected room.", variant: "destructive"});
                    return;
                }
                locationId = selectedRoom.id;
                locationName = `${selectedComplex.name} -> ${selectedBuilding.name} -> ${selectedFloor.name} -> ${selectedRoom.name}`;
                isFacility = false;
                newLocationDetails = {
                    buildingId: selectedBuildingId,
                    buildingName: selectedBuilding.name,
                    floorId: selectedFloorId,
                    floorName: selectedFloor.name,
                    roomId: selectedRoomId,
                    roomName: selectedRoom.name,
                };
            } else {
                const selectedFacility = availableFacilities.find(f => f.id === selectedFacilityId);
                 if (!selectedFacility) {
                    toast({ title: "Facility not found", description: "An error occurred with the selected facility.", variant: "destructive"});
                    return;
                }
                locationId = selectedFacility.id;
                locationName = `${selectedComplex.name} -> ${selectedFacility.name}`;
                isFacility = true;
                newLocationDetails = { facilityId: selectedFacilityId, locationId: selectedFacilityId };
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
                    const targetLocation = newLocations[existingLocationIndex];
                    const existingItemIndex = targetLocation.items.findIndex(i => i.id === itemToAdd.id);

                    if (existingItemIndex > -1) {
                        const currentQty = targetLocation.items[existingItemIndex].issueQuantity;
                        if(currentQty < stock) {
                            targetLocation.items[existingItemIndex].issueQuantity += 1;
                        } else {
                             toast({ title: "Stock limit reached", description: `Cannot issue more than the available ${stock} units.`, variant: "destructive"});
                        }
                    } else {
                        targetLocation.items.push({ ...itemToAdd, issueQuantity: 1 });
                    }
                    return newLocations;
                } else {
                    const newLocation: VoucherLocation = {
                        ...newLocationDetails,
                        locationId,
                        locationName,
                        isFacility,
                        items: [{ ...itemToAdd, issueQuantity: 1 }]
                    };
                    return [...prevLocations, newLocation];
                }
            });
        });
    };


    const handleQuantityChange = (locationId: string, itemId: string, newQuantity: number) => {
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
        
        setVoucherLocations(prev => prev.map(loc => 
            loc.locationId === locationId 
            ? { ...loc, items: loc.items.map(item => item.id === itemId ? {...item, issueQuantity: quantity} : item) }
            : loc
        ));
    };

    const handleRemoveItem = (locationId: string, itemId: string) => {
        setVoucherLocations(prev => {
            const newLocations = prev.map(loc => {
                if (loc.locationId === locationId) {
                    return { ...loc, items: loc.items.filter(item => item.id !== itemId) };
                }
                return loc;
            });
            return newLocations.filter(loc => loc.items.length > 0);
        });
    };
    
    const handleSubmitVoucher = async () => {
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
    };

    const isVoucherSubmittable = useMemo(() => {
        return voucherLocations.length > 0 && voucherLocations.every(loc => loc.items.length > 0);
    }, [voucherLocations]);

    if (residencesLoading || inventoryLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Material Issue Voucher (MIV)</h1>
                    <p className="text-muted-foreground">Issue materials from a residence's storeroom to specific locations.</p>
                </div>
                 <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/inventory/issue-history')}>
                        <History className="mr-2 h-4 w-4"/> View History
                    </Button>
                    <Button onClick={handleSubmitVoucher} disabled={!isVoucherSubmittable || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Voucher
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/> Select Location & Items</CardTitle>
                                <CardDescription>First, select the location. Then, add items from the available inventory below.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="whitespace-nowrap">Issue From:</Label>
                                <Select value={selectedComplexId} onValueChange={setSelectedComplexId} disabled={isSubmitting}>
                                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select a residence..." /></SelectTrigger>
                                    <SelectContent>
                                        {filteredResidences.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">Location Type</h3>
                                <RadioGroup value={locationType} onValueChange={(value) => setLocationType(value as 'unit' | 'facility')} className="flex gap-4" disabled={!selectedComplexId}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="unit" id="r_unit" />
                                        <Label htmlFor="r_unit" className="flex items-center gap-2"><Building className="h-4 w-4" /> Unit</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="facility" id="r_facility" />
                                        <Label htmlFor="r_facility" className="flex items-center gap-2"><ConciergeBell className="h-4 w-4" /> Facility</Label>
                                    </div>
                                </RadioGroup>
                                
                                <div className="space-y-2 pt-2">
                                    <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId} disabled={!selectedComplexId}>
                                        <SelectTrigger><SelectValue placeholder="Select Building" /></SelectTrigger>
                                        <SelectContent>
                                            {selectedComplex?.buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={!selectedBuildingId}>
                                        <SelectTrigger><SelectValue placeholder="Select Floor" /></SelectTrigger>
                                        <SelectContent>
                                            {selectedBuilding?.floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {locationType === 'unit' ? (
                                        <Select value={selectedRoomId} onValueChange={setSelectedRoomId} disabled={!selectedFloorId}>
                                            <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                                            <SelectContent>
                                                {selectedFloor?.rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId} disabled={!selectedComplexId}>
                                            <SelectTrigger><SelectValue placeholder="Select Facility" /></SelectTrigger>
                                            <SelectContent>
                                                {availableFacilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
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
                                        disabled={!selectedComplexId}
                                    />
                                </div>
                                <ScrollArea className="h-[250px] border rounded-md">
                                    {selectedComplexId ? (
                                        <div className="p-2 space-y-2">
                                            {availableInventory.length > 0 ? availableInventory.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                                                    <div>
                                                        <p className="font-medium text-sm">{item.nameAr} / {item.nameEn}</p>
                                                        <p className="text-xs text-muted-foreground">{item.category} - Stock: {getStockForResidence(item, selectedComplexId)} {item.unit}</p>
                                                    </div>
                                                    <Button size="icon" variant="outline" onClick={() => handleAddItemToLocation(item)} disabled={!isLocationSelected || isPending}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )) : (
                                                <div className="text-center text-muted-foreground p-8 text-sm">No inventory found.</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                            Select a residence to see items.
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary"/> Voucher Items</CardTitle>
                        <CardDescription>Review all items and locations before submitting.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[430px]">
                        {voucherLocations.length > 0 ? (
                            <Accordion type="multiple" defaultValue={voucherLocations.map(l => l.locationId)}>
                                {voucherLocations.map(location => (
                                    <AccordionItem key={location.locationId} value={location.locationId}>
                                        <AccordionTrigger className="font-semibold text-base">
                                            {location.locationName}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Item</TableHead>
                                                        <TableHead className="w-[150px] text-center">Quantity</TableHead>
                                                        <TableHead className="w-[50px] text-right"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {location.items.map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">
                                                                <p>{item.nameAr} / {item.nameEn}</p>
                                                                <p className="text-xs text-muted-foreground">{item.category}</p>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(location.locationId, item.id, item.issueQuantity - 1)}>
                                                                        <Minus className="h-4 w-4" />
                                                                    </Button>
                                                                    <Input type="number" value={item.issueQuantity} onChange={(e) => handleQuantityChange(location.locationId, item.id, parseInt(e.target.value, 10))} className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(location.locationId, item.id, item.issueQuantity + 1)}>
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(location.locationId, item.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 h-[400px] flex items-center justify-center">
                                No items added to the voucher yet.
                            </div>
                        )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
