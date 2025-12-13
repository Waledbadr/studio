"use client";

import { useState, useEffect, useRef, type ReactNode, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem } from "@/context/inventory-context";
import { useUsers } from "@/context/users-context";
import { Loader2, Plus, X, Languages, ChevronDown, ChevronRight, Package, Settings2, Image, Tags, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

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

// Collapsible section component for better organization
const CollapsibleSection = ({ 
    title, 
    icon, 
    children, 
    defaultOpen = false,
    badge,
    className 
}: { 
    title: string; 
    icon: ReactNode; 
    children: ReactNode; 
    defaultOpen?: boolean;
    badge?: string;
    className?: string;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("border border-muted rounded-lg bg-muted/20", className)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
                        {icon}
                    </span>
                    <span className="font-semibold text-sm">{title}</span>
                    {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
                <div className="pt-3 space-y-3 border-t border-muted/30">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

// Chip component for variants and keywords
const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
        {label}
        <button 
            type="button" 
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors" 
            onClick={onRemove}
        >
            <X className="h-3 w-3"/>
        </button>
    </span>
);


interface AddItemDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onItemAdded: (item: Omit<InventoryItem, 'id' | 'stock'>) => Promise<InventoryItem | void>;
    triggerButton?: ReactNode;
    /**
     * Initial raw name (from search box). If provided, it will be routed
     * to Arabic or English field based on detected script.
     */
    initialName?: string;
    /** Optional explicit initial Arabic / English names (override detection). */
    initialNameAr?: string;
    initialNameEn?: string;
    onItemAddedAndOrdered?: (item: InventoryItem) => void;
}

export function AddItemDialog({ 
    isOpen, 
    onOpenChange, 
    onItemAdded, 
    triggerButton, 
    initialName = '',
    initialNameAr,
    initialNameEn,
    onItemAddedAndOrdered 
}: AddItemDialogProps) {
    // Names (dual-language)
    const [nameAr, setNameAr] = useState('');
    const [nameEn, setNameEn] = useState('');
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
    // Track if we already performed auto-translation from each side to avoid loops
    const [autoTranslatedFromAr, setAutoTranslatedFromAr] = useState(false);
    const [autoTranslatedFromEn, setAutoTranslatedFromEn] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isTranslating, setIsTranslating] = useState(false);
    const { categories, items, addCategory } = useInventory();
    const { currentUser } = useUsers();
    const isAdmin = currentUser?.role === 'Admin';

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

    const isProbablyArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

    useEffect(() => {
        if (isOpen) {
            // Reset base state
            setNameAr('');
            setNameEn('');
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
            setAutoTranslatedFromAr(false);
            setAutoTranslatedFromEn(false);

            // Apply initial names if provided
            const rawAr = (initialNameAr ?? '').trim();
            const rawEn = (initialNameEn ?? '').trim();
            if (rawAr || rawEn) {
                setNameAr(rawAr);
                setNameEn(rawEn);
            } else if (initialName) {
                const trimmed = initialName.trim();
                if (trimmed) {
                    if (isProbablyArabic(trimmed)) {
                        setNameAr(trimmed);
                    } else {
                        setNameEn(trimmed);
                    }
                }
            }
        }
    }, [isOpen, initialName, initialNameAr, initialNameEn]);

    // Helper to call translation API with graceful handling
    const translateName = async (source: string) => {
        const res = await fetch('/api/translate-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: source }),
        });
        const data = await res.json();
        if (data?.error === 'TRANSLATION_DISABLED_NO_KEY') return null;
        if (!res.ok) throw new Error(data?.error || `Translation API failed: ${res.status}`);
        return data;
    };

    const addChip = (value: string, listSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const v = value.trim();
        if (!v) return;
        listSetter((prev: string[]) => (prev.includes(v) ? prev : [...prev, v]));
    };
    const removeChip = (value: string, listSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
        listSetter((prev: string[]) => prev.filter((vv: string) => vv !== value));
    };

    // Auto-translate to the other language once when user finishes typing.
    useEffect(() => {
        const source = nameAr.trim();
        if (!isOpen || !source || nameEn.trim() || autoTranslatedFromAr || isTranslating) return;

        // Debounce: wait a short delay after user stops typing
        const handle = setTimeout(async () => {
            try {
                setIsTranslating(true);
                const result = await translateName(source);
                if (result && !nameEn.trim()) {
                    setNameEn(result.englishName || nameEn);
                    setAutoTranslatedFromAr(true);
                }
            } catch {
                // ignore auto-translate errors silently; user can still edit manually
            } finally {
                setIsTranslating(false);
            }
        }, 800);

        return () => clearTimeout(handle);
    }, [nameAr, nameEn, autoTranslatedFromAr, isOpen, isTranslating]);

    useEffect(() => {
        const source = nameEn.trim();
        if (!isOpen || !source || nameAr.trim() || autoTranslatedFromEn || isTranslating) return;

        const handle = setTimeout(async () => {
            try {
                setIsTranslating(true);
                const result = await translateName(source);
                if (result && !nameAr.trim()) {
                    setNameAr(result.arabicName || nameAr);
                    setAutoTranslatedFromEn(true);
                }
            } catch {
                // ignore auto-translate errors silently
            } finally {
                setIsTranslating(false);
            }
        }, 800);

        return () => clearTimeout(handle);
    }, [nameEn, nameAr, autoTranslatedFromEn, isOpen, isTranslating]);

    const handleAutoTranslate = async () => {
        const source = (nameAr || nameEn || '').trim();
        if (!source) {
            toast({ title: 'Missing name', description: 'أدخل اسم بالعربي أو بالإنجليزي ثم اضغط ترجمة.', variant: 'destructive' });
            return;
        }
        setIsTranslating(true);
        try {
            const translationResult = await translateName(source);

            // If backend indicates translation is disabled (no API key), show soft info message
            if (!translationResult) {
                toast({
                    title: 'Auto-translate unavailable',
                    description: 'خدمة الترجمة الآلية غير مفعّلة حاليًا. يمكنك إدخال الترجمة يدويًا.',
                });
                return;
            }

            setNameAr(translationResult.arabicName || nameAr);
            setNameEn(translationResult.englishName || nameEn);
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
                    const t = await translateName(finalNameAr || finalNameEn);

                    if (!t) {
                        // translation disabled, keep whatever is provided
                        finalNameAr = finalNameAr || '';
                        finalNameEn = finalNameEn || '';
                    } else {
                        finalNameAr = finalNameAr || t.arabicName || '';
                        finalNameEn = finalNameEn || t.englishName || '';
                    }
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

                // Persist new category if needed (Admins only)
                if (isAdmin && isCustomCategory && finalCategory) {
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
        <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden" aria-describedby="add-item-dialog-desc">
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-muted bg-muted/40">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-semibold">Add New Inventory Item</DialogTitle>
                        <DialogDescription className="text-xs mt-0.5" id="add-item-dialog-desc">
                            Enter item details below. Initial stock is zero and increases via MRV receipts.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            {/* Scrollable Content */}
            <form
                id="add-item-form"
                onSubmit={(e) => handleAddItem(e, 'save')}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
                ref={formRef}
            >
                {/* Item Name Section - Always visible, most important */}
                <div className="space-y-4 p-4 border border-muted rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Languages className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Item Name</span>
                        <Badge variant="destructive" className="text-[10px] px-1.5">Required</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Arabic Name</Label>
                            <Input 
                                placeholder="مثال: لمبة" 
                                value={nameAr} 
                                onChange={e => setNameAr(e.target.value)} 
                                ref={nameArRef}
                                className="h-10"
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">English Name</Label>
                            <Input 
                                placeholder="e.g., Light Bulb" 
                                value={nameEn} 
                                onChange={e => setNameEn(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-1">
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleAutoTranslate} 
                            disabled={isTranslating}
                            className="gap-2"
                        >
                            {isTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            Auto Translate
                        </Button>
                        {isTranslating && <span className="text-xs text-muted-foreground">Translating...</span>}
                        {duplicateName && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                                <X className="h-3 w-3" /> Duplicate name exists
                            </span>
                        )}
                    </div>
                </div>

                {/* Category & Unit Section - Important, always visible */}
                <div className="space-y-4 p-4 border border-muted rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Settings2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Category & Unit</span>
                        <Badge variant="destructive" className="text-[10px] px-1.5">Required</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                            <Select onValueChange={setCategory} value={category}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                    {isAdmin && (
                                        <SelectItem value="__custom__" className="text-primary">
                                            <span className="flex items-center gap-1">
                                                <Plus className="h-3 w-3" /> Add new category
                                            </span>
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {isCustomCategory && isAdmin && (
                                <Input 
                                    placeholder="Enter new category name" 
                                    value={categoryCustom} 
                                    onChange={e => setCategoryCustom(e.target.value)} 
                                    className="h-9 mt-2"
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Unit of Measure</Label>
                            <Select onValueChange={setUnit} value={unit}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventoryUnits.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                    ))}
                                    <SelectItem value="__custom__" className="text-primary">
                                        <span className="flex items-center gap-1">
                                            <Plus className="h-3 w-3" /> Custom unit
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {isCustomUnit && (
                                <Input 
                                    placeholder="e.g., Bundle, Sheet" 
                                    value={unitCustom} 
                                    onChange={e => setUnitCustom(e.target.value)} 
                                    className="h-9 mt-2"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Optional Settings - Collapsible */}
                <CollapsibleSection 
                    title="Lifespan & Image" 
                    icon={<Image className="h-4 w-4" />}
                    badge="Optional"
                >
                    <div className="space-y-4 pt-3">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Item Lifespan</Label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="e.g., 30" 
                                    value={lifespanValue} 
                                    onChange={e => setLifespanValue(e.target.value)} 
                                    className="h-9 w-24"
                                    min="0"
                                />
                                <Select value={lifespanUnit} onValueChange={(value) => setLifespanUnit(value as LifespanUnit)}>
                                    <SelectTrigger className="h-9 w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="days">Days</SelectItem>
                                        <SelectItem value="months">Months</SelectItem>
                                        <SelectItem value="years">Years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-[11px] text-muted-foreground">How long the item typically lasts before replacement</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Image URL</Label>
                            <Input 
                                placeholder="https://example.com/image.jpg" 
                                value={imageUrl} 
                                onChange={e => { setImageUrl(e.target.value); setImageError(false); }}
                                className="h-9"
                            />
                            {imageUrl && !imageError && (
                                <div className="mt-2 p-2 border rounded-md bg-muted/20">
                                    <img 
                                        src={imageUrl} 
                                        alt="Preview" 
                                        className="max-h-24 rounded object-contain mx-auto" 
                                        onError={() => setImageError(true)} 
                                        onLoad={() => setImageError(false)} 
                                    />
                                </div>
                            )}
                            {imageError && <p className="text-xs text-destructive">Could not load image</p>}
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Variants - Collapsible */}
                <CollapsibleSection 
                    title="Variants" 
                    icon={<Plus className="h-4 w-4" />}
                    badge={variantList.length > 0 ? `${variantList.length} added` : "Optional"}
                >
                    <div className="space-y-3 pt-3">
                        {variantList.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {variantList.map(v => (
                                    <Chip key={v} label={v} onRemove={() => removeChip(v, setVariantList)} />
                                ))}
                            </div>
                        )}
                        <Input
                            placeholder="Type variant and press Enter (e.g., Red, Blue, Large)"
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
                            className="h-9"
                        />
                        <p className="text-[11px] text-muted-foreground">Different versions of the same item (sizes, colors, etc.)</p>
                    </div>
                </CollapsibleSection>

                {/* Keywords - Collapsible */}
                <CollapsibleSection 
                    title="Search Keywords" 
                    icon={<Tags className="h-4 w-4" />}
                    badge={keywordsArList.length + keywordsEnList.length > 0 ? `${keywordsArList.length + keywordsEnList.length} added` : "Optional"}
                >
                    <div className="space-y-4 pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Arabic Keywords</Label>
                                {keywordsArList.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {keywordsArList.map(v => (
                                            <Chip key={v} label={v} onRemove={() => removeChip(v, setKeywordsArList)} />
                                        ))}
                                    </div>
                                )}
                                <Input
                                    placeholder="كلمات بحث، اضغط Enter"
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
                                    className="h-9"
                                    dir="rtl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">English Keywords</Label>
                                {keywordsEnList.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {keywordsEnList.map(v => (
                                            <Chip key={v} label={v} onRemove={() => removeChip(v, setKeywordsEnList)} />
                                        ))}
                                    </div>
                                )}
                                <Input
                                    placeholder="Search terms, press Enter"
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
                                    className="h-9"
                                />
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Alternative terms to help find this item in search</p>
                    </div>
                </CollapsibleSection>
            </form>

            {/* Footer */}
            <DialogFooter className="px-6 py-4 border-t border-muted bg-muted/40 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="sm:order-1">
                        Cancel
                    </Button>
                    {onItemAddedAndOrdered && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={(e) => handleAddItem(e as any, 'save-and-order')} 
                            disabled={isPending}
                            className="sm:order-2"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & Add to Order
                        </Button>
                    )}
                    <Button type="submit" form="add-item-form" disabled={isPending} className="sm:order-3">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Item
                    </Button>
                </div>
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
