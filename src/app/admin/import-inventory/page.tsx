'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/context/users-context';
import { useRouter } from 'next/navigation';

export default function ImportInventoryPage() {
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== 'Admin') {
      toast({ title: 'Unauthorized', description: 'Access restricted to admins.', variant: 'destructive' });
      router.push('/');
    }
  }, [currentUser, router, toast]);

  const handleImportLocal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/inventory_local_db.json');
      if (!res.ok) throw new Error('Local import file not found');
      const items = await res.json();
      const transformed = (items || []).map((it: any, idx: number) => {
        const id = `it_local_${Date.now()}_${idx}`;
        const variantsArray = it.variants && typeof it.variants === 'object'
          ? Object.values(it.variants).flat()
          : Array.isArray(it.variants) ? it.variants : [];
        return { id, name: it.nameEn || it.nameAr || id, nameAr: it.nameAr || '', nameEn: it.nameEn || '', category: it.category || '', unit: it.unit || '', lifespanDays: it.lifespanDays || 0, variants: variantsArray, keywordsAr: it.keywordsAr || [], keywordsEn: it.keywordsEn || [], stock: 0, stockByResidence: {} };
      });
      localStorage.setItem('estatecare_inventory', JSON.stringify(transformed));
      const cats = Array.from(new Set(transformed.map((t:any) => (t.category||'').trim()).filter(Boolean)));
      localStorage.setItem('estatecare_inventory_categories', JSON.stringify(cats));
      toast({ title: 'Imported locally', description: `Added ${transformed.length} items to local storage.` });
      router.push('/inventory');
    } catch (e: any) {
      toast({ title: 'Import failed', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Import inventory (local fallback)</h1>
      <p className="text-muted-foreground">This will write items into your browser's local storage for development/testing.</p>
      <div className="mt-4">
        <Button onClick={handleImportLocal} disabled={loading}>{loading ? 'Importing...' : 'Import local inventory'}</Button>
      </div>
    </div>
  );
}
