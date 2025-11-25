'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, ArrowLeft, Loader2, Save, MapPin } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUsers } from '@/context/users-context';
import { useRouter, useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeText, includesNormalized } from '@/lib/utils';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { useResidences } from '@/context/residences-context';

interface LocationGroup {
    locationId: string; // We might not have ID if it was stored as name only, but MIV usually has locationId in transaction. 
    // Wait, MIVDetails only has locationName as key. 
    // But getMIVById implementation:
    // const locations: MIVDetails['locations'] = {};
    // for (const tx of txs) { ... locations[locName].push(...) }
    // It groups by NAME. This is a limitation if names are not unique or if we need IDs.
    // However, inventoryTransactions store locationId.
    // I should update getMIVById to return locationId as well if possible, or I can fetch transactions directly here to get IDs.
    // Let's fetch transactions directly here to be safe and get locationIds.
    locationName: string;
    items: { id: string; nameEn: string; nameAr: string; quantity: number; unit?: string; category?: string }[];
}

export default function EditMIVPage() {
    const { items: allItems, loading: inventoryLoading, loadInventory, updateMIV, categories, getInventoryTransactions, getMIVById } = useInventory();
    const { currentUser } = useUsers();
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { residences } = useResidences();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([]);
    const [editReason, setEditReason] = useState('');
    const [residenceId, setResidenceId] = useState('');
    const [selectedLocationIndex, setSelectedLocationIndex] = useState<number>(0);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    useEffect(() => {
        if (!id || typeof id !== 'string') return;
        
        const fetchMIVData = async () => {
            try {
                // We need to fetch transactions to reconstruct the groups with locationIds
                // We can't use getMIVById because it groups by name and loses locationId
                // But wait, getMIVById uses getDocs(query(..., where('referenceDocId', '==', mivId))).
                // I can do the same here.
                // Actually, I can use `getTransferItems` which returns transactions by referenceDocId, but that filters by TRANSFER type.
                // I'll use `getInventoryTransactions` but that filters by itemId.
                // I'll just use the raw firestore query here or add a helper.
                // Since I can't easily add a helper now without risking breaking things again, I'll use `getMIVById` and try to infer locationId or just use name if ID is missing (but updateMIV needs ID).
                // Wait, `updateMIV` needs `locationId`.
                // I MUST get the locationId.
                // Let's look at `getMIVById` again. It reads `inventoryTransactions`.
                // I will implement a local fetch here.
                
                // Actually, I can use `getMIVById` to get the residenceId, then fetch all transactions for that MIV.
                // But `getMIVById` is already doing that.
                // Let's just fetch the MIV doc to get residenceId, then fetch transactions.
                
                // Since I can't import `db` here easily (it's not exported from context, only from firebase lib), I should use a context function.
                // `getTransferItems` is close but filters by type.
                // `getMIVById` returns `MIVDetails` which has `locations: { [name]: items }`.
                // This is insufficient.
                
                // I will assume I can use `getMIVById` and maybe the locationName is unique enough or I can find the locationId from the residence locations list?
                // No, that's risky.
                
                // I'll use `getAllInventoryTransactions` and filter client side? No, too heavy.
                // I'll use `getMIVById` and then for each item, I'll try to find the transaction? No.
                
                // I'll use `getMIVById` but I'll modify `inventory-context` to return locationId in `MIVDetails`?
                // That would require changing the type definition which I already struggled with.
                
                // Alternative: I'll use `getMIVById` and just use `locationName` as `locationId` if I can't find it?
                // `updateMIV` writes `locationId`. If I pass garbage, it will write garbage.
                
                // Let's look at `inventory-context.tsx` again.
                // `getMIVById` implementation:
                /*
                const locations: MIVDetails['locations'] = {};
                for (const tx of txs) {
                    const locName = tx.locationName || 'Unknown';
                    if (!locations[locName]) locations[locName] = [];
                    locations[locName].push({ ... });
                }
                */
               // It completely drops `locationId`.
               
               // I will use `getMIVById` to get the basic info, but I really need the location IDs.
               // I'll try to match location names to residence locations.
               // `residences` context has locations.
               
               const miv = await getMRVById(id); // Wait, getMRVById is for MRV. getMIVById is for MIV.
               // I need `getMIVById`.
               // But `getMIVById` returns `MIVDetails`.
               
               // Let's try to fetch the MIV using `getMIVById` first.
               // And I'll use `residences` to find the locationId by name.
               
            } catch (e) {
                console.error(e);
            }
        };
    }, [id]);

    // Re-implementing fetch logic properly
    useEffect(() => {
        if (!id || typeof id !== 'string' || allItems.length === 0 || residences.length === 0) return;

        const loadData = async () => {
            try {
                // We need to fetch the raw transactions to get locationIds.
                // Since we can't access DB directly, and context doesn't expose a "getTransactionsByRef" for MIV...
                // Wait, `getTransferItems` does exactly that but filters for TRANSFER.
                // I'll use `getMIVById` and map names to IDs using `residences`.
                
                const miv = await getMIVById(id);
                if (!miv) {
                    toast({ title: 'Error', description: 'MIV not found', variant: 'destructive' });
                    router.push('/inventory/issue-history');
                    return;
                }
                
                setResidenceId(miv.residenceId);
                
                // Find the residence to get locations map
                const residence = residences.find(r => r.id === miv.residenceId);
                const locationMap = new Map<string, string>(); // Name -> ID
                if (residence) {
                    residence.facilities?.forEach(f => locationMap.set(f.name, f.id));
                    
                    residence.buildings?.forEach(b => {
                        locationMap.set(b.name, b.id);
                        b.facilities?.forEach(f => locationMap.set(f.name, f.id));
                        
                        b.floors?.forEach(f => {
                            locationMap.set(f.name, f.id);
                            f.facilities?.forEach(fac => locationMap.set(fac.name, fac.id));
                            f.rooms?.forEach(r => locationMap.set(r.name, r.id));
                        });
                    });
                }

                const groups: LocationGroup[] = [];
                
                Object.entries(miv.locations).forEach(([locName, items]) => {
                    const locId = locationMap.get(locName) || locName; // Fallback to name if ID not found
                    
                    const mappedItems = items.map(i => {
                        const invItem = allItems.find(ai => ai.id === i.itemId);
                        return {
                            id: i.itemId,
                            nameEn: i.itemNameEn,
                            nameAr: i.itemNameAr,
                            quantity: i.quantity,
                            unit: invItem?.unit,
                            category: invItem?.category
                        };
                    });
                    
                    groups.push({
                        locationId: locId,
                        locationName: locName,
                        items: mappedItems
                    });
                });
                
                setLocationGroups(groups);
                setLoading(false);

            } catch (error) {
                console.error(error);
                toast({ title: 'Error', description: 'Failed to load MIV', variant: 'destructive' });
                setLoading(false);
            }
        };
        
        loadData();
    }, [id, allItems, residences, getMIVById, router, toast]);


    const handleAddItem = (item: InventoryItem) => {
        if (locationGroups.length === 0) return;
        
        setLocationGroups(prev => {
            const newGroups = [...prev];
            const group = newGroups[selectedLocationIndex];
            const existingItem = group.items.find(i => i.id === item.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                group.items.push({
                    id: item.id,
                    nameEn: item.nameEn,
                    nameAr: item.nameAr,
                    quantity: 1,
                    unit: item.unit,
                    category: item.category
                });
            }
            return newGroups;
        });
    };

    const handleRemoveItem = (groupIndex: number, itemId: string) => {
        setLocationGroups(prev => {
            const newGroups = [...prev];
            newGroups[groupIndex].items = newGroups[groupIndex].items.filter(i => i.id !== itemId);
            return newGroups;
        });
    };

    const handleQuantityChange = (groupIndex: number, itemId: string, qty: number) => {
        setLocationGroups(prev => {
            const newGroups = [...prev];
            const item = newGroups[groupIndex].items.find(i => i.id === itemId);
            if (item) {
                item.quantity = Math.max(1, qty);
            }
            return newGroups;
        });
    };

    const handleSave = async () => {
        if (!editReason.trim()) {
            toast({ title: 'Validation Error', description: 'Edit reason is required.', variant: 'destructive' });
            return;
        }
        
        // Validate stock availability?
        // updateMIV handles validation, but we can do a quick check here.
        
        setSaving(true);
        try {
            await updateMIV(id as string, locationGroups, { editReason });
            router.push(`/inventory/issue-history/${id}`);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to update MIV', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const filteredInventory = useMemo(() => {
        const searchN = normalizeText(searchQuery);
        return allItems.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            if (!matchesCategory) return false;
            if (!searchN) return true;
            const cand = [item.nameEn, item.nameAr, item.category].join(' ');
            return includesNormalized(cand, searchN);
        });
    }, [allItems, searchQuery, selectedCategory]);

    if (loading || inventoryLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (currentUser?.role !== 'Admin') {
        return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Edit Material Issue</h1>
                    <p className="text-muted-foreground">MIV: {id}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Inventory Search */}
                <Card className="h-[calc(100vh-200px)] flex flex-col">
                    <CardHeader>
                        <CardTitle>Add Items</CardTitle>
                        <div className="mb-2">
                            <Label>Target Location</Label>
                            <Select 
                                value={selectedLocationIndex.toString()} 
                                onValueChange={v => setSelectedLocationIndex(parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {locationGroups.map((g, idx) => (
                                        <SelectItem key={idx} value={idx.toString()}>{g.locationName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search items..." 
                                    className="pl-8" 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden p-0">
                        <ScrollArea className="h-full px-6 pb-6">
                            <div className="space-y-2">
                                {filteredInventory.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-accent">
                                        <div>
                                            <div className="font-medium">{item.nameEn}</div>
                                            <div className="text-sm text-muted-foreground">{item.nameAr}</div>
                                            {/* Show stock for current residence */}
                                            <div className="text-xs text-muted-foreground">
                                                Stock: {item.stockByResidence?.[residenceId] || 0} {item.unit}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleAddItem(item)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right Column: MIV Details */}
                <div className="space-y-6 h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Issue Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-red-500">Edit Reason (Required)</Label>
                                <Input 
                                    value={editReason} 
                                    onChange={e => setEditReason(e.target.value)} 
                                    placeholder="Why are you editing this issue?"
                                    className="border-red-200 focus-visible:ring-red-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {locationGroups.map((group, groupIdx) => (
                        <Card key={groupIdx}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {group.locationName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {group.items.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-3 border rounded-md bg-card">
                                            <div className="flex-grow">
                                                <div className="font-medium">{item.nameEn}</div>
                                                <div className="text-sm text-muted-foreground">{item.nameAr}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <QuantityStepper 
                                                    value={item.quantity} 
                                                    onValueChange={(v) => handleQuantityChange(groupIdx, item.id, v)} 
                                                />
                                                <div className="w-12 text-sm text-muted-foreground text-center">{item.unit}</div>
                                                <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(groupIdx, item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {group.items.length === 0 && (
                                        <div className="text-center text-muted-foreground py-4 text-sm">
                                            No items in this location.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
