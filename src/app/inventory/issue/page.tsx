
'use client';

import { useEffect, useState, useMemo } from 'react';
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
    issueQuantity: number;
}

export default function IssueMaterialPage() {
    const { currentUser } = useUsers();
    const { residences, loading: residencesLoading } = useResidences();
    const { items: allItems, loading: inventoryLoading, getStockForResidence } = useInventory();
    const { toast } = useToast();
    
    // Form state
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [selectedFloorId, setSelectedFloorId] = useState<string>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    
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

    const buildings = useMemo(() => selectedComplex?.buildings || [], [selectedComplex]);
    
    const floors = useMemo(() => {
        if (!selectedBuildingId) return [];
        return buildings.find(b => b.id === selectedBuildingId)?.floors || [];
    }, [selectedBuildingId, buildings]);

    const rooms = useMemo(() => {
        if (!selectedFloorId) return [];
        return floors.find(f => f.id === selectedFloorId)?.rooms || [];
    }, [selectedFloorId, floors]);

    const availableInventory = useMemo(() => {
        if (!selectedComplexId) return [];
        return allItems.filter(item => getStockForResidence(item, selectedComplexId) > 0);
    }, [selectedComplexId, allItems, getStockForResidence]);


    // Reset selections when a parent selection changes
    useEffect(() => {
        setSelectedBuildingId('');
        setSelectedFloorId('');
        setSelectedRoomId('');
        setIssuedItems([]);
    }, [selectedComplexId]);

    useEffect(() => {
        setSelectedFloorId('');
        setSelectedRoomId('');
    }, [selectedBuildingId]);
    
    useEffect(() => {
        setSelectedRoomId('');
    }, [selectedFloorId]);

    const handleAddItem = (item: InventoryItem) => {
        setIssuedItems(prevItems => {
            const existingItem = prevItems.find(i => i.id === item.id);
            if (existingItem) {
                // Increment quantity if item already exists in the list
                const newQuantity = existingItem.issueQuantity + 1;
                const stock = getStockForResidence(item, selectedComplexId);
                if (newQuantity > stock) {
                    toast({ title: "Stock limit reached", description: `Cannot issue more than the available ${stock} units.`, variant: "destructive" });
                    return prevItems;
                }
                return prevItems.map(i => i.id === item.id ? { ...i, issueQuantity: newQuantity } : i);
            } else {
                // Add new item with quantity 1
                 const stock = getStockForResidence(item, selectedComplexId);
                 if (stock < 1) {
                     toast({ title: "Out of stock", description: "This item is currently out of stock.", variant: "destructive" });
                     return prevItems;
                 }
                return [...prevItems, { ...item, issueQuantity: 1 }];
            }
        });
    };
    
    const handleQuantityChange = (itemId: string, newQuantity: number) => {
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
        
        setIssuedItems(prevItems => prevItems.map(item => 
            item.id === itemId ? { ...item, issueQuantity: quantity } : item
        ));
    };
    
    const handleRemoveItem = (itemId: string) => {
        setIssuedItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    const handleSubmitVoucher = () => {
        // Logic to submit the MIV
        console.log({
            complex: selectedComplexId,
            building: selectedBuildingId,
            floor: selectedFloorId,
            room: selectedRoomId,
            items: issuedItems
        })
    };


    if (residencesLoading || inventoryLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Material Issue Voucher (MIV)</h1>
                    <p className="text-muted-foreground">Issue materials from a residence's storeroom to a specific location.</p>
                </div>
                <Button onClick={handleSubmitVoucher} disabled={issuedItems.length === 0 || !selectedRoomId}>Submit Voucher</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Issue To</CardTitle>
                    <CardDescription>Select the location where the materials will be used.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label>1. Select Residence</Label>
                        <Select value={selectedComplexId} onValueChange={setSelectedComplexId}>
                            <SelectTrigger><SelectValue placeholder="Select a residence..." /></SelectTrigger>
                            <SelectContent>
                                {userResidences.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div className="space-y-2">
                        <Label>2. Select Building</Label>
                        <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId} disabled={!selectedComplexId}>
                            <SelectTrigger><SelectValue placeholder="Select a building..." /></SelectTrigger>
                            <SelectContent>
                                {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div className="space-y-2">
                        <Label>3. Select Floor</Label>
                        <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={!selectedBuildingId}>
                            <SelectTrigger><SelectValue placeholder="Select a floor..." /></SelectTrigger>
                            <SelectContent>
                                {floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div className="space-y-2">
                        <Label>4. Select Room</Label>
                        <Select value={selectedRoomId} onValueChange={setSelectedRoomId} disabled={!selectedFloorId}>
                            <SelectTrigger><SelectValue placeholder="Select a room..." /></SelectTrigger>
                            <SelectContent>
                                {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                </CardContent>
            </Card>

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
                        <CardDescription>Items that will be deducted from stock.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-[150px] text-center">Quantity</TableHead>
                                        <TableHead className="w-[50px] text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issuedItems.length > 0 ? issuedItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <p>{item.nameAr} / {item.nameEn}</p>
                                                <p className="text-xs text-muted-foreground">{item.category}</p>
                                            </TableCell>
                                            <TableCell>
                                                 <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.issueQuantity - 1)}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input type="number" value={item.issueQuantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))} className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.issueQuantity + 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
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

    