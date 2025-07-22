
'use client';

import { useState, useEffect, type ReactNode, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventory, type InventoryItem, type ItemCategory } from '@/context/inventory-context';
import { translateItemName } from '@/ai/flows/translate-item-flow';
import { Loader2, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface AddItemDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onItemAdded: (item: Omit<InventoryItem, 'id'>) => Promise<InventoryItem | void>;
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
    const [stock, setStock] = useState('');
    
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const { categories } = useInventory();
    const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);


    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setCategory('');
            setUnit('');
            setStock('');
        }
    }, [isOpen, initialName]);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category || !unit || !stock) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                const translationResult = await translateItemName({ name: name });

                const newInventoryItem: Omit<InventoryItem, 'id'> = {
                    name: name,
                    nameAr: translationResult.arabicName,
                    nameEn: translationResult.englishName,
                    category: category.toLowerCase().trim(),
                    unit: unit,
                    stock: parseInt(stock, 10),
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
                <DialogDescription>Enter the item name in Arabic or English, and we'll translate it automatically.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-name" className="text-right">Name</Label>
                    <Input id="item-name" placeholder="e.g., Light Bulbs or مصابيح" className="col-span-3" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-category" className="text-right">Category</Label>
                     <Popover open={isCategoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={isCategoryPopoverOpen} className="w-full justify-between col-span-3">
                                {category ? categories.find(c => c.toLowerCase() === category.toLowerCase()) || 'Select category...' : 'Select category...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                           <Command>
                                <CommandInput placeholder="Search or add category..." onValueChange={setCategory} value={category}/>
                                <CommandList>
                                    <CommandEmpty>No category found. Type to add.</CommandEmpty>
                                    <CommandGroup>
                                        {categories.map((cat) => (
                                            <CommandItem
                                                key={cat}
                                                value={cat}
                                                onSelect={(currentValue) => {
                                                    setCategory(currentValue === category ? '' : currentValue);
                                                    setCategoryPopoverOpen(false);
                                                }}
                                            >
                                                {cat}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                           </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-unit" className="text-right">Unit</Label>
                    <Input id="item-unit" placeholder="e.g., Piece, Box" className="col-span-3" value={unit} onChange={e => setUnit(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-stock" className="text-right">Stock</Label>
                    <Input id="item-stock" type="number" placeholder="e.g., 100" className="col-span-3" value={stock} onChange={e => setStock(e.target.value)} />
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
