
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useInventory, type InventoryItem, type LocationWithItems as IVoucherLocation } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Trash2, MapPin, PackagePlus, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';

interface IssuedItem extends InventoryItem {
    issueQuantity: number;
}

// Renaming to avoid conflict if we ever import the context type directly
type VoucherLocation = IVoucherLocation<IssuedItem>;


export default function IssueMaterialPage() {
    const { currentUser } = useUsers();
    const { residences, loading: residencesLoading } = useResidences();
    const { items: allItems, loading: inventoryLoading, getStockForResidence, issueItemsFromStock } = useInventory();
    const { toast } = useToast();
    const router = useRouter();
    
    // Form state
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Location selection state
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');

    // Voucher state
    const [voucherLocations, setVoucherLocations] = useState<VoucherLocation[]>([]);
    
    const userResidences = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'Admin') return residences;
        return residences.filter(r => currentUser.assignedResidences.includes(r.id));
    }, [currentUser, residences]);

    const selectedComplex = useMemo(() => residences.find(c => c.id === selectedComplexId), [selectedComplexId, residences]);
    const selectedBuilding = useMemo(() => selectedComplex?.buildings.find(b => b.id === selectedBuildingId), [selectedBuildingId, selectedComplex]);
    const selectedFloor = useMemo(() => selectedBuilding?.floors.find(f => f.id === selectedFloorId), [selectedFloorId, selectedBuilding]);
    
    const isLocationSelected = useMemo(() => selectedBuildingId && selectedFloorId && selectedRoomId, [selectedBuildingId, selectedFloorId, selectedRoomId]);

    const availableInventory = useMemo(() => {
        if (!selectedComplexId) return [];
        return allItems.filter(item => getStockForResidence(item, selectedComplexId) > 0);
    }, [selectedComplexId, allItems, getStockForResidence]);


    // Reset selections when a parent selection changes
    useEffect(() => {
        setVoucherLocations([]);
        setSelectedBuildingId('');
    }, [selectedComplexId]);

    useEffect(() => {
        setSelectedFloorId('');
    }, [selectedBuildingId]);

    useEffect(() => {
        setSelectedRoomId('');
    }, [selectedFloorId]);
    
    const handleAddItemToLocation = (itemToAdd: InventoryItem) => {
        if (!isLocationSelected || !selectedComplex || !selectedBuilding || !selectedFloor) {
            toast({ title: "No Location Selected", description: "Please select a building, floor, and room first.", variant: "destructive"});
            return;
        }
        
        const selectedRoom = selectedFloor.rooms.find(r => r.id === selectedRoomId);
        if(!selectedRoom) {
            toast({ title: "Room not found", description: "An error occurred with the selected room.", variant: "destructive"});
            return;
        }

        const stock = getStockForResidence(itemToAdd, selectedComplexId);
        if (stock < 1) {
            toast({ title: "Out of stock", description: "This item is currently out of stock.", variant: "destructive" });
            return;
        }

        const locationId = `${selectedBuildingId}-${selectedFloorId}-${selectedRoomId}`;
        
        setVoucherLocations(prevLocations => {
            const existingLocationIndex = prevLocations.findIndex(l => l.locationId === locationId);
            
            // Location already exists in voucher
            if (existingLocationIndex > -1) {
                const newLocations = [...prevLocations];
                const targetLocation = newLocations[existingLocationIndex];
                const existingItemIndex = targetLocation.items.findIndex(i => i.id === itemToAdd.id);

                if (existingItemIndex > -1) {
                    // Item already in location, increment quantity
                    const currentQty = targetLocation.items[existingItemIndex].issueQuantity;
                    if(currentQty < stock) {
                        targetLocation.items[existingItemIndex].issueQuantity += 1;
                    } else {
                         toast({ title: "Stock limit reached", description: `Cannot issue more than the available ${stock} units.`, variant: "destructive"});
                    }
                } else {
                    // Add new item to location
                    targetLocation.items.push({ ...itemToAdd, issueQuantity: 1 });
                }
                return newLocations;
            } else {
                 // Add new location with the new item
                const newLocation: VoucherLocation = {
                    locationId,
                    buildingId: selectedBuildingId,
                    buildingName: selectedBuilding.name,
                    floorId: selectedFloorId,
                    floorName: selectedFloor.name,
                    roomId: selectedRoomId,
                    roomName: selectedRoom.name,
                    items: [{ ...itemToAdd, issueQuantity: 1 }]
                };
                return [...prevLocations, newLocation];
            }
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
            // Remove location if it has no items left
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
            const itemsToIssue = voucherLocations.map(loc => ({
                ...loc,
                items: loc.items.map(item => ({
                    id: item.id,
                    nameEn: item.nameEn,
                    nameAr: item.nameAr,
                    issueQuantity: item.issueQuantity,
                }))
            }));
            await issueItemsFromStock(selectedComplexId, itemsToIssue);
            toast({ title: "Success", description: "Material Issue Voucher has been processed and stock updated." });
            setVoucherLocations([]);
            setSelectedBuildingId('');
            // Maybe route to a history page in the future
            // router.push('/inventory'); 
        } catch (error) {
            console.error("Failed to submit voucher:", error);
            toast({ title: "Submission Error", description: `An error occurred: ${error}`, variant: "destructive" });
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
                     <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">Issue From Residence:</Label>
                        <Select value={selectedComplexId} onValueChange={setSelectedComplexId} disabled={isSubmitting}>
                            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a residence..." /></SelectTrigger>
                            <SelectContent>
                                {userResidences.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                    <Button onClick={handleSubmitVoucher} disabled={!isVoucherSubmittable || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Voucher
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/> Add Items to a Location</CardTitle>
                    <CardDescription>First, select the location. Then, add items from the available inventory below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Location Selection */}
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="font-semibold">Select Location</h3>
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
                            <Select value={selectedRoomId} onValueChange={setSelectedRoomId} disabled={!selectedFloorId}>
                                <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                                <SelectContent>
                                    {selectedFloor?.rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Available Inventory */}
                        <div className="lg:col-span-3">
                            <h3 className="font-semibold mb-4">Available Inventory</h3>
                             <ScrollArea className="h-[250px] border rounded-md">
                                {isLocationSelected ? (
                                    <div className="p-2 space-y-2">
                                        {availableInventory.length > 0 ? availableInventory.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                                                <div>
                                                    <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                                    <p className="text-sm text-muted-foreground">{item.category} - Stock: {getStockForResidence(item, selectedComplexId)} {item.unit}</p>
                                                </div>
                                                <Button size="icon" variant="outline" onClick={() => handleAddItemToLocation(item)}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="text-center text-muted-foreground p-8">No inventory with stock found.</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Select a full location to see available items.
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
                    <CardDescription>Review all items and locations before submitting the voucher.</CardDescription>
                </CardHeader>
                <CardContent>
                    {voucherLocations.length > 0 ? (
                         <Accordion type="multiple" defaultValue={voucherLocations.map(l => l.locationId)}>
                            {voucherLocations.map(location => (
                                <AccordionItem key={location.locationId} value={location.locationId}>
                                    <AccordionTrigger className="font-semibold text-lg">
                                        {location.buildingName} &rarr; {location.floorName} &rarr; {location.roomName}
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
                        <div className="text-center text-muted-foreground p-8">
                            No items added to the voucher yet.
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
