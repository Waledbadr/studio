const fs = require('fs');

// 1. types
const tPath = 'd:/EstateCare/studio/src/types/timesheet.ts';
let tContent = fs.readFileSync(tPath, 'utf8');
tContent = tContent.replace(
  "status: 'Present' | 'Absent' | 'Incomplete' | 'On Leave' | 'Permission' | 'Sick Leave' | 'Holiday' | 'Reduced Hours';",
  "status: 'Present' | 'Absent' | 'Incomplete' | 'On Leave' | 'Permission' | 'Sick Leave' | 'Holiday' | 'Reduced Hours' | 'Weekend';"
);
fs.writeFileSync(tPath, tContent);

// 2. context
const cPath = 'd:/EstateCare/studio/src/context/timesheet-context.tsx';
let cContent = fs.readFileSync(cPath, 'utf8');
cContent = cContent.replace(
  "const lSnap = await getDocs(query(collection(db, 'timesheetLeaves')));",
  "const [lSnap, eSnap] = await Promise.all([getDocs(query(collection(db, 'timesheetLeaves'))), getDocs(query(collection(db, 'housingEmployees')))]);\n          // Normally filter leaves\n          leavesData = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));\n          employeesData = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));\n"
);
// Make sure leavesData line replaces correctly
cContent = cContent.replace(
  "// Normally you'd filter by date here, but for now we pull all for processing\n          leavesData = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));",
  ""
);
cContent = cContent.replace(
  "let leavesData: any[] = [];",
  "let leavesData: any[] = [];\n        let employeesData: any[] = [];"
);
cContent = cContent.replace(
  "employeeSchedules,\n          leavesData\n        );",
  "employeeSchedules,\n          leavesData,\n          startDate,\n          endDate,\n          employeesData\n        );"
);
fs.writeFileSync(cPath, cContent);

// 3. view UI status badge
const vPath = 'd:/EstateCare/studio/src/components/timesheet/timesheet-view.tsx';
let vContent = fs.readFileSync(vPath, 'utf8');
if (!vContent.includes("case 'Weekend':")) {
  vContent = vContent.replace(
    "case 'Holiday':",
    "case 'Weekend':\n        return <Badge variant=\"secondary\" className=\"bg-sky-500 text-white hover:bg-sky-600\">{isAr ? 'عطلة أسبوعية' : 'Weekend'}</Badge>;\n      case 'Holiday':"
  );
  fs.writeFileSync(vPath, vContent);
}

// 4. Update the utils!
const utilsPath = 'd:/EstateCare/studio/src/utils/timesheet-utils.ts';
let utilsContent = fs.readFileSync(utilsPath, 'utf8');

// completely rewrite calculateAttendanceStats & processPunches
const newUtils = `
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
  leaves: any[] = [] // include leaves
): { totalHours: number; regularHours: number; overtimeHours: number; status: DailyAttendance['status'] } => {
  // 1. Check if the employee is on an approved leave
  const activeLeave = leaves.find(l =>
    (l.employeeId === employeeId || l.badgeId === employeeId) &&
    l.status !== 'Rejected' &&
    l.startDate <= date && (!l.endDate || l.endDate >= date)
  );

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
  let requiredHours = 8.0;
  const empSchedule = schedules.find(s => s.employeeId === employeeId);
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

  if (!checkIn && !checkOut) {
      status = 'Absent';
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
       if (totalHoursNum === 0) {
           regularHours = 8;
           totalHoursNum = 8;
           status = 'Weekend';
       } else {
           regularHours = 8;
           overtimeHours = totalHoursNum;
           totalHoursNum = 8 + totalHoursNum;
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
        // Normal Working Day or Reduced Hours. Scale them to equivalent of 8 hours!
        if (totalHoursNum > 0) {
             const ratio = totalHoursNum / requiredHours;
             const scaledTotal = ratio * 8.0;
             regularHours = Math.min(scaledTotal, 8.0);
             overtimeHours = scaledTotal > 8.0 ? Number((scaledTotal - 8.0).toFixed(2)) : 0;
             totalHoursNum = Number(scaledTotal.toFixed(2));
             if (activeEvent && activeEvent.type === 'reduced_hours') {
                status = 'Reduced Hours';
             }
        }
    }
  }

  // Round
  regularHours = Number(regularHours.toFixed(2));
  
  return {
    totalHours: totalHoursNum,
    regularHours,
    overtimeHours,
    status
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
  allEmployees: any[] = [] // Used to generate missing records
): DailyAttendance[] => {
  const map = new Map<string, RawPunch[]>();

  punches.forEach((punch) => {
    const key = \`\${punch.employeeId}_\${punch.date}\`;
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

    let checkIn = uniqueTimes[0];
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
    const stats = calculateAttendanceStats(checkIn, checkOut, date, employeeId, events, schedules, leaves);

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
      const datesArray = [];
      const current = new Date(start);
      while (current <= end) {
         datesArray.push(current.toISOString().split('T')[0]);
         current.setDate(current.getDate() + 1);
      }

      allEmployees.forEach((emp) => {
         const empId = emp.employeeId || emp.badgeId || emp.id;
         if (!empId) return;

         datesArray.forEach((dateStr) => {
             const key = \`\${empId}_\${dateStr}\`;
             if (!parsed.find(p => p.id === key)) {
                 // No punch logic -> completely empty day!
                 const stats = calculateAttendanceStats(null, null, dateStr, empId, events, schedules, leaves);
                 
                 // If it's a completely normal day (Absent) and they didn't work, we insert it.
                 // This fulfills the "generate full dummy records" requirement explicitly.
                 
                 // Create a dummy record
                 // Attempt to get employee name safely
                 const empName = emp.name || emp.nameAr || emp.firstName || emp.nameEn || empId;
                 const empProject = emp.project || emp.residenceId || 'Unknown Residence';

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
`;

fs.writeFileSync(utilsPath, newUtils);

console.log("Success! Updated utils, context, and view for dummy records generation.");

