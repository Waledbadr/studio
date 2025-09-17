"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccommodation } from '@/context/accommodation-context';
import { useToast } from '@/hooks/use-toast';

export default function WorkersPage() {
  const ctx = useAccommodation();
  const { toast } = useToast();
  const workers = ctx.workers || [];
  const saveWorker = ctx.saveWorker;
  const deleteWorker = ctx.deleteWorker;
  const migrate = ctx.migrateLocalWorkersToFirestore;

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ id: '', name: '', nationaliy: '', role: 'Worker' });

  useEffect(() => { if (!editing) setForm({ id: '', name: '', nationaliy: '', role: 'Worker' }); }, [editing]);

  function startAdd() { setEditing('new'); setForm({ id: `w${Date.now()}`, name: '', nationaliy: '', role: 'Worker' }); }
  function startEdit(w: any) { setEditing(w.id); setForm({ id: w.id, name: w.name, nationaliy: w.nationaliy, role: w.role || 'Worker' }); }

  async function submit() {
    if (!saveWorker) {
      toast({ title: 'Not configured', description: 'Firebase not configured and context helper missing.', variant: 'destructive' });
      return;
    }
    try {
  await saveWorker({ id: form.id, name: form.name, nationaliy: form.nationaliy, role: form.role as any });
      toast({ title: 'Saved', description: 'Worker saved.' });
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save worker.', variant: 'destructive' });
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete worker?')) return;
    if (!deleteWorker) {
      // fallback local removal
      try {
        const raw = localStorage.getItem('ac_workers') || '[]';
        const arr = JSON.parse(raw).filter((w: any) => w.id !== id);
        localStorage.setItem('ac_workers', JSON.stringify(arr));
        toast({ title: 'Deleted (local)', description: 'Worker removed locally.' });
      } catch (e) { console.error(e); toast({ title: 'Error', description: 'Failed to delete locally.', variant: 'destructive' }); }
      return;
    }
    try {
      await deleteWorker(id);
      toast({ title: 'Deleted', description: 'Worker removed.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to delete worker.', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workers</h1>
        <div className="flex gap-2">
          <button onClick={startAdd} className="rounded-md border px-3 py-1">Add worker</button>
          <Link href="/accommodation/assign" className="rounded-md bg-amber-600 text-white px-3 py-1">Open Assign</Link>
          <button onClick={async ()=>{
            if (!migrate) { toast({ title: 'Not configured', description: 'Migration requires Firestore configured.', variant: 'destructive' }); return; }
            const res = await migrate({ removeLocal: false });
            toast({ title: 'Migration completed', description: `${res.migrated} migrated, ${res.skipped} skipped, ${res.errors} errors.` });
          }} className="rounded-md border px-3 py-1">Migrate local → Firestore</button>
        </div>
      </div>

      <div className="rounded-md border p-4 bg-white/80">
        {editing === null ? (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Click Add to create a new worker, or Edit on an existing one.</div>
          </div>
        ) : null}

        {editing !== null && (
          <div className="space-y-2">
            <label className="block">ID</label>
            <input value={form.id} onChange={(e)=>setForm({...form, id:e.target.value})} className="border rounded px-2 py-1 w-full" />
            <label className="block">Name</label>
            <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="border rounded px-2 py-1 w-full" />
            <label className="block">Nationality</label>
            <input value={form.nationaliy} onChange={(e)=>setForm({...form, nationaliy:e.target.value})} className="border rounded px-2 py-1 w-full" />
            <label className="block">Role</label>
            <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} className="border rounded px-2 py-1 w-full">
              <option>Worker</option>
              <option>Supervisor</option>
              <option>Engineer</option>
            </select>
            <div className="flex gap-2 mt-2">
              <button onClick={submit} className="rounded-md bg-emerald-600 text-white px-3 py-1">Save</button>
              <button onClick={()=>setEditing(null)} className="rounded-md border px-3 py-1">Cancel</button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {workers.length ? workers.map((w: any) => (
            <div key={w.id} className="flex items-center justify-between p-2 border rounded bg-white">
              <div>
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.id} • {w.nationaliy} • {w.role}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>startEdit(w)} className="text-sm underline">Edit</button>
                <button onClick={()=>remove(w.id)} className="text-sm text-red-600">Delete</button>
              </div>
            </div>
          )) : <div className="text-sm text-muted-foreground">No workers</div>}
        </div>
      </div>
    </div>
  );
}
