import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { DEVICE_PROJECT_MAP } from '@/constants/timesheet-devices';

export async function GET() {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Admin DB not initialized' }, { status: 500 });
    }

    const ref = adminDb.collection('residences').doc('timesheetSettings');
    
    await ref.set({
      deviceToProjectMap: DEVICE_PROJECT_MAP
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${Object.keys(DEVICE_PROJECT_MAP).length} devices to project mappings.`,
      devices: Object.keys(DEVICE_PROJECT_MAP)
    });
  } catch (error: any) {
    console.error('Error syncing device mappings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
