// Cloudflare D1 database service example
// يمكنك تعديل هذا الملف ليحتوي على دوال CRUD حسب احتياجك

export async function getAllInventoryItems(params?: { q?: string; category?: string; limit?: number; offset?: number }): Promise<any[]> {
  // مثال: جلب جميع العناصر من جدول inventory مع فلاتر واستخدام D1
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.category) qs.set('category', params.category);
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.offset != null) qs.set('offset', String(params.offset));
  const url = qs.toString() ? `/api/inventory?${qs.toString()}` : '/api/inventory';
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return await response.json();
}

export async function addInventoryItem(item: any): Promise<any> {
  // مثال: إضافة عنصر جديد
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error('Failed to add item');
  return await response.json();
}

// يمكنك إضافة دوال أخرى للتعديل والحذف حسب الحاجة
export async function getInventoryItem(id: string): Promise<any | null> {
  const res = await fetch(`/api/inventory/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch item');
  return await res.json();
}

export async function updateInventoryItem(id: string, updates: any): Promise<any> {
  const res = await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return await res.json();
}

export async function deleteInventoryItem(id: string): Promise<any> {
  const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
  return await res.json();
}
