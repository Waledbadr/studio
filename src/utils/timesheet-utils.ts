import { RawPunch, DailyAttendance } from "../types/timesheet";
import { getProjectFromDevice } from "../constants/timesheet-devices";

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const calculateAttendanceStats = (
  checkIn: string | null,
  checkOut: string | null
): { totalHours: number; regularHours: number; overtimeHours: number; status: 'Present' | 'Incomplete' | 'Absent' } => {
  let totalHoursNum = 0;
  if (checkIn && checkOut && checkIn !== checkOut) {
    const inMins = timeToMinutes(checkIn);
    let outMins = timeToMinutes(checkOut);

    if (outMins < inMins) {
      outMins += 24 * 60; // Crossed midnight
    }

    const totalMins = outMins - inMins;

    // Round to nearest 15 minutes (which is 0.25 of an hour)
    const roundedMins = Math.round(totalMins / 15) * 15;

    totalHoursNum = Number((roundedMins / 60).toFixed(2));
  }

  const regularHours = Math.min(totalHoursNum, 8);
  const overtimeHours = totalHoursNum > 8 ? Number((totalHoursNum - 8).toFixed(2)) : 0;

  return {
    totalHours: totalHoursNum,
    regularHours,
    overtimeHours,
    status: checkOut ? 'Present' : 'Incomplete'
  };
};

export const processPunches = (punches: RawPunch[], deviceToProjectMap: Record<string, string> = {}): DailyAttendance[] => {
  const map = new Map<string, RawPunch[]>();

  punches.forEach((punch) => {
    const key = `${punch.employeeId}_${punch.date}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(punch);
  });

  const parsed: DailyAttendance[] = [];

  map.forEach((empPunches, key) => {
    // Sort chronologically
    const sorted = empPunches.sort((a, b) => a.time.localeCompare(b.time));

    let checkInDeviceRecord = sorted[0];

    // Deduplicate punches that are within 5 minutes of the previous valid punch
    const uniqueTimes: string[] = [];
    let isValidCheckIn = false;

    sorted.forEach((p) => {
      if (uniqueTimes.length === 0) {
        uniqueTimes.push(p.time);
        checkInDeviceRecord = p; // Lock in the device record associated with the first valid check-in
        isValidCheckIn = true;
      } else {
        const lastTime = uniqueTimes[uniqueTimes.length - 1];
        const lastMins = timeToMinutes(lastTime);
        let currMins = timeToMinutes(p.time);

        let diff = currMins - lastMins;
        if (diff < 0) diff += 24 * 60; // Should not happen easily since they are grouped by same date, but safe mathematically

        // Only add if it's more than 5 minutes later
        if (diff > 5) {
          uniqueTimes.push(p.time);
        }
      }
    });

    let checkIn = uniqueTimes[0];
    let checkOut = uniqueTimes.length > 1 ? uniqueTimes[uniqueTimes.length - 1] : null;

    const stats = calculateAttendanceStats(checkIn, checkOut);

    const checkInDevice = checkInDeviceRecord.deviceName || "Unknown";
    // Check dynamic map first, then static map, then default to Unknown
    const mappedProjectName = deviceToProjectMap[checkInDevice] || getProjectFromDevice(checkInDevice);

    parsed.push({
      id: key,
      employeeId: sorted[0].employeeId,
      firstName: sorted[0].firstName,
      department: sorted[0].department,
      projectName: mappedProjectName,
      checkInDevice: checkInDevice,
      date: sorted[0].date,
      checkIn: checkIn,
      checkOut: checkOut,
      totalHours: stats.totalHours,
      regularHours: stats.regularHours,
      overtimeHours: stats.overtimeHours,
      punches: uniqueTimes,
      status: stats.status,
      isSyncedToFirestore: false
    });
  });

  return parsed.sort((a, b) => a.date.localeCompare(b.date) || a.firstName.localeCompare(b.firstName));
};
