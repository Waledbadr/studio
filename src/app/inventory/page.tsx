'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

type ItemCategory = 'cleaning' | 'electrical' | 'plumbing';

interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  stock: number;
}

const initialItems: InventoryItem[] = [
  { id: 'item-1', name: 'Floor Cleaner', category: 'cleaning', unit: 'Bottle', stock: 50 },
  { id: 'item-2', name: 'Light Bulbs', category: 'electrical', unit: 'Pack of 4', stock: 120 },
  { id: 'item-3', name: 'PVC Pipe (1m)', category: 'plumbing', unit: 'Piece', stock: 30 },
  { id: 'item-4', name: 'Glass Wipes', category: 'cleaning', unit: 'Pack', stock: 75 },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', unit: '', stock: '' });
  const { toast } = useToast();

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

    setItems([...items, newInventoryItem]);
    setIsDialogOpen(false);
    setNewItem({ name: '', category: '', unit: '', stock: '' });
    toast({ title: "Success", description: "New item added to inventory." });
  };
  
  const handleDeleteItem = (id: string) => {
      setItems(items.filter(item => item.id !== id));
      toast({ title: "Success", description: "Item has been deleted." });
  }

  const renderItemsTable = (category: ItemCategory | 'all') => {
    const filteredItems = category === 'all' ? items : items.filter(item => item.category === category);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>{item.stock}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="mr-2">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your materials and supplies.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </DialogTrigger>
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
          </Dialog>
          <Button asChild variant="outline">
            <Link href="/inventory/new-order">
              <PlusCircle className="mr-2 h-4 w-4" /> New Order
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="border-b p-4">
                <TabsList>
                    <TabsTrigger value="all">All Items</TabsTrigger>
                    <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
                    <TabsTrigger value="electrical">Electrical</TabsTrigger>
                    <TabsTrigger value="plumbing">Plumbing</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="all" className="p-6 pt-0">
                {renderItemsTable('all')}
            </TabsContent>
            <TabsContent value="cleaning" className="p-6 pt-0">
                {renderItemsTable('cleaning')}
            </TabsContent>
            <TabsContent value="electrical" className="p-6 pt-0">
                {renderItemsTable('electrical')}
            </TabsContent>
            <TabsContent value="plumbing" className="p-6 pt-0">
                {renderItemsTable('plumbing')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
