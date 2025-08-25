
'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Trash2, ArrowLeftRight, Loader2, Search } from 'lucide-react';
import { normalizeText, includesNormalized } from '@/lib/utils';
import { AR_SYNONYMS, buildNormalizedSynonyms } from '@/lib/aliases';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/context/language-context';

interface TransferItem extends InventoryItem {
    transferQuantity: number;
}

export default function NewStockTransferPage() {
    const { items, getStockForResidence, loading, createTransferRequest } = useInventory();
    const { residences } = useResidences();
    const { currentUser } = useUsers();
    const { toast } = useToast();
    const router = useRouter();
    const { dict } = useLanguage();

    const [transferType, setTransferType] = useState<'internal' | 'external'>('internal');
    const [fromResidenceId, setFromResidenceId] = useState<string>('');
    const [toResidenceId, setToResidenceId] = useState<string>('');
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const normalizedSynonyms = useMemo(() => buildNormalizedSynonyms(AR_SYNONYMS), []);

    const userResidences = useMemo(() => {
        if (!currentUser) return [];
        // For 'Transfer From', user can only select residences they are assigned to.
        return residences.filter(r => currentUser.assignedResidences.includes(r.id) || currentUser.role === 'Admin');
    }, [currentUser, residences]);

        const availableItemsForTransfer = useMemo(() => {
        if (!fromResidenceId) return [];
                const qN = normalizeText(searchQuery);
                return items
                        .filter(item => getStockForResidence(item, fromResidenceId) > 0)
                        .filter(item => {
                                if (!qN) return true;
                                                const cand = [
                                    item.nameEn,
                                    item.nameAr,
                                    item.category,
                                    ...(item.keywordsAr || []),
                                    ...(item.keywordsEn || []),
                                                    ...(item.variants || []),
                                ].filter(Boolean).join(' ');
                                if (includesNormalized(cand, qN)) return true;
                                for (const [canonN, aliasSet] of normalizedSynonyms.entries()) {
                                    if (aliasSet.has(qN)) {
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
    }, [fromResidenceId, items, getStockForResidence, searchQuery]);
    
    const availableToResidences = useMemo(() => {
        if (!fromResidenceId) return [];
        
        if (transferType === 'internal') {
            // Internal: Show other residences assigned to the user
            return userResidences.filter(r => r.id !== fromResidenceId);
        } else {
            // External: Show residences NOT assigned to the user
            const assignedIds = new Set(userResidences.map(r => r.id));
            return residences.filter(r => r.id !== fromResidenceId && !assignedIds.has(r.id));
        }
    }, [fromResidenceId, residences, userResidences, transferType]);

    const handleAddItemToTransfer = (item: InventoryItem) => {
        const existingItem = transferItems.find(i => i.id === item.id);
        if (existingItem) {
            handleQuantityChange(item.id, existingItem.transferQuantity + 1);
        } else {
            setTransferItems([...transferItems, { ...item, transferQuantity: 1 }]);
        }
    };

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        const itemInfo = items.find(i => i.id === itemId);
        if (!itemInfo) return;

        const stock = getStockForResidence(itemInfo, fromResidenceId);
        let quantity = newQuantity;
        if (quantity < 1) quantity = 1;
        if (quantity > stock) {
            quantity = stock;
            toast({ title: "Stock Limit", description: `Cannot transfer more than the available ${stock} units.`, variant: "destructive" });
        }
        
        setTransferItems(prev => prev.map(item => item.id === itemId ? { ...item, transferQuantity: quantity } : item));
    };
    
    const handleRemoveItem = (itemId: string) => {
        setTransferItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleFromResidenceChange = (id: string) => {
        setFromResidenceId(id);
        setTransferItems([]); // Reset transfer items if source changes
        if (id === toResidenceId) {
            setToResidenceId('');
        }
    };
    
    const handleTransferTypeChange = (type: 'internal' | 'external') => {
        setTransferType(type);
        // Reset destination when type changes
        setToResidenceId('');
    };
    
    const handleSubmitTransfer = async () => {
        if (!fromResidenceId || !toResidenceId || transferItems.length === 0 || !currentUser) {
            toast({ title: "Invalid Transfer", description: "Please select source, destination, and add items to transfer.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const fromResidenceName = residences.find(r => r.id === fromResidenceId)?.name || '';
            const toResidenceName = residences.find(r => r.id === toResidenceId)?.name || '';

            await createTransferRequest({
                fromResidenceId,
                fromResidenceName,
                toResidenceId,
                toResidenceName,
                requestedById: currentUser.id,
                items: transferItems.map(item => ({ id: item.id, quantity: item.transferQuantity, nameEn: item.nameEn, nameAr: item.nameAr }))
            }, currentUser);

            router.push('/inventory/transfer');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Error", description: `Transfer failed: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{dict.newStockTransferTitle}</h1>
                    <p className="text-muted-foreground">{dict.newStockTransferDescription}</p>
                </div>
                <Button onClick={handleSubmitTransfer} disabled={isSubmitting || transferItems.length === 0}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
                    {dict.submitTransferRequest}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Side: Select Residences and Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Residences & Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                 <Label>{dict.transferTypeLabel}</Label>
                             <RadioGroup value={transferType} onValueChange={handleTransferTypeChange} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="internal" id="r_internal" />
                     <Label htmlFor="r_internal">{dict.transferTypeInternal}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="external" id="r_external" />
                     <Label htmlFor="r_external">{dict.transferTypeExternal}</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        <div className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="from-residence">{dict.transferFromLabel}</Label>
                                <Select value={fromResidenceId} onValueChange={handleFromResidenceChange}>
                                    <SelectTrigger id="from-residence"><SelectValue placeholder={dict.selectSourcePlaceholder} /></SelectTrigger>
                                    <SelectContent>
                                        {userResidences.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <ArrowLeftRight className="h-6 w-6 text-muted-foreground self-center mb-2" />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="to-residence">{dict.transferToPrefix}</Label>
                                <Select value={toResidenceId} onValueChange={setToResidenceId} disabled={!fromResidenceId}>
                                    <SelectTrigger id="to-residence"><SelectValue placeholder={dict.selectDestinationPlaceholder} /></SelectTrigger>
                                    <SelectContent>
                                        {availableToResidences.length > 0 ? (
                                            availableToResidences.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)
                                        ) : (
                                            <div className="p-2 text-sm text-muted-foreground">{dict.noItemsMatchSearch}</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="relative pt-4">
                            <Search className="absolute left-2.5 top-6 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={dict.searchItemsToAddPlaceholder}
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                disabled={!fromResidenceId}
                            />
                        </div>

                        <ScrollArea className="h-[400px] border rounded-md">
                             {loading ? (
                                <div className="p-4 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                            ) : fromResidenceId ? (
                                <div className="p-2 space-y-2">
                                    {availableItemsForTransfer.length > 0 ? availableItemsForTransfer.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                                            <div>
                                                <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                                <p className="text-sm text-muted-foreground">Stock: {getStockForResidence(item, fromResidenceId)}</p>
                                            </div>
                                            <Button size="icon" variant="outline" onClick={() => handleAddItemToTransfer(item)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )) : <div className="text-center p-8 text-muted-foreground">{dict.noItemsMatchSearch}</div>}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">{dict.selectSourceToSeeItems}</div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right Side: Review Transfer */}
                <Card>
                    <CardHeader>
                        <CardTitle>{dict.transferStep2Title}</CardTitle>
                        <CardDescription>{dict.transferReviewDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[550px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{dict.itemLabel}</TableHead>
                                        <TableHead className="w-[150px] text-center">{dict.quantity}</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transferItems.length > 0 ? transferItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <p>{item.nameAr} / {item.nameEn}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.transferQuantity - 1)}><Minus className="h-4 w-4" /></Button>
                                                    <Input type="number" value={item.transferQuantity} onChange={e => handleQuantityChange(item.id, parseInt(e.target.value, 10))} className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.transferQuantity + 1)}><Plus className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-60 text-center text-muted-foreground">{dict.addItemsFromLeft}</TableCell>
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
