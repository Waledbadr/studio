
import { RawPunch, DailyAttendance, TimesheetEvent, EmployeeSchedule } from "../types/timesheet";
import { getProjectFromDevice } from "../constants/timesheet-devices";

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const calculateAttendanceStats = (
  checkIn: string | null,
  checkOut: string | null,
  date: string,
  employeeId: string,
  events: TimesheetEvent[] = [],
  schedules: EmployeeSchedule[] = [],
  leaves: any[] = [],
  transfers: any[] = [] // include transfers
): { totalHours: number; regularHours: number; overtimeHours: number; status: DailyAttendance['status'] } => {
  // 0. Check for transfers (Move In / Move Out)
  if (transfers && transfers.length > 0) {
    const sortedTransfers = [...transfers].sort((a, b) => b.date.localeCompare(a.date));
    
    // Find last move-in and last move-out
    const lastMoveIn = sortedTransfers.find(t => t.type === 'Move In');
    const lastMoveOut = sortedTransfers.find(t => t.type === 'Move Out');

    if (lastMoveIn && date < lastMoveIn.date) {
      return { totalHours: 0, regularHours: 0, overtimeHours: 0, status: 'Transferred' };
    }
    if (lastMoveOut && date > lastMoveOut.date) {
      return { totalHours: 0, regularHours: 0, overtimeHours: 0, status: 'Transferred' };
    }
  }

  // 1. Check if the employee is on an approved leave
  let activeLeave = leaves.find(l =>
    (l.employeeId === employeeId || l.badgeId === employeeId) &&
    l.status !== 'Rejected' &&
    l.startDate <= date && (!l.endDate || l.endDate >= date) &&
    (!l.cutOffDate || date < l.cutOffDate)
  );

  // Cut off standard leaves if there is an attendance record (fingerprint)
  if (activeLeave && (checkIn || checkOut)) {
    const isPermission = activeLeave.type === 'Permission' || activeLeave.type === 'استئذان';
    if (!isPermission) {
      activeLeave = undefined;
    }
  }

  let totalHoursNum = 0;
  if (checkIn && checkOut && checkIn !== checkOut) {
    const inMins = timeToMinutes(checkIn);
    let outMins = timeToMinutes(checkOut);

    if (outMins < inMins) outMins += 24 * 60; // Crossed midnight

    const totalMins = outMins - inMins;
    const roundedMins = Math.round(totalMins / 15) * 15;
    totalHoursNum = Number((roundedMins / 60).toFixed(2));
  }

  const dateObj = new Date(date);
  const isThursday = dateObj.getDay() === 4;
  const isFriday = dateObj.getDay() === 5; // Weekend

  // Default required hours
  let requiredHours = isThursday ? 5.5 : 8.5;
  const empSchedule = schedules.find(s => s.employeeId === employeeId || (s as any).badgeId === employeeId);
  if (empSchedule) {
      requiredHours = isThursday ? (empSchedule.thursdayHours || 5.5) : (empSchedule.dailyHours || 8.5);
  }

  // Find if it's a holiday / reduced event
  const activeEvent = events.find(e => date >= e.startDate && date <= e.endDate);
  if (activeEvent && activeEvent.type === 'reduced_hours') {
      requiredHours = activeEvent.requiredHours || 6.0;
  }

  let regularHours = 0;
  let overtimeHours = 0;
  let status: DailyAttendance['status'] = checkOut ? 'Present' : 'Incomplete';

  const todayStr = new Date().toISOString().split('T')[0];
  if (!checkIn && !checkOut) {
      status = date > todayStr ? 'Future' : 'Absent';
  }

  // Incomplete punch (only one punch) → grant 1 RH as placeholder
  if (status === 'Incomplete') {
      regularHours = 1;
  }

  // 2. Adjust stats if there's an active leave
  if (activeLeave) {
    if (activeLeave.type === 'Annual' || activeLeave.type === 'ط³ظ†ظˆظٹط©' || activeLeave.type?.includes('Annual')) {
      status = 'On Leave';
      if (totalHoursNum === 0) {
        regularHours = 8;
        totalHoursNum = 8;
      }
    } else if (activeLeave.type === 'Sick' || activeLeave.type === 'ظ…ط±ط¶ظٹط©') {
      status = 'Sick Leave';
      if (totalHoursNum === 0) {
        regularHours = 8;
        totalHoursNum = 8;
      }
    } else if (activeLeave.type === 'Permission' || activeLeave.type === 'ط§ط³طھط¦ط°ط§ظ†') {
      status = 'Permission';
      // Let's assume a permission covers the gap up to 8 hours for now.
      if (totalHoursNum > 0 && totalHoursNum < 8) {
         regularHours = 8;
         totalHoursNum = 8;
      } else if (totalHoursNum === 0) {
         regularHours = 8;
         totalHoursNum = 8;
      }
    }
  } else {
    // 3. Process standard scaling and events
    if (isFriday) {
       // Friday Rest Day (Weekly Holiday)
       // RH = 8 (rest allowance), OT = actual raw hours worked (not re-added)
       if (totalHoursNum === 0) {
           regularHours = 8;
           totalHoursNum = 8;
           status = 'Weekend';
       } else {
           // totalHoursNum here is the RAW calculated worked hours (from checkIn/checkOut)
           // It has NOT been scaled yet, so it IS the actual time worked
           regularHours = 8;
           overtimeHours = totalHoursNum; // raw worked hours become OT
           totalHoursNum = 8 + overtimeHours;
           status = 'Weekend';
       }
    } else if (activeEvent && activeEvent.type === 'holiday') {
        // Automatically grant 8 hours for holiday
        if (totalHoursNum === 0) {
           regularHours = 8;
           totalHoursNum = 8;
           status = 'Holiday';
        } else {
           // If they worked on a holiday, base 8 + worked = OT
           regularHours = 8;
           overtimeHours = totalHoursNum;
           totalHoursNum = 8 + totalHoursNum;
           status = 'Holiday'; 
        }
    } else {
        // Normal Working Day, Reduced Hours (Ramadan), or Custom Schedule (Thursday etc.)
        // Unified ratio formula: ratio = workedHours / requiredHours, scaled to 8-hour base
        // - Worked exactly required  → 8 RH, 0 OT
        // - Worked more than required → 8 RH + proportional OT
        // - Worked less than required → proportional RH (< 8), 0 OT
        if (totalHoursNum > 0) {
            const ratio = totalHoursNum / requiredHours;
            const scaledTotal = ratio * 8.0;
            regularHours = Math.min(scaledTotal, 8.0);
            overtimeHours = scaledTotal > 8.0 ? scaledTotal - 8.0 : 0;
            totalHoursNum = regularHours + overtimeHours;

            if (activeEvent && activeEvent.type === 'reduced_hours') {
                status = 'Reduced Hours';
            }
        }
    }
  }

  // Round
  regularHours = Number(regularHours.toFixed(2));
  overtimeHours = Number(overtimeHours.toFixed(2));
const totalNum = Number(totalHoursNum.toFixed(2));
  
  return {
    totalHours: totalNum,
    regularHours,
    overtimeHours,
    status
  };
};

/**
 * Merges a newly imported day into an existing archived day without losing
 * punches that the biometric server no longer returns.  The source is often
 * eventually consistent, so a later import can contain only one punch.
 */
export const mergeAttendanceRecord = (
  existing: DailyAttendance,
  incoming: DailyAttendance,
  events: TimesheetEvent[] = [],
  schedules: EmployeeSchedule[] = [],
  leaves: any[] = [],
  transfers: any[] = []
): DailyAttendance => {
  const existingPunches = Array.isArray(existing.punches) ? existing.punches : [];
  const incomingPunches = Array.isArray(incoming.punches) ? incoming.punches : [];
  const punches = Array.from(new Set([...existingPunches, ...incomingPunches])).sort((a, b) => a.localeCompare(b));

  // A deliberate edit remains the displayed record. We still retain newly
  // received source punches for audit and future review.
  if (existing.isManualOverride) {
    return {
      ...existing,
      punches,
      isSyncedToFirestore: false,
    };
  }

  let checkIn = existing.checkIn || incoming.checkIn;
  let checkOut = existing.checkOut || incoming.checkOut;

  if (punches.length >= 2) {
    checkIn = punches[0];
    checkOut = punches[punches.length - 1];
  } else if (punches.length === 1) {
    // Keep the previously known direction of a single punch. If this is the
    // first import, processPunches has already applied its afternoon heuristic.
    checkIn = existing.checkIn || incoming.checkIn;
    checkOut = existing.checkOut || incoming.checkOut;
  }

  const employeeTransfers = transfers.filter(t => t.employeeId === incoming.employeeId || t.badgeId === incoming.employeeId);
  const stats = calculateAttendanceStats(
    checkIn,
    checkOut,
    incoming.date,
    incoming.employeeId,
    events,
    schedules,
    leaves,
    employeeTransfers
  );

  return {
    ...existing,
    ...incoming,
    // Do not replace known profile values with blanks from an incomplete export.
    firstName: incoming.firstName || existing.firstName,
    department: incoming.department || existing.department,
    projectName: incoming.projectName || existing.projectName,
    checkInDevice: incoming.checkInDevice || existing.checkInDevice,
    checkIn,
    checkOut,
    punches,
    ...stats,
    isSyncedToFirestore: false,
  };
};

export const processPunches = (
  punches: RawPunch[],
  deviceToProjectMap: Record<string, string> = {},
  events: TimesheetEvent[] = [],
  schedules: EmployeeSchedule[] = [],
  leaves: any[] = [],
  startDateStr?: string,
  endDateStr?: string,
  allEmployees: any[] = [], // Used to generate missing records
  transfers: any[] = []
): DailyAttendance[] => {
  // Pre-process leaves: cut off leaves from the day the employee has a fingerprint
  const effectiveLeaves = leaves.map(leave => ({...leave}));
  const sortedRawPunches = [...punches].sort((a, b) => a.date.localeCompare(b.date));

  effectiveLeaves.forEach(leave => {
    const isPermission = leave.type === 'Permission' || leave.type === 'استئذان';
    if (!isPermission) {
      const empId = leave.employeeId || leave.badgeId;
      const firstPunch = sortedRawPunches.find(p => 
        (p.employeeId === empId) && 
        (p.date >= leave.startDate) && 
        (!leave.endDate || p.date <= leave.endDate)
      );
      if (firstPunch) {
        leave.cutOffDate = firstPunch.date;
      }
    }
  });

  const map = new Map<string, RawPunch[]>();

  punches.forEach((punch) => {
    const key = `${punch.employeeId}_${punch.date}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(punch);
  });

  const parsed: DailyAttendance[] = [];

  // Parse actual punche
  map.forEach((empPunches, key) => {
    const sorted = empPunches.sort((a, b) => a.time.localeCompare(b.time));

    let checkInDeviceRecord = sorted[0];
    const uniqueTimes: string[] = [];
    sorted.forEach((p) => {
      if (uniqueTimes.length === 0) {
        uniqueTimes.push(p.time);
        checkInDeviceRecord = p;
      } else {
        const lastTime = uniqueTimes[uniqueTimes.length - 1];
        let diff = timeToMinutes(p.time) - timeToMinutes(lastTime);
        if (diff < 0) diff += 24 * 60;
        if (diff > 5) uniqueTimes.push(p.time);
      }
    });

    let checkIn: string | null = uniqueTimes[0] || null;
    let checkOut = uniqueTimes.length > 1 ? uniqueTimes[uniqueTimes.length - 1] : null;

    // Smart heuristic: If there is ONLY ONE punch and it's late (>= 12:00 PM), it's likely a check-out
    if (checkIn && !checkOut) {
      const punchHour = parseInt(checkIn.split(':')[0], 10);
      if (!isNaN(punchHour) && punchHour >= 12) {
         checkOut = checkIn;
         checkIn = null;
      }
    }

    const { employeeId, date } = sorted[0];
    const empTransfers = transfers.filter(t => t.employeeId === employeeId || t.badgeId === employeeId);
    const stats = calculateAttendanceStats(checkIn, checkOut, date, employeeId, events, schedules, effectiveLeaves, empTransfers);

    const checkInDevice = checkInDeviceRecord.deviceName || "Unknown";
    const mappedProjectName = deviceToProjectMap[checkInDevice] || getProjectFromDevice(checkInDevice);

    parsed.push({
      id: key,
      employeeId,
      firstName: sorted[0].firstName,
      department: sorted[0].department,
      projectName: mappedProjectName,
      checkInDevice: checkInDevice,
      date,
      checkIn,
      checkOut,
      totalHours: stats.totalHours,
      regularHours: stats.regularHours,
      overtimeHours: stats.overtimeHours,
      punches: uniqueTimes,
      status: stats.status,
      isSyncedToFirestore: false
    });
  });

  // Now, inject missing (dummy) records for all employees
  if (startDateStr && endDateStr && allEmployees.length > 0) {
      // Build Date Range
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      const datesArray: string[] = [];
      const current = new Date(start);
      while (current <= end) {
         datesArray.push(current.toISOString().split('T')[0]);
         current.setDate(current.getDate() + 1);
      }

          allEmployees.forEach((emp) => {
             const empId = emp.employeeId || emp.badgeId || emp.id;
             if (!empId) return;
             
             // Transfer Filtering Logic: Skip if fully moved out before this month AND no punches
             const empTransfers = transfers.filter(t => t.employeeId === emp.id || t.badgeId === emp.employeeId);
             const lastMoveOut = [...empTransfers].filter(t => t.type === 'Move Out').sort((a, b) => b.date.localeCompare(a.date))[0];
             const lastMoveIn = [...empTransfers].filter(t => t.type === 'Move In').sort((a, b) => b.date.localeCompare(a.date))[0];

             if (lastMoveOut && lastMoveOut.date < startDateStr! && (!lastMoveIn || lastMoveIn.date < lastMoveOut.date)) {
                // If they moved out before this range started, and haven't moved back in since, skip
                return;
             }

             datesArray.forEach((dateStr) => {
                 const key = `${empId}_${dateStr}`;
                 if (!parsed.find(p => p.id === key)) {
                     // No punch logic -> completely empty day!
                     const stats = calculateAttendanceStats(null, null, dateStr, empId, events, schedules, effectiveLeaves, empTransfers);
                     
                     // If it's a completely normal day (Absent) and they didn't work, we insert it.
                     // This fulfills the "generate full dummy records" requirement explicitly.
                     
                     // Create a dummy record
                     // Attempt to get employee name safely
                     const empName = emp.name || emp.nameAr || emp.firstName || emp.nameEn || empId;
                     const empProject = emp.projectName || emp.project || emp.residenceId || 'Unknown Residence';

                     parsed.push({
                         id: key,
                         employeeId: empId,
                         firstName: empName,
                         department: emp.department || emp.profession || 'Worker',
                         projectName: empProject,
                         checkInDevice: 'System Generated',
                         date: dateStr,
                         checkIn: null,
                         checkOut: null,
                         totalHours: stats.totalHours,
                         regularHours: stats.regularHours,
                         overtimeHours: stats.overtimeHours,
                         punches: [],
                         status: stats.status,
                         isSyncedToFirestore: false
                     });
                 }
             });
          });
  }

  return parsed.sort((a, b) => a.date.localeCompare(b.date) || a.firstName.localeCompare(b.firstName));
};
