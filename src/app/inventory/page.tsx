'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Edit, ListOrdered, Move } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInventory, type InventoryItem } from '@/context/inventory-context';
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { useLanguage } from '@/context/language-context';
import { normalizeText, includesNormalized } from '@/lib/utils';
import { AR_SYNONYMS, buildNormalizedSynonyms } from '@/lib/aliases';
import * as XLSX from 'xlsx';

export default function InventoryPage() {
  const { dict } = useLanguage();
  const { items, loading, addItem, updateItem, deleteItem, loadInventory, categories, addCategory, updateCategory, getStockForResidence } = useInventory();
  const { currentUser } = useUsers();
  const { residences, loadResidences: loadResidencesContext } = useResidences();
  const router = useRouter();
  const isAdmin = currentUser?.role === 'Admin';
  
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
    if (residences.length === 0) {
      loadResidencesContext();
    }
  }, [loadInventory, loadResidencesContext, residences.length]);

  const userResidences = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences, isAdmin]);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const normalizedSynonyms = useMemo(() => buildNormalizedSynonyms(AR_SYNONYMS), []);

  useEffect(() => {
    if (userResidences.length > 0 && activeTab === 'all') {
      // Do nothing, keep 'all' as active
    } else if (userResidences.length > 0 && !userResidences.some(r => r.id === activeTab)) {
        setActiveTab(userResidences[0].id);
    }
  }, [userResidences, activeTab]);


  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      deleteItem(id);
  }

  const handleEditItemClick = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
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
    const ec = editingCategory;
    if (!ec || !ec.newName.trim()) {
        toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
        return;
    }
    updateCategory(ec.oldName, ec.newName);
    setEditingCategory(null);
    setIsEditCategoryDialogOpen(false);
  }
  
  const openEditCategoryDialog = (category: string) => {
    setEditingCategory({ oldName: category, newName: category });
    setIsEditCategoryDialogOpen(true);
  }

  const handleRowClick = (itemId: string, residenceId?: string | undefined) => {
    if (residenceId) {
      // عرض حركة الصنف لسكن محدد
      router.push(`/inventory/reports/item-movement?itemId=${itemId}&residenceId=${residenceId}`);
    } else {
      // عرض حركة الصنف على مستوى النظام كله (All Items)
      router.push(`/inventory/reports/item-movement?itemId=${itemId}`);
    }
  };

  const calculateStockForUser = (item: InventoryItem) => {
    if (isAdmin || !currentUser) {
      return item.stock; // Admin sees total stock
    }
    // Other users see sum of stock from their assigned residences
    return currentUser.assignedResidences.reduce((acc, residenceId) => {
      return acc + (item.stockByResidence?.[residenceId] || 0);
    }, 0);
  };


  const renderItemsTable = (residenceId: string | 'all') => {
    const isAllItemsTab = residenceId === 'all';
    let filteredItems = isAllItemsTab 
        ? items 
        : items.filter(item => (getStockForResidence(item, residenceId) ?? 0) > 0);

    // apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filteredItems = filteredItems.filter(item => (item.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    // apply search filter (normalized, supports per-item keywords and centralized synonyms)
    if (search.trim()) {
      const qN = normalizeText(search);
    filteredItems = filteredItems.filter(item => {
        const cand = [
          item.nameEn,
          item.nameAr,
          item.category,
          ...(item.keywordsAr || []),
          ...(item.keywordsEn || []),
      ...(item.variants || []),
        ].filter(Boolean).join(' ');
        if (includesNormalized(cand, qN)) return true;
        for (const [canonN, aliasSet] of normalizedSynonyms.entries()) {
          if (aliasSet.has(qN)) {
            const itemMatchesCanon =
              includesNormalized(item.nameAr, canonN) ||
              includesNormalized(item.nameEn, canonN) ||
              (item.keywordsAr || []).some(k => includesNormalized(k, canonN)) ||
        (item.keywordsEn || []).some(k => includesNormalized(k, canonN)) ||
        (item.variants || []).some(v => includesNormalized(v, canonN));
            if (itemMatchesCanon) return true;
          }
        }
        return false;
      });
    }

    if (isAllItemsTab) {
        // Create a shallow copy before sorting to avoid mutating the original array
        filteredItems = [...filteredItems].sort((a, b) => calculateStockForUser(b) - calculateStockForUser(a));
    }


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
            <TableRow key={item.id} onClick={() => handleRowClick(item.id, isAllItemsTab ? undefined : residenceId)} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">{item.nameAr}</TableCell>
              <TableCell className="font-medium">{item.nameEn}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>{isAllItemsTab ? calculateStockForUser(item) : getStockForResidence(item, residenceId)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="mr-2" onClick={(e) => handleEditItemClick(e, item)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => handleDeleteItem(e, item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">No items with stock in this residence.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  // Export inventory items to Excel
  const handleExportExcel = () => {
    if (!items || items.length === 0) return;
    const data = items.map(item => ({
      'Arabic Name': item.nameAr,
      'English Name': item.nameEn,
      'Category': item.category,
      'Unit': item.unit,
      'Lifespan (days)': item.lifespanDays ?? '',
      'Variants': item.variants?.join(', ') ?? '',
      'Keywords (Ar)': item.keywordsAr?.join(', ') ?? '',
      'Keywords (En)': item.keywordsEn?.join(', ') ?? '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'inventory.xlsx');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{dict.ui?.availableInventory || 'Inventory Management'}</h1>
          <p className="text-muted-foreground">{dict.manageMaterialsSubtitle || 'Manage your materials and supplies for each residence.'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            {dict.exportToExcel || 'Export items to Excel'}
          </Button>
          <Button variant="secondary" onClick={() => router.push('/inventory/transfer')}>
            <Move className="mr-2 h-4 w-4" /> {dict.stockTransfer || 'Stock Transfer'}
          </Button>
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> {dict.addCategory || 'Add Category'}</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddCategory}>
                <DialogHeader>
                  <DialogTitle>{dict.addCategoryTitle || 'Add New Category'}</DialogTitle>
                  <DialogDescription>{dict.addCategoryDescription || 'Enter the name for the new inventory category.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="category-name">{dict.categoryNameLabel || 'Category Name'}</Label>
                  <Input id="category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder={dict.exampleCategoryPlaceholder || 'e.g., Landscaping'}/>
                </div>
                <DialogFooter>
                  <Button type="submit">{dict.saveCategory || 'Save Category'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AddItemDialog 
            isOpen={isAddItemDialogOpen} 
            onOpenChange={setIsAddItemDialogOpen} 
            onItemAdded={handleItemAdded}
            triggerButton={
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> {dict.addItem || 'Add Item'}
              </Button>
            }
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b p-4 flex justify-between items-center gap-4 flex-wrap">
        <TabsList>
          <TabsTrigger value="all">{dict.allItems || 'All Items'}</TabsTrigger>
                    {userResidences.map((res) => (
                      <TabsTrigger key={res.id} value={res.id}>
                        {res.name}
                      </TabsTrigger>
                    ))}
                </TabsList>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="w-full sm:w-64">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={dict.searchPlaceholder || 'Search / بحث'}
                      aria-label="Search items"
                    />
                  </div>
                  <div className="w-48">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={dict.categoryPlaceholder || 'Category'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{dict.allCategories || 'All Categories'}</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
            </div>
            <TabsContent value="all" className="p-6 pt-4">
                {renderItemsTable('all')}
            </TabsContent>
             {userResidences.map((res) => (
                <TabsContent key={res.id} value={res.id} className="p-6 pt-4">
                    {renderItemsTable(res.id)}
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
                        onChange={(e) => setEditingCategory(prev => prev ? ({...prev, newName: e.target.value}) : prev)}
                        placeholder="e.g., General Maintenance"
                      />
                  </div>
                  <DialogFooter>
                      <Button type="submit" disabled={!editingCategory || editingCategory?.oldName === editingCategory?.newName}>Save Changes</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
