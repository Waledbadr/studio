
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
    const [lifespanDays, setLifespanDays] = useState<string | number>('');

    
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
            setLifespanDays(item.lifespanDays || '');
        }
    }, [item]);

    const handleUpdateItem = (e: React.FormEvent) => {
        e.preventDefault();

        if (!nameEn || !nameAr || !category || !unit || !item) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }

        const lifespan = lifespanDays ? parseInt(String(lifespanDays), 10) : undefined;
        if (lifespanDays && isNaN(lifespan!)) {
            toast({ title: "Validation Error", description: "Lifespan must be a number.", variant: "destructive" });
            return;
        }


        startTransition(async () => {
            const updatedItem: InventoryItem = {
                ...item,
                name: nameAr, // Default to Arabic name for the generic 'name' field
                nameAr: nameAr,
                nameEn: nameEn,
                category: category,
                unit: unit,
                lifespanDays: lifespan
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
                            <Input id="item-unit" className="col-span-3" value={unit} onChange={e => setUnit(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-lifespan" className="text-right">Lifespan (Days)</Label>
                            <Input id="item-lifespan" type="number" placeholder="e.g., 365" className="col-span-3" value={lifespanDays} onChange={e => setLifespanDays(e.target.value)} />
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
