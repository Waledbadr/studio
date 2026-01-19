import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { AccommodationHistory, useAccommodation } from "@/context/accommodation-context";
import { useLanguage } from "@/context/language-context";
import { format } from "date-fns";
import { 
  canModifyHistoryRecord, 
  getValidationErrorMessage,
  type WorkerHistoryRecord,
  type InvoiceRecord 
} from "@/lib/accommodation-date-validation";

interface EditHistoryDialogProps {
  history: AccommodationHistory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (historyId: string, updates: Partial<AccommodationHistory>) => Promise<void>;
}

export function EditHistoryDialog({ history, open, onOpenChange, onSave }: EditHistoryDialogProps) {
  const { locale } = useLanguage();
  const { invoices } = useAccommodation();
  const [loading, setLoading] = useState(false);
  const [actionDate, setActionDate] = useState(
    format(new Date(history.actionDate), "yyyy-MM-dd'T'HH:mm")
  );
  const [notes, setNotes] = useState(history.notes || "");
  const [reason, setReason] = useState(history.reason || "");

  // Check if this record can be modified
  const modificationStatus = useMemo(() => {
    const recordForValidation: WorkerHistoryRecord = {
      id: history.id,
      workerId: history.workerId,
      checkInDate: new Date(history.actionDate),
      checkOutDate: history.actionType === 'CHECK_OUT' ? new Date(history.actionDate) : null,
      roomId: history.roomId || '',
      residenceId: history.residenceId
    };

    const invoiceRecords: InvoiceRecord[] = invoices.map(inv => ({
      id: inv.id,
      month: parseInt(inv.month.split('-')[1]) - 1,
      year: parseInt(inv.month.split('-')[0]),
      residenceId: inv.residenceId,
      status: inv.status === 'Draft' ? 'draft' : inv.status === 'Paid' ? 'paid' : inv.status === 'Cancelled' ? 'cancelled' : 'issued',
      createdAt: new Date(inv.generatedAt)
    }));

    return canModifyHistoryRecord(recordForValidation, invoiceRecords);
  }, [history, invoices]);

  const canModify = modificationStatus.isValid;
  const errorMessage = !canModify ? getValidationErrorMessage(modificationStatus, locale) : '';

  const handleSave = async () => {
    if (!canModify) {
      return;
    }

    setLoading(true);
    try {
      const updates: Partial<AccommodationHistory> = {
        actionDate: new Date(actionDate).toISOString(),
        notes: notes || undefined,
        reason: reason || undefined,
      };
      
      await onSave(history.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{locale === 'ar' ? 'تعديل السجل' : 'Edit Record'}</DialogTitle>
          <DialogDescription>
            {locale === 'ar' ? 'تعديل تفاصيل السجل التاريخي' : 'Edit history record details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!canModify && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="actionDate">
              {locale === 'ar' ? 'التاريخ والوقت' : 'Date and Time'}
            </Label>
            <Input
              id="actionDate"
              type="datetime-local"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
              disabled={!canModify}
            />
          </div>

          {history.actionType === 'CHECK_OUT' && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                {locale === 'ar' ? 'السبب' : 'Reason'}
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Transfer, Exit, Vacation, Other"
                disabled={!canModify}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              {locale === 'ar' ? 'ملاحظات' : 'Notes'}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={locale === 'ar' ? 'أضف ملاحظات إضافية...' : 'Add additional notes...'}
              rows={3}
              disabled={!canModify}
            />
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
            <div>
              <strong>{locale === 'ar' ? 'نوع العملية:' : 'Action Type:'}</strong> {history.actionType}
            </div>
            <div>
              <strong>{locale === 'ar' ? 'العامل:' : 'Worker:'}</strong> {history.workerName}
            </div>
            <div>
              <strong>{locale === 'ar' ? 'الموقع:' : 'Location:'}</strong> {history.residenceName} / {history.roomName}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={loading || !canModify}>
            {loading 
              ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
