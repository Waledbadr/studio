
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItem extends InventoryItem {
    quantity: number;
}

export default function NewOrderPage() {
    const { items: allItems, addItem, loading, loadInventory } = useInventory();
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [quantity, setQuantity] = useState(1);
    const { toast } = useToast();

    // For ComboBox
    const [open, setOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(''); // This will be the item ID
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

     useEffect(() => {
        loadInventory();
    }, [loadInventory]);


    const handleAddItemToOrder = () => {
        if (!selectedValue) {
            toast({ title: "Error", description: "Please select an item.", variant: "destructive" });
            return;
        }

        if (orderItems.find(item => item.id === selectedValue)) {
            toast({ title: "Error", description: "Item is already in the order.", variant: "destructive" });
            return;
        }

        const itemToAdd = allItems.find(item => item.id === selectedValue);
        if (itemToAdd) {
            setOrderItems([...orderItems, { ...itemToAdd, quantity }]);
            setSelectedValue('');
            setQuantity(1);
            setSearchQuery('');
        }
    };
    
    const handleRemoveItem = (id: string) => {
        setOrderItems(orderItems.filter(item => item.id !== id));
    }
    
    const handleQuantityChange = (id: string, newQuantity: number) => {
        if (newQuantity >= 1) {
            setOrderItems(orderItems.map(item => item.id === id ? {...item, quantity: newQuantity} : item));
        }
    }
    
    const handleSubmitOrder = () => {
        if (orderItems.length === 0) {
            toast({ title: "Error", description: "Cannot submit an empty order.", variant: "destructive" });
            return;
        }
        console.log("Order Submitted: ", orderItems);
        toast({ title: "Success", description: "Your order has been submitted." });
        setOrderItems([]);
    }

    const handleAddNewItem = (newItem: Omit<InventoryItem, 'id'>) => {
        addItem(newItem);
        setOpen(false);
    }
    
    const currentSelectedItem = allItems.find(item => item.id === selectedValue);

    return (
        <div className="space-y-6">
            <AddItemDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onItemAdded={handleAddNewItem}
                initialName={searchQuery}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Create New Monthly Order</CardTitle>
                    <CardDescription>Search for items from the inventory to create a new purchase order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-end gap-4">
                       <div className="flex-1">
                            <label className="text-sm font-medium">Item</label>
                            {loading ? <Skeleton className="h-10 w-full" /> : (
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between"
                                        >
                                        {currentSelectedItem
                                            ? `${currentSelectedItem.nameAr} / ${currentSelectedItem.nameEn}`
                                            : "Select item..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command shouldFilter={false}>
                                            <CommandInput 
                                                placeholder="Search item..." 
                                                value={searchQuery}
                                                onValueChange={setSearchQuery}
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className='p-4 text-sm text-center'>
                                                        No item found. <br/>
                                                        <Button 
                                                            variant="link"
                                                            className="p-0 h-auto"
                                                            onClick={() => {
                                                                setOpen(false);
                                                                setIsAddDialogOpen(true);
                                                            }}>
                                                                Add "{searchQuery}"
                                                        </Button>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {allItems
                                                    .filter(item => 
                                                        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                        item.nameAr.toLowerCase().includes(searchQuery.toLowerCase())
                                                    )
                                                    .map((item) => (
                                                    <CommandItem
                                                        key={item.id}
                                                        value={item.id}
                                                        onSelect={(currentId) => {
                                                            setSelectedValue(currentId === selectedValue ? "" : currentId);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedValue === item.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                        />
                                                        {item.nameAr} / {item.nameEn}
                                                    </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            )}
                       </div>
                       <div>
                           <label className="text-sm font-medium">Quantity</label>
                           <Input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} min="1" className="w-24"/>
                       </div>
                       <Button onClick={handleAddItemToOrder}>
                           <PlusCircle className="mr-2 h-4 w-4" />
                           Add to Order
                       </Button>
                   </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="w-[120px]">Quantity</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderItems.length > 0 ? orderItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nameAr} / {item.nameEn}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell>
                                        <Input type="number" value={item.quantity} onChange={e => handleQuantityChange(item.id, parseInt(e.target.value, 10))} min="1" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No items added to the order yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSubmitOrder}>Submit Order</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
