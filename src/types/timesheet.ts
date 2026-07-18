export interface RawPunch {
  employeeId: string;
  firstName: string;
  department: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  deviceName: string;
}

export interface DailyAttendance {
  id: string; // e.g., EMPID_YYYY-MM-DD
  employeeId: string;
  firstName: string;
  department: string;
  projectName: string; // Add mapped project name
  checkInDevice: string; // Add check-in device name
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number; // calculated differences in decimal hours
  regularHours: number; // Max 8 hours
  overtimeHours: number; // totalHours > 8
  punches: string[]; // array of all punch times sorted
  status: 'Present' | 'Absent' | 'Incomplete' | 'On Leave' | 'Permission' | 'Sick Leave' | 'Holiday' | 'Reduced Hours' | 'Weekend' | 'Transferred' | 'Future';
  isSyncedToFirestore: boolean;
  // A manual correction is authoritative and must never be overwritten by a
  // later import from the biometric source.
  isManualOverride?: boolean;
  lastSourceSyncAt?: string;
}

export type TimesheetEventType = 'holiday' | 'reduced_hours';

export interface TimesheetEvent {
  id: string;
  name: string;
  type: TimesheetEventType;
  startDate: string;
  endDate: string;
  requiredHours?: number;
}

export interface EmployeeSchedule {
  employeeId: string;
  name: string;
  dailyHours: number;
  thursdayHours: number;
}
