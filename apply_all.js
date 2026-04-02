const fs = require('fs');

// TYPES
const typesPath = 'd:/EstateCare/studio/src/types/timesheet.ts';
let types = fs.readFileSync(typesPath, 'utf8');
if (!types.includes('TimesheetEvent')) {
  types += \nexport type TimesheetEventType = 'holiday' | 'reduced_hours';\nexport interface TimesheetEvent {\n  id: string;\n  name: string;\n  type: TimesheetEventType;\n  startDate: string;\n  endDate: string;\n  requiredHours?: number;\n}\nexport interface EmployeeSchedule {\n  employeeId: string;\n  name: string;\n  dailyHours: number;\n  thursdayHours: number;\n}\n;
  fs.writeFileSync(typesPath, types);
}

// UTILS
const utilsPath = 'd:/EstateCare/studio/src/utils/timesheet-utils.ts';
let utils = fs.readFileSync(utilsPath, 'utf8');
utils = utils.replace('import { getProjectFromDevice }', 'import { TimesheetEvent, EmployeeSchedule } from "../types/timesheet";\nimport { getProjectFromDevice }');
utils = utils.replace('events: TimesheetEvent[] = [], schedules: EmployeeSchedule[] = []', ''); // cleanup previous runs if any
utils = utils.replace(
  'calculateAttendanceStats = (\n  checkIn: string | null,\n  checkOut: string | null\n)',
  'calculateAttendanceStats = (\n  checkIn: string | null,\n  checkOut: string | null,\n  date: string,\n  employeeId: string,\n  events: TimesheetEvent[] = [],\n  schedules: EmployeeSchedule[] = []\n)'
);
utils = utils.replace(
  '  const regularHours = Math.min(totalHoursNum, 8);\n  const overtimeHours = totalHoursNum > 8 ? Number((totalHoursNum - 8).toFixed(2)) : 0;\n\n  return {\n    totalHours: totalHoursNum,\n    regularHours,\n    overtimeHours,\n    status: checkOut ? \'Present\' : \'Incomplete\'\n  };',
    const activeEvent = events.find(e => date >= e.startDate && date <= e.endDate);\n  const empSchedule = schedules.find(s => s.employeeId === employeeId);\n  const isThursday = new Date(date).getDay() === 4;\n  let requiredHours = 8;\n  if (activeEvent && activeEvent.type === 'reduced_hours') { requiredHours = activeEvent.requiredHours || 6; } else if (empSchedule) { requiredHours = isThursday ? (empSchedule.thursdayHours || 5.5) : (empSchedule.dailyHours || 8.5); }\n  let regularHours = 0;\n  let overtimeHours = 0;\n  let status: any = checkOut ? 'Present' : 'Incomplete';\n  if (!checkIn && !checkOut) {\n    status = 'Absent';\n    if (activeEvent && activeEvent.type === 'holiday') { regularHours = 8; status = 'Holiday'; } else { regularHours = 0; }\n  } else if (activeEvent && activeEvent.type === 'holiday') { regularHours = 8; overtimeHours = totalHoursNum; status = 'Holiday'; } else { const ratio = totalHoursNum / requiredHours; const scaledTotal = ratio * 8; regularHours = Math.min(scaledTotal, 8); overtimeHours = scaledTotal > 8 ? Number((scaledTotal - 8).toFixed(2)) : 0; regularHours = Number(regularHours.toFixed(2)); }\n  return { totalHours: totalHoursNum, regularHours, overtimeHours, status };
);
utils = utils.replace(
  'export const processPunches = (punches: RawPunch[], deviceToProjectMap: Record<string, string> = {}): DailyAttendance[] => {',
  'export const processPunches = (punches: RawPunch[], deviceToProjectMap: Record<string, string> = {}, events: TimesheetEvent[] = [], schedules: EmployeeSchedule[] = []): DailyAttendance[] => {'
);
utils = utils.replace(
  'const stats = calculateAttendanceStats(checkIn, checkOut);',
  'const { employeeId, date } = sorted[0];\n    const stats = calculateAttendanceStats(checkIn, checkOut, date, employeeId, events, schedules);'
);
fs.writeFileSync(utilsPath, utils);

// CONTEXT
const ctxPath = 'd:/EstateCare/studio/src/context/timesheet-context.tsx';
let ctx = fs.readFileSync(ctxPath, 'utf8');
ctx = ctx.replace('import { RawPunch, DailyAttendance } from "@/types/timesheet";', 'import { RawPunch, DailyAttendance, TimesheetEvent, EmployeeSchedule } from "@/types/timesheet";');
ctx = ctx.replace('projectToResidenceMap: Record<string, string>;', 'projectToResidenceMap: Record<string, string>;\n  timesheetEvents: TimesheetEvent[];\n  employeeSchedules: EmployeeSchedule[];\n  updateEvents: (e: TimesheetEvent[]) => Promise<void>;\n  updateSchedules: (s: EmployeeSchedule[]) => Promise<void>;');
ctx = ctx.replace('const [projectToResidenceMap, setProjectToResidenceMap] = useState<Record<string, string>>({});', 'const [projectToResidenceMap, setProjectToResidenceMap] = useState<Record<string, string>>({});\n  const [timesheetEvents, setTimesheetEvents] = useState<TimesheetEvent[]>([]);\n  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);');
ctx = ctx.replace('setProjectToResidenceMap(data.projectToResidenceMap || {});', 'setProjectToResidenceMap(data.projectToResidenceMap || {});\n          setTimesheetEvents(data.timesheetEvents || []);\n          setEmployeeSchedules(data.employeeSchedules || []);');
ctx = ctx.replace('const updateDeviceMapping = async', 'const updateEvents = async (events: TimesheetEvent[]) => { if(db) { setTimesheetEvents(events); await setDoc(doc(db, "residences", "timesheetSettings"), { timesheetEvents: events }, { merge: true }); } };\n  const updateSchedules = async (schedules: EmployeeSchedule[]) => { if(db) { setEmployeeSchedules(schedules); await setDoc(doc(db, "residences", "timesheetSettings"), { employeeSchedules: schedules }, { merge: true }); } };\n  const updateDeviceMapping = async');
ctx = ctx.replace('const processed = processPunches(json.data || [], deviceToProjectMap);', 'const processed = processPunches(json.data || [], deviceToProjectMap, timesheetEvents, employeeSchedules);');
ctx = ctx.replace('removeProjectMapping,\n  };', 'removeProjectMapping,\n    timesheetEvents,\n    employeeSchedules,\n    updateEvents,\n    updateSchedules\n  };');
fs.writeFileSync(ctxPath, ctx);

// SETTINGS
const settingsPath = 'd:/EstateCare/studio/src/components/timesheet/timesheet-settings.tsx';
let setts = fs.readFileSync(settingsPath, 'utf8');
setts = setts.replace('import { useTimesheet } from "@/context/timesheet-context";', 'import { useTimesheet } from "@/context/timesheet-context";\nimport { TimesheetEvent, EmployeeSchedule } from "@/types/timesheet";');
setts = setts.replace('removeDeviceMapping\n  } = useTimesheet();', 'removeDeviceMapping,\n    timesheetEvents,\n    employeeSchedules,\n    updateEvents,\n    updateSchedules\n  } = useTimesheet();');

let newSection = \
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{isAr ? 'المناسبات والإجازات' : 'Events & Holidays'}</CardTitle>
            <CardDescription>{isAr ? 'إدارة الإجازات ومناسبات العمل المخفض' : 'Manage full-day holidays and reduced-hour events'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(timesheetEvents || []).map((e, idx) => (
              <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                <div>
                  <div className="font-semibold">{e.name} ({e.type === 'holiday' ? (isAr ? 'إجازة' : 'Holiday') : (isAr ? 'دوام مخفض' : 'Reduced Hours')})</div>
                  <div className="text-xs text-muted-foreground">{e.startDate} - {e.endDate} {e.type === 'reduced_hours' && '| ' + e.requiredHours + 'h'}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => updateEvents(timesheetEvents.filter(ev => ev.id !== e.id))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => {
              const name = prompt(isAr ? 'اسم المناسبة' : 'Event Name');
              if (!name) return;
              const typeChoice = prompt(isAr ? 'النوع: اكتب 1 للإجازة الرسمية، 2 لمناسبة دوام مخفض' : 'Type: 1 for Holiday, 2 for Reduced Hours');
              if (!typeChoice) return;
              const type = typeChoice === '1' ? 'holiday' : 'reduced_hours';
              const startDate = prompt(isAr ? 'تاريخ البداية (YYYY-MM-DD)' : 'Start Date (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
              const endDate = prompt(isAr ? 'تاريخ النهاية (YYYY-MM-DD)' : 'End Date (YYYY-MM-DD)', startDate);
              if (!startDate || !endDate) return;
              let requiredHours = 8;
              if (type === 'reduced_hours') requiredHours = parseFloat(prompt(isAr ? 'الساعات المطلوبة (مثال: 6)' : 'Required Hours', '6') || '6');
              updateEvents([...(timesheetEvents || []), { id: Date.now().toString(), name, type: type as any, startDate, endDate, requiredHours }]);
            }}><Plus className="h-4 w-4 mr-2" /> {isAr ? 'إضافة مناسبة جديدة' : 'Add Event/Holiday'}</Button>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{isAr ? 'موظفي الاستثناء' : 'Special Schedule Employees'}</CardTitle>
            <CardDescription>{isAr ? 'موظفين بنظام ساعات مختلف (مثل: 8.5/5.5)' : 'Employees with different required hours'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(employeeSchedules || []).map((s, idx) => (
              <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                <div>
                  <div className="font-semibold">{s.name} ({s.employeeId})</div>
                  <div className="text-xs text-muted-foreground">{isAr ? 'يومي: ' + s.dailyHours + 'س | الخميس: ' + s.thursdayHours + 'س' : 'Daily: ' + s.dailyHours + 'h | Thu: ' + s.thursdayHours + 'h'}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => updateSchedules(employeeSchedules.filter(sch => sch.employeeId !== s.employeeId))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => {
              const employeeId = prompt(isAr ? 'الرقم الوظيفي للاستثناء' : 'Employee ID');
              if (!employeeId) return;
              const name = prompt(isAr ? 'اسم الموظف' : 'Employee Name', 'موظف ' + employeeId);
              if (!name) return;
              const dailyHours = parseFloat(prompt(isAr ? 'ساعات الدوام الفعلي باليوم' : 'Daily Hours', '8.5') || '8.5');
              const thursdayHours = parseFloat(prompt(isAr ? 'ساعات الدوام الفعلي بالخميس' : 'Thursday Hours', '5.5') || '5.5');
              updateSchedules([...(employeeSchedules || []), { employeeId, name, dailyHours, thursdayHours }]);
            }}><UserPlus className="h-4 w-4 mr-2" /> {isAr ? 'إضافة استثناء موظف' : 'Add Custom Schedule'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
\;

const lastDiv = setts.lastIndexOf('    </div>\n  );\n}');
if (lastDiv !== -1) {
  setts = setts.substring(0, lastDiv) + newSection;
  fs.writeFileSync(settingsPath, setts);
}
