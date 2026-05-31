"use client";

import { useEffect } from 'react';

export default function TimesheetCrossAppCatchAllRedirectPage() {
  useEffect(() => {
    window.location.assign('/timesheet');
  }, []);

  return null;
}
