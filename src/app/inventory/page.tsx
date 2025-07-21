
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { useInventory, type ItemCategory, type InventoryItem } from '@/context/inventory-context';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  const { items, loading, addItem, deleteItem } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleDeleteItem = (id: string) => {
      deleteItem(id);
  }

  const handleItemAdded = (newItem: Omit<InventoryItem, 'id'>) => {
    addItem(newItem);
  }

  const renderItemsTable = (category: ItemCategory | 'all') => {
    const filteredItems = category === 'all' ? items : items.filter(item => item.category === category);

    if (loading) {
       return (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
       )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arabic Name</TableHead>
            <TableHead>English Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.nameAr}</TableCell>
              <TableCell className="font-medium">{item.nameEn}</TableCell>
              <TableCell>{item.category}</TableCell>
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
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">No items in this category yet.</TableCell>
            </TableRow>
          )}
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
          <AddItemDialog 
            isOpen={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
            onItemAdded={handleItemAdded}
            triggerButton={
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            }
          />
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
