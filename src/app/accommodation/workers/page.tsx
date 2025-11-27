"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccommodation } from '@/context/accommodation-context';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { CreateTransferDialog } from '@/components/accommodation/create-transfer-dialog';
import { ArrowRightLeft, Plus, Upload, UserPlus, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function WorkersPage() {
  const ctx = useAccommodation();
  const { dict } = useLanguage();
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
      toast({ title: dict.workers.notConfigured, description: 'Firebase not configured and context helper missing.', variant: 'destructive' });
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
      toast({ title: dict.workers.saved, description: dict.workers.saved });
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast({ title: dict.workers.error, description: 'Failed to save worker.', variant: 'destructive' });
    }
  }

  async function remove(id: string) {
    if (!confirm(dict.workers.deleteConfirm)) return;
    if (!deleteWorker) {
      // fallback local removal
      try {
        const raw = localStorage.getItem('ac_workers') || '[]';
        const arr = JSON.parse(raw).filter((w: any) => w.id !== id);
        localStorage.setItem('ac_workers', JSON.stringify(arr));
        toast({ title: 'Deleted (local)', description: 'Worker removed locally.' });
      } catch (e) { console.error(e); toast({ title: dict.workers.error, description: 'Failed to delete locally.', variant: 'destructive' }); }
      return;
    }
    try {
      await deleteWorker(id);
      toast({ title: dict.workers.deleted, description: dict.workers.deleted });
    } catch (e) {
      console.error(e);
      toast({ title: dict.workers.error, description: 'Failed to delete worker.', variant: 'destructive' });
    }
  }

  const handleCreateTransfer = (workerIds: string[]) => {
    setSelectedWorkersForTransfer(workerIds);
    setTransferDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{dict.workers.title}</h1>
          <p className="text-muted-foreground mt-1">{dict.workers.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/accommodation/workers/import">
            <Button variant="outline" className="gap-2 bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-600">
              <Upload className="h-4 w-4" />
              {dict.workers.importExcel}
            </Button>
          </Link>
          <Button onClick={startAdd} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {dict.workers.addWorker}
          </Button>
          <Button onClick={() => handleCreateTransfer([])} variant="outline" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            {dict.workers.transferRequest}
          </Button>
          <Link href="/accommodation/assign">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              {dict.workers.assign}
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={async ()=>{
              if (!migrate) { toast({ title: dict.workers.notConfigured, description: 'Migration requires Firestore configured.', variant: 'destructive' }); return; }
              const res = await migrate({ removeLocal: false });
              toast({ title: 'Migration completed', description: `${res.migrated} migrated, ${res.skipped} skipped, ${res.errors} errors.` });
            }} 
            title={dict.workers.migrate}
          >
            <Database className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CreateTransferDialog 
        isOpen={transferDialogOpen} 
        onOpenChange={setTransferDialogOpen}
        preSelectedWorkers={selectedWorkersForTransfer}
      />

      <Card>
        <CardContent className="p-4 md:p-6">
          {editing === null ? (
            <div className="text-sm text-muted-foreground mb-4 hidden md:block">{dict.workers.clickAdd}</div>
          ) : null}

          {editing !== null && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>{dict.workers.systemId}</Label>
                <Input value={form.id} disabled placeholder="w12345" />
              </div>
              <div className="space-y-2">
                <Label>{dict.workers.employeeId}</Label>
                <Input value={form.employeeId} onChange={(e)=>setForm({...form, employeeId:e.target.value})} placeholder="37433" />
              </div>
              <div className="space-y-2">
                <Label>{dict.workers.name}</Label>
                <Input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Akram Naimu Deen" />
              </div>
              <div className="space-y-2">
                <Label>{dict.workers.iqamaNo}</Label>
                <Input value={form.idNumber} onChange={(e)=>setForm({...form, idNumber:e.target.value})} placeholder="2326188378" />
              </div>
              <div className="space-y-2">
                <Label>{dict.workers.nationality}</Label>
                <Input value={form.nationaliy} onChange={(e)=>setForm({...form, nationaliy:e.target.value})} placeholder="Indian" />
              </div>
              <div className="space-y-2">
                <Label>{dict.workers.company}</Label>
                <Input value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} placeholder="SACODECO" />
              </div>
              <div className="space-y-2">
                <Label>{dict.workers.role}</Label>
                <Select value={form.role} onValueChange={(val)=>setForm({...form, role: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Worker">Worker</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Engineer">Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-end md:col-span-2 justify-end mt-2">
                <Button variant="outline" onClick={()=>setEditing(null)}>{dict.workers.cancel}</Button>
                <Button onClick={submit}>{dict.workers.save}</Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-start p-3 font-medium">{dict.workers.employeeId}</th>
                  <th className="text-start p-3 font-medium">{dict.workers.name}</th>
                  <th className="text-start p-3 font-medium hidden md:table-cell">{dict.workers.iqamaNo}</th>
                  <th className="text-start p-3 font-medium hidden md:table-cell">{dict.workers.nationality}</th>
                  <th className="text-start p-3 font-medium hidden lg:table-cell">{dict.workers.company}</th>
                  <th className="text-start p-3 font-medium hidden lg:table-cell">{dict.workers.role}</th>
                  <th className="text-center p-3 font-medium">{dict.workers.actions}</th>
                </tr>
              </thead>
              <tbody>
                {workers.length ? workers.map((w: any) => (
                  <tr key={w.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono">{w.employeeId || '-'}</td>
                    <td className="p-3 font-medium">
                      <div>{w.name}</div>
                      <div className="md:hidden text-xs text-muted-foreground mt-1">
                        {w.company} • {w.role}
                      </div>
                    </td>
                    <td className="p-3 font-mono hidden md:table-cell">{w.idNumber || '-'}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{w.nationaliy || '-'}</td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {w.company || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{w.role || 'Worker'}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={()=>startEdit(w)} className="h-8 px-2 text-primary hover:text-primary/80">
                          {dict.workers.edit}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={()=>remove(w.id)} className="h-8 px-2 text-destructive hover:text-destructive/80">
                          {dict.workers.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {dict.workers.noWorkers}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
