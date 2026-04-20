import { TimesheetProvider } from "@/context/timesheet-context";
import { TimesheetSettings } from "@/components/timesheet/timesheet-settings";

export default function TimesheetSettingsPage() {
  return (
    <TimesheetProvider>
      <div className="container mx-auto py-6 max-w-6xl">
        <TimesheetSettings />
      </div>
    </TimesheetProvider>
  );
}
