const fs = require('fs');
const path = 'd:/EstateCare/studio/src/components/timesheet/timesheet-settings.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('updateEvents')) {
  c = c.replace(/const isAr = locale === "ar";/g, 'const isAr = locale === "ar";\n  const { timesheetEvents, employeeSchedules, updateEvents, updateSchedules } = useTimesheet();');
  const importMatch = c.match(/import \{ [^}]+\} from "@\/types\/timesheet"/);
  if (importMatch) {
    c = c.replace(importMatch[0], importMatch[0].replace('}', ', TimesheetEvent, EmployeeSchedule }'));
  } else {
    c = c.replace(/import \{ useTimesheet \} from "@\/context\/timesheet-context";/g, 'import { useTimesheet } from "@/context/timesheet-context";\nimport { TimesheetEvent, EmployeeSchedule } from "@/types/timesheet";');
  }

  const eventsBlock = 
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{isAr ? "المناسبات والإجازات" : "Events & Holidays"}</CardTitle>
            <CardDescription>{isAr ? "إدارة الإجازات (عمل كامل) ومناسبات العمل المخفض (مثل رمضان)" : "Manage full-day holidays and reduced-hour events (e.g. Ramadan)"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(timesheetEvents || []).map((e, idx) => (
              <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                <div>
                  <div className="font-semibold">{e.name} ({e.type === 'holiday' ? (isAr ? 'إجازة' : 'Holiday') : (isAr ? 'دوام مخفض' : 'Reduced Hours')})</div>
                  <div className="text-xs text-muted-foreground">{e.startDate} - {e.endDate} {e.type === 'reduced_hours' && \| \h\}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => updateEvents(timesheetEvents.filter(ev => ev.id !== e.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => {
              const name = prompt(isAr ? 'اسم المناسبة' : 'Event Name');
              if (!name) return;
              const type = prompt(isAr ? 'النوع: اكتب 1 للإجازة، 2 للمناسبة/دوام مخفض' : 'Type: 1 for Holiday, 2 for Reduced Hours') === '1' ? 'holiday' : 'reduced_hours';
              const startDate = prompt(isAr ? 'تاريخ البداية (YYYY-MM-DD)' : 'Start Date (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
              const endDate = prompt(isAr ? 'تاريخ النهاية (YYYY-MM-DD)' : 'End Date (YYYY-MM-DD)', startDate);
              if (!startDate || !endDate) return;
              let requiredHours = 8;
              if (type === 'reduced_hours') {
                requiredHours = parseFloat(prompt(isAr ? 'الساعات المطلوبة (مثال: 6)' : 'Required Hours (e.g. 6)', '6') || '6');
              }
              const newEvent: TimesheetEvent = { id: Date.now().toString(), name, type, startDate, endDate, requiredHours };
              updateEvents([...(timesheetEvents || []), newEvent]);
            }}>
              <Plus className="h-4 w-4 mr-2" /> {isAr ? "إضافة مناسبة جديدة" : "Add Event"}
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{isAr ? "موظفي الجداول الخاصة" : "Special Schedule Employees"}</CardTitle>
            <CardDescription>{isAr ? "موظفين بنظام ساعات مختلف (مثل: 8.5 ساعة، الخميس 5.5)" : "Employees with different required hours (e.g. 8.5/5.5)"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(employeeSchedules || []).map((s, idx) => (
              <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                <div>
                  <div className="font-semibold">{s.name} ({s.employeeId})</div>
                  <div className="text-xs text-muted-foreground">{isAr ? \يومي: \س | الخميس: \س\ : \Daily: \h | Thu: \h\}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => updateSchedules(employeeSchedules.filter(sch => sch.employeeId !== s.employeeId))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => {
              const employeeId = prompt(isAr ? 'رقم الموظف' : 'Employee ID');
              if (!employeeId) return;
              const name = prompt(isAr ? 'اسم الموظف' : 'Employee Name', 'موظف ' + employeeId);
              if (!name) return;
              const dailyHours = parseFloat(prompt(isAr ? 'ساعات الدوام اليومي' : 'Daily Hours', '8.5') || '8.5');
              const thursdayHours = parseFloat(prompt(isAr ? 'ساعات الخميس' : 'Thursday Hours', '5.5') || '5.5');
              const newSchedule: EmployeeSchedule = { employeeId, name, dailyHours, thursdayHours };
              updateSchedules([...(employeeSchedules || []), newSchedule]);
            }}>
              <UserPlus className="h-4 w-4 mr-2" /> {isAr ? "تخصيص موظف" : "Add Custom Schedule"}
            </Button>
          </CardContent>
        </Card>
      </div>
  ;

  // Insert before the last </div> which we guess is the main container close
  const lastDivIndex = c.lastIndexOf('</div>');
  c = c.substring(0, lastDivIndex) + eventsBlock + c.substring(lastDivIndex);
  
  fs.writeFileSync(path, c);
}
