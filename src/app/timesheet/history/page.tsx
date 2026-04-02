'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, MapPin, CalendarDays, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useUsers } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { TimesheetProvider, useTimesheet } from '@/context/timesheet-context';

function TimesheetHistoryContent() {
  const { dict } = useLanguage();
  const { currentUser } = useUsers();
  const { residences, loadResidences } = useResidences();
  const { projectToResidenceMap } = useTimesheet();
  const [records, setRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const today = new Date();
  const getFiscalMonthForDate = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    // If before the 20th, it belongs to current month's fiscal period
    // If on or after the 20th, it belongs to NEXT month's fiscal period
    if (day >= 20) {
      if (month === 12) return `${year + 1}-01`;
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const defaultMonth = getFiscalMonthForDate(today);
  const [filterMonth, setFilterMonth] = useState<string>(defaultMonth);

  useEffect(() => {
    setLoading(true);
    loadResidences();
    
    // Fetch Employees mapping to keep names/professions up-to-date
    const empsUnsub = onSnapshot(collection(db, 'housingEmployees'), (snap) => {
      const emps: Record<string, any> = {};
      snap.forEach(d => {
        emps[d.data().employeeId] = { id: d.id, ...d.data() };
      });
      setEmployeesMap(emps);
    });

    // Fetch a large enough batch to cover recent months
    const q = query(collection(db, 'attendanceRecords'), orderBy('date', 'desc'), limit(3000));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(fetchedRecords);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching records:', error);
      setLoading(false);
    });

    const lq = query(collection(db, 'timesheetLeaves'), orderBy('createdAt', 'desc'), limit(1000));
    const leavesUnsub = onSnapshot(lq, (snap) => setLeaves(snap.docs.map(d => d.data())));

    return () => {
      unsubscribe();
      empsUnsub();
      leavesUnsub();
    };
  }, []);

  // Helper to parse 'YYYY-MM-DD' and return 'YYYY-MM' fiscal month string
  const getFiscalMonthString = (dateStr: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (d >= 20) {
      if (m === 12) return `${y + 1}-01`;
      return `${y}-${String(m + 1).padStart(2, '0')}`;
    }
    return `${y}-${String(m).padStart(2, '0')}`;
  };

  // Get list of available fiscal months in data
  const availableMonths = useMemo(() => {
    const months = new Set(records.map(r => getFiscalMonthString(r.date)));
    if (!months.has(defaultMonth)) months.add(defaultMonth);
    return Array.from(months).filter(Boolean).sort().reverse();
  }, [records, defaultMonth]);

  // Calculate days in selected fiscal month
  const { startDate, endDate, daysArray } = useMemo(() => {
    if (!filterMonth) return { startDate: new Date(), endDate: new Date(), daysArray: [] };
    const [year, month] = filterMonth.split('-').map(Number);
    
    // Fiscal month starts on the 20th of the previous calendar month
    // Example: Fiscal '2026-05' starts '2026-04-20' and ends '2026-05-20' (exclusive)
    let startY = year;
    let startM = month - 2; // JavaScript months are 0-indexed, so -1 to go back a month, another -1 for 0-index
    if (startM < 0) {
      startM += 12;
      startY--;
    }
    
    const start = new Date(startY, startM, 20);
    const end = new Date(year, month - 1, 20); // Exclusive end
    
    const days = [];
    const current = new Date(start);
    while (current < end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
    }
    
    return { startDate: start, endDate: end, daysArray: days };
  }, [filterMonth]);

  // Group data by Residence (projectName) -> Employee
  const groupedData = useMemo(() => {
    const grouped: Record<string, Record<string, any>> = {};

    // Get the allowed project names for the current user
    const userResidences = currentUser?.assignedResidences || [];
    let allowedProjectNames: string[] = [];
    if (currentUser?.role !== 'Admin') {
      const allowedNames = userResidences.flatMap(id => {
        const res = residences.find(r => r.id === id);
        return [
          res?.name?.toLowerCase(), 
          res?.nameAr?.toLowerCase(), 
          res?.nameEn?.toLowerCase()
        ].filter(Boolean);
      }) as string[];
      
      allowedProjectNames = Array.from(new Set(allowedNames)); // unique names
    }

    // Fast lookup for the latest project name associated with an employee
    const latestProjectMap: Record<string, string> = {};
    records.forEach(r => {
      // records are fetched desc (newest first). The first time we see an employeeId, it's their latest project.
      if (r.employeeId && r.projectName && !latestProjectMap[r.employeeId]) {
        latestProjectMap[r.employeeId] = r.projectName;
      }
    });

    records.forEach(record => {
      if (!record.date) return;
      
      // Only include records for the selected fiscal month
      const recordFiscalMonth = getFiscalMonthString(record.date);
      if (recordFiscalMonth !== filterMonth) return;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          record.firstName?.toLowerCase().includes(searchLower) ||
          record.employeeId?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return;
      }

      const proj = record.projectName || 'Unassigned / Outside';
      
      // Filter out residences that currentUser doesn't have access to
      if (currentUser?.role !== 'Admin') {
        const projLower = proj.toLowerCase();
        const mappedResidenceId = projectToResidenceMap[proj];
        // 1. Is this project directly mapped to a residence the user has?
        const isMappedAndAssigned = mappedResidenceId && userResidences.includes(mappedResidenceId);
        // 2. Is this project string matching any of the user's residence names?
        const isNameMatched = allowedProjectNames.some(n => projLower.includes(n) || n.includes(projLower));
        
        if (!isMappedAndAssigned && !isNameMatched) {
          return; // Skip this record if it belongs to an unassigned project
        }
      }

      const empKey = record.employeeId || 'Unknown ID';
      const currentUserData = employeesMap[empKey] || {};

      if (!grouped[proj]) grouped[proj] = {};
      if (!grouped[proj][empKey]) {
        grouped[proj][empKey] = {
          name: currentUserData.name || currentUserData.nameAr || record.firstName,
          profession: currentUserData.professionAr || currentUserData.profession || record.department || '-',
          department: currentUserData.department || record.department || '-',
          daily: {},
          totalRH: 0,
          totalOT: 0,
          absences: 0
        };
      }

      // Clone the record to avoid mutating the original state object later
      grouped[proj][empKey].daily[record.date] = { ...record };
    });

    // Populate Leaves
    leaves.forEach(l => {
      if (!l.badgeId || !l.startDate || !l.endDate) return;

      const badge = l.badgeId;
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (l.name?.toLowerCase().includes(searchLower) || l.nameAr?.toLowerCase().includes(searchLower)) ||
          badge.toLowerCase().includes(searchLower);
        if (!matchesSearch) return;
      }

      // Assign the employee to their latest known project, else fallback
      const proj = latestProjectMap[badge] || 'Unassigned / Outside';
      
      // Authorization Check
      if (currentUser?.role !== 'Admin') {
        const projLower = proj.toLowerCase();
        const mappedResidenceId = projectToResidenceMap[proj];
        const isMappedAndAssigned = mappedResidenceId && userResidences.includes(mappedResidenceId);
        const isNameMatched = allowedProjectNames.some(n => projLower.includes(n) || n.includes(projLower));
        
        if (!isMappedAndAssigned && !isNameMatched) return;
      }

      const empKey = badge;
      const currentUserData = employeesMap[empKey] || {};

      // Need to find if any of their leave days overlap with daysArray (the selected month range)
      daysArray.forEach(dateStr => {
        if (dateStr >= l.startDate && dateStr <= l.endDate) {
          // They are on leave today
          if (!grouped[proj]) grouped[proj] = {};
          if (!grouped[proj][empKey]) {
            grouped[proj][empKey] = {
              name: currentUserData.name || currentUserData.nameAr || l.name || l.nameAr || badge,
              profession: currentUserData.professionAr || currentUserData.profession || '-',
              department: currentUserData.department || '-',
              daily: {},
              totalRH: 0,
              totalOT: 0,
              absences: 0
            };
          }

          // In case they have no actual punch/attendance record on this leave day
          if (!grouped[proj][empKey].daily[dateStr]) {
            grouped[proj][empKey].daily[dateStr] = {
              status: 'Leave',
              leaveType: l.type || 'Leave',
              reason: l.reason || ''
            };
          } else {
             // Override existing to reflect Leave, but maybe preserve hours if any (usually none on Leave)
             grouped[proj][empKey].daily[dateStr].status = 'Leave';
          }
        }
      });
    });

    // Post-Process: Friday Weekly Rest (بدل الراحة الاسبوعية) and Totals
    Object.keys(grouped).forEach(proj => {
      Object.keys(grouped[proj]).forEach(empKey => {
        const empData = grouped[proj][empKey];

        // 1. Process Fridays based on Thursday presence
        daysArray.forEach((dateStr, idx) => {
          const dateObj = new Date(dateStr);
          if (dateObj.getDay() === 5) { // Friday
            const prevDateStr = daysArray[idx - 1]; // Thursday
            let workedThursday = false;
            
            if (prevDateStr) {
              const thursRecord = empData.daily[prevDateStr];
              if (thursRecord && (thursRecord.status === 'Present' || (thursRecord.punches && thursRecord.punches.length > 0) || thursRecord.totalHours > 0 || thursRecord.regularHours > 0)) {
                workedThursday = true;
              }
            }

            if (workedThursday) {
              let fridayRecord = empData.daily[dateStr];
              
              if (!fridayRecord) {
                // They didn't work Friday, but get 8 hrs rest allowance
                empData.daily[dateStr] = {
                  status: 'Weekend',
                  isVirtualWeekend: true, 
                  regularHours: 8,
                  overtimeHours: 0,
                  totalHours: 8,
                  date: dateStr
                };
              } else if (fridayRecord.status !== 'Leave') {
                // They worked Friday AND get the 8 hrs rest
                // All actually worked hours shift to Overtime
                const originalRH = fridayRecord.regularHours !== undefined ? fridayRecord.regularHours : (fridayRecord.totalHours || 0);
                const originalOT = fridayRecord.overtimeHours || 0;
                const totalWorked = originalRH + originalOT;
                
                // Even if they only checked in/out with 0 hours, they get the 8 hours rest
                fridayRecord.regularHours = 8;
                fridayRecord.overtimeHours = totalWorked; // All previously calculated worked hours become OT
                fridayRecord.totalHours = 8 + totalWorked;
                fridayRecord.isVirtualWeekend = true;
              }
            }
          }
        });

        // 2. Accumulate Totals across all processed days
        Object.values(empData.daily).forEach((record: any) => {
          empData.totalRH += (record.regularHours !== undefined ? record.regularHours : (record.totalHours || 0));
          empData.totalOT += (record.overtimeHours || 0);
          
          if (record.status === 'Absent') {
            empData.absences += 1;
          }
        });
      });
    });

    return grouped;
  }, [records, leaves, filterMonth, searchTerm, currentUser, residences, employeesMap, projectToResidenceMap, daysArray]);

  const renderCell = (record: any) => {
    if (!record) return <div className="text-gray-200 dark:text-gray-700">-</div>;
    
    let checkIn = record.checkIn;
    let checkOut = record.checkOut;

    // Smart heuristic: If there is ONLY ONE punch and it's late (>= 12:00 PM), it's likely a check-out
    if (checkIn && !checkOut) {
      const punchHour = parseInt(checkIn.split(':')[0], 10);
      if (!isNaN(punchHour) && punchHour >= 12) {
         checkOut = checkIn;
         checkIn = null;
      }
    }

    const isAbsent = record.status === 'Absent';
    const isPresent = record.status === 'Present';
    const isLeave = record.status === 'Leave';
    const hasHours = (record.regularHours || 0) > 0 || (record.overtimeHours || 0) > 0 || (record.totalHours || 0) > 0;
    
    // Determine missing punches (only one punch logged)
    const isMissingPunch = (!checkIn || !checkOut) && !isAbsent && !isLeave && !record.isVirtualWeekend;
    
    const formatNumber = (num: number) => {
      if (!num) return '0';
      return Number.isInteger(num) ? num.toString() : num.toFixed(1);
    };

    let content: React.ReactNode = '-';
    let tooltip = '';

    if (isLeave) {
      content = 'L'; // Indicates Leave
      tooltip = `Leave: ${record.leaveType || 'Approved'} \nNotes: ${record.reason || '-'}`;
    } else if (isAbsent) {
      content = 'A';
      tooltip = `Status: Absent`;
    } else if (record.isVirtualWeekend && (!hasHours || record.overtimeHours === 0)) {
      // Friday Rest day without any actual worked hours
      content = (
        <div className="flex flex-col items-center justify-center leading-none">
          <span>8</span>
        </div>
      );
      tooltip = `Weekly Rest Allowance (8 hours)`;
    } else if (hasHours) {
      // If we have detailed breakdown use it, otherwise fallback to totalHours for old records
      const rh = record.regularHours !== undefined ? record.regularHours : (record.totalHours || 0);
      const ot = record.overtimeHours || 0;
      
      content = (
        <div className="flex flex-col items-center justify-center leading-none">
          <span>{formatNumber(rh)}</span>
          {ot > 0 && <span className="text-[8px] md:text-[9px] font-bold text-orange-600 dark:text-orange-400">+{formatNumber(ot)}</span>}
        </div>
      );
      tooltip = record.isVirtualWeekend 
        ? `Weekly Rest Allowance (8 hours) + Worked Overtime\nIn: ${checkIn || '-'} | Out: ${checkOut || '-'}` 
        : `In: ${checkIn || '-'} | Out: ${checkOut || '-'}`;
    } else if (isMissingPunch) {
      content = '?'; // Missing Punch Indicator
      tooltip = `In: ${checkIn || 'Missed'} | Out: ${checkOut || 'Missed'}`;
    } else if (isPresent) {
      content = 'P'; // Present but no hours recorded yet (e.g. 0 hours shift but checked out)
      tooltip = `In: ${checkIn || '-'} | Out: ${checkOut || '-'}`;
    }

    return (
      <div 
        title={tooltip}
        className={`w-6 h-6 md:w-8 md:h-8 flex flex-col items-center justify-center rounded text-[10px] md:text-sm font-bold mx-auto cursor-help
        ${(isPresent && !isMissingPunch && !record.isVirtualWeekend) || (hasHours && !record.isVirtualWeekend) ? 'bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
        ${record.isVirtualWeekend ? 'bg-sky-100/60 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' : ''}
        ${isAbsent ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
        ${isLeave ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
        ${isMissingPunch && !isLeave ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
      `}>
        {content}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Monthly Archive
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View attendance matrix organized by residence and employee for the entire month.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Monthly Sheet
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search Employee by Name or Badge..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(month => (
              <SelectItem key={month as string} value={month as string}>
                {new Date((month as string) + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading attendance matrix...</div>
      ) : Object.keys(groupedData).length === 0 ? (
        <div className="py-20 text-center text-gray-500 border rounded-xl bg-white dark:bg-gray-950">No records found for this month.</div>
      ) : (
        Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b)).map(([project, employees]) => (
          <Card key={project} className="overflow-hidden shadow-sm">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b py-3">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <MapPin className="w-5 h-5 text-blue-600" />
                {project}
                <span className="text-xs font-normal text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full ml-auto">
                  {Object.keys(employees).length} Employees
                </span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-2 font-medium border-r sticky left-0 bg-gray-100 dark:bg-gray-800 min-w-[200px] z-10 w-48 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.1)]">
                      Employee
                    </th>
                    <th className="px-3 py-2 font-medium border-r sticky left-48 bg-gray-50 dark:bg-gray-800/90 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] min-w-[120px] text-xs">
                      Profession
                    </th>
                    {daysArray.map((dateStr, idx) => {
                      const dayStr = dateStr.split('-')[2];
                      const isWeekend = new Date(dateStr).getDay() === 5; // Friday
                      return (
                        <th key={dateStr} className={`px-1 py-1 font-medium text-center border-r min-w-[32px] text-[10px] md:text-xs ${isWeekend ? 'bg-gray-200 dark:bg-gray-700/50' : ''}`}>
                          {dayStr}
                        </th>
                      )
                    })}
                    <th className="px-2 py-2 font-medium text-center border-r text-gray-700 dark:text-gray-300 text-xs shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                      Total RH
                    </th>
                    <th className="px-2 py-2 font-medium text-center border-r text-orange-600 dark:text-orange-400 text-xs shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                      Total OT
                    </th>
                    <th className="px-2 py-2 font-medium text-center border-r text-red-600 dark:text-red-400 text-xs shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                      Absences
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {Object.entries(employees).sort(([,a], [,b]) => a.name.localeCompare(b.name)).map(([empId, empData]) => (
                    <tr key={empId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 bg-white dark:bg-gray-950">
                      <td className="px-4 py-2 border-r sticky left-0 bg-white dark:bg-gray-950 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="truncate w-full min-w-[120px]">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-xs md:text-sm truncate">{empData.name}</div>
                            <div className="text-[10px] text-gray-500">{empId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r sticky left-48 bg-gray-50/50 dark:bg-gray-900/80 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 line-clamp-2" title={empData.profession}>
                          <Briefcase className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{empData.profession}</span>
                        </div>
                      </td>
                      {daysArray.map(dateStr => {
                        const isWeekend = new Date(dateStr).getDay() === 5; // Friday
                        return (
                        <td key={dateStr} className={`px-0.5 py-1 border-r text-center align-middle ${isWeekend ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
                          {renderCell(empData.daily[dateStr])}
                        </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center border-r font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50">
                        {empData.totalRH > 0 ? (Number.isInteger(empData.totalRH) ? empData.totalRH : empData.totalRH.toFixed(1)) : '-'}
                      </td>
                      <td className="px-2 py-2 text-center border-r font-bold text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-900/10">
                        {empData.totalOT > 0 ? (Number.isInteger(empData.totalOT) ? empData.totalOT : empData.totalOT.toFixed(1)) : '-'}
                      </td>
                      <td className="px-2 py-2 text-center border-r font-bold text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10">
                        {empData.absences > 0 ? empData.absences : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

export default function TimesheetHistoryPage() {
  return (
    <TimesheetProvider>
      <TimesheetHistoryContent />
    </TimesheetProvider>
  );
}
