'use client';

import { redirect } from 'next/navigation';

export default function ToolsPage() {
  // This page has been deprecated per request.
  // Redirect to dashboard.
  redirect('/');
  return null;
}
