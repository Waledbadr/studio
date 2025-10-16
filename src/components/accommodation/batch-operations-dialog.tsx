"use client";

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { auth } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  LogIn, 
  LogOut, 
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

type OperationType = 'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER';

interface BatchOperationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  operationType: OperationType;
  preSelectedWorkers?: string[];
  targetResidenceId?: string;
  targetRoomId?: string;
}

export function BatchOperationsDialog({
  isOpen,
  onOpenChange,
  operationType,
  preSelectedWorkers = [],
  targetResidenceId,
  targetRoomId,
}: BatchOperationsDialogProps) {
  const { 
    workers, 
    residences,
    bulkCheckIn,
    bulkCheckOut,
    bulkTransfer,
  } = useAccommodation();
  
  const currentUser = auth?.currentUser;

  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>(preSelectedWorkers);
  const [selectedResidenceId, setSelectedResidenceId] = useState(targetResidenceId || '');
  const [selectedRoomId, setSelectedRoomId] = useState(targetRoomId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<Record<string, { success: boolean; error?: string }> | null>(null);

  const getTitle = () => {
    switch (operationType) {
      case 'CHECK_IN': return 'تسكين جماعي';
      case 'CHECK_OUT': return 'إخراج جماعي';
      case 'TRANSFER': return 'نقل جماعي';
    }
  };

  const getIcon = () => {
    switch (operationType) {
      case 'CHECK_IN': return <LogIn className="h-5 w-5" />;
      case 'CHECK_OUT': return <LogOut className="h-5 w-5" />;
      case 'TRANSFER': return <ArrowRightLeft className="h-5 w-5" />;
    }
  };

  const getDescription = () => {
    switch (operationType) {
      case 'CHECK_IN': return 'تسكين عدة عمال في نفس الغرفة';
      case 'CHECK_OUT': return 'إخراج عدة عمال من سكناتهم الحالية';
      case 'TRANSFER': return 'نقل عدة عمال إلى غرفة جديدة';
    }
  };

  // Get available rooms for selected residence
  const availableRooms = React.useMemo(() => {
    if (!selectedResidenceId) return [];
    const residence = residences.find(r => r.id === selectedResidenceId);
    if (!residence) return [];
    
    const rooms: any[] = [];
    if (residence.rooms) rooms.push(...residence.rooms);
    if (residence.buildings) {
      residence.buildings.forEach(b => {
        b.floors?.forEach(f => {
          if (f.rooms) rooms.push(...f.rooms);
        });
      });
    }
    return rooms;
  }, [selectedResidenceId, residences]);

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    if (selectedWorkerIds.length === 0) {
      return;
    }

    if ((operationType === 'CHECK_IN' || operationType === 'TRANSFER') && (!selectedResidenceId || !selectedRoomId)) {
      return;
    }

    setProcessing(true);
    setResults(null);

    try {
      let result;

      if (operationType === 'CHECK_IN') {
        result = await bulkCheckIn({
          workerIds: selectedWorkerIds,
          residenceId: selectedResidenceId,
          roomId: selectedRoomId,
          checkInDate: date + 'T00:00:00.000Z',
          notes,
          performedBy: currentUser?.uid || 'system',
        });
      } else if (operationType === 'CHECK_OUT') {
        result = await bulkCheckOut({
          workerIds: selectedWorkerIds,
          checkOutDate: date + 'T00:00:00.000Z',
          reason,
          notes,
          performedBy: currentUser?.uid || 'system',
        });
      } else if (operationType === 'TRANSFER') {
        result = await bulkTransfer({
          workerIds: selectedWorkerIds,
          toResidenceId: selectedResidenceId,
          toRoomId: selectedRoomId,
          transferDate: date + 'T00:00:00.000Z',
          reason,
          notes,
          performedBy: currentUser?.uid || 'system',
        });
      }

      if (result) {
        setResults(result.results);
      }
    } catch (e) {
      console.error('Batch operation failed:', e);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedWorkerIds([]);
    setSelectedResidenceId(targetResidenceId || '');
    setSelectedRoomId(targetRoomId || '');
    setDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setNotes('');
    setResults(null);
    onOpenChange(false);
  };

  const removeWorker = (workerId: string) => {
    setSelectedWorkerIds(prev => prev.filter(id => id !== workerId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-6">
            {/* Selected Workers */}
            <div>
              <Label>العمال المحددين ({selectedWorkerIds.length})</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedWorkerIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لم يتم تحديد أي عمال</p>
                ) : (
                  selectedWorkerIds.map(workerId => {
                    const worker = workers.find(w => w.id === workerId);
                    return (
                      <Badge key={workerId} variant="secondary" className="pr-1">
                        {worker?.name || workerId}
                        <button
                          onClick={() => removeWorker(workerId)}
                          className="mr-1 rounded-full hover:bg-background p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>

            {/* Residence & Room Selection (for CHECK_IN and TRANSFER) */}
            {(operationType === 'CHECK_IN' || operationType === 'TRANSFER') && (
              <>
                <div>
                  <Label htmlFor="residence">المسكن</Label>
                  <select
                    id="residence"
                    value={selectedResidenceId}
                    onChange={(e) => {
                      setSelectedResidenceId(e.target.value);
                      setSelectedRoomId('');
                    }}
                    className="w-full mt-1 border rounded-md px-3 py-2 bg-background"
                  >
                    <option value="">اختر المسكن</option>
                    {residences.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="room">الغرفة</Label>
                  <select
                    id="room"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    disabled={!selectedResidenceId}
                    className="w-full mt-1 border rounded-md px-3 py-2 bg-background disabled:opacity-50"
                  >
                    <option value="">اختر الغرفة</option>
                    {availableRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name || room.id}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Date */}
            <div>
              <Label htmlFor="date">
                {operationType === 'CHECK_IN' && 'تاريخ التسكين'}
                {operationType === 'CHECK_OUT' && 'تاريخ الإخراج'}
                {operationType === 'TRANSFER' && 'تاريخ النقل'}
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Reason (for CHECK_OUT and TRANSFER) */}
            {(operationType === 'CHECK_OUT' || operationType === 'TRANSFER') && (
              <div>
                <Label htmlFor="reason">السبب (اختياري)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="أدخل سبب العملية"
                  className="mt-1"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        ) : (
          /* Results */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              {Object.values(results).every(r => r.success) ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>تمت العملية بنجاح</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span>العملية مكتملة مع بعض الأخطاء</span>
                </>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(results).map(([workerId, result]) => {
                const worker = workers.find(w => w.id === workerId);
                return (
                  <div
                    key={workerId}
                    className={`p-3 rounded-md border ${
                      result.success 
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{worker?.name || workerId}</span>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {result.error === 'worker-not-found' && 'العامل غير موجود'}
                        {result.error === 'worker-already-assigned' && 'العامل مسكّن بالفعل'}
                        {result.error === 'worker-not-assigned' && 'العامل غير مسكّن'}
                        {result.error === 'room-not-found' && 'الغرفة غير موجودة'}
                        {result.error === 'room-full' && 'الغرفة ممتلئة'}
                        {result.error === 'nationality-mismatch' && 'تعارض في الجنسية'}
                        {!['worker-not-found', 'worker-already-assigned', 'worker-not-assigned', 'room-not-found', 'room-full', 'nationality-mismatch'].includes(result.error) && result.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          {!results ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={processing}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  processing ||
                  selectedWorkerIds.length === 0 ||
                  ((operationType === 'CHECK_IN' || operationType === 'TRANSFER') &&
                    (!selectedResidenceId || !selectedRoomId))
                }
              >
                {processing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                {operationType === 'CHECK_IN' && 'تسكين الجميع'}
                {operationType === 'CHECK_OUT' && 'إخراج الجميع'}
                {operationType === 'TRANSFER' && 'نقل الجميع'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              إغلاق
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
