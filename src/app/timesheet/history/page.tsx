'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, MapPin, CalendarDays, User, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useUsers } from '@/context/users-context';
import { useResidences } from '@/context/residences-context';
import { TimesheetProvider, useTimesheet } from '@/context/timesheet-context';
import { getFiscalMonthPeriod, getFiscalMonthForDate } from '@/lib/fiscal-month-utils';
import { HousingEmployee, HousingEmployeesProvider } from '@/context/housing-employees-context';
import { EmployeeProfileSheet } from '@/components/timesheet/employees/employee-profile-sheet';

// Custom profession ordering for Monthly Archive (Arabic labels)
const PROFESSION_ORDER: Record<string, number> = {
  'إداري': 1,
  'مسؤول سكن': 2,
  'مدخل بيانات': 3,
  'مشرف سكن': 4,
  'تسكين عمالة': 5,
  'فني صيانة': 6,
  'فني تكييف': 7,
  'سائق': 8,
  'سباك': 9,
  'بناء': 10,
  'حداد': 11,
  'كهربائي': 12,
  'عامل': 13,
  'عامل نظافة': 14,
};

const getProfessionRank = (profession?: string) => {
  if (!profession) return 999;
  const key = profession.trim();
  return PROFESSION_ORDER[key] ?? 999;
};

function TimesheetHistoryContent() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { currentUser } = useUsers();
  const { residences, loadResidences } = useResidences();
  const { projectToResidenceMap, timesheetEvents, employeeSchedules } = useTimesheet();
  const [records, setRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, any>>({});
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Employee profile sheet state (for quick Add Leave / Permission)
  const [selectedEmployee, setSelectedEmployee] = useState<HousingEmployee | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDefaultDate, setProfileDefaultDate] = useState<string | null>(null);

  const goToNextMonth = () => {
    const currentIndex = availableMonths.indexOf(filterMonth);
    // availableMonths are desc (newest first), so index-1 is newer
    if (currentIndex > 0) {
      setFilterMonth(availableMonths[currentIndex - 1]);
    }
  };

  const goToPrevMonth = () => {
    const currentIndex = availableMonths.indexOf(filterMonth);
    // availableMonths are desc (newest first), so index+1 is older
    if (currentIndex !== -1 && currentIndex < availableMonths.length - 1) {
      setFilterMonth(availableMonths[currentIndex + 1]);
    }
  };

  const today = new Date();

  const defaultMonth = getFiscalMonthForDate(today);
  const [filterMonth, setFilterMonth] = useState<string>(defaultMonth);

  // Calculate days in selected fiscal month using company standard
  const { startDate, endDate, daysArray } = useMemo(() => {
    if (!filterMonth) return { startDate: new Date(), endDate: new Date(), daysArray: [] };

    const period = getFiscalMonthPeriod(filterMonth);
    const start = period.startDate;
    const end = period.endDate;

    const days = [];
    const current = new Date(start);
    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
    }

    return { startDate: start, endDate: end, daysArray: days };
  }, [filterMonth]);

  // availableMonths is populated dynamically from DB records (see fetchData below)

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadResidences();

    if (!db) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch housing employees
        const empsSnap = await getDocs(collection(db as any, 'housingEmployees'));
        const emps: Record<string, any> = {};
        empsSnap.forEach(d => {
          emps[d.data().employeeId] = { id: d.id, ...d.data() };
        });
        if (active) setEmployeesMap(emps);

        // Fetch leaves
        const lq = query(collection(db as any, 'timesheetLeaves'), orderBy('createdAt', 'desc'), limit(1000));
        const leavesSnap = await getDocs(lq);
        if (active) setLeaves(leavesSnap.docs.map(d => d.data()));

        // --- Build dynamic available months from stored records ---
        // Fetch just the dates of all records to determine which months have data
        const allDatesSnap = await getDocs(query(
          collection(db as any, 'attendanceRecords'),
          orderBy('date', 'desc'),
          limit(10000)
        ));
        const monthsSet = new Set<string>();
        allDatesSnap.forEach(d => {
          const date: string = d.data().date;
          if (date) {
            // Convert raw date to fiscal month label
            const [y, m, dd] = date.split('-').map(Number);
            const dayNum = dd;
            // Fiscal month: if day >= 20, belongs to NEXT calendar month
            let fiscalYear = y, fiscalMonth = m;
            if (dayNum >= 20) {
              fiscalMonth += 1;
              if (fiscalMonth > 12) { fiscalMonth = 1; fiscalYear += 1; }
            }
            monthsSet.add(`${fiscalYear}-${String(fiscalMonth).padStart(2, '0')}`);
          }
        });
        const dynamicMonths = Array.from(monthsSet).sort().reverse();
        if (!dynamicMonths.includes(defaultMonth)) dynamicMonths.unshift(defaultMonth);
        if (active) setAvailableMonths(dynamicMonths);

        // Fetch attendance records for selected month
        if (daysArray.length > 0) {
          const dateStartStr = daysArray[0];
          const dateEndStr = daysArray[daysArray.length - 1];

          // Fetch only the records in the selected month interval to prevent limit truncations
          const q = query(
            collection(db as any, 'attendanceRecords'),
            where('date', '>=', dateStartStr),
            where('date', '<=', dateEndStr),
            orderBy('date', 'desc'),
            limit(10000)
          );

          const recordsSnap = await getDocs(q);
          const fetchedRecords = recordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          if (active) {
            setRecords(fetchedRecords);
            setLoading(false);
          }
        } else {
          if (active) setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching history data:', error);
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [daysArray]);

  // Group data by Residence (projectName) -> Employee
  const groupedData = useMemo(() => {
    // Stage 1: Collect everything by Employee ID
    const empRawGroup: Record<string, {
      allRecords: any[];
      primaryRes: string;
      residenceCounts: Record<string, number>;
    }> = {};

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

    records.forEach(record => {
      if (!record.date) return;
      if (!daysArray.includes(record.date)) return;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          record.firstName?.toLowerCase().includes(searchLower) ||
          record.employeeId?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return;
      }

      const empKey = record.employeeId || 'Unknown ID';
      if (!empRawGroup[empKey]) {
        empRawGroup[empKey] = { allRecords: [], primaryRes: '', residenceCounts: {} };
      }
      
      empRawGroup[empKey].allRecords.push(record);
      
      const proj = record.projectName || 'Unassigned / Outside';
      empRawGroup[empKey].residenceCounts[proj] = (empRawGroup[empKey].residenceCounts[proj] || 0) + 1;
    });

    // Determine primary residence for each employee
    Object.keys(empRawGroup).forEach(empId => {
      const counts = empRawGroup[empId].residenceCounts;
      let topProj = '';
      let maxCount = -1;
      
      Object.entries(counts).forEach(([proj, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topProj = proj;
        }
      });
      
      // Fallback to official project name from employee profile if available and it has some punches
      const officialProj = employeesMap[empId]?.projectName || employeesMap[empId]?.project;
      if (officialProj && counts[officialProj]) {
          topProj = officialProj;
      }

      empRawGroup[empId].primaryRes = topProj || 'Unassigned / Outside';
    });

    // Stage 2: Create the final grouped structure
    const grouped: Record<string, Record<string, any>> = {};
    const employeeDailyProjects: Record<string, Record<string, string[]>> = {};

    Object.entries(empRawGroup).forEach(([empKey, data]) => {
      const proj = data.primaryRes;

      // For non-admin users, only include employees whose primary residence
      // is mapped to one of the user's assigned residences. Prefer the
      // explicit projectToResidenceMap; fall back to name comparison only
      // if no mapping exists.
      if (currentUser?.role !== 'Admin') {
        const mappedResidenceId = projectToResidenceMap[proj];
        if (mappedResidenceId) {
          if (!userResidences.includes(mappedResidenceId)) {
            return;
          }
        } else {
          const projLower = (proj || '').toLowerCase();
          if (!projLower || !allowedProjectNames.includes(projLower)) {
            return;
          }
        }
      }

      const currentUserData = employeesMap[empKey] || {};

      if (!grouped[proj]) grouped[proj] = {};
      if (!grouped[proj][empKey]) {
        grouped[proj][empKey] = {
          name: currentUserData.name || currentUserData.nameAr || data.allRecords[0]?.firstName || empKey,
          profession: currentUserData.professionAr || currentUserData.profession || data.allRecords[0]?.department || '-',
          department: currentUserData.department || data.allRecords[0]?.department || '-',
          daily: {},
          totalRH: 0,
          totalOT: 0,
          absences: 0
        };
      }

      data.allRecords.forEach(record => {
        const dateStr = record.date;
        const prevRecord = grouped[proj][empKey].daily[dateStr];
        
        // If there's multiple records for one day in different residence
        if (prevRecord) {
           // Heuristic: If one has hours and the other doesn't, pick the one with hours
           if ((record.totalHours || 0) > (prevRecord.totalHours || 0)) {
               grouped[proj][empKey].daily[dateStr] = { ...record };
           }
        } else {
           grouped[proj][empKey].daily[dateStr] = { ...record };
        }

        // Track project participation for indicators
        if (!employeeDailyProjects[empKey]) employeeDailyProjects[empKey] = {};
        if (!employeeDailyProjects[empKey][dateStr]) employeeDailyProjects[empKey][dateStr] = [];
        const recProj = record.projectName || 'Unassigned / Outside';
        if (!employeeDailyProjects[empKey][dateStr].includes(recProj)) {
           employeeDailyProjects[empKey][dateStr].push(recProj);
        }
      });
    });

    // Populate Leaves with Deduplication
    leaves.forEach(l => {
      if (!l.badgeId || !l.startDate || !l.endDate) return;
      const badge = l.badgeId;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!(l.name?.toLowerCase().includes(searchLower) || l.nameAr?.toLowerCase().includes(searchLower) || badge.toLowerCase().includes(searchLower))) return;
      }

      // Determine where this leave should be shown: official residence or the one they appear in
      const primaryRes = empRawGroup[badge]?.primaryRes || employeesMap[badge]?.projectName || employeesMap[badge]?.project || 'Unassigned / Outside';
      
      if (currentUser?.role !== 'Admin') {
        const resId = projectToResidenceMap[primaryRes];
        if (resId && !userResidences.includes(resId)) return;
      }

      daysArray.forEach(dateStr => {
        if (dateStr >= l.startDate && dateStr <= l.endDate) {
          if (!grouped[primaryRes]) grouped[primaryRes] = {};
          if (!grouped[primaryRes][badge]) {
            const currentUserData = employeesMap[badge] || {};
            grouped[primaryRes][badge] = {
              name: currentUserData.name || currentUserData.nameAr || l.name || l.nameAr || badge,
              profession: currentUserData.professionAr || currentUserData.profession || '-',
              department: currentUserData.department || '-',
              daily: {},
              totalRH: 0,
              totalOT: 0,
              absences: 0
            };
          }

          if (!grouped[primaryRes][badge].daily[dateStr]) {
            grouped[primaryRes][badge].daily[dateStr] = { status: 'Leave', leaveType: l.type || 'Leave', reason: l.reason || '' };
          } else {
             grouped[primaryRes][badge].daily[dateStr].status = 'Leave';
          }
        }
      });
    });

    // Get today formatted as YYYY-MM-DD in local time to prevent processing future Fridays
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    // Post-Process: Friday Weekly Rest (بدل الراحة الاسبوعية) and Totals
    Object.keys(grouped).forEach(proj => {
      Object.keys(grouped[proj]).forEach(empKey => {
        const empData = grouped[proj][empKey];

        // Helper to find the 'Winner' project for the 8-hour allowance on a specific day
        const getAllowanceWinner = (date: string) => {
            const allProjs = employeeDailyProjects[empKey]?.[date] || [];
            if (allProjs.length <= 1) return allProjs[0] || proj;
            
            // Try to find projects where they actually worked (has hours or 'Present')
            const workedProjs = allProjs.filter((p: string) => {
                const r = grouped[p]?.[empKey]?.daily[date];
                return r && (r.totalHours > 0 || r.regularHours > 0 || r.status === 'Present' || (r.punches && r.punches.length > 0));
            });

            if (workedProjs.length > 0) {
                // Return the last one they worked in (most likely where they finished their day)
                return workedProjs[workedProjs.length - 1];
            }
            // If no work anywhere, fallback to first in list
            return allProjs[0] || proj;
        };

        // 1. Process Fridays based on Thursday presence
        daysArray.forEach((dateStr, idx) => {
          if (dateStr > todayStr) return; // Do not process future Fridays
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
              const allowanceWinner = getAllowanceWinner(dateStr);
              if (proj !== allowanceWinner) return; // Only the winner gets the Friday rest allowance

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
                // They worked on Friday AND get the 8 hrs rest
                // OT = actual hours worked (from checkIn/checkOut to avoid double-counting)
                let actualWorked = 0;
                const ci = fridayRecord.checkIn;
                const co = fridayRecord.checkOut;
                if (ci && co && ci !== co) {
                  const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                  let inMins = toMins(ci);
                  let outMins = toMins(co);
                  if (outMins < inMins) outMins += 24 * 60;
                  actualWorked = Number((Math.round((outMins - inMins) / 15) * 15 / 60).toFixed(2));
                } else if (fridayRecord.status === 'Weekend' && (fridayRecord.totalHours || 0) > 8) {
                  // Already-processed: OT ≈ totalHours - 8
                  actualWorked = Number(((fridayRecord.totalHours || 0) - 8).toFixed(2));
                }
                fridayRecord.regularHours = 8;
                fridayRecord.overtimeHours = actualWorked;
                fridayRecord.totalHours = Number((8 + actualWorked).toFixed(2));
                fridayRecord.isVirtualWeekend = true;
              }
            }
          }
        });

        // 1.5 Process Events & Holidays (Added logic)
        daysArray.forEach((dateStr) => {
            if (dateStr > todayStr) return; // Do not process future Events/Holidays

            const dateObj = new Date(dateStr);
            const isThursday = dateObj.getDay() === 4;
            const activeEvent = (timesheetEvents || []).find(e => dateStr >= e.startDate && dateStr <= e.endDate);
            const employeeSchedule = (employeeSchedules || []).find(s => s.employeeId === empKey);

            let requiredHours = 8.0;

            if (activeEvent && activeEvent.type === 'reduced_hours') {
                requiredHours = activeEvent.requiredHours || 6.0;
            } else if (employeeSchedule) {
                requiredHours = isThursday 
                    ? (employeeSchedule.thursdayHours || 5.5) 
                    : (employeeSchedule.dailyHours || 8.5);
            }

            if (activeEvent && activeEvent.type === 'holiday') {
                const allowanceWinner = getAllowanceWinner(dateStr);
                let holidayRecord = empData.daily[dateStr];

                // Holidays grant 8 hrs allowance ONLY to the priority project
                if (proj === allowanceWinner) {
                    if (!holidayRecord) {
                        // No punch on this holiday → pure 8h allowance
                        empData.daily[dateStr] = {
                            status: 'Holiday',
                            isHoliday: true,
                            regularHours: 8,
                            overtimeHours: 0,
                            totalHours: 8,
                            date: dateStr
                        };
                    } else if (holidayRecord.status !== 'Leave' && holidayRecord.status !== 'Weekend' && !holidayRecord.isVirtualWeekend) {
                        // They worked on Holiday → RH = 8 allowance, OT = actual worked hours
                        let actualWorked = 0;
                        const ci = holidayRecord.checkIn;
                        const co = holidayRecord.checkOut;
                        if (ci && co && ci !== co) {
                            const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                            let inMins = toMins(ci);
                            let outMins = toMins(co);
                            if (outMins < inMins) outMins += 24 * 60;
                            actualWorked = Number((Math.round((outMins - inMins) / 15) * 15 / 60).toFixed(2));
                        } else if (holidayRecord.status === 'Holiday' && (holidayRecord.totalHours || 0) > 8) {
                            actualWorked = Number(((holidayRecord.totalHours || 0) - 8).toFixed(2));
                        }

                        holidayRecord.regularHours = 8;
                        holidayRecord.overtimeHours = actualWorked;
                        holidayRecord.totalHours = Number((8 + actualWorked).toFixed(2));
                        holidayRecord.isHoliday = true;
                        holidayRecord.status = 'Holiday';
                    }
                } else if (holidayRecord) {
                    // This is NOT the winner project, but they have a record here.
                    // If they worked, it's 100% OT (since allowance is in another project)
                    let actualWorked = holidayRecord.totalHours || 0;
                    if (actualWorked > 0) {
                        holidayRecord.regularHours = 0;
                        holidayRecord.overtimeHours = actualWorked;
                        holidayRecord.totalHours = actualWorked;
                        holidayRecord.status = 'Holiday';
                        holidayRecord.isHoliday = true;
                    }
                }
            } 

            // Add cross-residence indicator logic
            const allDayProjs = employeeDailyProjects[empKey]?.[dateStr] || [];
            if (allDayProjs.length > 0) {
                let record = empData.daily[dateStr];
                
                // If they have no record here BUT have records in other residences -> create a "ghost" record
                const hasWorkElsewhere = allDayProjs.some((p: string) => p !== proj);
                
                if (!record && hasWorkElsewhere) {
                    empData.daily[dateStr] = {
                        status: 'Elsewhere',
                        hasOtherResidence: true,
                        otherProjectNames: allDayProjs, // List all residences they were seen in
                        date: dateStr,
                        totalHours: 0,
                        regularHours: 0,
                        overtimeHours: 0
                    };
                } else if (record && allDayProjs.length > 1) {
                    // Multiple residences including this one
                    record.hasOtherResidence = true;
                    record.otherProjectNames = allDayProjs.filter((p: string) => p !== proj);
                }
            }
            // NOTE: No re-calculation needed here. Records are pre-calculated at import time
            // (via timesheet-utils.ts processPunches → calculateAttendanceStats) and stored correctly.
        });

        // 3. Transfer marker 'T': mark days before/after employee's transfer date
        // Transfer data is stored on the employee record in employeesMap
        const empRecord = employeesMap[empKey];
        const transferDate: string | undefined = empRecord?.transferDate; // e.g. '2026-04-02'
        if (transferDate && empRecord?.status === 'Transferred') {
          const [ty, tm] = transferDate.split('-').map(Number);
          daysArray.forEach((dateStr) => {
            const [dy, dm] = dateStr.split('-').map(Number);
            const sameMonth = dy === ty && dm === tm; // only within the transfer month

            if (sameMonth) {
              // Days BEFORE transfer date in same month → mark T (employee was elsewhere)
              if (dateStr < transferDate) {
                if (!empData.daily[dateStr] || empData.daily[dateStr].status === 'Absent') {
                  empData.daily[dateStr] = { status: 'Transferred', date: dateStr, isTransfer: true };
                }
              }
              // Days AFTER (or equal to) transfer date, if no punch → mark T
              if (dateStr >= transferDate) {
                if (!empData.daily[dateStr] || empData.daily[dateStr].status === 'Absent') {
                  empData.daily[dateStr] = { status: 'Transferred', date: dateStr, isTransfer: true };
                }
              }
            } else if (dateStr > transferDate) {
              // Future months after transfer: mark all days T
              if (!empData.daily[dateStr] || empData.daily[dateStr].status === 'Absent') {
                empData.daily[dateStr] = { status: 'Transferred', date: dateStr, isTransfer: true };
              }
            }
          });
          // Mark employee-level as transferred so we can filter later
          empData.isTransferred = true;
          empData.transferDate = transferDate;
        }

        // 2. Accumulate Totals across all processed days
        Object.values(empData.daily).forEach((record: any) => {
          if (record.isTransfer) return; // Don't count transferred days
          empData.totalRH += (record.regularHours !== undefined ? record.regularHours : (record.totalHours || 0));
          empData.totalOT += (record.overtimeHours || 0);
          
          if (record.status === 'Absent') {
            empData.absences += 1;
          }
        });
      });
    });

    // Remove employees with Transferred status who have NO punches at all in this month
    // (they shouldn't appear in months where they have zero presence)
    Object.keys(grouped).forEach(proj => {
      Object.keys(grouped[proj]).forEach(empId => {
        const emp = grouped[proj][empId];
        if (!emp.isTransferred) return;
        const hasPunch = Object.values(emp.daily).some(
          (r: any) => !r.isTransfer && r.status !== 'Absent' && (r.totalHours > 0 || r.regularHours > 0 || r.status === 'Present' || r.status === 'Weekend' || r.status === 'Holiday' || r.status === 'Leave')
        );
        if (!hasPunch) {
          delete grouped[proj][empId];
        }
      });
    });

    return grouped;
  }, [records, leaves, filterMonth, searchTerm, currentUser, residences, employeesMap, projectToResidenceMap, daysArray, timesheetEvents, employeeSchedules]);

  const handleCellDoubleClick = (empId: string, dateStr: string) => {
    const emp = employeesMap[empId];
    if (!emp) return;
    setSelectedEmployee(emp as HousingEmployee);
    setProfileDefaultDate(dateStr);
    setProfileOpen(true);
  };

  const renderCell = (record: any, empId: string, dateStr: string) => {
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
    const isElsewhere = record.status === 'Elsewhere';
    const isFuture = record.status === 'Future';
    const isTransferred = record.status === 'Transferred' || record.isTransfer;
    const hasHours = (record.regularHours || 0) > 0 || (record.overtimeHours || 0) > 0 || (record.totalHours || 0) > 0;
    
    // Determine missing punches (only one punch logged)
    const isMissingPunch = (!checkIn || !checkOut) && !isAbsent && !isLeave && !record.isVirtualWeekend && !isTransferred && !isElsewhere && !isFuture;
    
    const formatNumber = (num: number) => {
      if (!num) return '0';
      return Number.isInteger(num) ? num.toString() : num.toFixed(1);
    };

    let content: React.ReactNode = '-';
    let tooltip = '';

    if (isFuture) {
      content = <span className="opacity-30 text-gray-400">-</span>;
      tooltip = `Upcoming Date`;
    } else if (isElsewhere) {
      content = <span className="opacity-30">-</span>;
      tooltip = `Work recorded in: ${record.otherProjectNames.join(', ')}`;
    } else if (isTransferred) {
      content = 'T';
      tooltip = `Transferred`;
    } else if (isLeave) {
      content = 'L'; // Indicates Leave
      tooltip = `Leave: ${record.leaveType || 'Approved'} \nNotes: ${record.reason || '-'}`;
    } else if (isAbsent) {
      content = 'A';
      tooltip = `Status: Absent`;
    } else if (record.isHoliday && (!hasHours || record.overtimeHours === 0)) {
      // Holiday without actual worked hours
      content = (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="text-purple-600 dark:text-purple-400">8</span>
        </div>
      );
      tooltip = `Official Holiday Allowance (8 hours)`;
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
      tooltip = record.isHoliday
        ? `Holiday Allowance (8 hours) + Worked Overtime\nIn: ${checkIn || '-'} | Out: ${checkOut || '-'}`
        : record.isVirtualWeekend
        ? `Weekly Rest Allowance (8 hours) + Worked Overtime\nIn: ${checkIn || '-'} | Out: ${checkOut || '-'}`
        : `In: ${checkIn || '-'} | Out: ${checkOut || '-'}`;
    } else if (isMissingPunch) {
      content = '1'; // Missing Punch → show RH=1 per rule
      tooltip = `Missing Punch\nIn: ${checkIn || 'Missed'} | Out: ${checkOut || 'Missed'}`;
    } else if (isPresent) {
      content = 'P'; // Present but no hours recorded yet (e.g. 0 hours shift but checked out)
      tooltip = `In: ${checkIn || '-'} | Out: ${checkOut || '-'}`;
    }

    return (
      <div 
        title={tooltip + (record.hasOtherResidence ? `\n• Also seen in: ${record.otherProjectNames.join(', ')}` : '')}
        className={`w-6 h-6 md:w-8 md:h-8 flex flex-col items-center justify-center rounded text-[10px] md:text-sm font-bold mx-auto cursor-help relative
        ${isTransferred ? 'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-500 opacity-60' : ''}
        ${(isPresent && !isMissingPunch && !record.isVirtualWeekend && !record.isHoliday) || (hasHours && !record.isVirtualWeekend && !record.isHoliday) ? 'bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
        ${record.isHoliday ? 'bg-purple-100/60 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : ''}
        ${record.isVirtualWeekend && !record.isHoliday ? 'bg-sky-100/60 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' : ''}
        ${isAbsent && !record.isHoliday ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
        ${isLeave ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
        ${isMissingPunch && !isLeave && !record.isHoliday ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
      `}
        onDoubleClick={() => handleCellDoubleClick(empId, dateStr)}
      >
        {record.hasOtherResidence && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-gray-900 z-20" title={`Work also recorded in: ${record.otherProjectNames.join(', ')}`} />
        )}
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
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPrevMonth}
            disabled={availableMonths.indexOf(filterMonth) >= availableMonths.length - 1}
            title={isAr ? "الشهر السابق" : "Previous Month"}
          >
            {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          
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

          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextMonth}
            disabled={availableMonths.indexOf(filterMonth) <= 0}
            title={isAr ? "الشهر التالي" : "Next Month"}
          >
            {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
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
                  {Object.entries(employees).sort(([,a], [,b]) => {
                    const rankA = getProfessionRank(a.profession);
                    const rankB = getProfessionRank(b.profession);
                    if (rankA !== rankB) return rankA - rankB;
                    return a.name.localeCompare(b.name);
                  }).map(([empId, empData]) => (
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
                          {renderCell(empData.daily[dateStr], empId, dateStr)}
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
      <EmployeeProfileSheet 
        open={profileOpen && !!selectedEmployee}
        onOpenChange={(open) => {
          setProfileOpen(open);
          if (!open) {
            setSelectedEmployee(null);
            setProfileDefaultDate(null);
          }
        }}
        employee={selectedEmployee}
        defaultDate={profileDefaultDate}
      />
    </div>
  );
}

export default function TimesheetHistoryPage() {
  return (
    <HousingEmployeesProvider>
      <TimesheetProvider>
        <TimesheetHistoryContent />
      </TimesheetProvider>
    </HousingEmployeesProvider>
  );
}
