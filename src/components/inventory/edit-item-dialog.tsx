'use client';

import { useState, useEffect, useTransition, useRef, useMemo, type ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { useUsers } from '@/context/users-context';
import { Loader2, Plus, X, Languages, ChevronDown, ChevronRight, Package, Settings2, Image, Tags, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResidences } from '@/context/residences-context';
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

interface EditItemDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onItemUpdated: (item: InventoryItem) => Promise<void>;
	item: InventoryItem | null;
}

export function EditItemDialog({ isOpen, onOpenChange, onItemUpdated, item }: EditItemDialogProps) {
	const [nameAr, setNameAr] = useState('');
	const [nameEn, setNameEn] = useState('');
	const nameArRef = useRef<HTMLInputElement | null>(null);

	const [category, setCategory] = useState('');
	const [categoryCustom, setCategoryCustom] = useState('');
	const [unit, setUnit] = useState('');
	const [unitCustom, setUnitCustom] = useState('');
	const [lifespanValue, setLifespanValue] = useState<string>('');
	const [lifespanUnit, setLifespanUnit] = useState<LifespanUnit>('days');

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
	const { residences } = useResidences();
	const { currentUser } = useUsers();
	const isAdmin = currentUser?.role === 'Admin';

	// Only show residences that currently have stock for this item
	const residencesWithStock = residences.filter(res => (item?.stockByResidence?.[res.id] ?? 0) > 0);
	// Total aggregated stock across residences that have stock
	const totalStock = residencesWithStock.reduce((acc, res) => acc + (item?.stockByResidence?.[res.id] ?? 0), 0);

	useEffect(() => {
		if (item) {
			setNameAr(item.nameAr || '');
			setNameEn(item.nameEn || '');
			setCategory(item.category || '');
			setCategoryCustom('');
			setUnit(item.unit || '');
			setUnitCustom('');
			setVariantList(item.variants || []);
			setVariantInput('');
			setKeywordsArList(item.keywordsAr || []);
			setKeywordsArInput('');
			setKeywordsEnList(item.keywordsEn || []);
			setKeywordsEnInput('');
			setImageUrl('');
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

	useEffect(() => {
		if (isOpen) setTimeout(() => { try { nameArRef.current?.focus(); } catch {} }, 50);
	}, [isOpen]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault();
				try { (formRef.current as HTMLFormElement | null)?.requestSubmit?.(); } catch {}
			}
		};
		if (isOpen) window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [isOpen]);

	const isCustomCategory = category === '__custom__';
	const isCustomUnit = unit === '__custom__';

	const addChip = (value: string, listSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
		const v = value.trim();
		if (!v) return;
		listSetter((prev) => (prev.includes(v) ? prev : [...prev, v]));
	};
	const removeChip = (value: string, listSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
		listSetter((prev) => prev.filter((vv) => vv !== value));
	};

	const duplicateName = useMemo(() => {
		const norm = (s: string) => (s || '').trim().toLowerCase();
		const en = norm(nameEn);
		const ar = norm(nameAr);
		if (!items || items.length === 0) return false;
		const checkEn = en.length >= 2;
		const checkAr = ar.length >= 2;
		if (!checkEn && !checkAr) return false;
		return items.some(it => {
			if (item && it.id === item.id) return false; // ignore self
			const ien = norm((it as any).nameEn);
			const iar = norm((it as any).nameAr);
			return (checkEn && ien && ien === en) || (checkAr && iar && iar === ar);
		});
	}, [items, nameAr, nameEn, item]);

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

	const handleVariantKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const parts = variantInput.split(/[\n,]+/);
			parts.forEach(p => addChip(p, setVariantList));
			setVariantInput('');
		}
	};
	const handleKeywordsArKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const parts = keywordsArInput.split(/[\n,]+/);
			parts.forEach(p => addChip(p, setKeywordsArList));
			setKeywordsArInput('');
		}
	};
	const handleKeywordsEnKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const parts = keywordsEnInput.split(/[\n,]+/);
			parts.forEach(p => addChip(p, setKeywordsEnList));
			setKeywordsEnInput('');
		}
	};

	const handleUpdateItem = (e: React.FormEvent) => {
		e.preventDefault();
		const finalCategory = isCustomCategory ? categoryCustom.trim() : category.trim();
		const finalUnit = isCustomUnit ? unitCustom.trim() : unit.trim();

		if (!(nameAr || nameEn) || !finalCategory || !finalUnit || !item) {
			toast({ title: 'Error', description: 'املأ الحقول المطلوبة: الاسم، الفئة، ووحدة القياس.', variant: 'destructive' });
			return;
		}
		if (duplicateName) {
			toast({ title: 'Duplicate', description: 'هذا الصنف موجود مسبقًا باسم عربي أو إنجليزي.', variant: 'destructive' });
			return;
		}

		startTransition(async () => {
			try {
				let finalNameAr = nameAr.trim();
				let finalNameEn = nameEn.trim();
				if (!finalNameAr || !finalNameEn) {
					const res = await fetch('/api/translate-item', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: (finalNameAr || finalNameEn) }),
					});
					if (res.ok) {
						const t = await res.json();
						finalNameAr = finalNameAr || t.arabicName || '';
						finalNameEn = finalNameEn || t.englishName || '';
					}
				}

				let totalLifespanDays: number | undefined = undefined;
				if (lifespanValue) {
					const value = parseInt(lifespanValue, 10);
					if (isNaN(value)) {
						toast({ title: 'Validation Error', description: 'Lifespan value must be a number.', variant: 'destructive' });
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

				if (isAdmin && isCustomCategory && finalCategory) {
					try { await addCategory(finalCategory); } catch {}
				}

				const updatedItem: InventoryItem = {
					...item,
					name: finalNameEn || finalNameAr,
					nameAr: finalNameAr,
					nameEn: finalNameEn,
					category: finalCategory,
					unit: finalUnit,
					lifespanDays: totalLifespanDays,
					variants: variantList,
					keywordsAr: keywordsArList.length ? keywordsArList : undefined,
					keywordsEn: keywordsEnList.length ? keywordsEnList : undefined,
				};

				await onItemUpdated(updatedItem);
				onOpenChange(false);
			} catch (error) {
				toast({ title: 'Update Error', description: 'تعذر حفظ التغييرات.', variant: 'destructive' });
				console.error(error);
			}
		});
	};

	const dialogContent = (
		<DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden" aria-describedby="edit-item-dialog-desc">
			{/* Header */}
			<DialogHeader className="px-6 pt-6 pb-4 border-b border-muted bg-muted/40">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
						<Package className="h-5 w-5 text-primary" />
					</div>
					<div>
						<DialogTitle className="text-lg font-semibold">Edit Inventory Item</DialogTitle>
						<p className="text-xs text-muted-foreground mt-0.5" id="edit-item-dialog-desc">
							Update item details below. Stock is managed separately.
						</p>
					</div>
				</div>
			</DialogHeader>

			{/* Scrollable Content */}
			<form id="edit-item-form" onSubmit={handleUpdateItem} className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={formRef}>
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
							onKeyDown={handleVariantKey}
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
									onKeyDown={handleKeywordsArKey}
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
									onKeyDown={handleKeywordsEnKey}
									className="h-9"
								/>
							</div>
						</div>
						<p className="text-[11px] text-muted-foreground">Alternative terms to help find this item in search</p>
					</div>
				</CollapsibleSection>

				{/* Stock by Residence - Collapsible */}
				<CollapsibleSection 
					title="Stock by Residence" 
					icon={<Tags className="h-4 w-4" />}
					badge={totalStock > 0 ? `${totalStock} items` : "Empty"}
				>
					<div className="space-y-3 pt-3">
						{residencesWithStock.length > 0 ? (
							<>
								<div className="flex justify-between items-center text-sm font-medium p-2 rounded-md bg-primary/5 border border-primary/10">
									<span className="text-muted-foreground">إجمالي المخزون</span>
									<span className="font-bold text-primary">{totalStock}</span>
								</div>
								{residencesWithStock.map(res => (
									<div key={res.id} className="flex justify-between items-center text-sm p-2 border border-muted rounded-md hover:bg-muted/20 transition-colors">
										<span className="text-muted-foreground">{res.name}</span>
										<span className="font-medium">{item?.stockByResidence?.[res.id] ?? 0}</span>
									</div>
								))}
							</>
						) : (
							<p className="text-xs text-muted-foreground text-center py-4">لا توجد سكنات تحتوي على مخزون</p>
						)}
					</div>
				</CollapsibleSection>
			</form>

			{/* Footer */}
			<DialogFooter className="px-6 py-4 border-t border-muted bg-muted/40 flex-shrink-0">
				<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="sm:order-1">
						Cancel
					</Button>
					<Button type="submit" form="edit-item-form" disabled={isPending} className="sm:order-2">
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Save Changes
					</Button>
				</div>
			</DialogFooter>
		</DialogContent>
	);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>{dialogContent}</Dialog>
	);
}
