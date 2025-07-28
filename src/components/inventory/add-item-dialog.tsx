
'use client';

import { useState, useEffect, type ReactNode, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { translateItemName } from '@/ai/flows/translate-item-flow';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    const [name, setName] = useState(initialName);
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('');
    const [lifespanDays, setLifespanDays] = useState('');
    
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const { categories } = useInventory();

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setCategory('');
            setUnit('');
            setLifespanDays('');
        }
    }, [isOpen, initialName]);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !category || !unit) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                const translationResult = await translateItemName({ name: name });
                const lifespan = lifespanDays ? parseInt(lifespanDays, 10) : undefined;
                if (lifespanDays && isNaN(lifespan!)) {
                     toast({ title: "Validation Error", description: "Lifespan must be a number.", variant: "destructive" });
                     return;
                }

                const newInventoryItem: Omit<InventoryItem, 'id' | 'stock'> = {
                    name: name,
                    nameAr: translationResult.arabicName,
                    nameEn: translationResult.englishName,
                    category: category,
                    unit: unit,
                    stockByResidence: {},
                    lifespanDays: lifespan
                };

                const addedItem = await onItemAdded(newInventoryItem);
                
                if (addedItem && onItemAddedAndOrdered) {
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
            <form onSubmit={handleAddItem}>
                <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>Enter the item name in Arabic or English, and we'll translate it automatically. Initial stock is set to zero and managed via receiving vouchers.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-name" className="text-right">Name</Label>
                        <Input id="item-name" placeholder="e.g., Light Bulbs or مصابيح" className="col-span-3" value={name} onChange={e => setName(e.target.value)} />
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
                        <Input id="item-unit" placeholder="e.g., Piece, Box" className="col-span-3" value={unit} onChange={e => setUnit(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-lifespan" className="text-right">Lifespan (Days)</Label>
                        <Input id="item-lifespan" type="number" placeholder="e.g., 365" className="col-span-3" value={lifespanDays} onChange={e => setLifespanDays(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
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
