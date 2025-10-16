"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccommodation } from '@/context/accommodation-context';
import { useToast } from '@/hooks/use-toast';
import { CreateTransferDialog } from '@/components/accommodation/create-transfer-dialog';
import { ArrowRightLeft } from 'lucide-react';

export default function WorkersPage() {
  const ctx = useAccommodation();
  const { toast } = useToast();
  const workers = ctx.workers || [];
  const saveWorker = ctx.saveWorker;
  const deleteWorker = ctx.deleteWorker;
  const migrate = ctx.migrateLocalWorkersToFirestore;

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ id: '', name: '', employeeId: '', idNumber: '', nationaliy: '', company: '', role: 'Worker' });
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedWorkersForTransfer, setSelectedWorkersForTransfer] = useState<string[]>([]);

  useEffect(() => { if (!editing) setForm({ id: '', name: '', employeeId: '', idNumber: '', nationaliy: '', company: '', role: 'Worker' }); }, [editing]);

  function startAdd() { setEditing('new'); setForm({ id: `w${Date.now()}`, name: '', employeeId: '', idNumber: '', nationaliy: '', company: '', role: 'Worker' }); }
  function startEdit(w: any) { setEditing(w.id); setForm({ id: w.id, name: w.name, employeeId: w.employeeId || '', idNumber: w.idNumber || '', nationaliy: w.nationaliy, company: w.company || '', role: w.role || 'Worker' }); }

  async function submit() {
    if (!saveWorker) {
      toast({ title: 'Not configured', description: 'Firebase not configured and context helper missing.', variant: 'destructive' });
      return;
    }
    try {
  await saveWorker({ 
    id: form.id, 
    name: form.name, 
    employeeId: form.employeeId,
    idNumber: form.idNumber,
    nationaliy: form.nationaliy, 
    company: form.company,
    role: form.role as any 
  });
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

  const handleCreateTransfer = (workerIds: string[]) => {
    setSelectedWorkersForTransfer(workerIds);
    setTransferDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workers • العمال</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة بيانات العمال</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/accommodation/workers/import"
            className="rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            استيراد من Excel
          </Link>
          <button onClick={startAdd} className="rounded-md border border-border bg-background px-3 py-1 hover:bg-accent">إضافة عامل</button>
          <button 
            onClick={() => handleCreateTransfer([])} 
            className="rounded-md border border-border bg-background px-3 py-1 hover:bg-accent flex items-center gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            طلب نقل
          </button>
          <Link href="/accommodation/assign" className="rounded-md bg-primary text-primary-foreground px-3 py-1 hover:bg-primary/90">التسكين</Link>
          <button onClick={async ()=>{
            if (!migrate) { toast({ title: 'Not configured', description: 'Migration requires Firestore configured.', variant: 'destructive' }); return; }
            const res = await migrate({ removeLocal: false });
            toast({ title: 'Migration completed', description: `${res.migrated} migrated, ${res.skipped} skipped, ${res.errors} errors.` });
          }} className="rounded-md border border-border bg-background px-3 py-1 hover:bg-accent">Migrate local → Firestore</button>
        </div>
      </div>
      
      <CreateTransferDialog 
        isOpen={transferDialogOpen} 
        onOpenChange={setTransferDialogOpen}
        preSelectedWorkers={selectedWorkersForTransfer}
      />

      <div className="rounded-md border border-border p-4 bg-card">
        {editing === null ? (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Click Add to create a new worker, or Edit on an existing one.</div>
          </div>
        ) : null}

        {editing !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">System ID</label>
              <input value={form.id} onChange={(e)=>setForm({...form, id:e.target.value})} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="w12345" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">رقم الموظف (Employee ID)</label>
              <input value={form.employeeId} onChange={(e)=>setForm({...form, employeeId:e.target.value})} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="37433" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">اسم العامل (Name)</label>
              <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="Akram Naimu Deen" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">رقم الهوية (Iqama No)</label>
              <input value={form.idNumber} onChange={(e)=>setForm({...form, idNumber:e.target.value})} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="2326188378" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الجنسية (Nationality)</label>
              <input value={form.nationaliy} onChange={(e)=>setForm({...form, nationaliy:e.target.value})} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="Indian" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الشركة (Company)</label>
              <input value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full" placeholder="SACODECO" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الدور (Role)</label>
              <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})} className="border border-border bg-background text-foreground rounded px-3 py-2 w-full">
                <option>Worker</option>
                <option>Supervisor</option>
                <option>Engineer</option>
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button onClick={submit} className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 flex-1">حفظ (Save)</button>
              <button onClick={()=>setEditing(null)} className="rounded-md border border-border bg-background px-4 py-2 hover:bg-accent flex-1">إلغاء (Cancel)</button>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right p-3 text-sm font-semibold text-foreground">رقم الموظف<br/><span className="text-xs font-normal text-muted-foreground">C_Number</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">اسم العامل<br/><span className="text-xs font-normal text-muted-foreground">Name</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">رقم الهوية<br/><span className="text-xs font-normal text-muted-foreground">Iqama No</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">الجنسية<br/><span className="text-xs font-normal text-muted-foreground">Nationality</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">الشركة<br/><span className="text-xs font-normal text-muted-foreground">Company</span></th>
                <th className="text-right p-3 text-sm font-semibold text-foreground">الدور<br/><span className="text-xs font-normal text-muted-foreground">Role</span></th>
                <th className="text-center p-3 text-sm font-semibold text-foreground">الإجراءات<br/><span className="text-xs font-normal text-muted-foreground">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {workers.length ? workers.map((w: any) => (
                <tr key={w.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-sm text-foreground">{w.employeeId || '-'}</td>
                  <td className="p-3 text-sm font-medium text-foreground">{w.name}</td>
                  <td className="p-3 text-sm text-foreground font-mono">{w.idNumber || '-'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{w.nationaliy || '-'}</td>
                  <td className="p-3 text-sm text-foreground">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {w.company || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{w.role || 'Worker'}</td>
                  <td className="p-3 text-sm">
                    <div className="flex justify-center gap-2">
                      <button onClick={()=>startEdit(w)} className="text-sm underline text-primary hover:text-primary/80 px-2 py-1">تعديل</button>
                      <button onClick={()=>remove(w.id)} className="text-sm text-destructive hover:text-destructive/80 px-2 py-1">حذف</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    لا يوجد عمال • No workers
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
