'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResidences } from '@/context/residences-context';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';

type LifespanUnit = 'days' | 'months' | 'years';

const inventoryUnits = [
    { value: 'Piece', label: 'قطعة (Piece)' },
    { value: 'Can', label: 'علبة (Can)' },
    { value: 'Box', label: 'كرتون (Box)' },
    { value: 'Pack', label: 'باقة (Pack)' },
    { value: 'Set', label: 'مجموعة (Set)' },
    { value: 'Meter', label: 'متر (Meter)' },
    { value: 'Kilogram', label: 'كيلوجرام (Kilogram)' },
    { value: 'Liter', label: 'لتر (Liter)' },
    { value: 'Pair', label: 'زوج (Pair)' },
    { value: 'Dozen', label: 'درزن (Dozen)' },
    { value: 'Ream', label: 'رزمة (Ream)' },
    { value: 'Roll', label: 'لفة (Roll)' },
    { value: 'Bag', label: 'كيس (Bag)' },
];


interface EditItemDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onItemUpdated: (item: InventoryItem) => Promise<void>;
    item: InventoryItem | null;
}

export function EditItemDialog({ 
    isOpen, 
    onOpenChange, 
    onItemUpdated, 
    item
}: EditItemDialogProps) {
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('');
    const [lifespanValue, setLifespanValue] = useState<string>('');
    const [lifespanUnit, setLifespanUnit] = useState<LifespanUnit>('days');
    const [variants, setVariants] = useState('');
    const [keywordsAr, setKeywordsAr] = useState('');
    const [keywordsEn, setKeywordsEn] = useState('');

    
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const { categories } = useInventory();
    const { residences } = useResidences();

    useEffect(() => {
        if (item) {
            setNameEn(item.nameEn);
            setNameAr(item.nameAr);
            setCategory(item.category);
            setUnit(item.unit);
            setVariants(item.variants?.join(', ') || '');
            setKeywordsAr(item.keywordsAr?.join(', ') || '');
            setKeywordsEn(item.keywordsEn?.join(', ') || '');

            if (item.lifespanDays) {
                if (item.lifespanDays >= 365 && item.lifespanDays % 365 === 0) {
                    setLifespanValue(String(item.lifespanDays / 365));
                    setLifespanUnit('years');
                } else if (item.lifespanDays >= 30 && item.lifespanDays % 30 === 0) {
                    setLifespanValue(String(item.lifespanDays / 30));
                    setLifespanUnit('months');
                } else {
                    setLifespanValue(String(item.lifespanDays));
                    setLifespanUnit('days');
                }
            } else {
                setLifespanValue('');
                setLifespanUnit('days');
            }
        }
    }, [item]);

    const handleUpdateItem = (e: React.FormEvent) => {
        e.preventDefault();

        if (!nameEn || !nameAr || !category || !unit || !item) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }
        
        let totalLifespanDays = 0;
        if (lifespanValue) {
            const value = parseInt(lifespanValue, 10);
            if (isNaN(value)) {
                toast({ title: "Validation Error", description: "Lifespan value must be a number.", variant: "destructive" });
                return;
            }
            if (lifespanUnit === 'months') {
                totalLifespanDays = value * 30;
            } else if (lifespanUnit === 'years') {
                totalLifespanDays = value * 365;
            } else {
                totalLifespanDays = value;
            }
        }

        const variantList = variants.split(/[\n,]+/).map(v => v.trim()).filter(v => v);
    const kwArList = keywordsAr.split(/[\n,]+/).map(v => v.trim()).filter(v => v);
    const kwEnList = keywordsEn.split(/[\n,]+/).map(v => v.trim()).filter(v => v);


        startTransition(async () => {
            const updatedItem: InventoryItem = {
                ...item,
                name: nameAr, // Default to Arabic name for the generic 'name' field
                nameAr: nameAr,
                nameEn: nameEn,
                category: category,
                unit: unit,
                lifespanDays: totalLifespanDays,
                variants: variantList,
                keywordsAr: kwArList.length ? kwArList : undefined,
                keywordsEn: kwEnList.length ? kwEnList : undefined,
            };

            await onItemUpdated(updatedItem);
            onOpenChange(false);
        });
    };
    
    return (
         <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <form onSubmit={handleUpdateItem}>
                    <DialogHeader>
                        <DialogTitle>Edit Inventory Item</DialogTitle>
                        <DialogDescription>Update the details for this item. Stock is managed via Material Receipt Vouchers.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-name-en" className="text-right">English Name</Label>
                            <Input id="item-name-en" className="col-span-3" value={nameEn} onChange={e => setNameEn(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-name-ar" className="text-right">Arabic Name</Label>
                            <Input id="item-name-ar" className="col-span-3" value={nameAr} onChange={e => setNameAr(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-category" className="text-right">Category</Label>
                            <Select onValueChange={setCategory} value={category}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-unit" className="text-right">Unit</Label>
                             <Select onValueChange={setUnit} value={unit}>
                                <SelectTrigger id="item-unit" className="col-span-3">
                                    <SelectValue placeholder="Select a unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventoryUnits.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>
                                            {u.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-lifespan" className="text-right">Lifespan</Label>
                             <div className="col-span-3 grid grid-cols-3 gap-2">
                                <Input id="item-lifespan" type="number" placeholder="e.g., 1" className="col-span-1" value={lifespanValue} onChange={e => setLifespanValue(e.target.value)} />
                                <Select value={lifespanUnit} onValueChange={(value) => setLifespanUnit(value as LifespanUnit)}>
                                    <SelectTrigger className="col-span-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="days">Days</SelectItem>
                                        <SelectItem value="months">Months</SelectItem>
                                        <SelectItem value="years">Years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4 pt-2">
                            <Label htmlFor="item-variants" className="text-right mt-2">Variants</Label>
                            <div className="col-span-3">
                                <Textarea 
                                    id="item-variants" 
                                    placeholder="e.g., 1000g, 1200g, 1500g" 
                                    className="col-span-3" 
                                    value={variants} 
                                    onChange={e => setVariants(e.target.value)} 
                                />
                                <p className="text-xs text-muted-foreground mt-1">Separate variants with a comma or new line. Leave blank if none.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="item-keywords-ar" className="text-right mt-2">Arabic Keywords</Label>
                            <div className="col-span-3">
                                <Textarea
                                    id="item-keywords-ar"
                                    placeholder="مثال: بوية, صبغ, طلاء"
                                    className="col-span-3"
                                    value={keywordsAr}
                                    onChange={e => setKeywordsAr(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">افصل بين الكلمات بفاصلة أو سطر جديد. اختياري.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="item-keywords-en" className="text-right mt-2">English Keywords</Label>
                            <div className="col-span-3">
                                <Textarea
                                    id="item-keywords-en"
                                    placeholder="e.g., paint, dye, coating"
                                    className="col-span-3"
                                    value={keywordsEn}
                                    onChange={e => setKeywordsEn(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Separate with a comma or new line. Optional.</p>
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                             <Label>Stock by Residence</Label>
                             <ScrollArea className="h-32 rounded-md border p-2">
                                <div className="space-y-2">
                                     {residences.map(res => (
                                        <div key={res.id} className="flex justify-between items-center text-sm p-1">
                                            <span className="text-muted-foreground">{res.name}</span>
                                            <span className="font-medium">{item?.stockByResidence?.[res.id] || 0}</span>
                                        </div>
                                     ))}
                                </div>
                             </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
