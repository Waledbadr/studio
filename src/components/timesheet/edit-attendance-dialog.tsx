import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyAttendance } from "@/types/timesheet";
import { useTimesheet } from "@/context/timesheet-context";
import { calculateAttendanceStats } from "@/utils/timesheet-utils";

interface EditAttendanceDialogProps {
  record: DailyAttendance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAttendanceDialog({ record, open, onOpenChange }: EditAttendanceDialogProps) {
  const { updateAttendanceRecord } = useTimesheet();
  const [checkIn, setCheckIn] = useState(record.checkIn || "");
  const [checkOut, setCheckOut] = useState(record.checkOut || "");

  // Update internal state when record opens
  useEffect(() => {
    if (open) {
      setCheckIn(record.checkIn || "");
      setCheckOut(record.checkOut || "");
    }
  }, [open, record]);

  const handleSave = () => {
    // 1. Convert spaces to basic time validations if needed, assume format HH:MM
    const inTime = checkIn.trim() || null;
    const outTime = checkOut.trim() || null;

    // 2. Re-calculate metrics based on new inputs
    const stats = calculateAttendanceStats(inTime, outTime, record.date, record.employeeId);

    // 3. Update the global context
    updateAttendanceRecord(record.id, {
      checkIn: inTime,
      checkOut: outTime,
      totalHours: stats.totalHours,
      regularHours: stats.regularHours,
      overtimeHours: stats.overtimeHours,
      status: stats.status,
      isManualOverride: true,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل السجل اليومي</DialogTitle>
          <DialogDescription>
            تعديل بصمات الدخول والخروج للموظف {record.firstName} ليوم {record.date}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="checkIn" className="text-right">
              وقت الدخول
            </Label>
            <Input
              id="checkIn"
              type="time"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="checkOut" className="text-right">
              وقت الخروج
            </Label>
            <Input
              id="checkOut"
              type="time"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="bg-muted p-3 flex gap-2 justify-center rounded-md border mt-2">
            <span className="text-xs text-muted-foreground mr-1 text-center w-full">
              بصمات النظام الأصلية:
              <br/>
              <b>{record.punches.join(' | ')}</b>
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
