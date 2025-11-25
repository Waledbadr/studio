'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, ArrowLeft, Loader2, Save } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUsers } from '@/context/users-context';
import { useRouter, useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { normalizeText, includesNormalized } from '@/lib/utils';
import { QuantityStepper } from '@/components/ui/quantity-stepper';

export default function EditMRVPage() {
    const { items: allItems, loading: inventoryLoading, loadInventory, getMRVById, updateMRV, categories } = useInventory();
    const { currentUser } = useUsers();
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [items, setItems] = useState<{ id: string; nameEn: string; nameAr: string; quantity: number; unit?: string; category?: string }[]>([]);
    const [supplierName, setSupplierName] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [notes, setNotes] = useState('');
    const [editReason, setEditReason] = useState('');
    const [residenceId, setResidenceId] = useState('');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    useEffect(() => {
        if (!id || typeof id !== 'string') return;
        
        const fetchMRV = async () => {
            try {
                const mrv = await getMRVById(id);
                if (!mrv) {
                    toast({ title: 'Error', description: 'MRV not found', variant: 'destructive' });
                    router.push('/inventory/receive');
                    return;
                }
                
                setResidenceId(mrv.residenceId);
                setSupplierName(mrv.supplierName || '');
                setInvoiceNo(mrv.invoiceNo || '');
                // Notes might not be in MRVDetails interface but usually in meta, let's assume it might be there or we just start empty if not exposed
                // Looking at getMRVById implementation, it doesn't return notes in MRVDetails interface explicitly but it might be in the object if we cast it.
                // The interface MRVDetails has: supplierName, invoiceNo, attachmentUrl, etc. but not notes.
                // However, createMRV saves notes. Let's check if we can get it.
                // For now, we'll leave notes empty if not available.
                
                // Map items to include unit/category from inventory
                const mappedItems = mrv.items.map(i => {
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
                setItems(mappedItems);
            } catch (error) {
                console.error(error);
                toast({ title: 'Error', description: 'Failed to load MRV', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };

        if (allItems.length > 0) {
            fetchMRV();
        }
    }, [id, getMRVById, allItems, router, toast]);

    const handleAddItem = (item: InventoryItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                id: item.id,
                nameEn: item.nameEn,
                nameAr: item.nameAr,
                quantity: 1,
                unit: item.unit,
                category: item.category
            }];
        });
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    const handleQuantityChange = (itemId: string, qty: number) => {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, qty) } : i));
    };

    const handleSave = async () => {
        if (!editReason.trim()) {
            toast({ title: 'Validation Error', description: 'Edit reason is required.', variant: 'destructive' });
            return;
        }
        if (items.length === 0) {
            toast({ title: 'Validation Error', description: 'At least one item is required.', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            await updateMRV(id as string, items, {
                supplierName,
                invoiceNo,
                notes,
                editReason
            });
            router.push(`/inventory/receive/receipts/${id}`);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to update MRV', variant: 'destructive' });
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
                    <h1 className="text-2xl font-bold">Edit Material Receipt</h1>
                    <p className="text-muted-foreground">MRV: {id}</p>
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

                {/* Right Column: MRV Details */}
                <div className="space-y-6 h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Receipt Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Supplier Name</Label>
                                    <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Optional" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Invoice No</Label>
                                    <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="Optional" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-red-500">Edit Reason (Required)</Label>
                                <Input 
                                    value={editReason} 
                                    onChange={e => setEditReason(e.target.value)} 
                                    placeholder="Why are you editing this receipt?"
                                    className="border-red-200 focus-visible:ring-red-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Items ({items.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-3 border rounded-md bg-card">
                                        <div className="flex-grow">
                                            <div className="font-medium">{item.nameEn}</div>
                                            <div className="text-sm text-muted-foreground">{item.nameAr}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <QuantityStepper 
                                                value={item.quantity} 
                                                onValueChange={(v) => handleQuantityChange(item.id, v)} 
                                            />
                                            <div className="w-12 text-sm text-muted-foreground text-center">{item.unit}</div>
                                            <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        No items added. Select items from the left.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
