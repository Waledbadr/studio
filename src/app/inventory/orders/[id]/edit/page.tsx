'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2, Search, PlusCircle, Loader2, ArrowLeft, MessageSquare, ChevronDown } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { useUsers } from '@/context/users-context';
import { useRouter, useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResidences } from '@/context/residences-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function EditOrderPage() {
    const { items: allItems, loading: inventoryLoading, loadInventory, addItem, categories } = useInventory();
    const { getOrderById, updateOrder, loading: ordersLoading } = useOrders();
    const { currentUser } = useUsers();
    // Add residences context to resolve/display residence name properly
    const { residences } = useResidences();
    const [order, setOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [residenceName, setResidenceName] = useState('');
    const [residenceId, setResidenceId] = useState('');
    const [generalNotes, setGeneralNotes] = useState('');
    const [status, setStatus] = useState<'Pending' | 'Approved' | 'Partially Delivered' | 'Delivered' | 'Cancelled'>('Pending');

    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isAddDialogVisible, setAddDialogVisible] = useState(false);
    const router = useRouter();
    const { id } = useParams();

    // Local saving state for the Save button
    const [isSaving, setIsSaving] = useState(false);

    // Draft support for editing an order
    const restoredDraftRef = useRef(false);
    const hasMeaningfulDraftRef = useRef(false);
    const draftKey = (currentUser?.id && typeof id === 'string') ? `estatecare_draft_edit_request_${id}_${currentUser.id}` : null;
    const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
    const isDraftDirtyRef = useRef(false);
    // Track live values without resubscribing the snapshot effect
    const orderItemsRef = useRef<OrderItem[]>([]);
    const generalNotesRef = useRef('');

    // Update refs on orderItems or generalNotes change
    useEffect(() => {
        orderItemsRef.current = orderItems;
    }, [orderItems]);
    useEffect(() => {
        generalNotesRef.current = generalNotes;
    }, [generalNotes]);

    // Restore draft once after order is loaded
    useEffect(() => {
        if (!order || !draftKey || restoredDraftRef.current) return;
        try {
            const raw = localStorage.getItem(draftKey);
            if (!raw) { restoredDraftRef.current = true; hasMeaningfulDraftRef.current = false; return; }
            const draft = JSON.parse(raw) as { items?: OrderItem[]; notes?: string; updatedAt?: number };
            const hasMeaningfulDraft = (Array.isArray(draft?.items) && draft.items.length > 0) || (typeof draft?.notes === 'string' && draft.notes.trim().length > 0);
            hasMeaningfulDraftRef.current = hasMeaningfulDraft;
            if (hasMeaningfulDraft) {
                if (Array.isArray(draft.items)) setOrderItems(draft.items);
                if (typeof draft.notes === 'string') setGeneralNotes(draft.notes);
                if (typeof draft?.updatedAt === 'number') setLastDraftSavedAt(draft.updatedAt);
            }
            restoredDraftRef.current = true;
        } catch {
            restoredDraftRef.current = true;
            hasMeaningfulDraftRef.current = false;
        }
    }, [order, draftKey]);

    // Mark dirty on changes, but skip the first run after mount
    const firstDirtyMark = useRef(true);
    useEffect(() => {
        if (!draftKey) return;
        if (firstDirtyMark.current) { firstDirtyMark.current = false; return; }
        isDraftDirtyRef.current = true;
    }, [draftKey, orderItems, generalNotes]);

    const clearDraft = useCallback(() => {
        try { if (draftKey) localStorage.removeItem(draftKey); } catch {}
        setLastDraftSavedAt(null);
        isDraftDirtyRef.current = false;
    }, [draftKey]);

    const hasDraft = !!draftKey && (orderItems.length > 0 || !!generalNotes);

    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);
    
    useEffect(() => {
        if (!db || typeof id !== 'string') return;
        const ref = doc(db, 'orders', id);
        const unsub = onSnapshot(ref, (snap) => {
            if (!snap.exists()) {
                setPageLoading(false);
                return;
            }
            const data = { id: snap.id, ...(snap.data() as any) } as Order;
            setOrder(data);

            // Seed items if user hasn't started editing OR draft has no items.
            // Keep user's draft notes if they exist; always sync residence and status.
            const draftHasItems = orderItemsRef.current && orderItemsRef.current.length > 0;
            if (!isDraftDirtyRef.current && !draftHasItems) {
                setOrderItems(data.items || []);
            }
            setResidenceName(data.residence || '');
            setResidenceId(data.residenceId || '');
            if (!isDraftDirtyRef.current && !(hasMeaningfulDraftRef.current && (generalNotesRef.current?.trim().length > 0))) {
                setGeneralNotes(data.notes || '');
            }
            setStatus(data.status);

            setPageLoading(false);
        }, (err) => {
            console.error('Error listening to order in edit page:', err);
            setPageLoading(false);
        });
        return () => unsub();
    }, [id]);

    const handleAddItemToOrder = useCallback((itemToAdd: InventoryItem, variant?: string) => {
        const nameAr = variant ? `${itemToAdd.nameAr} - ${variant}` : itemToAdd.nameAr;
        const nameEn = variant ? `${itemToAdd.nameEn} - ${variant}` : itemToAdd.nameEn;
        const orderItemId = variant ? `${itemToAdd.id}-${variant}` : itemToAdd.id;

        setOrderItems((currentOrderItems) => {
            const existingItem = currentOrderItems.find(item => item.id === orderItemId);
            isDraftDirtyRef.current = true;
            if (existingItem) {
                return currentOrderItems.map(item => 
                    item.id === orderItemId ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                // Add new item at the beginning (top) like the new order page
                return [{ ...itemToAdd, id: orderItemId, nameAr, nameEn, quantity: 1, notes: '' }, ...currentOrderItems];
            }
        });
    }, []);
    
    const handleRemoveItem = (id: string) => {
        isDraftDirtyRef.current = true;
        setOrderItems(orderItems.filter(item => item.id !== id));
    }
    
    const handleQuantityChange = (id: string, newQuantity: number) => {
        const quantity = isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity;
        isDraftDirtyRef.current = true;
        setOrderItems(orderItems.map(item => item.id === id ? {...item, quantity: quantity } : item));
    }

    const handleNotesChange = (id: string, notes: string) => {
        isDraftDirtyRef.current = true;
        setOrderItems(orderItems.map(item => item.id === id ? { ...item, notes } : item));
    };

    const handleGeneralNotesChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        isDraftDirtyRef.current = true;
        setGeneralNotes(e.target.value);
    };

    const canEdit = status === 'Pending' ? (currentUser?.role === 'Admin' || currentUser?.id === order?.requestedById) : (currentUser?.role === 'Admin');

    const handleUpdateOrder = async () => {
        if (!canEdit) {
            toast({ title: 'Not allowed', description: 'You cannot edit this request at its current status.', variant: 'destructive' });
            return;
        }
        if (orderItems.length === 0) {
            toast({ title: "Error", description: "Cannot submit an empty request.", variant: "destructive" });
            return;
        }

        // Resolve residence name correctly using residenceId if name is missing
        const resolvedResidenceName = residenceName || (residences.find(r => r.id === residenceId)?.name ?? '');
        // Also resolve residenceId from the resolved name if id is missing
        const resolvedResidenceId = residenceId || (residences.find(r => r.name === resolvedResidenceName)?.id ?? '');

        const updatedOrderData = {
            residence: resolvedResidenceName,
            residenceId: resolvedResidenceId,
            items: orderItems,
            notes: generalNotes,
        };
        setIsSaving(true);
        try {
            await updateOrder(id as string, updatedOrderData);
            clearDraft();
            router.push(`/inventory/orders/${id}`);
            // Force refresh to avoid any stale view after navigation
            setTimeout(() => { try { router.refresh(); } catch {} }, 0);
        } finally {
            setIsSaving(false);
        }
    }

    const filteredItems = allItems.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.nameAr.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const totalOrderQuantity = orderItems.reduce((total, item) => total + item.quantity, 0);

    const handleNewItemAdded = (newItemWithId: InventoryItem) => {
        handleAddItemToOrder(newItemWithId);
        setSearchQuery('');
    };

    const getStockForResidence = (item: InventoryItem) => {
        // Use a resolved residenceId to show stock even if the stored name was empty
        const residenceEffectiveId = residenceId || (residences.find(r => r.name === residenceDisplayName)?.id ?? '');
        if (!residenceEffectiveId || !item.stockByResidence) return 0;
        return item.stockByResidence[residenceEffectiveId] || 0;
    }

    // Derive a display name for residence using id if the name string is empty
    const residenceDisplayName = residenceName || residences.find(r => r.id === residenceId)?.name || '';


    if (pageLoading) {
         return (
             <div className="space-y-6">
                 <Skeleton className="h-10 w-64" />
                 <Skeleton className="h-4 w-96" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                     <Card>
                         <CardHeader><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
                         <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                     </Card>
                     <Card>
                         <CardHeader><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
                         <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                     </Card>
                </div>
            </div>
         );
    }

    const AddItemButton = ({ item }: { item: InventoryItem }) => {
        if (!item.variants || item.variants.length === 0) {
            return (
                <Button size="icon" variant="outline" onClick={() => handleAddItemToOrder(item)}>
                    <Plus className="h-4 w-4" />
                </Button>
            );
        }
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline">
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {item.variants.map(variant => (
                        <DropdownMenuItem key={variant} onClick={() => handleAddItemToOrder(item, variant)}>
                            Add: {variant}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Edit Material Request</h1>
                    <p className="text-muted-foreground">Request ID: #{id as string}</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Last autosave indicator */}
                    {lastDraftSavedAt && (
                        <span className="text-xs text-muted-foreground mr-2">Saved {new Date(lastDraftSavedAt).toLocaleTimeString()}</span>
                    )}
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    {hasDraft && (
                        <Button variant="outline" onClick={() => { setOrderItems([]); setGeneralNotes(''); clearDraft(); }}>
                            Discard Draft
                        </Button>
                    )}
                    <Button onClick={handleUpdateOrder} disabled={!canEdit || orderItems.length === 0 || isSaving}>
                        {isSaving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            `Save Changes (${totalOrderQuantity} items)`
                        )}
                    </Button>
                </div>
            </div>
            
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Inventory</CardTitle>
                        <CardDescription>Click the '+' to add an item to your request.</CardDescription>
                         <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="search"
                                    placeholder="Search items..."
                                    className="pl-8 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[450px]">
                            {inventoryLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredItems.length > 0 ? filteredItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                                            <div>
                                                <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                                <p className="text-sm text-muted-foreground">{item.category} - Stock: {getStockForResidence(item)} {item.unit}</p>
                                            </div>
                                            <AddItemButton item={item} />
                                        </div>
                                    )) : (
                                         searchQuery || selectedCategory !== 'all' ? (
                                            <div className="text-center text-muted-foreground py-10">
                                                <p className="mb-4">No items found matching your criteria.</p>
                                                {searchQuery && <Button onClick={() => setAddDialogVisible(true)}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add "{searchQuery}"
                                                </Button>}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted-foreground py-10">Start typing to search for items.</div>
                                        )
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Current Request</CardTitle>
                                <CardDescription>Review and adjust the items in your request.</CardDescription>
                            </div>
                            <div className="text-right">
                                <Label htmlFor='residence' className="text-xs text-muted-foreground">Residence</Label>
                                {/* Display resolved residence name even if the stored name is empty */}
                                <Input id="residence" readOnly value={residenceDisplayName} className="w-48 mt-1 text-sm font-medium" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[450px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-[150px] text-center">Quantity</TableHead>
                                        <TableHead className="text-right w-[100px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderItems.length > 0 ? orderItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.nameAr} / {item.nameEn}
                                                <div className="text-xs text-muted-foreground">{item.category}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))} className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <div className="flex items-center justify-end gap-1">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MessageSquare className="h-4 w-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80">
                                                            <div className="grid gap-4">
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium leading-none">Item Notes</h4>
                                                                    <p className="text-sm text-muted-foreground">Add specific notes for this item.</p>
                                                                </div>
                                                                <Textarea
                                                                    value={item.notes || ''}
                                                                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                                                    placeholder="e.g., Please provide the new model."
                                                                />
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-60 text-center text-muted-foreground">Your request is empty.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <div className="mt-6 space-y-2">
                            <Label htmlFor="general-notes">General Notes</Label>
                            <Textarea
                                id="general-notes"
                                placeholder="Add any general notes for the entire request..."
                                value={generalNotes}
                                onChange={handleGeneralNotesChange}
                            />
                        </div>
                    </CardContent>
                </Card>
           </div>
            <AddItemDialog
                isOpen={isAddDialogVisible}
                onOpenChange={setAddDialogVisible}
                onItemAdded={addItem}
                onItemAddedAndOrdered={handleNewItemAdded}
                initialName={searchQuery}
            />
        </div>
    )
}


