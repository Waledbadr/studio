"use client";

import { useState, useEffect, useRef, type ReactNode, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem } from "@/context/inventory-context";
import { Loader2, Plus, X, Languages, Eye, Box, Tag, Image as ImageIcon, Hash } from "lucide-react";
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

// Reusable section header for consistent, professional headings
const SectionHeader = ({ children, description, icon }: { children: ReactNode; description?: string; icon?: ReactNode }) => (
    <div className="mb-4">
        <div className="flex items-center gap-2 min-h-[32px]">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary mr-2">{icon}</span>
            <h3 className="text-base font-bold tracking-tight text-primary">{children}</h3>
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1 ml-8">{description}</p>}
        <div className="mt-2 border-b border-muted/40" />
    </div>
);


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
    const nameArRef = useRef<HTMLInputElement | null>(null);
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
    const [imageUrl, setImageUrl] = useState('');
    const [imageError, setImageError] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isTranslating, setIsTranslating] = useState(false);
    const { categories, items, addCategory } = useInventory();

    // Focus first input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                try { nameArRef.current?.focus(); } catch {};
            }, 50);
        }
    }, [isOpen]);

    // Keyboard submit handler: Ctrl/Cmd + Enter
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                // Use requestSubmit if available to trigger React onSubmit
                try {
                    (formRef.current as HTMLFormElement | null)?.requestSubmit?.();
                } catch {}
            }
        };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

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
            setImageUrl('');
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
        setIsTranslating(true);
        try {
            const res = await fetch('/api/translate-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: source }),
            });
            const translationResult = await res.json();
            if (!res.ok) {
                const msg = translationResult?.error || `Translation API failed: ${res.status}`;
                toast({ title: 'Translation Error', description: msg, variant: 'destructive' });
            } else {
                setNameAr(translationResult.arabicName || nameAr);
                setNameEn(translationResult.englishName || nameEn);
            }
        } catch (e: any) {
            toast({ title: 'Translation Error', description: e?.message || 'تعذر تنفيذ الترجمة.', variant: 'destructive' });
        } finally {
            setIsTranslating(false);
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
        <DialogContent className="max-w-3xl w-full max-h-[80vh] pr-8 pt-6 flex flex-col">
            <form
                id="add-item-form"
                onSubmit={(e) => handleAddItem(e, 'save')}
                className="flex-1 flex flex-col gap-6 overflow-y-auto px-0 pr-4 pb-16 custom-scrollbar"
                ref={formRef}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg">Add New Inventory Item</DialogTitle>
                    <DialogDescription className="text-sm">Enter the item name in Arabic or English and click Translate if desired. Initial stock is zero and is increased via MRV receipts.</DialogDescription>
                </DialogHeader>
                {/* Basic Info Section */}
                <section className="flex flex-col gap-4">
                    <SectionHeader icon={<Hash className="h-5 w-5 text-primary" />}>Basic Information</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2 mt-2">
                            <Label>Arabic Name</Label>
                            <Input placeholder="e.g., لمبة" value={nameAr} onChange={e => setNameAr(e.target.value)} ref={nameArRef} />
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <Label>English Name</Label>
                            <Input placeholder="e.g., Light Bulb" value={nameEn} onChange={e => setNameEn(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={handleAutoTranslate} className="gap-2" disabled={isTranslating}>
                            {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4"/>}
                            Auto Translate
                        </Button>
                        {duplicateName && <span className="text-xs text-destructive">Duplicate name already exists.</span>}
                    </div>
                </section>
                {/* Details Section */}
                <section className="flex flex-col gap-4">
                    <SectionHeader icon={<Tag className="h-5 w-5 text-primary" />}>Item Details</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Category</Label>
                            <Select onValueChange={setCategory} value={category}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                    <SelectItem value="__custom__">+ Add new category…</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCustomCategory && (
                                <Input placeholder="New category name" value={categoryCustom} onChange={e => setCategoryCustom(e.target.value)} className="mt-2" />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Unit</Label>
                            <Select onValueChange={setUnit} value={unit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventoryUnits.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                    ))}
                                    <SelectItem value="__custom__">+ Custom unit…</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCustomUnit && (
                                <Input placeholder="e.g., Bundle, Sheet…" value={unitCustom} onChange={e => setUnitCustom(e.target.value)} className="mt-2" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 md:w-1/2">
                        <Label>Lifespan</Label>
                        <div className="flex gap-2">
                            <Input type="number" placeholder="e.g., 1" value={lifespanValue} onChange={e => setLifespanValue(e.target.value)} className="w-1/2" />
                            <Select value={lifespanUnit} onValueChange={(value) => setLifespanUnit(value as LifespanUnit)}>
                                <SelectTrigger className="w-1/2">
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
                    <div className="flex flex-col gap-2">
                        <Label>Image URL</Label>
                        <Input placeholder="Optional: e.g., http://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                        {imageError && <p className="text-xs text-destructive">Invalid image URL.</p>}
                    </div>
                </section>
                {/* Variants Section */}
                <section className="flex flex-col gap-4">
                    <SectionHeader icon={<Plus className="h-5 w-5 text-primary" />}>Variants</SectionHeader>
                    <div className="flex flex-col gap-2">
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
                </section>
                {/* Keywords Section */}
                <section className="flex flex-col gap-4">
                    <SectionHeader icon={<Tag className="h-5 w-5 text-primary" />}>Keywords</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Arabic Keywords</Label>
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
                                placeholder="Type then press Enter or comma"
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
                            <p className="text-xs text-muted-foreground">Optional.</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>English Keywords</Label>
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
                </section>
                {/* Preview Section */}
                <section className="flex flex-col gap-4">
                    <SectionHeader icon={<Eye className="h-5 w-5 text-primary" />}>Preview</SectionHeader>
                    <div className="border rounded-md p-3 bg-muted/20">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2"><Eye className="h-4 w-4" /> How the item will look</div>
                        <div className="font-medium">{nameAr || '—'} / {nameEn || '—'}</div>
                        <div className="text-xs text-muted-foreground">
                            {(isCustomCategory ? categoryCustom : category) || 'Category'}
                            <span className="mx-1">•</span>
                            { (isCustomUnit ? unitCustom : unit) || 'Unit' }
                            {lifespanValue ? ` • Lifespan: ${lifespanValue} ${lifespanUnit}` : ''}
                        </div>
                        {variantList.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {variantList.map(v => <span key={v} className="rounded bg-muted px-2 py-0.5 text-xs">{v}</span>)}
                            </div>
                        )}
                        {imageUrl && (
                            <div className="mt-2">
                                <img src={imageUrl} alt="Preview" className="max-w-full h-auto rounded-md" onError={() => setImageError(true)} onLoad={() => setImageError(false)} />
                                {imageError && <p className="text-xs text-destructive mt-1">Could not load image.</p>}
                            </div>
                        )}
                    </div>
                </section>
            </form>
            <DialogFooter className="sticky bottom-2 flex flex-row gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                {onItemAddedAndOrdered && (
                    <Button type="button" variant="outline" onClick={(e) => handleAddItem(e as any, 'save-and-order')} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save & Add to Order
                    </Button>
                )}
                <Button type="submit" form="add-item-form" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Item
                </Button>
            </DialogFooter>
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

/* Add custom scrollbar styles for the dialog form */
/* Add this style block at the top or in your global CSS if not already present
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: theme('colors.primary.DEFAULT', '#3b82f6'); border-radius: 8px; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #3b82f6 #f3f4f6; } */
