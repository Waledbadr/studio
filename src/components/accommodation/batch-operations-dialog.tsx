"use client";

import React, { useState, useMemo } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';
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
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUserLanguage, getLocalizedMessage } from '@/lib/i18n-helpers';

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
  
  const { currentUser } = useUsers();

  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>(preSelectedWorkers);
  const [selectedResidenceId, setSelectedResidenceId] = useState(targetResidenceId || '');
  const [selectedRoomId, setSelectedRoomId] = useState(targetRoomId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<Record<string, { success: boolean; error?: string }> | null>(null);
  const [dateWarning, setDateWarning] = useState<string>('');

  // Filter Residences based on permissions
  const accessibleResidences = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences?.includes(r.id));
  }, [residences, currentUser]);

  const getTitle = () => {
    const lang = getUserLanguage();
    switch (operationType) {
      case 'CHECK_IN': return getLocalizedMessage({ ar: 'تسكين جماعي', en: 'Bulk Check-In' });
      case 'CHECK_OUT': return getLocalizedMessage({ ar: 'إخراج جماعي', en: 'Bulk Check-Out' });
      case 'TRANSFER': return getLocalizedMessage({ ar: 'تبديل جماعي', en: 'Bulk Transfer' });
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
    const lang = getUserLanguage();
    switch (operationType) {
      case 'CHECK_IN': return getLocalizedMessage({ ar: 'تسكين عدة عمال في نفس الغرفة', en: 'Check in multiple workers to the same room' });
      case 'CHECK_OUT': return getLocalizedMessage({ ar: 'إخراج عدة عمال من سكناتهم الحالية', en: 'Check out multiple workers from their current accommodations' });
      case 'TRANSFER': return getLocalizedMessage({ ar: 'نقل عدة عمال إلى غرفة جديدة', en: 'Transfer multiple workers to a new room' });
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
      const performedBy = currentUser.id || 'Admin';

      if (operationType === 'CHECK_IN') {
        result = await bulkCheckIn({
          workerIds: selectedWorkerIds,
          residenceId: selectedResidenceId,
          roomId: selectedRoomId,
          checkInDate: date + 'T00:00:00.000Z',
          notes,
          performedBy,
        });
      } else if (operationType === 'CHECK_OUT') {
        result = await bulkCheckOut({
          workerIds: selectedWorkerIds,
          checkOutDate: date + 'T00:00:00.000Z',
          reason,
          notes,
          performedBy,
        });
      } else if (operationType === 'TRANSFER') {
        result = await bulkTransfer({
          workerIds: selectedWorkerIds,
          toResidenceId: selectedResidenceId,
          toRoomId: selectedRoomId,
          transferDate: date + 'T00:00:00.000Z',
          reason,
          notes,
          performedBy,
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
              <Label>{getLocalizedMessage({ ar: `العمال المحددين (${selectedWorkerIds.length})`, en: `Selected Workers (${selectedWorkerIds.length})` })}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedWorkerIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{getLocalizedMessage({ ar: 'لم يتم تحديد أي عمال', en: 'No workers selected' })}</p>
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
                  <Label htmlFor="residence">{getLocalizedMessage({ ar: 'المسكن', en: 'Residence' })}</Label>
                  <select
                    id="residence"
                    value={selectedResidenceId}
                    onChange={(e) => {
                      setSelectedResidenceId(e.target.value);
                      setSelectedRoomId('');
                    }}
                    className="w-full mt-1 border rounded-md px-3 py-2 bg-background"
                  >
                    <option value="">{getLocalizedMessage({ ar: 'اختر المسكن', en: 'Select Residence' })}</option>
                    {accessibleResidences.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="room">{getLocalizedMessage({ ar: 'الغرفة', en: 'Room' })}</Label>
                  <select
                    id="room"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    disabled={!selectedResidenceId}
                    className="w-full mt-1 border rounded-md px-3 py-2 bg-background disabled:opacity-50"
                  >
                    <option value="">{getLocalizedMessage({ ar: 'اختر الغرفة', en: 'Select Room' })}</option>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="date">
                  {operationType === 'CHECK_IN' && 'تاريخ التسكين'}
                  {operationType === 'CHECK_OUT' && 'تاريخ الإخراج'}
                  {operationType === 'TRANSFER' && 'تاريخ التبديل'}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" dir="rtl">
                      <p className="text-sm">
                        {operationType === 'CHECK_OUT' && (
                          <>• لا يمكن اختيار تاريخ في المستقبل<br/>• لا يمكن التعديل في الشهور المفوترة</>
                        )}
                        {operationType === 'CHECK_IN' && (
                          <>• لا يمكن اختيار تاريخ في المستقبل<br/>• يجب أن يكون التاريخ بعد آخر خروج للعامل<br/>• لا يمكن تسكين عامل لديه سجل نشط</>
                        )}
                        {operationType === 'TRANSFER' && (
                          <>• لا يمكن اختيار تاريخ في المستقبل<br/>• يجب أن يكون التاريخ بعد آخر خروج للعامل<br/>• لا يمكن النقل في فترة مفوترة</>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="date"
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (selectedDate > today) {
                    setDateWarning('⚠️ لا يمكن اختيار تاريخ في المستقبل');
                  } else {
                    setDateWarning('');
                  }
                  setDate(e.target.value);
                }}
                className="mt-1"
              />
              {dateWarning && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{dateWarning}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Reason (for CHECK_OUT and TRANSFER) */}
            {(operationType === 'CHECK_OUT' || operationType === 'TRANSFER') && (
              <div>
                <Label htmlFor="reason">{getLocalizedMessage({ ar: 'السبب (اختياري)', en: 'Reason (Optional)' })}</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={getLocalizedMessage({ ar: 'أدخل سبب العملية', en: 'Enter reason for operation' })}
                  className="mt-1"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">{getLocalizedMessage({ ar: 'ملاحظات (اختياري)', en: 'Notes (Optional)' })}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={getLocalizedMessage({ ar: 'أدخل أي ملاحظات إضافية', en: 'Enter any additional notes' })}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              Object.values(results).every(r => r.success)
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`} dir="rtl">
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
                        {(() => {
                          const lang = getUserLanguage();
                          const errorCode = (result.error || '').split(':')[0].trim();
                          const errorMessages: Record<string, {ar: string, en: string}> = {
                            'CHECKIN_IN_FUTURE': { ar: 'تاريخ التسكين لا يمكن أن يكون في المستقبل', en: 'Check-in date cannot be in the future' },
                            'CHECKOUT_IN_FUTURE': { ar: 'تاريخ الخروج لا يمكن أن يكون في المستقبل', en: 'Check-out date cannot be in the future' },
                            'DATE_CONFLICT_WITH_HISTORY': { ar: 'يوجد تعارض في التواريخ مع سجلات العامل', en: 'Date conflict with worker history' },
                            'CHECKIN_BEFORE_LAST_CHECKOUT': { ar: 'تاريخ التسكين يجب أن يكون بعد آخر خروج', en: 'Check-in must be after last check-out' },
                            'CHECKOUT_BEFORE_CHECKIN': { ar: 'تاريخ الخروج قبل تاريخ الدخول', en: 'Check-out before check-in' },
                            'MONTH_ALREADY_INVOICED': { ar: 'تم إصدار فاتورة لهذا الشهر', en: 'Month already invoiced' },
                            'worker-not-found': { ar: 'العامل غير موجود', en: 'Worker not found' },
                            'worker-already-assigned': { ar: 'العامل مسكّن بالفعل', en: 'Worker already assigned' },
                            'worker-not-assigned': { ar: 'العامل غير مسكّن', en: 'Worker not assigned' },
                            'room-not-found': { ar: 'الغرفة غير موجودة', en: 'Room not found' },
                            'room-full': { ar: 'الغرفة ممتلئة', en: 'Room full' },
                            'nationality-mismatch': { ar: 'تعارض في الجنسية', en: 'Nationality mismatch' },
                            'role-mismatch': { ar: 'تعارض في الدور الوظيفي', en: 'Role mismatch' }
                          };
                          const msg = errorMessages[errorCode];
                          return msg ? getLocalizedMessage(msg) : result.error;
                        })()}
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
                {getLocalizedMessage({ ar: 'إلغاء', en: 'Cancel' })}
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
                {operationType === 'CHECK_IN' && getLocalizedMessage({ ar: 'تسكين الجميع', en: 'Check In All' })}
                {operationType === 'CHECK_OUT' && getLocalizedMessage({ ar: 'إخراج الجميع', en: 'Check Out All' })}
                {operationType === 'TRANSFER' && getLocalizedMessage({ ar: 'نقل الجميع', en: 'Transfer All' })}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              {getLocalizedMessage({ ar: 'إغلاق', en: 'Close' })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
