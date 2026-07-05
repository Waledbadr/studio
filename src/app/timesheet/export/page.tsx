'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Download, Users, FileText, Ban, CircleCheckBig } from 'lucide-react';
import * as XLSX from 'xlsx';

import { db } from '@/lib/firebase';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HousingEmployeesProvider, useHousingEmployees } from '@/context/housing-employees-context';

const EXPORT_HEADERS = [
  'C_number',
  'Name',
  'Department',
  'Project',
  'R_Hours',
  'OT_Hours',
  'CostDscrp',
  'Ppm_PrNam',
  'Ppm_PrNo',
  'Task_Nam',
  'Task_No',
  'Date',
  'Remarks',
];

const EXPORT_COLS = [
  { wch: 8 },
  { wch: 34 },
  { wch: 14 },
  { wch: 48 },
  { wch: 8 },
  { wch: 8 },
  { wch: 12 },
  { wch: 8 },
  { wch: 8 },
  { wch: 8 },
  { wch: 8 },
  { wch: 24 },
  { wch: 12 },
];

type PreviewRow = {
  badgeId: string;
  name: string;
  project: string;
  regularHours: number;
  overtimeHours: number;
  status: 'Present' | 'Absent';
};

const roundToQuarter = (value: number) => Math.round(value * 4) / 4;

const getBadgeId = (item: any) => String(item.employeeId || item.badgeId || item.C_number || item.C_Number || item.id || '');

const getDisplayName = (item: any, isAr: boolean) => String(item?.name || item?.nameAr || (isAr ? 'بدون اسم' : 'No Name') || '');

const getDepartment = (item: any) => String(item?.department || item?.professionAr || item?.profession || 'HOUSING');

const getProject = (item: any) => String(item?.projectName || item?.project || item?.residenceLocation || 'Absence');

const getRegularHours = (record: any) => {
  const regular = typeof record?.regularHours === 'number'
    ? record.regularHours
    : typeof record?.totalHours === 'number'
      ? Math.min(record.totalHours, 8)
      : 0;
  return roundToQuarter(regular);
};

const getOvertimeHours = (record: any) => {
  const overtime = typeof record?.overtimeHours === 'number'
    ? record.overtimeHours
    : typeof record?.totalHours === 'number'
      ? Math.max(record.totalHours - (typeof record?.regularHours === 'number' ? record.regularHours : Math.min(record.totalHours, 8)), 0)
      : 0;
  return roundToQuarter(overtime);
};

const isExportableEmployee = (employee: any) => {
  const status = String(employee?.status || '').toLowerCase();
  const residenceStatus = String(employee?.residenceStatus || '').toLowerCase();
  return status !== 'inactive' && status !== 'transferred' && residenceStatus !== 'outside';
};

const normalizeLocalDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

function TimesheetDailyExportContent() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { employees, loading: employeesLoading } = useHousingEmployees();

  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeLocalDate(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, excluded: 0 });

  const selectedDateLabel = format(selectedDate, 'yyyy-MM-dd');

  const handleDateChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return;
    setSelectedDate(normalizeLocalDate(new Date(year, month - 1, day)));
  };

  const loadDayData = async () => {
    if (!db) return null;

    setIsLoading(true);
    try {
      const [attendanceSnap, leavesSnap, transfersSnap] = await Promise.all([
        getDocs(query(collection(db as any, 'attendanceRecords'), where('date', '==', selectedDateLabel))),
        getDocs(collection(db as any, 'timesheetLeaves')),
        getDocs(collection(db as any, 'timesheetTransfers')),
      ]);

      const attendanceRecords = attendanceSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const leaveRecords = leavesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const transferRecords = transfersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const activeEmployees = employees.filter((employee) => isExportableEmployee(employee));

      const leaveBadgeIds = new Set<string>();
      leaveRecords.forEach((leave) => {
        const badgeId = String(leave.badgeId || leave.employeeId || '');
        if (!badgeId || !leave.startDate || !leave.endDate) return;
        if (selectedDateLabel >= leave.startDate && selectedDateLabel <= leave.endDate) {
          leaveBadgeIds.add(badgeId);
        }
      });

      const transferBadgeIds = new Set<string>();
      transferRecords.forEach((transfer) => {
        const badgeId = String(transfer.badgeId || transfer.employeeId || '');
        if (!badgeId) return;
        const transferDate = String(transfer.date || transfer.transferDate || '');
        const startDate = String(transfer.startDate || '');
        const endDate = String(transfer.endDate || '');
        if (transferDate === selectedDateLabel || (startDate && endDate && selectedDateLabel >= startDate && selectedDateLabel <= endDate)) {
          transferBadgeIds.add(badgeId);
        }
      });

      const attendanceByBadge = new Map<string, any>();
      attendanceRecords.forEach((record) => {
        const badgeId = String(record.employeeId || record.badgeId || record.C_number || record.C_Number || '');
        if (badgeId) attendanceByBadge.set(badgeId, record);
      });

      const visibleEmployees = activeEmployees.filter((employee) => {
        const badgeId = getBadgeId(employee);
        return badgeId && !leaveBadgeIds.has(badgeId) && !transferBadgeIds.has(badgeId);
      });

      const preview = visibleEmployees.map((employee): PreviewRow => {
        const badgeId = getBadgeId(employee);
        const record = attendanceByBadge.get(badgeId);
        const hasAttendance = !!record && record.status !== 'Absent' && record.status !== 'Leave' && record.status !== 'Transferred' && record.status !== 'Elsewhere' && ((record.checkIn || record.checkOut) || (record.totalHours || 0) > 0 || (record.regularHours || 0) > 0 || (record.overtimeHours || 0) > 0);

        return {
          badgeId,
          name: getDisplayName(employee, isAr),
          project: hasAttendance ? getProject(record) : 'Absence',
          regularHours: hasAttendance ? getRegularHours(record) : 0,
          overtimeHours: hasAttendance ? getOvertimeHours(record) : 0,
          status: hasAttendance ? 'Present' : 'Absent',
        };
      });

      preview.sort((a, b) => {
        const projectCompare = a.project.localeCompare(b.project);
        if (projectCompare !== 0) return projectCompare;
        return a.name.localeCompare(b.name);
      });

      setPreviewRows(preview);
      setSummary({
        total: activeEmployees.length,
        present: preview.filter((row) => row.status === 'Present').length,
        absent: preview.filter((row) => row.status === 'Absent').length,
        excluded: leaveBadgeIds.size + transferBadgeIds.size,
      });

      const rows = preview.map((row) => [
        row.badgeId,
        row.name,
        isAr ? 'HOUSING' : 'HOUSING',
        row.project,
        row.regularHours,
        row.overtimeHours,
        'Housing',
        '',
        '',
        '',
        '',
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
        row.status === 'Absent' ? 'Absent' : '',
      ]);

      return { rows, rowCount: rows.length };
    } catch (error) {
      console.error('Failed to load daily export data:', error);
      toast({
        title: isAr ? 'فشل تحميل البيانات' : 'Failed to load data',
        description: isAr ? 'تعذر قراءة بيانات اليوم المختار.' : 'Could not read data for the selected day.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateLabel, employees.length]);

  const handleExport = async () => {
    if (!db) {
      toast({
        title: isAr ? 'قاعدة البيانات غير متاحة' : 'Database unavailable',
        description: isAr ? 'تأكد من إعداد Firebase.' : 'Please check the Firebase configuration.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const result = await loadDayData();
      if (!result || result.rowCount === 0) {
        toast({
          title: isAr ? 'لا توجد بيانات قابلة للتصدير' : 'No exportable data found',
          description: isAr ? 'لا توجد سجلات بعد الاستثناءات.' : 'No rows remain after exclusions.',
        });
        return;
      }

      const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...result.rows]);
      worksheet['!cols'] = EXPORT_COLS;
      worksheet['!autofilter'] = { ref: `A1:M${result.rows.length + 1}` };
      worksheet['!rows'] = [{ hpt: 31.5 }];

      result.rows.forEach((_, index) => {
        const cellAddress = `L${index + 2}`;
        worksheet[cellAddress] = {
          t: 'd',
          v: selectedDate,
          z: 'dd/mm/yyyy',
        };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, `${selectedDateLabel}.xlsx`, {
        bookType: 'xlsx',
        cellStyles: true,
        compression: true,
      });

      toast({
        title: isAr ? 'تم التصدير' : 'Export complete',
        description: isAr
          ? `تم تصدير ${result.rowCount} سجل بتاريخ ${selectedDateLabel}.`
          : `Exported ${result.rowCount} records for ${selectedDateLabel}.`,
      });
    } catch (error) {
      console.error('Daily export failed:', error);
      toast({
        title: isAr ? 'فشل التصدير' : 'Export failed',
        description: isAr ? 'تعذر إنشاء ملف Excel.' : 'Could not create the Excel file.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{isAr ? 'تصدير Excel يومي' : 'Daily Excel Export'}</h1>
        <p className="text-muted-foreground mt-2">
          {isAr
            ? 'اختر يومًا محددًا لمراجعة السجلات ثم تصدير ملف Excel.'
            : 'Pick a specific day to review the records and export the Excel file.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'اختيار التاريخ' : 'Select Date'}</CardTitle>
          <CardDescription>
            {isAr ? 'سيتم استعراض اليوم المختار أولًا قبل التصدير.' : 'The selected day will be previewed before export.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{isAr ? 'التاريخ' : 'Date'}</label>
            <Input
              type="date"
              value={selectedDateLabel}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            {isAr ? 'الصيغة:' : 'Format:'} {format(selectedDate, 'dd/MM/yyyy')}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" />{isAr ? 'الموظفون' : 'Employees'}</div>
              <div className="mt-1 text-2xl font-semibold">{employeesLoading || isLoading ? '...' : summary.total}</div>
            </div>
            <div className="rounded-lg border bg-emerald-50/60 p-3 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><CircleCheckBig className="h-4 w-4" />{isAr ? 'داوم' : 'Present'}</div>
              <div className="mt-1 text-2xl font-semibold">{summary.present}</div>
            </div>
            <div className="rounded-lg border bg-red-50/60 p-3 dark:bg-red-950/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Ban className="h-4 w-4" />{isAr ? 'غياب' : 'Absent'}</div>
              <div className="mt-1 text-2xl font-semibold">{summary.absent}</div>
            </div>
            <div className="rounded-lg border bg-blue-50/60 p-3 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" />{isAr ? 'مستثنى' : 'Excluded'}</div>
              <div className="mt-1 text-2xl font-semibold">{summary.excluded}</div>
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="border-b px-4 py-3 text-sm font-medium">
              {isAr ? 'استعراض اليوم المختار' : 'Selected Day Preview'}
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-left">
                    <th className="px-4 py-2 font-medium">{isAr ? 'الرقم' : 'Badge'}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? 'الاسم' : 'Name'}</th>
                    <th className="px-4 py-2 font-medium">{isAr ? 'المشروع' : 'Project'}</th>
                    <th className="px-4 py-2 font-medium">RH</th>
                    <th className="px-4 py-2 font-medium">OT</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`${row.badgeId}-${row.name}`} className="border-b last:border-b-0">
                      <td className="px-4 py-2">{row.badgeId}</td>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">{row.project}</td>
                      <td className="px-4 py-2">{row.regularHours}</td>
                      <td className="px-4 py-2">{row.overtimeHours}</td>
                    </tr>
                  ))}
                  {!previewRows.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        {isAr ? 'اختر تاريخًا لمعاينة اليوم.' : 'Pick a date to preview the day.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExport} disabled={isExporting || isLoading} className="min-w-40">
              <Download className="mr-2 h-4 w-4" />
              {isAr ? 'تصدير Excel' : 'Export Excel'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TimesheetDailyExportPage() {
  return (
    <HousingEmployeesProvider>
      <TimesheetDailyExportContent />
    </HousingEmployeesProvider>
  );
}