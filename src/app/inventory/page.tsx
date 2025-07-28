
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Edit, Pencil, ListOrdered } from 'lucide-react';
import Link from 'next/link';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function InventoryPage() {
  const { items, loading, addItem, updateItem, deleteItem, loadInventory, categories, addCategory, updateCategory } = useInventory();
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleDeleteItem = (id: string) => {
      deleteItem(id);
  }

  const handleEditItemClick = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsEditItemDialogOpen(true);
  }

  const handleItemAdded = (newItem: Omit<InventoryItem, 'id' | 'stock'>) => {
    return addItem(newItem);
  }

  const handleItemUpdated = (item: InventoryItem) => {
    return updateItem(item);
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
        toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
        return;
    }
    addCategory(newCategoryName);
    setNewCategoryName('');
    setIsAddCategoryDialogOpen(false);
  }

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.newName.trim()) {
        toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
        return;
    }
    updateCategory(editingCategory.oldName, editingCategory.newName);
    setEditingCategory(null);
    setIsEditCategoryDialogOpen(false);
  }
  
  const openEditCategoryDialog = (category: string) => {
    if (category === 'all') return;
    setEditingCategory({ oldName: category, newName: category });
    setIsEditCategoryDialogOpen(true);
  }


  const renderItemsTable = (category: string) => {
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
            <TableHead>Total Stock</TableHead>
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
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleEditItemClick(item)}>
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
            isOpen={isAddItemDialogOpen} 
            onOpenChange={setIsAddItemDialogOpen} 
            onItemAdded={handleItemAdded}
            triggerButton={
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            }
          />
           <Button asChild>
            <Link href="/inventory/new-order">
              <PlusCircle className="mr-2 h-4 w-4" /> New Request
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="border-b p-4 flex justify-between items-center">
                <TabsList>
                    {['all', ...categories].map((category) => (
                      <TabsTrigger key={category} value={category} className="capitalize group relative">
                        {category === 'all' ? 'All Items' : category}
                        {category !== 'all' && (
                             <span
                                role="button"
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "icon" }),
                                    "absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    openEditCategoryDialog(category);
                                }}
                            >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">Edit category</span>
                            </span>
                        )}
                      </TabsTrigger>
                    ))}
                </TabsList>
                <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAddCategory}>
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                                <DialogDescription>Enter the name for the new inventory category.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                               <Label htmlFor="category-name">Category Name</Label>
                               <Input id="category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., Landscaping"/>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Category</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
             {['all', ...categories].map((category) => (
                <TabsContent key={category} value={category} className="p-6 pt-0">
                    {renderItemsTable(category)}
                </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      <EditItemDialog
          isOpen={isEditItemDialogOpen}
          onOpenChange={setIsEditItemDialogOpen}
          onItemUpdated={handleItemUpdated}
          item={itemToEdit}
      />

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
          <DialogContent>
              <form onSubmit={handleUpdateCategory}>
                  <DialogHeader>
                      <DialogTitle>Edit Category Name</DialogTitle>
                      <DialogDescription>
                          Renaming a category will update it for all associated items.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <Label htmlFor="edit-category-name">New Category Name</Label>
                      <Input 
                        id="edit-category-name" 
                        value={editingCategory?.newName || ''} 
                        onChange={(e) => editingCategory && setEditingCategory({...editingCategory, newName: e.target.value})}
                        placeholder="e.g., General Maintenance"
                      />
                  </div>
                  <DialogFooter>
                      <Button type="submit" disabled={!editingCategory || editingCategory.oldName === editingCategory.newName}>Save Changes</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
