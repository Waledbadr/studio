import { NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';
import { getDb } from '@/lib/db';
import { residences, occupants, workers as workersTable } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    // Expected body: { workerId | workerIds, residenceId, roomId }
    const { workerId, workerIds, residenceId, roomId } = body || {};

    if ((!workerId && !Array.isArray(workerIds)) || !residenceId || !roomId) {
      return NextResponse.json({ ok: false, error: 'missing-params' }, { status: 400 });
    }

    const env = await getCloudflareEnvRecord();
    if (!env || !(env as any).DB) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'D1 binding not available. If running locally, start the app with `npm run dev:d1` (Cloudflare Pages dev) so `getRequestContext().env.DB` is present.'
        },
        { status: 503 }
      );
    }

    const db = getDb((env as any).DB);

    try {
      const toAssign = Array.isArray(workerIds) ? workerIds : [workerId];
      const assigned: any[] = [];

      // Workers to assign
      const workerRows = await db.select().from(workersTable).where((workersTable.id as any).in(toAssign));
      const workers = workerRows as any[];

      // Current active occupants
      const activeOccupants = await db
        .select()
        .from(occupants)
        .where(and(eq(occupants.residenceId, residenceId), eq(occupants.roomId, roomId), isNull(occupants.until)));

      const allActiveOccupants = await db.select().from(occupants).where(isNull(occupants.until));

      // Check if workers are already assigned (active)
      const alreadyAssignedWorkers = toAssign.filter((wid: string) =>
        (allActiveOccupants as any[]).some((o: any) => o.workerId === wid)
      );

      // Get residence data to check room capacity
      const residenceRows = await db.select().from(residences).where(eq(residences.id, residenceId));
      const residence = (residenceRows && residenceRows[0]) as any;

      if (!residence) {
        return NextResponse.json({ ok: false, error: 'Residence not found' }, { status: 404 });
      }

      // Find the room in the residence structure
      let roomData: any = null;
      const buildings = residence?.buildings && typeof residence.buildings === 'string' ? JSON.parse(residence.buildings) : residence?.buildings;
      if (Array.isArray(buildings)) {
        for (const building of buildings) {
          for (const floor of building?.floors || []) {
            const found = floor?.rooms?.find((r: any) => r.id === roomId);
            if (found) {
              roomData = found;
              break;
            }
          }
          if (roomData) break;
        }
      }

      if (!roomData) {
        return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 });
      }

      // Check room capacity
      const currentOccupants = activeOccupants as any[];
      const roomCapacity = roomData.capacity || 0;

      if (currentOccupants.length + toAssign.length > roomCapacity) {
        return NextResponse.json({
          ok: false,
          error: `Room capacity exceeded. Current: ${currentOccupants.length}, Capacity: ${roomCapacity}`
        }, { status: 400 });
      }

      // Check if any workers are already assigned
      if (alreadyAssignedWorkers.length > 0) {
        const workerIds = alreadyAssignedWorkers.join(', ');
        return NextResponse.json({
          ok: false,
          error: `Workers already assigned: ${workerIds}`
        }, { status: 400 });
      }

      // Check nationality rule (all occupants in same room must have same nationality)
      if (currentOccupants.length > 0) {
        const firstOccupant = currentOccupants[0] as any;
        const firstWorkerRows = await db.select().from(workersTable).where(eq(workersTable.id, firstOccupant.workerId));
        const firstNationality = (firstWorkerRows[0] as any)?.nationality;

        for (const worker of workers) {
          const w = worker as any;
          if (!w) {
            return NextResponse.json({ ok: false, error: `Worker ${w?.id} not found` }, { status: 404 });
          }

          // Check nationality match
          if (firstNationality && w.nationality !== firstNationality) {
            return NextResponse.json({
              ok: false,
              error: `Nationality mismatch. Room has ${firstNationality} workers, cannot assign ${w.nationality}`
            }, { status: 400 });
          }
        }
      } else {
        // If no existing occupants, verify all workers to assign have same nationality
        if (workers.length > 1) {
          const firstNationality = (workers[0] as any).nationality;
          for (const worker of workers.slice(1)) {
            const w = worker as any;
            if (w.nationality !== firstNationality) {
              return NextResponse.json({
                ok: false,
                error: `Cannot assign workers with different nationalities to the same room`
              }, { status: 400 });
            }
          }
        }
      }

      // Assign workers to room (check-in)
      for (const wid of toAssign) {
        const worker = workers.find((w: any) => w.id === wid);
        if (!worker) continue;

        const res = await D1Actions.checkInWorker(env, {
          workerId: wid,
          residenceId,
          roomId,
          since: new Date().toISOString(),
          checkInBy: 'system',
        });
        if (res && (res as any).ok) assigned.push(wid);
      }

      return NextResponse.json({ ok: true, assigned, count: assigned.length });
    } catch (e) {
      console.error('assign route error', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
