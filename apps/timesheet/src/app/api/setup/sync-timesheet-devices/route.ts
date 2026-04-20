import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { DEVICE_PROJECT_MAP } from '@/constants/timesheet-devices';

export async function GET() {
  try {
    const adminDb = getD1Db();
    if (!adminDb) {
      return NextResponse.json({ error: 'D1 database not initialized' }, { status: 500 });
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
