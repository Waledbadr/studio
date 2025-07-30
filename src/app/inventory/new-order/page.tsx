
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2, Search, PlusCircle, Loader2, ChevronDown } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { useOrders } from '@/context/orders-context';
import type { OrderItem } from '@/context/orders-context';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Complex } from '@/context/residences-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


export default function NewOrderPage() {
    const { items: allItems, loading, loadInventory, addItem, categories, getStockForResidence } = useInventory();
    const { createOrder, loading: ordersLoading } = useOrders();
    const { currentUser, users, loadUsers } = useUsers();
    const { residences, loadResidences } = useResidences();

    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedResidence, setSelectedResidence] = useState<Complex | undefined>(undefined);
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isAddDialogVisible, setAddDialogVisible] = useState(false);
    const router = useRouter();


    useEffect(() => {
        loadInventory();
        if (users.length === 0) loadUsers();
        if (residences.length === 0) loadResidences();
    }, [loadInventory, loadUsers, loadResidences, users.length, residences.length]);

    const userResidences = currentUser?.assignedResidences
        ?.map(id => residences.find(r => r.id === id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined) || [];

    useEffect(() => {
        if (userResidences.length === 1) {
            setSelectedResidence(userResidences[0]);
        }
    }, [currentUser, residences, userResidences]);


    const handleAddItemToOrder = useCallback((itemToAdd: InventoryItem, variant?: string) => {
        const nameAr = variant ? `${itemToAdd.nameAr} - ${variant}` : itemToAdd.nameAr;
        const nameEn = variant ? `${itemToAdd.nameEn} - ${variant}` : itemToAdd.nameEn;
        
        // Use a unique ID for each variant to allow adding multiple variants of the same item
        const orderItemId = variant ? `${itemToAdd.id}-${variant}` : itemToAdd.id;

        setOrderItems((currentOrderItems) => {
            const existingItem = currentOrderItems.find(item => item.id === orderItemId);

            if (existingItem) {
                return currentOrderItems.map(item => 
                    item.id === orderItemId ? {...item, quantity: item.quantity + 1} : item
                );
            } else {
                return [...currentOrderItems, { ...itemToAdd, id: orderItemId, nameAr, nameEn, quantity: 1 }];
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

        if (!selectedResidence) {
            toast({ title: "Error", description: "Please select a residence for the request.", variant: "destructive" });
            return;
        }

        if (!currentUser) {
            toast({ title: "Error", description: "User not found. Please log in again.", variant: "destructive" });
            return;
        }
        
        const newOrderData = {
            residence: selectedResidence.name,
            residenceId: selectedResidence.id,
            items: orderItems,
            requestedById: currentUser.id,
        };
        
        const newOrderId = await createOrder(newOrderData);

        if (newOrderId) {
            toast({ title: "Success", description: "Your order has been submitted." });
            setOrderItems([]);
            router.push(`/inventory/orders/${newOrderId}`);
        }
    }

    const filteredItems = allItems.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.nameAr.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const totalOrderQuantity = orderItems.reduce((total, item) => total + item.quantity, 0);

    const handleNewItemAdded = (newItemWithId: InventoryItem) => {
        handleAddItemToOrder(newItemWithId);
        setSearchQuery('');
    };

    const handleResidenceChange = (residenceId: string) => {
        const residence = userResidences.find(r => r.id === residenceId);
        setSelectedResidence(residence);
        setOrderItems([]); // Clear order items when residence changes
    };
    
    const handleGetStockForResidence = (item: InventoryItem) => {
        if (!selectedResidence) return 0;
        return getStockForResidence(item, selectedResidence.id);
    }
    
    const AddItemButton = ({ item }: { item: InventoryItem }) => {
        if (!item.variants || item.variants.length === 0) {
            return (
                <Button size="icon" variant="outline" onClick={() => handleAddItemToOrder(item)} disabled={!selectedResidence}>
                    <Plus className="h-4 w-4" />
                </Button>
            );
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline" disabled={!selectedResidence}>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {item.variants.map(variant => (
                        <DropdownMenuItem key={variant} onClick={() => handleAddItemToOrder(item, variant)}>
                            Add: {variant}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };


    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Create New Material Request</h1>
                    {userResidences.length > 1 ? (
                        <div className="flex items-center gap-4 mt-2">
                             <Label htmlFor="residence-select" className="text-muted-foreground">Request for residence:</Label>
                             <Select onValueChange={handleResidenceChange} value={selectedResidence?.id}>
                                <SelectTrigger id="residence-select" className="w-[250px]">
                                    <SelectValue placeholder="Select a residence" />
                                </SelectTrigger>
                                <SelectContent>
                                    {userResidences.map(res => (
                                        <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                    ) : (
                         <p className="text-muted-foreground">Request for residence: <span className="font-semibold">{selectedResidence?.name || '...'}</span></p>
                    )}
                </div>
                <Button onClick={handleSubmitOrder} disabled={orderItems.length === 0 || ordersLoading || !selectedResidence}>
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
                         <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="search"
                                    placeholder="Search items..."
                                    className="pl-8 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                                <p className="text-sm text-muted-foreground">{item.category} - Stock: {handleGetStockForResidence(item)} {item.unit}</p>
                                            </div>
                                            <AddItemButton item={item} />
                                        </div>
                                    )) : (
                                         searchQuery || selectedCategory !== 'all' ? (
                                            <div className="text-center text-muted-foreground py-10">
                                                <p className="mb-4">No items found matching your criteria.</p>
                                                 {searchQuery && <Button onClick={() => setAddDialogVisible(true)}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add "{searchQuery}"
                                                </Button>}
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
