"use client";

import React, { useState, useMemo } from "react";
import { Download, RefreshCw, Save, Database, Clock, Users, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTimesheet } from "@/context/timesheet-context";
import { EditAttendanceDialog } from "./edit-attendance-dialog";
import { DailyAttendance } from "@/types/timesheet";
import { useLanguage } from "@/context/language-context";
import { useUsers } from "@/context/users-context";
import { useResidences } from "@/context/residences-context";
import { getFiscalMonthForDate, getFiscalMonthPeriod, getPreviousFiscalMonth } from "@/lib/fiscal-month-utils";

export function TimesheetView() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const currentDay = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(currentDay);
  const [editingRecord, setEditingRecord] = useState<DailyAttendance | null>(null);

  const { locale } = useLanguage();
  const { currentUser } = useUsers();
  
  const isAr = locale === "ar";
  
  const {
    rawPunches,
    processedAttendance,
    projectToResidenceMap,
    isFetching,
    isProcessing,
    isSaving,
    fetchAndProcessAttendance,
    syncProcessedDataToFirestore,
    deleteAllAttendanceRecords,
  } = useTimesheet();

  const handleFetch = () => {
    if (!startDate || !endDate) return;
    fetchAndProcessAttendance(startDate, endDate);
  };

  const setRangeToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const setRangeYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    setStartDate(yStr);
    setEndDate(yStr);
  };

  const setRangeThisMonth = () => {
    const now = new Date();
    const currentFiscalMonth = getFiscalMonthForDate(now);
    const period = getFiscalMonthPeriod(currentFiscalMonth);
    
    // Format to YYYY-MM-DD for the input type="date"
    const formatDate = (date: Date) => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    setStartDate(formatDate(period.startDate));
    setEndDate(formatDate(period.endDate));
  };

  const setRangeByMonth = (monthStr: string) => {
    const period = getFiscalMonthPeriod(monthStr);
    
    const formatDate = (date: Date) => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    setStartDate(formatDate(period.startDate));
    setEndDate(formatDate(period.endDate));
  };

  const setRangeLastMonth = () => {
    const now = new Date();
    const currentFiscalMonth = getFiscalMonthForDate(now);
    const prevMonthStr = getPreviousFiscalMonth(currentFiscalMonth);
    const period = getFiscalMonthPeriod(prevMonthStr);

    const formatDate = (date: Date) => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    setStartDate(formatDate(period.startDate));
    setEndDate(formatDate(period.endDate));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">{isAr ? "مكتمل" : "Complete"}</Badge>;
      case 'Incomplete':
        return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">{isAr ? "ناقص" : "Incomplete"}</Badge>;
      case 'Absent':
        return <Badge variant="destructive">{isAr ? "غائب" : "Absent"}</Badge>;
      case 'On Leave':
        return <Badge variant="secondary" className="bg-indigo-500 text-white hover:bg-indigo-600">{isAr ? "إجازة معتمدة" : "On Leave"}</Badge>;
      case 'Sick Leave':
        return <Badge variant="secondary" className="bg-red-400 text-white hover:bg-red-500">{isAr ? "إجازة مرضية" : "Sick Leave"}</Badge>;
      case 'Permission':
        return <Badge variant="secondary" className="bg-amber-400 text-white hover:bg-amber-500">{isAr ? "استئذان" : "Permission"}</Badge>;
      case 'Weekend':
        return <Badge variant="secondary" className="bg-sky-500 text-white hover:bg-sky-600">{isAr ? 'عطلة أسبوعية' : 'Weekend'}</Badge>;
      case 'Holiday':
        return <Badge variant="secondary" className="bg-purple-500 text-white hover:bg-purple-600">{isAr ? "عطلة رسمية" : "Holiday"}</Badge>;
      case 'Reduced Hours':
        return <Badge variant="secondary" className="bg-sky-500 text-white hover:bg-sky-600">{isAr ? "دوام مخفض" : "Reduced Hours"}</Badge>;
      case 'Transferred':
        return <Badge variant="outline" className="text-muted-foreground border-dashed bg-muted/20">{isAr ? 'متحول (T)' : 'Transferred (T)'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter records to only those that belong to the user's assigned residences
  const displayAttendance = useMemo(() => {
    // If admin or super user, they might see everything or we just skip filtering
    if (currentUser?.role === 'Admin') return processedAttendance;

    const assignedResidenceIds = currentUser?.assignedResidences || [];
    
    if (assignedResidenceIds.length === 0) return []; // User with no access

    return processedAttendance.filter(record => {
      // Find the App Residence ID linked to this specific biometric project
      const mappedResidenceId = projectToResidenceMap[record.projectName];
      
      // If we found a mapped residence id, check if the user has access to it
      if (mappedResidenceId) {
        return assignedResidenceIds.includes(mappedResidenceId);
      }

      // Fallback matching logic (by simple string match) if not explicitly mapped
      return assignedResidenceIds.some(assigned => 
        record.projectName.toLowerCase().includes(assigned.toLowerCase()) ||
        assigned.toLowerCase().includes(record.projectName.toLowerCase())
      );
    });
  }, [processedAttendance, currentUser, projectToResidenceMap]);

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {isSaving && (
        <div
          className="fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-3 text-emerald-900 shadow-lg dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
          role="status"
          aria-live="assertive"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <div>
            <p className="font-semibold">{isAr ? "جاري الحفظ في قاعدة البيانات" : "Saving to database"}</p>
            <p className="text-xs opacity-80">{isAr ? "يتم دمج السجلات وحماية البيانات الموجودة…" : "Merging records and preserving existing data…"}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isAr ? "سجل الدوام" : "Timesheet"}</h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "إدارة البصمات، الحضور والانصراف، والمزامنة" : "Manage punches, attendance records, and synchronization"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {displayAttendance.length > 0 && (
            <Button
              onClick={syncProcessedDataToFirestore}
              variant="outline"
              className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              disabled={isFetching || isProcessing || isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {isSaving
                ? (isAr ? "جاري الحفظ والدمج..." : "Saving & merging...")
                : (isAr ? "حفظ السجلات" : "Save Records")}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
                {isAr ? "حذف جميع السجلات" : "Delete All Records"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isAr ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isAr
                    ? "سيتم حذف جميع سجلات الحضور المحفوظة في قاعدة البيانات نهائياً. يمكنك إعادة استيرادها بعد الحذف."
                    : "This will permanently delete ALL attendance records from the database. You can re-import them afterwards."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={deleteAllAttendanceRecords}
                >
                  {isAr ? "نعم، احذف الكل" : "Yes, Delete All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" className="gap-2" disabled>
            <Download className="w-4 h-4" />
            {isAr ? "تصدير Excel" : "Export Excel"}
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">{isAr ? "استيراد البيانات من أجهزة البصمة" : "Import Biometric Data"}</CardTitle>
          <CardDescription>
            {isAr ? "اختر نطاق التاريخ لاستيراد البصمات مباشرة من قاعدة البيانات الرئيسية" : "Select date range to import punches directly from the main database"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">{isAr ? "اختيارات سريعة:" : "Quick Select:"}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={setRangeToday}>{isAr ? "اليوم" : "Today"}</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={setRangeYesterday}>{isAr ? "أمس" : "Yesterday"}</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full bg-blue-50 dark:bg-blue-950/30" onClick={setRangeThisMonth}>{isAr ? "هذا الشهر" : "This Month"}</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={setRangeLastMonth}>{isAr ? "الشهر السابق" : "Last Month"}</Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">{isAr ? "الشهور المالية 2026:" : "2026 Fiscal Months:"}</span>
            {[
              { name: isAr ? "يناير" : "Jan", value: "2026-01" },
              { name: isAr ? "فبراير" : "Feb", value: "2026-02" },
              { name: isAr ? "مارس" : "Mar", value: "2026-03" },
              { name: isAr ? "أبريل" : "Apr", value: "2026-04" },
              { name: isAr ? "مايو" : "May", value: "2026-05" },
            ].map(m => (
              <Button 
                key={m.value}
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs px-3 border border-dashed hover:border-solid rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                onClick={() => setRangeByMonth(m.value)}
              >
                {m.name}
              </Button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end pt-2 border-t border-dashed">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="start-date" className="text-sm font-medium">{isAr ? "من تاريخ" : "Start Date"}</label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="end-date" className="text-sm font-medium">{isAr ? "إلى تاريخ" : "End Date"}</label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleFetch} 
              disabled={isFetching || isProcessing || isSaving || !startDate || !endDate}
              className="w-full md:w-auto"
            >
              {isFetching || isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isFetching
                    ? (isAr ? "جاري جلب البصمات..." : "Fetching punches...")
                    : (isAr ? "جاري معالجة السجلات..." : "Processing records...")}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isAr ? "جلب ومعالجة البيانات" : "Fetch & Process Data"}
                </>
              )}
            </Button>
          </div>
          {(isFetching || isProcessing || isSaving) && (
            <div
              className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {isSaving
                ? (isAr ? "يتم حفظ ودمج البيانات في قاعدة البيانات. يمكنك الانتظار هنا." : "Saving and merging records in the database. Please wait.")
                : isFetching
                  ? (isAr ? "يتم الاتصال بخادم البصمة وجلب البيانات." : "Connecting to the biometric server and fetching data.")
                  : (isAr ? "يتم تحويل البصمات إلى سجلات حضور يومية." : "Converting punches into daily attendance records.")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "إجمالي السجلات اليومية" : "Total Daily Records"}</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayAttendance.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "يوم عمل لموظف" : "employee working days"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "إجمالي البصمات الخام" : "Total Raw Punches"}</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawPunches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "حركة دخول/خروج" : "in/out movements"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "بصمات ناقصة (للمراجعة)" : "Incomplete (To Review)"}</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayAttendance.filter(r => r.status === 'Incomplete').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-yellow-600 dark:text-yellow-500">
              {isAr ? "حالات تتطلب تعديل" : "cases require edit"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{isAr ? "معاينة السجلات" : "Records Preview"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isFetching || isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>{isAr ? "جاري سحب البيانات ومعالجة سجلات الدخول والخروج..." : "Pulling data and processing records..."}</p>
            </div>
          ) : displayAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-md bg-muted/20">
              <Database className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">{isAr ? "لا توجد بيانات للعرض" : "No data to display"}</p>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? "يرجى تحديد النطاق الزمني والضغط على جلب البيانات" : "Please select date range and click fetch"}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الرقم الوظيفي" : "Employee ID"}</TableHead>
                    <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isAr ? "المشروع / الموقع" : "Project / Location"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isAr ? "دخول" : "Check In"}</TableHead>
                    <TableHead>{isAr ? "خروج" : "Check Out"}</TableHead>
                    <TableHead>{isAr ? "الإجمالي" : "Total"}</TableHead>
                    <TableHead>{isAr ? "الأساسي (RH)" : "Base (RH)"}</TableHead>
                    <TableHead>{isAr ? "الإضافي (OT)" : "Overtime (OT)"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAttendance.slice(0, 100).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeId}</TableCell>
                      <TableCell>{record.firstName}</TableCell>
                      <TableCell className="text-muted-foreground w-[200px] truncate max-w-[200px]" title={isAr ? `بصمة الدخول من: ${record.checkInDevice}` : `Check In from: ${record.checkInDevice}`}>
                        {record.projectName}
                      </TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono bg-blue-50/50">
                          {record.checkIn || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? (
                          <Badge variant="outline" className="font-mono bg-emerald-50/50">
                            {record.checkOut}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.totalHours > 0 ? record.totalHours.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-emerald-600 dark:text-emerald-400">
                        {record.regularHours > 0 ? record.regularHours.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                        {record.overtimeHours > 0 ? record.overtimeHours.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingRecord(record)}
                        >
                          {isAr ? "تعديل" : "Edit"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              {displayAttendance.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  {isAr ? `يتم عرض أول 100 سجل فقط من أصل ${displayAttendance.length}` : `Showing first 100 records out of ${displayAttendance.length}`}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editing Dialog */}
      {editingRecord && (
        <EditAttendanceDialog
          record={editingRecord}
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
        />
      )}
    </div>
  );
}
