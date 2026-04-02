const fs = require('fs');
const path = 'd:/EstateCare/studio/src/context/timesheet-context.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/import \{ RawPunch, DailyAttendance \} from "@\/types\/timesheet";/g, 'import { RawPunch, DailyAttendance, TimesheetEvent, EmployeeSchedule } from "@/types/timesheet";');

c = c.replace(/projectToResidenceMap: Record<string, string>;/g, 'projectToResidenceMap: Record<string, string>;\n  timesheetEvents: TimesheetEvent[];\n  employeeSchedules: EmployeeSchedule[];\n  updateEvents: (events: TimesheetEvent[]) => Promise<void>;\n  updateSchedules: (schedules: EmployeeSchedule[]) => Promise<void>;');

c = c.replace(/const \[projectToResidenceMap, setProjectToResidenceMap\] = useState<Record<string, string>>\(\{ \}\);/g, 'const [projectToResidenceMap, setProjectToResidenceMap] = useState<Record<string, string>>({});\n  const [timesheetEvents, setTimesheetEvents] = useState<TimesheetEvent[]>([]);\n  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);');

c = c.replace(/setProjectToResidenceMap\(data\.projectToResidenceMap \|\| \{\}\);/g, 'setProjectToResidenceMap(data.projectToResidenceMap || {});\n          setTimesheetEvents(data.timesheetEvents || []);\n          setEmployeeSchedules(data.employeeSchedules || []);');

c = c.replace(/const updateDeviceMapping/g, 'const updateEvents = async (events: TimesheetEvent[]) => {\n    if (!db) return;\n    setTimesheetEvents(events);\n    await setDoc(doc(db, "residences", "timesheetSettings"), { timesheetEvents: events }, { merge: true });\n  };\n\n  const updateSchedules = async (schedules: EmployeeSchedule[]) => {\n    if (!db) return;\n    setEmployeeSchedules(schedules);\n    await setDoc(doc(db, "residences", "timesheetSettings"), { employeeSchedules: schedules }, { merge: true });\n  };\n\n  const updateDeviceMapping');

c = c.replace(/processPunches\(json\.data \|\| \[\], deviceToProjectMap\)/g, 'processPunches(json.data || [], deviceToProjectMap, timesheetEvents, employeeSchedules)');

c = c.replace(/removeProjectMapping\n\}/g, 'removeProjectMapping,\n  timesheetEvents,\n  employeeSchedules,\n  updateEvents,\n  updateSchedules\n}');

fs.writeFileSync(path, c);
