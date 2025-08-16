'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { normalizeText, includesNormalized } from '@/lib/utils';
import { AR_SYNONYMS, buildNormalizedSynonyms } from '@/lib/aliases';
import { Plus, Minus, Trash2, Search, PlusCircle, Loader2, ChevronDown, MessageSquare, Clock, Edit } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { useOrders } from '@/context/orders-context';
import type { OrderItem } from '@/context/orders-context';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Complex } from '@/context/residences-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

export default function NewOrderPage() {
    const { items: allItems, loading, loadInventory, addItem, categories, getStockForResidence, updateItem } = useInventory();
    const { createOrder, loading: ordersLoading } = useOrders();
    const { currentUser, users, loadUsers } = useUsers();
    const { residences, loadResidences } = useResidences();

    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedResidence, setSelectedResidence] = useState<Complex | undefined>(undefined);
    const [generalNotes, setGeneralNotes] = useState('');
    // Track pending residence id when restoring draft before residences are loaded
    const pendingResidenceIdRef = useRef<string | null>(null);
    const restoredDraftRef = useRef<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isAddDialogVisible, setAddDialogVisible] = useState(false);
    const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    // Local submitting state for the submit button
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Map of quantity input refs keyed by order item id
    const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
    // Track which item should receive focus on its quantity input
    const [focusItemId, setFocusItemId] = useState<string | null>(null);

    // Threshold for highlighting stock availability
    const STOCK_ATTENTION_THRESHOLD = 3;

    // Compute a per-user draft key
    const draftKey = currentUser?.id ? `estatecare_draft_material_request_${currentUser.id}` : null;
    // New: track last autosave time and dirty state
    const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
    const isDraftDirtyRef = useRef(false);

    useEffect(() => {
        loadInventory();
        if (users.length === 0) loadUsers();
        if (residences.length === 0) loadResidences();
    }, [loadInventory, loadUsers, loadResidences, users.length, residences.length]);

    // Restore draft once when user and residences are available
    useEffect(() => {
        if (!currentUser || restoredDraftRef.current) return;
        if (!draftKey) return;
        try {
            const raw = localStorage.getItem(draftKey);
            if (!raw) return;
            const draft = JSON.parse(raw) as { items?: OrderItem[]; notes?: string; residenceId?: string; updatedAt?: number };
            if (!draft || (!draft.items?.length && !draft.notes && !draft.residenceId)) return;

            // Restore items and notes immediately
            if (draft.items && Array.isArray(draft.items)) setOrderItems(draft.items);
            if (typeof draft.notes === 'string') setGeneralNotes(draft.notes);
            if (typeof draft.updatedAt === 'number') setLastDraftSavedAt(draft.updatedAt);

            // Restore residence when available
            if (draft.residenceId) {
                const found = residences.find(r => r.id === draft.residenceId && !r.disabled);
                if (found) setSelectedResidence(found);
                else pendingResidenceIdRef.current = draft.residenceId;
            }
            restoredDraftRef.current = true;
        } catch {}
    }, [currentUser, draftKey, residences]);

    // If we had a pending residence id and residences list updated, try to apply it
    useEffect(() => {
        if (!pendingResidenceIdRef.current || residences.length === 0) return;
        const found = residences.find(r => r.id === pendingResidenceIdRef.current && !r.disabled);
        if (found) {
            setSelectedResidence(found);
            pendingResidenceIdRef.current = null;
        }
    }, [residences]);

    // Mark draft dirty on changes
    useEffect(() => {
        if (!draftKey) return;
        isDraftDirtyRef.current = true;
    }, [draftKey, orderItems, generalNotes, selectedResidence?.id]);

    // Robust autosave: debounce on changes (2s), heartbeat interval (30s), beforeunload + when tab hidden
    useEffect(() => {
        if (!draftKey) return;

        const saveNow = () => {
            if (!isDraftDirtyRef.current) return;
            try {
                const payload = {
                    items: orderItems,
                    notes: generalNotes,
                    residenceId: selectedResidence?.id || null,
                    updatedAt: Date.now(),
                };
                localStorage.setItem(draftKey, JSON.stringify(payload));
                setLastDraftSavedAt(payload.updatedAt);
                isDraftDirtyRef.current = false;
            } catch {}
        };

        // Debounced save shortly after changes
        const debounced = setTimeout(saveNow, 2_000);
        // Heartbeat save every 30s while editing (in case a change flag was missed)
        const interval = setInterval(saveNow, 30_000);
        // Save before unload/navigation
        const handleBeforeUnload = () => saveNow();
        // Save when tab goes to background
        const handleVisibility = () => { if (document.visibilityState === 'hidden') saveNow(); };
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibility);
            clearInterval(interval);
            clearTimeout(debounced);
            // Final save when effect cleans up
            saveNow();
        };
    }, [draftKey, orderItems, generalNotes, selectedResidence?.id]);

    // Clear draft helper
    const clearDraft = useCallback(() => {
        try {
            if (draftKey) localStorage.removeItem(draftKey);
        } catch {}
        setLastDraftSavedAt(null);
        isDraftDirtyRef.current = false;
    }, [draftKey]);

    const userResidences = currentUser?.assignedResidences
        ?.map(id => residences.find(r => r.id === id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined && !r.disabled) || [];

    useEffect(() => {
        if (userResidences.length === 1 && !selectedResidence) {
            setSelectedResidence(userResidences[0]);
        } else if (selectedResidence && selectedResidence.disabled) {
            // Clear selection if it became disabled
            setSelectedResidence(undefined);
        }
    }, [currentUser, residences, userResidences, selectedResidence]);

    // Load recent items from localStorage
    useEffect(() => {
        const loadRecentItems = () => {
            try {
                const recentItemIds = JSON.parse(localStorage.getItem('recentMaterialRequestItems') || '[]') as string[];
                const recent = recentItemIds
                    .map(id => allItems.find(item => item.id === id))
                    .filter((item): item is InventoryItem => item !== undefined)
                    .slice(0, 5); // Show max 5 recent items
                setRecentItems(recent);
            } catch (error) {
                console.error('Error loading recent items:', error);
            }
        };

        if (allItems.length > 0) {
            loadRecentItems();
        }
    }, [allItems]);

    // Function to add item to recent items list
    const addToRecentItems = useCallback((item: InventoryItem) => {
        try {
            const recentItemIds = JSON.parse(localStorage.getItem('recentMaterialRequestItems') || '[]') as string[];
            // Remove if already exists to avoid duplicates
            const filteredIds = recentItemIds.filter(id => id !== item.id);
            // Add to beginning of array
            const updatedIds = [item.id, ...filteredIds].slice(0, 10); // Keep max 10 recent items
            localStorage.setItem('recentMaterialRequestItems', JSON.stringify(updatedIds));
            
            // Update state
            const recent = updatedIds
                .map(id => allItems.find(i => i.id === id))
                .filter((i): i is InventoryItem => i !== undefined)
                .slice(0, 5);
            setRecentItems(recent);
        } catch (error) {
            console.error('Error saving recent item:', error);
        }
    }, [allItems]);


    const handleAddItemToOrder = useCallback((itemToAdd: InventoryItem, variant?: string, qty: number = 1) => {
        const nameAr = variant ? `${itemToAdd.nameAr} - ${variant}` : itemToAdd.nameAr;
        const nameEn = variant ? `${itemToAdd.nameEn} - ${variant}` : itemToAdd.nameEn;
        
        // Use an encoded variant suffix to keep ids safe
        const orderItemId = variant ? `${itemToAdd.id}::${encodeURIComponent(String(variant))}` : itemToAdd.id;

        setOrderItems((currentOrderItems) => {
            const existingItem = currentOrderItems.find(item => item.id === orderItemId);

            if (existingItem) {
                return currentOrderItems.map(item => 
                    item.id === orderItemId ? {...item, quantity: (item.quantity || 0) + qty} : item
                );
            } else {
                // Add new item at the beginning of the list (top)
                return [{ ...itemToAdd, id: orderItemId, nameAr, nameEn, quantity: qty, notes: '' }, ...currentOrderItems];
            }
        });

        // After adding, focus the quantity input for that item
        setFocusItemId(orderItemId);

        // Add to recent items
        addToRecentItems(itemToAdd);
    }, [addToRecentItems]);

    // When orderItems change and we have a target to focus, focus and select its quantity input
    useEffect(() => {
        if (!focusItemId) return;
        const el = qtyRefs.current[focusItemId];
        if (el) {
            try {
                // Ensure it's visible then focus
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } catch {}
            el.focus();
            el.select();
            setFocusItemId(null);
        }
    }, [orderItems, focusItemId]);
    
    const handleRemoveItem = (id: string) => {
        setOrderItems(orderItems.filter(item => item.id !== id));
    }
    
    const handleQuantityChange = (id: string, newQuantity: number) => {
        const quantity = isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity;
        
        setOrderItems(orderItems.map(item => item.id === id ? {...item, quantity: quantity } : item));
    }

    const handleNotesChange = (id: string, notes: string) => {
        setOrderItems(orderItems.map(item => item.id === id ? { ...item, notes } : item));
    }
    
    const handleSubmitOrder = async () => {
        if (orderItems.length === 0) {
            toast({ title: "Error", description: "Cannot submit an empty order.", variant: "destructive" });
            return;
        }

        if (!selectedResidence) {
            toast({ title: "Error", description: "Please select a residence for the request.", variant: "destructive" });
            return;
        }

        if (!currentUser) {
            toast({ title: "Error", description: "User not found. Please log in again.", variant: "destructive" });
            return;
        }
        
        const newOrderData = {
            residence: selectedResidence.name,
            residenceId: selectedResidence.id,
            items: orderItems,
            requestedById: currentUser.id,
            notes: generalNotes,
        };
        
        setIsSubmitting(true);
        try {
            const newOrderId = await createOrder(newOrderData);

            if (newOrderId) {
                toast({ title: "Success", description: "Your order has been submitted." });
                // Clear draft on success
                clearDraft();
                setOrderItems([]);
                router.push(`/inventory/orders/${newOrderId}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

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
        // Direct normalized contains
        if (includesNormalized(cand, searchN)) return true;
        // Alias match: if search matches any alias of a canonical and item matches that canonical
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
        addToRecentItems(newItemWithId);
        setSearchQuery('');
    };

    // Edit item dialog state so users can add/edit variants & keywords inline while creating an order
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Variant selection bookkeeping for the popover UI. Shape: { [itemId]: { [variantLabel]: true } }
    const variantSelectionsRef = useRef<Record<string, Record<string, boolean>>>({});
    // Small tick state to force re-render when the ref is updated (simple and efficient)
    const [variantTick, setVariantTick] = useState(0);

    const openEditForItem = (item: InventoryItem) => {
        setItemToEdit(item);
        setEditDialogOpen(true);
    };

    const handleItemUpdated = async (updated: InventoryItem) => {
        try {
            await updateItem(updated);
            // Close dialog
            setEditDialogOpen(false);
            setItemToEdit(null);
            // Optionally update recent items list if present
            addToRecentItems(updated);
        } catch (e) {
            console.error('Failed to update item from new order page', e);
        }
    };

    const handleResidenceChange = (residenceId: string) => {
        const residence = userResidences.find(r => r.id === residenceId);
        setSelectedResidence(residence);
        setOrderItems([]); // Clear order items when residence changes
    };
    
    const handleGetStockForResidence = (item: InventoryItem) => {
        if (!selectedResidence) return 0;
        return getStockForResidence(item, selectedResidence.id);
    }

    // Compute stock for an order item by mapping variant ids to base item ids
    const handleGetStockForOrderItem = (item: OrderItem) => {
        try {
            if (!selectedResidence) return 0;
            const rawId = (item as any).id ?? (item as any).itemId;
            if (!rawId) return 0;
            const baseItemId = String(rawId).split('-')[0];
            const baseItem = allItems.find(i => i.id === baseItemId);
            if (!baseItem) return 0;
            return getStockForResidence(baseItem, selectedResidence.id);
        } catch {
            return 0;
        }
    };

    // Helper: split name into base and detail using " - " convention
    const splitNameDetail = (name?: string): { base: string; detail: string } => {
        const raw = (name || '').trim();
        if (!raw) return { base: '', detail: '' };
        const parts = raw.split(' - ');
        if (parts.length <= 1) return { base: raw, detail: '' };
        return { base: parts[0].trim(), detail: parts.slice(1).join(' - ').trim() };
    };

    // Group current order items by category for display similar to order details page
    const groupedOrderItems = useMemo(() => {
        return orderItems.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {} as Record<string, OrderItem[]>);
    }, [orderItems]);
    
// Top-level AddItemButton for NewOrder to avoid remounting and keep popover stable
function AddItemButton({
    item,
    handleAddItemToOrder,
    variantSelectionsRef,
    disabled,
}: {
    item: InventoryItem;
    handleAddItemToOrder: (item: InventoryItem, variant?: string, qty?: number) => void;
    variantSelectionsRef: React.MutableRefObject<Record<string, Record<string, boolean>>>;
    disabled?: boolean;
}) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [, setTick] = useState(0);

    if (!item.variants || item.variants.length === 0) {
        return (
            <Button size="icon" variant="outline" onClick={() => handleAddItemToOrder(item)} disabled={disabled}>
                <Plus className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <Button size="icon" variant="outline" disabled={disabled}>
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
                                handleAddItemToOrder(item, item.variants?.[0]);
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

                            setPopoverOpen(true);
                            variantSelectionsRef.current[item.id] = {};
                            setTick(t => t + 1);
                        }}>
                            Add selected
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}


    // Allow manual clearing of draft
    const hasDraft = !!draftKey && (orderItems.length > 0 || !!generalNotes || !!selectedResidence);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Create New Material Request</h1>
                    {userResidences.length > 1 ? (
                        <div className="flex items-center gap-4 mt-2">
                             <Label htmlFor="residence-select" className="text-muted-foreground">Request for residence:</Label>
                             <Select onValueChange={handleResidenceChange} value={selectedResidence?.id || ''}>
                                <SelectTrigger id="residence-select" className="w-[250px]">
                                    <SelectValue placeholder="Select a residence" />
                                </SelectTrigger>
                                <SelectContent>
                                    {userResidences.map(res => (
                                        <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                    ) : (
                         <p className="text-muted-foreground">Request for residence: <span className="font-semibold">{selectedResidence?.name || '...'}</span></p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Last autosave indicator */}
                    {lastDraftSavedAt && (
                        <span className="text-xs text-muted-foreground mr-2">Saved {new Date(lastDraftSavedAt).toLocaleTimeString()}</span>
                    )}
                    {hasDraft && (
                        <Button variant="outline" onClick={() => { setOrderItems([]); setGeneralNotes(''); /* keep residence */ clearDraft(); }}>
                            Discard Draft
                        </Button>
                    )}
                    <Button onClick={handleSubmitOrder} disabled={orderItems.length === 0 || isSubmitting || !selectedResidence}>
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                            `Submit Request (${totalOrderQuantity} items)`
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
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Recent Items Section */}
                                    {recentItems.length > 0 && !searchQuery && selectedCategory === 'all' && (
                                        <div className="border-b pb-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Recently Used Items • الأصناف المستخدمة حديثاً
                                                </h3>
                                            </div>
                                            <div className="space-y-2">
                                                {recentItems.map(item => (
                                                    <div key={`recent-${item.id}`} className="flex items-center justify-between p-2 rounded-md border bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                                                        <div>
                                                            <p className="font-medium text-blue-900 dark:text-blue-100">{item.nameAr} / {item.nameEn}</p>
                                                            {(() => {
                                                                const stock = handleGetStockForResidence(item);
                                                                return (
                                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                                        {item.category} - {" "}
                                                                        <span className={stock > STOCK_ATTENTION_THRESHOLD ? "text-emerald-700 dark:text-emerald-400 font-semibold" : undefined}>
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
                                                            <AddItemButton item={item} handleAddItemToOrder={handleAddItemToOrder} variantSelectionsRef={variantSelectionsRef} disabled={!selectedResidence} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* All Items Section */}
                                    <div className="space-y-2">
                                        {filteredItems.length > 0 ? filteredItems.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                                                <div>
                                                    <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                                    {(() => {
                                                        const stock = handleGetStockForResidence(item);
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
                                                    <AddItemButton item={item} handleAddItemToOrder={handleAddItemToOrder} variantSelectionsRef={variantSelectionsRef} disabled={!selectedResidence} />
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
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Current Request</CardTitle>
                        <CardDescription>Review and adjust the items in your request.</CardDescription>
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
                                                                    ref={(el) => { qtyRefs.current[item.id] = el; }}
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
                                onChange={(e) => setGeneralNotes(e.target.value)}
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
            <EditItemDialog
                isOpen={editDialogOpen}
                onOpenChange={(v) => { setEditDialogOpen(v); if (!v) setItemToEdit(null); }}
                onItemUpdated={handleItemUpdated}
                item={itemToEdit}
            />
        </div>
    )

    
}
