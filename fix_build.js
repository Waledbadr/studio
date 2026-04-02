const fs = require('fs');
const path = 'd:/EstateCare/studio/src/context/timesheet-context.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/  updateEvents: \(events: TimesheetEvent\[\]\) => Promise<void>;\\n  updateSchedules: \(schedules: EmployeeSchedule\[\]\) => Promise<void>;\\n/g, '');
c = c.replace(/  timesheetEvents: TimesheetEvent\[\];\\n  employeeSchedules: EmployeeSchedule\[\];\\n/g, '');

c = c.replace(/  const updateEvents = async \(events: TimesheetEvent\[\]\) => \{\\n    if \(!db\) return;\\n    setTimesheetEvents\(events\);\\n    await setDoc\(doc\(db, "residences", "timesheetSettings"\), \{ timesheetEvents: events \}, \{ merge: true \}\);\\n  \};\\n\\n  const updateSchedules = async \(schedules: EmployeeSchedule\[\]\) => \{\\n    if \(!db\) return;\\n    setEmployeeSchedules\(schedules\);\\n    await setDoc\(doc\(db, "residences", "timesheetSettings"\), \{ employeeSchedules: schedules \}, \{ merge: true \}\);\\n  \};\\n\\n/g, '');

const interfaceFix = "  timesheetEvents: TimesheetEvent[];\\n  employeeSchedules: EmployeeSchedule[];\\n  updateEvents: (events: TimesheetEvent[]) => Promise<void>;\\n  updateSchedules: (schedules: EmployeeSchedule[]) => Promise<void>;\\n";
c = c.replace(/  projectToResidenceMap: Record<string, string>;/g, "  projectToResidenceMap: Record<string, string>;\\n" + interfaceFix);

const implFix = "  const updateEvents = async (events: TimesheetEvent[]) => {\\n    if (!db) return;\\n    setTimesheetEvents(events);\\n    await setDoc(doc(db, 'residences', 'timesheetSettings'), { timesheetEvents: events }, { merge: true });\\n  };\\n\\n  const updateSchedules = async (schedules: EmployeeSchedule[]) => {\\n    if (!db) return;\\n    setEmployeeSchedules(schedules);\\n    await setDoc(doc(db, 'residences', 'timesheetSettings'), { employeeSchedules: schedules }, { merge: true });\\n  };\\n\\n";
c = c.replace(/  const updateDeviceMapping/g, implFix + "  const updateDeviceMapping");

c = c.replace(/  timesheetEvents,\\n  employeeSchedules,\\n  updateEvents,\\n  updateSchedules\\n/g, "");
c = c.replace(/  removeProjectMapping,\\n/g, "  removeProjectMapping,\\n  timesheetEvents,\\n  employeeSchedules,\\n  updateEvents,\\n  updateSchedules\\n");

fs.writeFileSync(path, c);
