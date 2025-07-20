
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem, ItemCategory } from '@/context/inventory-context';

interface AddItemDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onItemAdded: (item: InventoryItem) => void;
    triggerButton?: ReactNode;
    initialName?: string;
}

export function AddItemDialog({ isOpen, onOpenChange, onItemAdded, triggerButton, initialName = '' }: AddItemDialogProps) {
    const [newItem, setNewItem] = useState({ name: initialName, category: '', unit: '', stock: '' });
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setNewItem({ name: initialName, category: '', unit: '', stock: '' });
        }
    }, [isOpen, initialName]);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.category || !newItem.unit || !newItem.stock) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }

        const newInventoryItem: InventoryItem = {
            id: `item-${Date.now()}`,
            name: newItem.name,
            category: newItem.category as ItemCategory,
            unit: newItem.unit,
            stock: parseInt(newItem.stock, 10),
        };

        onItemAdded(newInventoryItem);
        onOpenChange(false);
        setNewItem({ name: '', category: '', unit: '', stock: '' });
    };

    const dialogContent = (
         <DialogContent>
            <form onSubmit={handleAddItem}>
                <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>Fill in the details for the new item.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-name" className="text-right">Name</Label>
                    <Input id="item-name" placeholder="e.g., Light Bulbs" className="col-span-3" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-category" className="text-right">Category</Label>
                    <Select onValueChange={value => setNewItem({...newItem, category: value})} value={newItem.category}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-unit" className="text-right">Unit</Label>
                    <Input id="item-unit" placeholder="e.g., Piece, Box" className="col-span-3" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-stock" className="text-right">Stock</Label>
                    <Input id="item-stock" type="number" placeholder="e.g., 100" className="col-span-3" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} />
                </div>
                </div>
                <DialogFooter>
                <Button type="submit">Save Item</Button>
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
