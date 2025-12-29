import React, { useState } from "react";
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
import { AccommodationHistory } from "@/context/accommodation-context";
import { useLanguage } from "@/context/language-context";
import { format } from "date-fns";

interface EditHistoryDialogProps {
  history: AccommodationHistory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (historyId: string, updates: Partial<AccommodationHistory>) => Promise<void>;
}

export function EditHistoryDialog({ history, open, onOpenChange, onSave }: EditHistoryDialogProps) {
  const { locale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [actionDate, setActionDate] = useState(
    format(new Date(history.actionDate), "yyyy-MM-dd'T'HH:mm")
  );
  const [notes, setNotes] = useState(history.notes || "");
  const [reason, setReason] = useState(history.reason || "");

  const handleSave = async () => {
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
          <div className="space-y-2">
            <Label htmlFor="actionDate">
              {locale === 'ar' ? 'التاريخ والوقت' : 'Date and Time'}
            </Label>
            <Input
              id="actionDate"
              type="datetime-local"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
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
          <Button onClick={handleSave} disabled={loading}>
            {loading 
              ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
