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
    if (!currentUser) return;
    loadInventory();
    if (residences.length === 0) {
      loadResidencesContext();
    }
  }, [currentUser, loadInventory, loadResidencesContext, residences.length]);

  const userResidences = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences, isAdmin]);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const normalizedSynonyms = useMemo(() => buildNormalizedSynonyms(AR_SYNONYMS), []);

  // Negative stock auto-fix removed per request; values should no longer go negative.

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
      return acc + getStockForResidence(item, residenceId);
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
            <TableHead className="h-10 px-3">Arabic Name</TableHead>
            <TableHead className="h-10 px-3">English Name</TableHead>
            <TableHead className="h-10 px-3">Category</TableHead>
            <TableHead className="h-10 px-3">Unit</TableHead>
            <TableHead className="h-10 px-3">Stock</TableHead>
            <TableHead className="h-10 px-3 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <TableRow key={item.id} onClick={() => handleRowClick(item.id, isAllItemsTab ? undefined : residenceId)} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="py-2 px-3 font-medium">{item.nameAr}</TableCell>
              <TableCell className="py-2 px-3 font-medium">{item.nameEn}</TableCell>
              <TableCell className="py-2 px-3">{item.category}</TableCell>
              <TableCell className="py-2 px-3">{item.unit}</TableCell>
              <TableCell className="py-2 px-3">{isAllItemsTab ? calculateStockForUser(item) : getStockForResidence(item, residenceId)}</TableCell>
              <TableCell className="py-2 px-3 text-right">
                <Button variant="ghost" size="icon" className="mr-2" onClick={(e) => handleEditItemClick(e, item)}>
                    <Edit className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={(e) => handleDeleteItem(e, item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
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

  // استيراد الأصناف من ملف عبر API
  const handleImportInventory = async () => {
    try {
      const res = await fetch('/api/import-inventory', { method: 'POST' });
      if (res.status === 503) {
        // D1 not available - do local fallback
        const fallback = await fetch('/api/import-inventory/local');
        if (!fallback.ok) {
          toast({ title: 'خطأ', description: 'ملف الاستيراد المحلي غير موجود.', variant: 'destructive' });
          return;
        }
        const payload = await fallback.json();
        const items = (payload.items || []) as any[];
        // Transform to storage shape
        const transformed = (items || []).map((it: any, idx: number) => {
          const id = `it_local_${Date.now()}_${idx}`;
          const variantsArray = it.variants && typeof it.variants === 'object'
            ? Object.values(it.variants).flat()
            : Array.isArray(it.variants) ? it.variants : [];
          return { id, name: it.nameEn || it.nameAr || id, nameAr: it.nameAr || '', nameEn: it.nameEn || '', category: it.category || '', unit: it.unit || '', lifespanDays: it.lifespanDays || 0, variants: variantsArray, keywordsAr: it.keywordsAr || [], keywordsEn: it.keywordsEn || [], stock: 0, stockByResidence: {} } as any;
        });
        // Save to localStorage so InventoryContext fallback picks it up
        try {
          localStorage.setItem('estatecare_inventory', JSON.stringify(transformed));
          const cats = Array.from(new Set(transformed.map((t:any) => (t.category||'').trim()).filter(Boolean)));
          localStorage.setItem('estatecare_inventory_categories', JSON.stringify(cats));
          toast({ title: 'تم الاستيراد محليًا', description: `تم إضافة ${transformed.length} صنف إلى المتصفح المحلي.` });
          loadInventory();
        } catch (e) {
          toast({ title: 'خطأ', description: 'لم يتم حفظ الأصناف محليًا.', variant: 'destructive' });
        }
        return;
      }

      const data = await res.json() as any;
      if (data?.results) {
        const successCount = data.results.filter((r:any) => r.ok).length;
        const errorCount = data.results.filter((r:any) => r.error).length;
        toast({
          title: 'تم الاستيراد',
          description: `تم استيراد ${successCount} صنف${successCount !== 1 ? ' بنجاح' : ''}${errorCount ? '، وحدثت أخطاء في ' + errorCount + ' صنف' : ''}`,
          variant: errorCount ? 'destructive' : undefined,
        });
        loadInventory();
      } else {
        toast({ title: 'خطأ في الاستيراد', description: 'لم يتم العثور على نتائج الاستيراد.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'خطأ في الاتصال', description: String(err), variant: 'destructive' });
    }
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
          {isAdmin && (
            <Button variant="outline" onClick={handleImportInventory}>
              <ListOrdered className="mr-2 h-4 w-4" />
                {(dict as any).importInventory || 'استيراد الأصناف من ملف'}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-2">Temporary import tool UI for dev: press the button to import adapted items into the local database.</p>
        {isAdmin && (
          <Button onClick={handleImportInventory}>{(dict as any).importInventory || 'استيراد الأصناف من ملف'}</Button>
        )}
      </div>
    </div>
  );
}
