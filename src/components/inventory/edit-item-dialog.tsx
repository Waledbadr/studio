'use client';

import { useState, useEffect, useTransition, useRef, useMemo, type ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { useUsers } from '@/context/users-context';
import { useLanguage } from '@/context/language-context';
import { Loader2, Plus, X, Languages, Eye, Tag, Hash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResidences } from '@/context/residences-context';

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
	const { dict } = useLanguage();
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
		<DialogContent className="max-w-3xl w-full max-h-[80vh] pr-8 pt-6 flex flex-col">
			<form id="edit-item-form" onSubmit={handleUpdateItem} className="flex-1 flex flex-col gap-6 overflow-y-auto px-0 pr-4 pb-16 custom-scrollbar" ref={formRef}>
				<DialogHeader>
					<DialogTitle className="text-lg">Edit Inventory Item</DialogTitle>
					<p className="sr-only" id="edit-item-dialog-desc">Update the item details such as names, category, unit, lifespan, variants and keywords.</p>
				</DialogHeader>
				{/* Associate description using aria-describedby for a11y linters */}
				<div aria-describedby="edit-item-dialog-desc" />

				<section className="flex flex-col gap-4">
					<SectionHeader icon={<Hash className="h-5 w-5 text-primary" />}>Basic Information</SectionHeader>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex flex-col gap-2 mt-2">
							<Label>Arabic Name</Label>
							<Input placeholder="e.g., لمبة" value={nameAr} onChange={e => setNameAr(e.target.value)} ref={nameArRef} />
						</div>
						<div className="flex flex-col gap-2 mt-2">
							<Label>{dict.englishName}</Label>
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
									{isAdmin && <SelectItem value="__custom__">+ Add new category…</SelectItem>}
								</SelectContent>
							</Select>
							{isCustomCategory && isAdmin && (
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
						<Input placeholder="Type and press Enter or comma" value={variantInput} onChange={e => setVariantInput(e.target.value)} onKeyDown={handleVariantKey} />
						<p className="text-xs text-muted-foreground">Optional.</p>
					</div>
				</section>

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
							<Input placeholder="Type then press Enter or comma" value={keywordsArInput} onChange={e => setKeywordsArInput(e.target.value)} onKeyDown={handleKeywordsArKey} />
							<p className="text-xs text-muted-foreground">Optional.</p>
						</div>
						<div className="flex flex-col gap-2">
							<Label>{dict.englishKeywords}</Label>
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
							<Input placeholder="Type then press Enter or comma" value={keywordsEnInput} onChange={e => setKeywordsEnInput(e.target.value)} onKeyDown={handleKeywordsEnKey} />
							<p className="text-xs text-muted-foreground">Optional.</p>
						</div>
					</div>
				</section>

				<section className="flex flex-col gap-4">
					<SectionHeader icon={<Eye className="h-5 w-5 text-primary" />}>Preview</SectionHeader>
					<div className="border rounded-md p-3 bg-muted/20">
						<div className="flex items-center gap-2 text-muted-foreground mb-2"><Eye className="h-4 w-4" /> How the item will look</div>
						<div className="font-medium">{nameAr || '—'} / {nameEn || '—'}</div>
						<div className="text-xs text-muted-foreground">{(isCustomCategory ? categoryCustom : category) || 'Category'}<span className="mx-1">•</span>{(isCustomUnit ? unitCustom : unit) || 'Unit'}{lifespanValue ? ` • Lifespan: ${lifespanValue} ${lifespanUnit}` : ''}</div>
						{variantList.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-2">{variantList.map(v => <span key={v} className="rounded bg-muted px-2 py-0.5 text-xs">{v}</span>)}</div>
						)}
						{imageUrl && (
							<div className="mt-2">
								<img src={imageUrl} alt="Preview" className="max-w-full h-auto rounded-md" onError={() => setImageError(true)} onLoad={() => setImageError(false)} />
								{imageError && <p className="text-xs text-destructive mt-1">Could not load image.</p>}
							</div>
						)}
					</div>
				</section>

				<section className="flex flex-col gap-2">
					<SectionHeader icon={<Plus className="h-5 w-5 text-primary" />}>Stock by Residence</SectionHeader>
					<div className="grid gap-2">
						{/* Total stock summary */}
						<div className="flex justify-between items-center text-sm font-medium p-1">
							<div className="flex items-center gap-2">
								<span className="flex items-center justify-center w-6 h-6 rounded bg-primary text-white" aria-hidden>
									{/* icon removed to avoid unused import */}
								</span>
								<span className="text-muted-foreground">الإجمالي المخزون</span>
							</div>
							<span className="font-medium text-primary">{totalStock}</span>
						</div>
						{residencesWithStock.length > 0 ? (
							residencesWithStock.map(res => (
								<div key={res.id} className="flex justify-between items-center text-sm p-1 border rounded-md" aria-hidden>
									<span className="text-muted-foreground">{res.name}</span>
									<span className="font-medium">{item?.stockByResidence?.[res.id] ?? 0}</span>
								</div>
							))
						) : (
							<p className="text-xs text-muted-foreground">لا توجد سكنات تحتوي على مخزون.</p>
						)}
					</div>
				</section>

			</form>
			<DialogFooter className="sticky bottom-2 flex flex-row gap-2 justify-end">
				<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
				<Button type="submit" form="edit-item-form" disabled={isPending}>
					{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Save Changes
				</Button>
			</DialogFooter>
		</DialogContent>
	);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>{dialogContent}</Dialog>
	);
}
