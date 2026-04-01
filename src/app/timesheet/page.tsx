import React from 'react';
import { TimesheetProvider } from '@/context/timesheet-context';
import { TimesheetView } from '@/components/timesheet/timesheet-view';

export default function TimesheetDashboard() {
  return (
    <TimesheetProvider>
      <div className="p-6">
        <TimesheetView />
      </div>
    </TimesheetProvider>
  );
}
