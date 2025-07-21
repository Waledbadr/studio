
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2, Search } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderItem extends InventoryItem {
    quantity: number;
}

export default function NewOrderPage() {
    const { items: allItems, loading, loadInventory } = useInventory();
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');

     useEffect(() => {
        loadInventory();
    }, [loadInventory]);


    const handleAddItemToOrder = (itemToAdd: InventoryItem) => {
        const existingItem = orderItems.find(item => item.id === itemToAdd.id);

        if (existingItem) {
            // If item already exists, just increment its quantity
            handleQuantityChange(itemToAdd.id, existingItem.quantity + 1);
        } else {
            // Otherwise, add it to the order with quantity 1
            setOrderItems([...orderItems, { ...itemToAdd, quantity: 1 }]);
        }
    };
    
    const handleRemoveItem = (id: string) => {
        setOrderItems(orderItems.filter(item => item.id !== id));
    }
    
    const handleQuantityChange = (id: string, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemoveItem(id); // Remove item if quantity goes below 1
        } else {
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

    const filteredItems = allItems.filter(item => 
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.nameAr.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalOrderQuantity = orderItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold">Create New Monthly Order</h1>
                <p className="text-muted-foreground">Select items from the inventory to build your purchase order.</p>
                </div>
                <Button onClick={handleSubmitOrder} disabled={orderItems.length === 0}>
                    Submit Order ({totalOrderQuantity} items)
                </Button>
            </div>
            
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Inventory</CardTitle>
                        <CardDescription>Click the '+' to add an item to your order.</CardDescription>
                         <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="search"
                                placeholder="Search items..."
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[450px]">
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredItems.length > 0 ? filteredItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                                            <div>
                                                <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                                <p className="text-sm text-muted-foreground">{item.category} - Stock: {item.stock} {item.unit}</p>
                                            </div>
                                            <Button size="icon" variant="outline" onClick={() => handleAddItemToOrder(item)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )) : (
                                        <div className="text-center text-muted-foreground py-10">No items match your search.</div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Current Order</CardTitle>
                        <CardDescription>Review and adjust the items in your order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[450px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-[150px] text-center">Quantity</TableHead>
                                        <TableHead className="text-right w-[50px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderItems.length > 0 ? orderItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.nameAr} / {item.nameEn}
                                                <div className="text-xs text-muted-foreground">{item.category}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input type="number" value={item.quantity} readOnly className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-60 text-center text-muted-foreground">Your order is empty.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
           </div>
        </div>
    )
}

    