
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2, Search, PlusCircle, Loader2 } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { useOrders } from '@/context/orders-context';
import type { OrderItem } from '@/context/orders-context';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';


export default function NewOrderPage() {
    const { items: allItems, loading, loadInventory, addItem } = useInventory();
    const { createOrder, loading: ordersLoading } = useOrders();
    const { currentUser, users, loadUsers } = useUsers();
    const { residences, loadResidences } = useResidences();

    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogVisible, setAddDialogVisible] = useState(false);
    const router = useRouter();


    useEffect(() => {
        loadInventory();
        if (users.length === 0) loadUsers();
        if (residences.length === 0) loadResidences();
    }, [loadInventory, loadUsers, loadResidences, users.length, residences.length]);

    const userResidenceId = currentUser?.assignedResidences?.[0];
    const userResidenceName = residences.find(r => r.id === userResidenceId)?.name || "Default Residence";


    const handleAddItemToOrder = useCallback((itemToAdd: InventoryItem) => {
        setOrderItems((currentOrderItems) => {
            const existingItem = currentOrderItems.find(item => item.id === itemToAdd.id);

            if (existingItem) {
                // If item already exists, just increment its quantity
                return currentOrderItems.map(item => 
                    item.id === itemToAdd.id ? {...item, quantity: item.quantity + 1} : item
                );
            } else {
                // Otherwise, add it to the order with quantity 1
                return [...currentOrderItems, { ...itemToAdd, quantity: 1 }];
            }
        });
    }, []);
    
    const handleRemoveItem = (id: string) => {
        setOrderItems(orderItems.filter(item => item.id !== id));
    }
    
    const handleQuantityChange = (id: string, newQuantity: number) => {
        const quantity = isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity;
        
        setOrderItems(orderItems.map(item => item.id === id ? {...item, quantity: quantity } : item));
    }
    
    const handleSubmitOrder = async () => {
        if (orderItems.length === 0) {
            toast({ title: "Error", description: "Cannot submit an empty order.", variant: "destructive" });
            return;
        }

        if (!userResidenceName || userResidenceName === "Default Residence") {
            toast({ title: "Error", description: "User has no assigned residence.", variant: "destructive" });
            return;
        }
        
        const newOrderData = {
            residence: userResidenceName,
            items: orderItems,
        };
        
        const newOrderId = await createOrder(newOrderData);

        if (newOrderId) {
            toast({ title: "Success", description: "Your order has been submitted." });
            setOrderItems([]);
            router.push(`/inventory/orders/${newOrderId}`);
        }
    }

    const filteredItems = allItems.filter(item => 
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.nameAr.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalOrderQuantity = orderItems.reduce((total, item) => total + item.quantity, 0);

    const handleNewItemAdded = (newItemWithId: InventoryItem) => {
        // This function is called from the dialog after the item is created in the DB
        handleAddItemToOrder(newItemWithId);
        setSearchQuery(''); // Clear search query
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold">Create New Material Request</h1>
                <p className="text-muted-foreground">Request for residence: <span className="font-semibold">{userResidenceName}</span></p>
                </div>
                <Button onClick={handleSubmitOrder} disabled={orderItems.length === 0 || ordersLoading}>
                    {ordersLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                        `Submit Request (${totalOrderQuantity} items)`
                    )}
                </Button>
            </div>
            
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Inventory</CardTitle>
                        <CardDescription>Click the '+' to add an item to your request.</CardDescription>
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
                                         searchQuery ? (
                                            <div className="text-center text-muted-foreground py-10">
                                                <p className="mb-4">Item not found.</p>
                                                 <Button onClick={() => setAddDialogVisible(true)}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add "{searchQuery}"
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted-foreground py-10">Start typing to search for items.</div>
                                        )
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Current Request</CardTitle>
                        <CardDescription>Review and adjust the items in your request.</CardDescription>
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
                                                    <Input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))} className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
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
                                            <TableCell colSpan={3} className="h-60 text-center text-muted-foreground">Your request is empty.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
           </div>
            <AddItemDialog
                isOpen={isAddDialogVisible}
                onOpenChange={setAddDialogVisible}
                onItemAdded={addItem}
                onItemAddedAndOrdered={handleNewItemAdded}
                initialName={searchQuery}
            />
        </div>
    )

    
}

    