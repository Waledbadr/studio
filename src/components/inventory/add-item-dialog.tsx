"use client";

import { useState, useEffect, type ReactNode, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem } from "@/context/inventory-context";
import { Loader2, Plus, X, Languages, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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


interface AddItemDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onItemAdded: (item: Omit<InventoryItem, 'id' | 'stock'>) => Promise<InventoryItem | void>;
    triggerButton?: ReactNode;
    initialName?: string;
    onItemAddedAndOrdered?: (item: InventoryItem) => void;
}

export function AddItemDialog({ 
    isOpen, 
    onOpenChange, 
    onItemAdded, 
    triggerButton, 
    initialName = '',
    onItemAddedAndOrdered 
}: AddItemDialogProps) {
    // Names (dual-language)
    const [nameAr, setNameAr] = useState('');
    const [nameEn, setNameEn] = useState(initialName);
    // Category/Unit (with optional custom)
    const [category, setCategory] = useState('');
    const [categoryCustom, setCategoryCustom] = useState('');
    const [unit, setUnit] = useState('');
    const [unitCustom, setUnitCustom] = useState('');
    const [lifespanValue, setLifespanValue] = useState<string>('');
    const [lifespanUnit, setLifespanUnit] = useState<LifespanUnit>('days');
    // Chip inputs
    const [variantList, setVariantList] = useState<string[]>([]);
    const [variantInput, setVariantInput] = useState('');
    const [keywordsArList, setKeywordsArList] = useState<string[]>([]);
    const [keywordsArInput, setKeywordsArInput] = useState('');
    const [keywordsEnList, setKeywordsEnList] = useState<string[]>([]);
    const [keywordsEnInput, setKeywordsEnInput] = useState('');
    
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const { categories, items, addCategory } = useInventory();

    const isCustomCategory = category === '__custom__';
    const isCustomUnit = unit === '__custom__';

    const duplicateName = useMemo(() => {
        const norm = (s: string) => (s || '').trim().toLowerCase();
        const en = norm(nameEn);
        const ar = norm(nameAr);
        if (!items || items.length === 0) return false;
        const checkEn = en.length >= 2;
        const checkAr = ar.length >= 2;
        if (!checkEn && !checkAr) return false; // don't flag duplicates for empty/very short input
        return items.some(it => {
            const ien = norm((it as any).nameEn);
            const iar = norm((it as any).nameAr);
            return (checkEn && ien && ien === en) || (checkAr && iar && iar === ar);
        });
    }, [items, nameAr, nameEn]);

    useEffect(() => {
        if (isOpen) {
            setNameAr('');
            setNameEn(initialName || '');
            setCategory('');
            setCategoryCustom('');
            setUnit('');
            setUnitCustom('');
            setLifespanValue('');
            setLifespanUnit('days');
            setVariantList([]);
            setVariantInput('');
            setKeywordsArList([]);
            setKeywordsArInput('');
            setKeywordsEnList([]);
            setKeywordsEnInput('');
        }
    }, [isOpen, initialName]);

    const addChip = (value: string, listSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const v = value.trim();
        if (!v) return;
        listSetter((prev: string[]) => (prev.includes(v) ? prev : [...prev, v]));
    };
    const removeChip = (value: string, listSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
        listSetter((prev: string[]) => prev.filter((vv: string) => vv !== value));
    };

    const handleAutoTranslate = async () => {
        const source = (nameAr || nameEn || '').trim();
        if (!source) {
            toast({ title: 'Missing name', description: 'أدخل اسم بالعربي أو بالإنجليزي ثم اضغط ترجمة.', variant: 'destructive' });
            return;
        }
        try {
            const res = await fetch('/api/translate-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: source }),
            });
            if (!res.ok) throw new Error(`Translation API failed: ${res.status}`);
            const translationResult = await res.json();
            setNameAr(translationResult.arabicName || nameAr);
            setNameEn(translationResult.englishName || nameEn);
        } catch (e) {
            toast({ title: 'Translation Error', description: 'تعذر تنفيذ الترجمة.', variant: 'destructive' });
        }
    };

    const handleAddItem = (e: React.FormEvent, action: 'save' | 'save-and-order' = 'save') => {
        e.preventDefault();

        // Resolve category/unit values (custom or selected)
        const finalCategory = isCustomCategory ? categoryCustom.trim() : category.trim();
        const finalUnit = isCustomUnit ? unitCustom.trim() : unit.trim();

        if (!(nameAr || nameEn) || !finalCategory || !finalUnit) {
            toast({ title: 'Error', description: 'املأ الحقول المطلوبة: الاسم، الفئة، ووحدة القياس.', variant: 'destructive' });
            return;
        }
        if (duplicateName) {
            toast({ title: 'Duplicate', description: 'هذا الصنف موجود مسبقًا بالاسم العربي أو الإنجليزي.', variant: 'destructive' });
            return;
        }

        startTransition(async () => {
            try {
                // Ensure both language names exist (auto-translate if one is empty)
                let finalNameAr = nameAr.trim();
                let finalNameEn = nameEn.trim();
                if (!finalNameAr || !finalNameEn) {
                    const res = await fetch('/api/translate-item', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: (finalNameAr || finalNameEn) }),
                    });
                    if (!res.ok) throw new Error(`Translation API failed: ${res.status}`);
                    const t = await res.json();
                    finalNameAr = finalNameAr || t.arabicName || '';
                    finalNameEn = finalNameEn || t.englishName || '';
                }

                let totalLifespanDays: number | undefined = undefined;
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

                // Persist new category if needed
                if (isCustomCategory && finalCategory) {
                    try { await addCategory(finalCategory); } catch {}
                }

                const newInventoryItem: Omit<InventoryItem, 'id' | 'stock'> = {
                    name: finalNameEn || finalNameAr,
                    nameAr: finalNameAr,
                    nameEn: finalNameEn,
                    category: finalCategory,
                    unit: finalUnit,
                    stockByResidence: {},
                    lifespanDays: totalLifespanDays,
                    variants: variantList,
                    keywordsAr: keywordsArList.length ? keywordsArList : undefined,
                    keywordsEn: keywordsEnList.length ? keywordsEnList : undefined,
                };

                const addedItem = await onItemAdded(newInventoryItem);
                
                if (addedItem && onItemAddedAndOrdered && action === 'save-and-order') {
                    onItemAddedAndOrdered(addedItem);
                }

                onOpenChange(false);
            } catch (error) {
                 toast({ title: "Translation Error", description: "Could not translate item name.", variant: "destructive" });
                 console.error(error);
            }
        });
    };
    
    const dialogContent = (
         <DialogContent>
            <form onSubmit={(e) => handleAddItem(e, 'save')}>
                <DialogHeader>
                    <DialogTitle>Add New Inventory Item</DialogTitle>
                    <DialogDescription>اكتب اسم الصنف بالعربي أو الإنجليزي واضغط ترجمة إن رغبت؛ المخزون الابتدائي صفر ويتم زيادته عبر سندات الاستلام (MRV).</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Names row */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Name (AR / EN)</Label>
                        <div className="col-span-3 grid grid-cols-3 gap-2">
                            <Input placeholder="مثال: لمبة" value={nameAr} onChange={e => setNameAr(e.target.value)} />
                            <Input placeholder="e.g., Light Bulb" value={nameEn} onChange={e => setNameEn(e.target.value)} />
                            <Button type="button" variant="secondary" onClick={handleAutoTranslate} className="gap-2"><Languages className="h-4 w-4"/> Translate</Button>
                        </div>
                    </div>
                    {/* Category */}
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
                                <SelectItem value="__custom__">+ Add new category…</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isCustomCategory && (
                        <div className="grid grid-cols-4 items-center gap-4 -mt-2">
                            <div />
                            <Input placeholder="New category name" className="col-span-3" value={categoryCustom} onChange={e => setCategoryCustom(e.target.value)} />
                        </div>
                    )}
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
                                <SelectItem value="__custom__">+ Custom unit…</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isCustomUnit && (
                        <div className="grid grid-cols-4 items-center gap-4 -mt-2">
                            <div />
                            <Input placeholder="e.g., Bundle, Sheet…" className="col-span-3" value={unitCustom} onChange={e => setUnitCustom(e.target.value)} />
                        </div>
                    )}
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
                    {/* Variants chips */}
                    <div className="grid grid-cols-4 items-start gap-4 pt-2">
                        <Label className="text-right mt-2">Variants</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {variantList.map(v => (
                                    <span key={v} className="inline-flex items-center rounded border px-2 py-1 text-xs">
                                        {v}
                                        <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => removeChip(v, setVariantList)}>
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <Input
                                placeholder="Type and press Enter or comma"
                                value={variantInput}
                                onChange={e => setVariantInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault();
                                        const parts = variantInput.split(/[\n,]+/);
                                        parts.forEach(p => addChip(p, setVariantList));
                                        setVariantInput('');
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Optional.</p>
                        </div>
                    </div>
                    {/* Keywords AR */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">Arabic Keywords</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {keywordsArList.map(v => (
                                    <span key={v} className="inline-flex items-center rounded border px-2 py-1 text-xs">
                                        {v}
                                        <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => removeChip(v, setKeywordsArList)}>
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <Input
                                placeholder="اكتب ثم اضغط Enter أو فاصلة"
                                value={keywordsArInput}
                                onChange={e => setKeywordsArInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault();
                                        const parts = keywordsArInput.split(/[\n,]+/);
                                        parts.forEach(p => addChip(p, setKeywordsArList));
                                        setKeywordsArInput('');
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground">اختياري.</p>
                        </div>
                    </div>
                    {/* Keywords EN */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">English Keywords</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {keywordsEnList.map(v => (
                                    <span key={v} className="inline-flex items-center rounded border px-2 py-1 text-xs">
                                        {v}
                                        <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => removeChip(v, setKeywordsEnList)}>
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <Input
                                placeholder="Type then press Enter or comma"
                                value={keywordsEnInput}
                                onChange={e => setKeywordsEnInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault();
                                        const parts = keywordsEnInput.split(/[\n,]+/);
                                        parts.forEach(p => addChip(p, setKeywordsEnList));
                                        setKeywordsEnInput('');
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Optional.</p>
                        </div>
                    </div>
                    {/* Preview */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">Preview</Label>
                        <div className="col-span-3 text-sm border rounded-md p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2"><Eye className="h-4 w-4"/> How it will look</div>
                            <div className="font-medium">{nameAr || '—'} / {nameEn || '—'}</div>
                            <div className="text-xs text-muted-foreground">{(isCustomCategory ? categoryCustom : category) || 'Category'} • { (isCustomUnit ? unitCustom : unit) || 'Unit' } {lifespanValue ? `• Lifespan: ${lifespanValue} ${lifespanUnit}` : ''}</div>
                            {variantList.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {variantList.map(v => <span key={v} className="rounded bg-muted px-2 py-0.5 text-xs">{v}</span>)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    {duplicateName && <span className="text-xs text-destructive mr-auto">اسم مشابه موجود بالفعل.</span>}
                    {onItemAddedAndOrdered && (
                        <Button type="button" variant="outline" onClick={(e) => handleAddItem(e as any, 'save-and-order')} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save & Add to Order
                        </Button>
                    )}
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Item
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );

    if (triggerButton) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                {dialogContent}
            </Dialog>
        );
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
           {dialogContent}
        </Dialog>
    );
}
