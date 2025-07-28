
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useResidences, type Complex, type Building, type Floor, type Room } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useInventory } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function IssueMaterialPage() {
    const { currentUser } = useUsers();
    const { residences, loading: residencesLoading } = useResidences();
    const { items: allItems, loading: inventoryLoading, getStockForResidence } = useInventory();
    
    // Form state
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [selectedFloorId, setSelectedFloorId] = useState<string>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    
    // Items state
    const [issuedItems, setIssuedItems] = useState<any[]>([]);
    
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

    const handleAddItem = (item: any) => {
        // Logic to add an item to the issuedItems list
    };
    
    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        // Logic to change the quantity of an issued item
    };
    
    const handleRemoveItem = (itemId: string) => {
        // Logic to remove an item from the issuedItems list
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
                <Button onClick={handleSubmitVoucher}>Submit Voucher</Button>
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
                            {/* Inventory items will be listed here */}
                            <div className="text-center text-muted-foreground p-8">
                                Select a residence to see its inventory.
                            </div>
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
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                                            No items added to the voucher yet.
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
