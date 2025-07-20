'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from 'lucide-react';

type ItemCategory = 'cleaning' | 'electrical' | 'plumbing';

interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  stock: number;
}

const allItems: InventoryItem[] = [
  { id: 'item-1', name: 'Floor Cleaner', category: 'cleaning', unit: 'Bottle', stock: 50 },
  { id: 'item-2', name: 'Light Bulbs', category: 'electrical', unit: 'Pack of 4', stock: 120 },
  { id: 'item-3', name: 'PVC Pipe (1m)', category: 'plumbing', unit: 'Piece', stock: 30 },
  { id: 'item-4', name: 'Glass Wipes', category: 'cleaning', unit: 'Pack', stock: 75 },
  { id: 'item-5', name: 'Wire Connector', category: 'electrical', unit: 'Box', stock: 200 },
  { id: 'item-6', name: 'Faucet Washer', category: 'plumbing', unit: 'Bag', stock: 150 },
];

interface OrderItem extends InventoryItem {
    quantity: number;
}

export default function NewOrderPage() {
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const { toast } = useToast();

    const handleAddItemToOrder = () => {
        if (!selectedItem) {
            toast({ title: "Error", description: "Please select an item.", variant: "destructive" });
            return;
        }

        if (orderItems.find(item => item.id === selectedItem)) {
            toast({ title: "Error", description: "Item is already in the order.", variant: "destructive" });
            return;
        }

        const itemToAdd = allItems.find(item => item.id === selectedItem);
        if (itemToAdd) {
            setOrderItems([...orderItems, { ...itemToAdd, quantity }]);
            setSelectedItem('');
            setQuantity(1);
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


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Monthly Order</CardTitle>
                    <CardDescription>Select items from the inventory to create a new purchase order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-end gap-4">
                       <div className="flex-1">
                            <label className="text-sm font-medium">Item</label>
                            <Select onValueChange={setSelectedItem} value={selectedItem}>
                                <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                                <SelectContent>
                                    {allItems.map(item => (
                                        <SelectItem key={item.id} value={item.id}>{item.name} ({item.category})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    <TableCell className="font-medium">{item.name}</TableCell>
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
