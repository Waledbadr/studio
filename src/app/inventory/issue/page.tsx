
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useResidences, type Complex, type Building, type Floor, type Room } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface IssuedItem extends InventoryItem {
    voucherItemId: string; // Unique ID for the item within this voucher
    issueQuantity: number;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
}

export default function IssueMaterialPage() {
    const { currentUser } = useUsers();
    const { residences, loading: residencesLoading } = useResidences();
    const { items: allItems, loading: inventoryLoading, getStockForResidence } = useInventory();
    const { toast } = useToast();
    
    // Form state
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    
    // Items state
    const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
    
    const userResidences = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'Admin') return residences;
        return residences.filter(r => currentUser.assignedResidences.includes(r.id));
    }, [currentUser, residences]);

    const selectedComplex = useMemo(() => {
        return residences.find(c => c.id === selectedComplexId);
    }, [selectedComplexId, residences]);

    const availableInventory = useMemo(() => {
        if (!selectedComplexId) return [];
        return allItems.filter(item => getStockForResidence(item, selectedComplexId) > 0);
    }, [selectedComplexId, allItems, getStockForResidence]);


    // Reset selections when a parent selection changes
    useEffect(() => {
        setIssuedItems([]);
    }, [selectedComplexId]);


    const handleAddItem = (item: InventoryItem) => {
        const stock = getStockForResidence(item, selectedComplexId);
        if (stock < 1) {
            toast({ title: "Out of stock", description: "This item is currently out of stock.", variant: "destructive" });
            return;
        }

        setIssuedItems(prevItems => {
            const newItem: IssuedItem = {
                ...item,
                voucherItemId: `${item.id}-${Date.now()}`, // Create a unique ID for this line item
                issueQuantity: 1,
                buildingId: '',
                floorId: '',
                roomId: '',
            };
            return [...prevItems, newItem];
        });
    };
    
    const handleQuantityChange = (voucherItemId: string, newQuantity: number) => {
        const itemInfo = issuedItems.find(i => i.voucherItemId === voucherItemId);
        if (!itemInfo || !selectedComplexId) return;

        const stock = getStockForResidence(itemInfo, selectedComplexId);

        let quantity = newQuantity;
        if (quantity < 1) {
            quantity = 1;
        } else if (quantity > stock) {
            quantity = stock;
            toast({ title: "Stock limit reached", description: `Cannot issue more than the available ${stock} units.`, variant: "destructive"});
        }
        
        setIssuedItems(prevItems => prevItems.map(item => 
            item.voucherItemId === voucherItemId ? { ...item, issueQuantity: quantity } : item
        ));
    };

    const handleLocationChange = (voucherItemId: string, field: 'buildingId' | 'floorId' | 'roomId', value: string) => {
        setIssuedItems(prevItems => prevItems.map(item => {
            if (item.voucherItemId === voucherItemId) {
                const updatedItem = { ...item, [field]: value };
                // Reset child fields when a parent changes
                if (field === 'buildingId') {
                    updatedItem.floorId = '';
                    updatedItem.roomId = '';
                } else if (field === 'floorId') {
                    updatedItem.roomId = '';
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleRemoveItem = (voucherItemId: string) => {
        setIssuedItems(prevItems => prevItems.filter(item => item.voucherItemId !== voucherItemId));
    };

    const handleSubmitVoucher = () => {
        // Logic to submit the MIV
        console.log({
            complex: selectedComplexId,
            items: issuedItems
        })
    };

    const isVoucherSubmittable = useMemo(() => {
        if (issuedItems.length === 0) return false;
        // Every item must have a quantity, building, floor, and room selected.
        return issuedItems.every(item => item.issueQuantity > 0 && item.buildingId && item.floorId && item.roomId);
    }, [issuedItems]);


    if (residencesLoading || inventoryLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    const getBuildingOptions = () => selectedComplex?.buildings || [];
    const getFloorOptions = (buildingId?: string) => {
        if (!buildingId) return [];
        return selectedComplex?.buildings.find(b => b.id === buildingId)?.floors || [];
    };
    const getRoomOptions = (buildingId?: string, floorId?: string) => {
        if (!buildingId || !floorId) return [];
        return selectedComplex?.buildings.find(b => b.id === buildingId)
            ?.floors.find(f => f.id === floorId)?.rooms || [];
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
                        <Select value={selectedComplexId} onValueChange={setSelectedComplexId}>
                            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a residence..." /></SelectTrigger>
                            <SelectContent>
                                {userResidences.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                    <Button onClick={handleSubmitVoucher} disabled={!isVoucherSubmittable}>Submit Voucher</Button>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Inventory for {selectedComplex?.name || '...'}</CardTitle>
                        <CardDescription>Items with stock in the selected residence.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            {selectedComplexId ? (
                                <div className="space-y-2">
                                    {availableInventory.length > 0 ? availableInventory.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md border bg-background hover:bg-muted/50">
                                            <div>
                                                <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                                <p className="text-sm text-muted-foreground">{item.category} - Stock: {getStockForResidence(item, selectedComplexId)} {item.unit}</p>
                                            </div>
                                            <Button size="icon" variant="outline" onClick={() => handleAddItem(item)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )) : (
                                        <div className="text-center text-muted-foreground p-8">
                                            No inventory with stock found for this residence.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    Select a residence to see its inventory.
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Items to Issue</CardTitle>
                        <CardDescription>Specify location and quantity for each item.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-[120px] text-center">Location</TableHead>
                                        <TableHead className="w-[150px] text-center">Quantity</TableHead>
                                        <TableHead className="w-[50px] text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issuedItems.length > 0 ? issuedItems.map(item => (
                                        <TableRow key={item.voucherItemId}>
                                            <TableCell className="font-medium align-top">
                                                <p>{item.nameAr} / {item.nameEn}</p>
                                                <p className="text-xs text-muted-foreground">{item.category}</p>
                                            </TableCell>
                                            <TableCell className="space-y-2">
                                                 <Select value={item.buildingId} onValueChange={(val) => handleLocationChange(item.voucherItemId, 'buildingId', val)} disabled={!selectedComplexId}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Building" /></SelectTrigger>
                                                    <SelectContent>
                                                        {getBuildingOptions().map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={item.floorId} onValueChange={(val) => handleLocationChange(item.voucherItemId, 'floorId', val)} disabled={!item.buildingId}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Floor" /></SelectTrigger>
                                                    <SelectContent>
                                                        {getFloorOptions(item.buildingId).map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={item.roomId} onValueChange={(val) => handleLocationChange(item.voucherItemId, 'roomId', val)} disabled={!item.floorId}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Room" /></SelectTrigger>
                                                    <SelectContent>
                                                        {getRoomOptions(item.buildingId, item.floorId).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                 <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.voucherItemId, item.issueQuantity - 1)}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input type="number" value={item.issueQuantity} onChange={(e) => handleQuantityChange(item.voucherItemId, parseInt(e.target.value, 10))} className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.voucherItemId, item.issueQuantity + 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right align-top">
                                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.voucherItemId)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                                No items added to the voucher yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
