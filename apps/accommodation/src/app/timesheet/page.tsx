"use client";

import { useEffect } from 'react';

export default function TimesheetCrossAppRedirectPage() {
  useEffect(() => {
    window.location.assign('/timesheet');
  }, []);

  return null;
}
