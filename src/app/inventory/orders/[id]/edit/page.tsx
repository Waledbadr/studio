'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2, Search, PlusCircle, Loader2, ArrowLeft, MessageSquare, ChevronDown, Edit } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { useUsers } from '@/context/users-context';
import { useRouter, useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResidences } from '@/context/residences-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { normalizeText, includesNormalized } from '@/lib/utils';
import { AR_SYNONYMS, buildNormalizedSynonyms } from '@/lib/aliases';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Top-level AddItemButton component to avoid remounting when parent re-renders
function AddItemButton({
    item,
    handleAddItemToOrder,
    variantSelectionsRef,
}: {
    item: InventoryItem;
    handleAddItemToOrder: (item: InventoryItem, variant?: string, qty?: number) => void;
    variantSelectionsRef: React.MutableRefObject<Record<string, Record<string, boolean>>>;
}) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [, setTick] = useState(0);

    if (!item.variants || item.variants.length === 0) {
        return (
            <Button size="icon" variant="outline" onClick={() => handleAddItemToOrder(item)}>
                <Plus className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <Button size="icon" variant="outline">
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
                <div className="space-y-2">
                    {item.variants.map((variant) => (
                        <div key={variant} className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4"
                                    checked={Boolean((variantSelectionsRef.current[item.id] || {})[variant])}
                                    onChange={(e) => {
                                        const map = { ...(variantSelectionsRef.current[item.id] || {}) } as Record<string, boolean>;
                                        if (e.target.checked) map[variant] = true;
                                        else delete map[variant];
                                        variantSelectionsRef.current = { ...variantSelectionsRef.current, [item.id]: map };
                                        setTick(t => t + 1);
                                    }}
                                />
                                <span className="truncate">{variant}</span>
                            </label>
                        </div>
                    ))}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => { variantSelectionsRef.current[item.id] = {}; setTick(t => t + 1); }}>
                            Clear
                        </Button>
                        <Button size="sm" onClick={() => {
                            const map = variantSelectionsRef.current[item.id] || {};
                            const entries = Object.entries(map);
                            if (entries.length === 0) {
                                const firstVariant = item.variants?.[0];
                                handleAddItemToOrder(item, firstVariant ?? undefined, 1);
                                variantSelectionsRef.current[item.id] = {};
                                setTick(t => t + 1);
                                setPopoverOpen(true);
                                return;
                            }

                            if (entries.length === 1) {
                                const [variant] = entries[0];
                                handleAddItemToOrder(item, variant, 1);
                                variantSelectionsRef.current[item.id] = {};
                                setTick(t => t + 1);
                                setPopoverOpen(true);
                                return;
                            }

                            const composedParts = entries.map(([variant]) => variant);
                            const combinedLabel = composedParts.join(', ');
                            const totalQty = entries.length;
                            handleAddItemToOrder(item, combinedLabel, totalQty);

                            variantSelectionsRef.current[item.id] = {};
                            setTick(t => t + 1);
                            setPopoverOpen(true);
                        }}>
                            Add selected
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function EditOrderPage() {
    const { items: allItems, loading: inventoryLoading, loadInventory, addItem, categories, updateItem } = useInventory();
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

    // Threshold for highlighting stock availability
    const STOCK_ATTENTION_THRESHOLD = 3;

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
                // Only apply draft items if there are items; avoid clearing server items with an empty array
                if (Array.isArray(draft.items) && draft.items.length > 0) setOrderItems(draft.items);
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
    
    // Seed initial data promptly via a one-time fetch, then keep in sync via onSnapshot
    useEffect(() => {
        let unsub: (() => void) | null = null;
        let isMounted = true;
        (async () => {
            if (!db || typeof id !== 'string') { setPageLoading(false); return; }
            try {
                // Immediate fetch to populate without hard refresh
                const first = await getOrderById(id as string);
                if (first && isMounted) {
                    setOrder(first);
                    const hasItemsNow = orderItemsRef.current && orderItemsRef.current.length > 0;
                    if (!hasItemsNow) {
                        setOrderItems(first.items || []);
                    }
                    setResidenceName(first.residence || '');
                    setResidenceId(first.residenceId || '');
                    if (!isDraftDirtyRef.current && !(hasMeaningfulDraftRef.current && (generalNotesRef.current?.trim().length > 0))) {
                        setGeneralNotes(first.notes || '');
                    }
                    setStatus(first.status);
                    setPageLoading(false);
                }
            } catch (e) {
                console.warn('Initial fetch failed, relying on snapshot:', e);
            }

            // Live subscription
            const ref = doc(db, 'orders', id as string);
            unsub = onSnapshot(ref, (snap) => {
                if (!snap.exists()) {
                    if (isMounted) setPageLoading(false);
                    return;
                }
                const data = { id: snap.id, ...(snap.data() as any) } as Order;
                if (!isMounted) return;
                setOrder(data);

                const hasItemsNow = orderItemsRef.current && orderItemsRef.current.length > 0;
                if (!hasItemsNow) {
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
                if (isMounted) setPageLoading(false);
            });
        })();
        return () => { isMounted = false; if (unsub) unsub(); };
    }, [id, getOrderById]);

    // Autosave draft in edit page: debounce + interval + visibility change
    useEffect(() => {
        if (!draftKey) return;

        const saveNow = () => {
            if (!isDraftDirtyRef.current) return;
            try {
                const payload = {
                    items: orderItemsRef.current,
                    notes: generalNotesRef.current,
                    updatedAt: Date.now(),
                };
                localStorage.setItem(draftKey, JSON.stringify(payload));
                setLastDraftSavedAt(payload.updatedAt);
                isDraftDirtyRef.current = false;
            } catch {}
        };

        const debounced = setTimeout(saveNow, 2_000);
        const interval = setInterval(saveNow, 30_000);
        const handleBeforeUnload = () => saveNow();
        const handleVisibility = () => { if (document.visibilityState === 'hidden') saveNow(); };
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibility);
            clearInterval(interval);
            clearTimeout(debounced);
            saveNow();
        };
    }, [draftKey, orderItems, generalNotes]);

    // Support adding a specific quantity and record variant metadata on the order line
    const handleAddItemToOrder = useCallback((itemToAdd: InventoryItem, variant?: string, qty: number = 1) => {
        const nameAr = variant ? `${itemToAdd.nameAr} - ${variant}` : itemToAdd.nameAr;
        const nameEn = variant ? `${itemToAdd.nameEn} - ${variant}` : itemToAdd.nameEn;
        // Use a safe separator and encode variant text to avoid unsafe chars in id
        const orderItemId = variant ? `${itemToAdd.id}::${encodeURIComponent(String(variant))}` : itemToAdd.id;

        setOrderItems((currentOrderItems) => {
            isDraftDirtyRef.current = true;
            const existingItem = currentOrderItems.find(item => item.id === orderItemId);
            if (existingItem) {
                return currentOrderItems.map(item => 
                    item.id === orderItemId ? { ...item, quantity: (item.quantity || 0) + qty } : item
                );
            } else {
                // Add new item at the beginning (top) with explicit variant fields
                const newOrderItem: any = {
                    ...itemToAdd,
                    id: orderItemId,
                    itemId: itemToAdd.id,
                    variantId: variant ?? null,
                    variantLabel: variant ?? '',
                    nameAr,
                    nameEn,
                    quantity: qty,
                    notes: ''
                };
                return [newOrderItem, ...currentOrderItems];
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
            toast({ title: 'Error', description: 'Cannot submit an empty request.', variant: 'destructive' });
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
    };

    // Use centralized Arabic synonyms (includes دهان ⇄ بوية)
    const normalizedSynonyms = buildNormalizedSynonyms(AR_SYNONYMS);
    const searchN = normalizeText(searchQuery);
    const filteredItems = allItems.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        if (!matchesCategory) return false;
        if (!searchN) return true;
        const cand = [
            item.nameEn,
            item.nameAr,
            item.category,
            ...(item.keywordsAr || []),
            ...(item.keywordsEn || []),
            ...(item.variants || []),
        ].filter(Boolean).join(' ');
        if (includesNormalized(cand, searchN)) return true;
        for (const [canonN, aliasSet] of normalizedSynonyms.entries()) {
            if (aliasSet.has(searchN)) {
                const itemMatchesCanon =
                    includesNormalized(item.nameAr, canonN) ||
                    includesNormalized(item.nameEn, canonN) ||
                    (item.keywordsAr || []).some(k => includesNormalized(k, canonN)) ||
                    (item.keywordsEn || []).some(k => includesNormalized(k, canonN)) ||
                    (item.variants || []).some(v => includesNormalized(v, canonN));
                if (itemMatchesCanon) return true;
            }
        }
        return false;
    });

    const totalOrderQuantity = orderItems.reduce((total, item) => total + item.quantity, 0);

    const handleNewItemAdded = (newItemWithId: InventoryItem) => {
        handleAddItemToOrder(newItemWithId);
        setSearchQuery('');
    };

    // Edit item dialog state so users can add/edit variants & keywords inline while editing an order
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Variant selection bookkeeping for the popover UI. Shape: { [itemId]: { [variantLabel]: true } }
    const variantSelectionsRef = useRef<Record<string, Record<string, boolean>>>({});

    const openEditForItem = (item: InventoryItem) => {
        setItemToEdit(item);
        setEditDialogOpen(true);
    };

    const handleItemUpdated = async (updated: InventoryItem) => {
        try {
            await updateItem(updated);
            // close dialog and clear selection
            setEditDialogOpen(false);
            setItemToEdit(null);
        } catch (e) {
            console.error('Failed to update item from edit order page', e);
        }
    };

    const getStockForResidence = (item: InventoryItem) => {
        // Use a resolved residenceId to show stock even if the stored name was empty
        const residenceEffectiveId = residenceId || (residences.find(r => r.name === residenceDisplayName)?.id ?? '');
        if (!residenceEffectiveId || !item.stockByResidence) return 0;
        return item.stockByResidence[residenceEffectiveId] || 0;
    }

    // Derive a display name for residence using id if the name string is empty
    const residenceDisplayName = residenceName || residences.find(r => r.id === residenceId)?.name || '';

    // Helper: split name into base and detail using " - " like details/new-order pages
    const splitNameDetail = (name?: string): { base: string; detail: string } => {
        const raw = (name || '').trim();
        if (!raw) return { base: '', detail: '' };
        const parts = raw.split(' - ');
        if (parts.length <= 1) return { base: raw, detail: '' };
        return { base: parts[0].trim(), detail: parts.slice(1).join(' - ').trim() };
    };

    // Map order item id (variant possible) to base item stock at current residence
    const handleGetStockForOrderItem = (item: OrderItem) => {
        try {
            const rawId = (item as any).id ?? (item as any).itemId;
            if (!rawId) return 0;
            const baseItemId = String(rawId).split('-')[0];
            const baseItem = allItems.find(i => i.id === baseItemId);
            if (!baseItem) return 0;
            const effectiveId = residenceId || (residences.find(r => r.name === residenceDisplayName)?.id ?? '');
            if (!effectiveId || !baseItem.stockByResidence) return 0;
            return baseItem.stockByResidence[effectiveId] || 0;
        } catch { return 0; }
    };

    // Group current order items by category for display similar to new-order/details
    const groupedOrderItems = useMemo(() => {
        return orderItems.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {} as Record<string, OrderItem[]>);
    }, [orderItems]);


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

    // Note: using the top-level AddItemButton declared above avoids remounts and keeps popovers stable.

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
                                                {(() => {
                                                    const stock = getStockForResidence(item);
                                                    return (
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.category} - {" "}
                                                            <span className={stock > STOCK_ATTENTION_THRESHOLD ? "text-emerald-600 dark:text-emerald-400 font-semibold" : undefined}>
                                                                Stock: {stock}
                                                            </span>{" "}
                                                            {item.unit}
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditForItem(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AddItemButton item={item} handleAddItemToOrder={handleAddItemToOrder} variantSelectionsRef={variantSelectionsRef} />
                                            </div>
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
                            {orderItems.length === 0 ? (
                                <div className="h-60 flex items-center justify-center text-muted-foreground">Your request is empty.</div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(groupedOrderItems).map(([category, items]) => (
                                        <div key={category} className="rounded-md border">
                                            <div className="bg-muted/50 px-3 py-2 font-semibold text-primary capitalize">{category}</div>
                                            <div className="divide-y">
                                                {items.map((item) => {
                                                    const ar = splitNameDetail(item.nameAr);
                                                    const en = splitNameDetail(item.nameEn);
                                                    const detail = ar.detail || en.detail || '';
                                                    const stock = handleGetStockForOrderItem(item);
                                                    return (
                                                        <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="font-medium truncate">{en.base || item.nameEn} | {ar.base || item.nameAr}</div>
                                                                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                                                                    <span className="capitalize">{item.category}</span>
                                                                    {item.unit && <span>• {item.unit}</span>}
                                                                    <span className={stock > STOCK_ATTENTION_THRESHOLD ? "text-emerald-600 dark:text-emerald-400 font-semibold" : undefined}>• Stock: {stock}</span>
                                                                    {detail && <span className="italic">• {detail}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                                                                    className="w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
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
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
            {/* Edit dialog for modifying variants/keywords inline while editing an order */}
            {/* Use the same EditItemDialog component as the new-order page */}
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <EditItemDialog
                isOpen={editDialogOpen}
                onOpenChange={(v: boolean) => { setEditDialogOpen(v); if (!v) setItemToEdit(null); }}
                onItemUpdated={handleItemUpdated}
                item={itemToEdit}
            />
        </div>
    )
}


