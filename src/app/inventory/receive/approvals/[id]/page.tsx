// Note: Approvals list has been removed. This detailed review page remains accessible via direct links from the Receive page.

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export default function MRVApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { approveMRVRequest, rejectMRVRequest } = useInventory();
  const { residences, loadResidences } = useResidences();
  const { currentUser } = useUsers();

  const id = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Record<string, number>>({});
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (residences.length === 0) loadResidences();
  }, [loadResidences, residences.length]);

  useEffect(() => {
    if (!id || !db) return;
    (async () => {
      setLoading(true);
      try {
        const ref = doc(collection(db, 'mrvRequests'), id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          toast({ title: 'Not found', description: 'Request was not found.', variant: 'destructive' });
          router.push('/inventory/receive/approvals');
          return;
        }
        const d = { id: snap.id, ...(snap.data() as any) };
        setData(d);
        setSupplierName(d.supplierName || '');
        setInvoiceNo(d.invoiceNo || '');
        setNotes(d.notes || '');
        const m: Record<string, number> = {};
        (d.items || []).forEach((it: any) => { m[it.id] = it.quantity || 0; });
        setLines(m);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const residenceName = (rid?: string) => residences.find(r => r.id === rid)?.name || rid || '-';

  const selectedLines = useMemo(() => Object.entries(lines)
    .filter(([, q]) => Number(q) > 0)
    .map(([itemId, q]) => {
      const it = (data?.items || []).find((x: any) => x.id === itemId);
      return { id: itemId, nameEn: it?.nameEn || '', nameAr: it?.nameAr || '', quantity: Number(q) };
    }), [lines, data]);

  const setQty = (id: string, q: number) => setLines(prev => ({ ...prev, [id]: Math.max(0, isNaN(q) ? 0 : q) }));

  const handleReplaceAttachment = async (): Promise<{ url: string; path: string } | null> => {
    if (!file) return null;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/uploads/mrv-invoice', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  };

  const handleSave = async () => {
    if (!db || !data) return;
    if (!supplierName.trim() || !invoiceNo.trim()) {
      toast({ title: 'Error', description: 'Supplier and Invoice No. are required.', variant: 'destructive' });
      return;
    }
    if (selectedLines.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one quantity.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let upload: { url: string; path: string } | null = null;
      if (file) upload = await handleReplaceAttachment();
      const ref = doc(collection(db, 'mrvRequests'), data.id);
      await updateDoc(ref, {
        supplierName: supplierName.trim(),
        invoiceNo: invoiceNo.trim(),
        notes: notes || null,
        items: selectedLines,
        ...(upload ? { attachmentUrl: upload.url, attachmentPath: upload.path } : {}),
        updatedAt: Timestamp.now()
      });
      toast({ title: 'Saved', description: 'Changes saved.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!data || !currentUser) return;
    try {
      await handleSave();
      const mrvId = await approveMRVRequest(data.id, currentUser.id);
      toast({ title: 'Approved', description: `Created MRV ${mrvId}.` });
      router.push(`/inventory/receive/receipts/${mrvId}`);
    } catch (e: any) {}
  };

  const handleReject = async () => {
    if (!data || !currentUser) return;
    try {
      await rejectMRVRequest(data.id, currentUser.id);
      toast({ title: 'Rejected', description: 'Request rejected.' });
      router.push('/inventory/receive/approvals');
    } catch (e: any) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MRV Request {id}</h1>
          <p className="text-muted-foreground">Review, edit, and approve/reject.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button onClick={handleApprove} disabled={currentUser?.role !== 'Admin'}>Approve</Button>
          <Button variant="destructive" onClick={handleReject} disabled={currentUser?.role !== 'Admin'}>Reject</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
          <CardDescription>Residence and supplier details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">Residence</div>
            <div className="font-medium">{residenceName(data?.residenceId)}</div>
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Invoice No.</Label>
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Invoice Attachment</Label>
            <div className="flex items-center gap-3">
              {data?.attachmentUrl && (
                <a className="underline text-primary" href={data.attachmentUrl} target="_blank" rel="noreferrer">Open current</a>
              )}
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Requested At</div>
            <div className="font-medium">{data?.requestedAt?.toDate ? format(data.requestedAt.toDate(), 'PPpp') : '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium">{data?.status || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Adjust quantities before approval</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items || []).length > 0 ? (data.items as any[]).map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.nameAr} / {it.nameEn}</TableCell>
                  <TableCell>
                    <Input type="number" className="w-24" min={0} value={lines[it.id] ?? it.quantity ?? 0} onChange={(e) => setQty(it.id, parseInt(e.target.value, 10))} />
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-40 text-center text-muted-foreground">No items</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
