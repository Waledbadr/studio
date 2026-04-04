"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Calendar, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";
import { useTimesheet } from "@/context/timesheet-context";
import { TimesheetProvider } from "@/context/timesheet-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function EventsContent() {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const { timesheetEvents, updateEvents } = useTimesheet();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    type: "holiday",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    requiredHours: 8,
  });

  const handleAddEvent = () => {
    if (!newEvent.name) return;
    const event = {
      id: Date.now().toString(),
      name: newEvent.name,
      type: newEvent.type as "holiday" | "reduced_hours",
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      requiredHours: newEvent.type === "reduced_hours" ? newEvent.requiredHours : 8,
    };
    updateEvents([...(timesheetEvents || []), event]);
    setIsAddOpen(false);
    setNewEvent({
      name: "",
      type: "holiday",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      requiredHours: 8,
    });
  };

  const handleRemoveEvent = (id: string) => {
    updateEvents((timesheetEvents || []).filter((e) => e.id !== id));
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "المناسبات والاستثناءات" : "Events & Exceptions"}</h1>
          <p className="text-muted-foreground">
            {isAr
              ? "إدارة الإجازات الرسمية (تضيف ساعات كاملة) ومناسبات العمل المخفض (مثل رمضان)"
              : "Manage official holidays (grants full hours) and reduced-hour events (e.g. Ramadan)"}
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2 ml-2" />
          {isAr ? "إضافة مناسبة" : "Add Event"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              {isAr ? "قائمة المناسبات والإجازات" : "List of Events & Holidays"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!timesheetEvents || timesheetEvents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {isAr ? "لا توجد مناسبات مضافة" : "No events added"}
              </div>
            ) : (
              timesheetEvents.map((e) => (
                <div key={e.id} className="flex justify-between items-center bg-muted/50 p-4 rounded-lg border">
                  <div>
                    <div className="font-semibold text-lg flex items-center gap-2">
                      {e.name}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          e.type === "holiday" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {e.type === "holiday" ? (isAr ? "عطلة رسمية" : "Holiday") : (isAr ? "دوام مخفض" : "Reduced Hours")}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {e.startDate} {e.startDate !== e.endDate && `➡️ ${e.endDate}`}
                      </span>
                      {e.type === "reduced_hours" && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {e.requiredHours} {isAr ? "ساعات عمل إجبارية" : "required hours"}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveEvent(e.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة مناسبة جديدة" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {isAr
                ? "سيتم تطبيق هذه المناسبة إما لتعويض الموظف غياب يوم كعطلة أو تقليل الساعات."
                : "This event will be applied either to cover absences on holidays or reduce required hours."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? "اسم المناسبة" : "Event Name"}</Label>
              <Input
                placeholder={isAr ? "مثال: عيد الفطر" : "e.g. Eid Al-Fitr"}
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "النوع" : "Type"}</Label>
              <Select value={newEvent.type} onValueChange={(val) => setNewEvent({ ...newEvent, type: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">{isAr ? "عطلة رسمية (لا تتطلب دوام)" : "Official Holiday"}</SelectItem>
                  <SelectItem value="reduced_hours">{isAr ? "دوام مخفض (كرمضان)" : "Reduced Hours (e.g. Ramadan)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newEvent.type === "reduced_hours" && (
              <div className="space-y-2">
                <Label>{isAr ? "الساعات المطلوبة" : "Required Hours"}</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={newEvent.requiredHours}
                  onChange={(e) => setNewEvent({ ...newEvent, requiredHours: Number(e.target.value) })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? "من تاريخ" : "From Date"}</Label>
                <Input
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "إلى تاريخ" : "To Date"}</Label>
                <Input
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.name}>
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EventsPage() {
  return (
    <TimesheetProvider>
      <EventsContent />
    </TimesheetProvider>
  );
}