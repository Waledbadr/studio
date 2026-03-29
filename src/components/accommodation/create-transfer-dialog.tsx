"use client";

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  validateDateConflicts, 
  getValidationErrorMessage,
  type WorkerHistoryRecord
} from '@/lib/accommodation-date-validation';

interface CreateTransferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedWorkers?: string[]; // Optional: pre-select workers
}

export function CreateTransferDialog({ isOpen, onOpenChange, preSelectedWorkers = [] }: CreateTransferDialogProps) {
  const { workers, occupants, createTransferRequest, fetchWorkerHistory } = useAccommodation();
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { toast } = useToast();

  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(preSelectedWorkers);
  const [fromResidenceId, setFromResidenceId] = useState<string>('');
  const [fromRoomId, setFromRoomId] = useState<string>('');
  const [toResidenceId, setToResidenceId] = useState<string>('');
  const [toRoomId, setToRoomId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateConflicts, setDateConflicts] = useState<Record<string, string>>({});

  // Get available workers (not pre-selected)
  const availableWorkers = workers?.filter(w => !selectedWorkers.includes(w.id)) || [];

  // Get from rooms based on selected residence
  const fromRooms = React.useMemo(() => {
    if (!fromResidenceId) return [];
    const residence = residences?.find(r => r.id === fromResidenceId);
    if (!residence) return [];
    
    const rooms: any[] = [];
    if (residence.rooms) rooms.push(...residence.rooms);
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          if (floor.rooms) rooms.push(...floor.rooms);
        }
      }
    }
    return rooms;
  }, [fromResidenceId, residences]);

  // Get to rooms based on selected residence
  const toRooms = React.useMemo(() => {
    if (!toResidenceId) return [];
    const residence = residences?.find(r => r.id === toResidenceId);
    if (!residence) return [];
    
    const rooms: any[] = [];
    if (residence.rooms) rooms.push(...residence.rooms);
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          if (floor.rooms) rooms.push(...floor.rooms);
        }
      }
    }
    return rooms;
  }, [toResidenceId, residences]);

  const handleAddWorker = (workerId: string) => {
    setSelectedWorkers(prev => [...prev, workerId]);
    // Check for date conflicts when adding worker
    checkDateConflictsForWorker(workerId);
  };

  const handleRemoveWorker = (workerId: string) => {
    setSelectedWorkers(prev => prev.filter(id => id !== workerId));
    setDateConflicts(prev => {
      const updated = { ...prev };
      delete updated[workerId];
      return updated;
    });
  };

  // Check date conflicts for a worker
  const checkDateConflictsForWorker = async (workerId: string) => {
    if (!transferDate) return;
    
    const workerHistory = await fetchWorkerHistory(workerId);
    const historyRecords: WorkerHistoryRecord[] = workerHistory
      .filter(h => h.actionType === 'CHECK_IN' || h.actionType === 'CHECK_OUT' || h.actionType === 'TRANSFER')
      .map(h => ({
        id: h.id,
        workerId: h.workerId,
        checkInDate: new Date(h.actionDate),
        checkOutDate: h.actionType === 'CHECK_OUT' ? new Date(h.actionDate) : null,
        roomId: h.toRoomId || h.roomId || '',
        residenceId: h.toResidenceId || h.residenceId
      }));

    const conflictValidation = validateDateConflicts(
      workerId,
      new Date(transferDate),
      historyRecords
    );

    if (!conflictValidation.isValid) {
      const lastCheckout = workerHistory.find(h => h.actionType === 'CHECK_OUT');
      const errorMsg = lastCheckout 
        ? `لا يمكن النقل بتاريخ ${new Date(transferDate).toLocaleDateString('ar-SA')} لأن العامل خرج بتاريخ ${new Date(lastCheckout.actionDate).toLocaleDateString('ar-SA')}`
        : getValidationErrorMessage(conflictValidation, 'ar');
      
      setDateConflicts(prev => ({ ...prev, [workerId]: errorMsg }));
    } else {
      setDateConflicts(prev => {
        const updated = { ...prev };
        delete updated[workerId];
        return updated;
      });
    }
  };

  // Re-check conflicts when date changes
  React.useEffect(() => {
    selectedWorkers.forEach(checkDateConflictsForWorker);
  }, [transferDate]);

  const getWorkerName = (id: string) => {
    return workers?.find(w => w.id === id)?.name || id;
  };

  const getResidenceName = (id: string) => {
    return residences?.find(r => r.id === id)?.name || id;
  };

  const getRoomName = (roomId: string, residenceId: string) => {
    const residence = residences?.find(r => r.id === residenceId);
    if (!residence) return roomId;
    
    if (residence.rooms) {
      const room = residence.rooms.find(r => r.id === roomId);
      if (room) return room.name || roomId;
    }
    
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          const room = floor.rooms?.find(r => r.id === roomId);
          if (room) return room.name || roomId;
        }
      }
    }
    
    return roomId;
  };

  const handleSubmit = async () => {
    if (selectedWorkers.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار عامل واحد على الأقل',
        variant: 'destructive',
      });
      return;
    }

    if (!toResidenceId) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار المسكن المستهدف',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const transferRequest = createTransferRequest({
        from: fromResidenceId && fromRoomId ? { residenceId: fromResidenceId, roomId: fromRoomId } : undefined,
        to: { residenceId: toResidenceId, roomId: toRoomId || undefined },
        workerIds: selectedWorkers,
        requestedBy: currentUser?.id || 'unknown',
        reason: reason || undefined,
      });

      toast({
        title: 'تم إنشاء الطلب',
        description: `تم إنشاء طلب نقل #${transferRequest.id.slice(0, 8)} بنجاح`,
      });

      // Reset form
      setSelectedWorkers([]);
      setFromResidenceId('');
      setFromRoomId('');
      setToResidenceId('');
      setToRoomId('');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create transfer request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء طلب النقل',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">إنشاء طلب نقل</DialogTitle>
          <DialogDescription>
            انقل العمال من مسكن/غرفة إلى مسكن/غرفة أخرى
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Workers */}
          <div className="space-y-2">
            <Label>العمال المختارون ({selectedWorkers.length})</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/50">
              {selectedWorkers.length === 0 ? (
                <span className="text-sm text-muted-foreground">لم يتم اختيار عمال بعد</span>
              ) : (
                selectedWorkers.map(wid => (
                  <Badge key={wid} variant="secondary" className="gap-1">
                    {getWorkerName(wid)}
                    <button
                      type="button"
                      onClick={() => handleRemoveWorker(wid)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            
            {/* Show date conflicts if any */}
            {Object.keys(dateConflicts).length > 0 && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">تعارض في التواريخ:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(dateConflicts).map(([workerId, error]) => (
                      <li key={workerId} className="text-sm">
                        {getWorkerName(workerId)}: {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Add Worker */}
          <div className="space-y-2">
            <Label>إضافة عامل</Label>
            <Select onValueChange={handleAddWorker}>
              <SelectTrigger>
                <SelectValue placeholder="اختر عامل..." />
              </SelectTrigger>
              <SelectContent>
                {availableWorkers.length === 0 ? (
                  <SelectItem value="_empty" disabled>لا توجد عمال متاحة</SelectItem>
                ) : (
                  availableWorkers.map(worker => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name} {worker.employeeId ? `(${worker.employeeId})` : ''} - {worker.nationaliy}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* From Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="text-muted-foreground">من:</span>
              <span className="text-sm text-muted-foreground">(اختياري)</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المسكن الحالي</Label>
                <Select value={fromResidenceId} onValueChange={setFromResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المسكن..." />
                  </SelectTrigger>
                  <SelectContent>
                    {residences?.map(residence => (
                      <SelectItem key={residence.id} value={residence.id}>
                        {residence.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الغرفة الحالية</Label>
                <Select value={fromRoomId} onValueChange={setFromRoomId} disabled={!fromResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الغرفة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fromRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name || room.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>

          {/* To Section */}
          <div className="space-y-4 p-4 border-2 border-primary/50 rounded-lg bg-primary/5">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="text-primary">إلى:</span>
              <span className="text-sm text-destructive">*مطلوب</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المسكن الجديد *</Label>
                <Select value={toResidenceId} onValueChange={setToResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المسكن..." />
                  </SelectTrigger>
                  <SelectContent>
                    {residences?.map(residence => (
                      <SelectItem key={residence.id} value={residence.id}>
                        {residence.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الغرفة الجديدة</Label>
                <Select value={toRoomId} onValueChange={setToRoomId} disabled={!toResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الغرفة (اختياري)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {toRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name || room.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transfer Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>تاريخ النقل *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">• لا يمكن اختيار تاريخ في المستقبل</p>
                      <p className="text-sm">• لا يمكن النقل إلى تاريخ محجوز أو مستخدم</p>
                      <p className="text-sm">• تحقق من عدم وجود تعارض مع سجلات العمال</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              {new Date(transferDate) > new Date() && (
                <Alert className="py-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-xs text-destructive">
                    ⚠️ لا يمكن اختيار تاريخ في المستقبل للنقل
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>سبب النقل (اختياري)</Label>
            <Textarea
              placeholder="مثال: نقل للقرب من مكان العمل..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedWorkers.length > 0 && toResidenceId && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-md">
              <p className="text-sm font-medium mb-2">ملخص الطلب:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• عدد العمال: {selectedWorkers.length}</li>
                {fromResidenceId && (
                  <li>• من: {getResidenceName(fromResidenceId)} {fromRoomId ? `- ${getRoomName(fromRoomId, fromResidenceId)}` : ''}</li>
                )}
                <li>• إلى: {getResidenceName(toResidenceId)} {toRoomId ? `- ${getRoomName(toRoomId, toResidenceId)}` : ''}</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedWorkers.length === 0 || !toResidenceId}>
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء طلب النقل'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
