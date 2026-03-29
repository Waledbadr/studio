import { NextResponse } from "next/server";
import { getAdminDb } from '@/lib/firebase-admin';
import serverCache from '@/lib/server-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Accommodation Assignment API (Check-in)
 * 
 * Handles worker check-in operations and room assignments.
 * For checkout operations with date validation, see: /api/accommodation/checkout
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expected body: { workerId | workerIds, residenceId, roomId }
    const { workerId, workerIds, residenceId, roomId } = body || {};
    
    if ((!workerId && !Array.isArray(workerIds)) || !residenceId || !roomId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'missing-params',
        errorAr: 'معاملات مفقودة: يجب تحديد العامل والمسكن والغرفة',
        errorEn: 'Missing parameters: worker, residence, and room are required'
      }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Firebase Admin not configured',
        errorAr: 'خطأ في إعداد قاعدة البيانات',
        errorEn: 'Database configuration error'
      }, { status: 500 });
    }

    try {
      const toAssign = Array.isArray(workerIds) ? workerIds : [workerId];
      const assigned: any[] = [];
      
      // Get ONLY the specific workers we need using cache
      const workers: any[] = [];
      
      // Try to get all workers from cache first
      const allWorkers = await serverCache.get(
        'workers:all',
        async () => {
          console.log('📡 [Assign] Fetching all workers from Firestore (cache miss)');
          const snap = await adminDb.collection('workers').get();
          return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        },
        10 * 60 * 1000 // 10 min cache
      );
      
      // Filter only the workers we need from cached data
      for (const wid of toAssign) {
        const worker = allWorkers.find((w: any) => w.id === wid);
        if (worker) {
          workers.push(worker);
        }
      }
      
      // Get occupants from cache and filter
      const allOccupants = await serverCache.get(
        'occupants:all',
        async () => {
          console.log('📡 [Assign] Fetching all occupants from Firestore (cache miss)');
          const snap = await adminDb.collection('occupants').get();
          return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        },
        2 * 60 * 1000 // 2 min cache (occupants change frequently)
      );
      
      // Filter occupants for this room from cached data
      const existingOccupants = allOccupants.filter((o: any) => 
        o.roomId === roomId && o.residenceId === residenceId
      );
      
      // Check if workers are already assigned (from cached data)
      const alreadyAssignedWorkers = toAssign.filter(wid =>
        allOccupants.some((o: any) => o.workerId === wid)
      );
      
      // Get residence data to check room capacity
      const residenceDoc = await adminDb.collection('residences').doc(residenceId).get();
      const residence = residenceDoc.data();
      
      if (!residence) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Residence not found',
          errorAr: 'المسكن غير موجود',
          errorEn: 'Residence not found'
        }, { status: 404 });
      }
      
      // Find the room in the residence structure
      let roomData: any = null;
      if (residence.rooms) {
        roomData = residence.rooms.find((r: any) => r.id === roomId);
      } else if (residence.buildings) {
        for (const building of residence.buildings) {
          for (const floor of building.floors || []) {
            const found = floor.rooms?.find((r: any) => r.id === roomId);
            if (found) {
              roomData = found;
              break;
            }
          }
          if (roomData) break;
        }
      }
      
      if (!roomData) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Room not found',
          errorAr: 'الغرفة غير موجودة',
          errorEn: 'Room not found'
        }, { status: 404 });
      }
      
      // Check room capacity
      const currentOccupants = existingOccupants.filter((o: any) => o.roomId === roomId);
      const roomCapacity = roomData.capacity || 0;
      
      if (currentOccupants.length + toAssign.length > roomCapacity) {
        return NextResponse.json({ 
          ok: false, 
          error: `Room capacity exceeded. Current: ${currentOccupants.length}, Capacity: ${roomCapacity}`,
          errorAr: `الغرفة ممتلئة. الحالي: ${currentOccupants.length}، السعة: ${roomCapacity}`,
          errorEn: `Room capacity exceeded. Current: ${currentOccupants.length}, Capacity: ${roomCapacity}`
        }, { status: 400 });
      }
      
      // Check if any workers are already assigned
      if (alreadyAssignedWorkers.length > 0) {
        const workerIds = alreadyAssignedWorkers.join(', ');
        return NextResponse.json({ 
          ok: false, 
          error: `Workers already assigned: ${workerIds}`,
          errorAr: `العمال مسكّنين بالفعل: ${workerIds}`,
          errorEn: `Workers already assigned: ${workerIds}`
        }, { status: 400 });
      }
      
      // Check nationality rule (all occupants in same room must have same nationality)
      if (currentOccupants.length > 0) {
        const firstOccupant = currentOccupants[0] as any;
        // Get the first occupant's worker from cached workers
        const firstWorker: any = allWorkers.find((w: any) => w.id === firstOccupant.workerId);
        const firstNationality = firstWorker?.nationaliy;
        
        for (const worker of workers) {
          const w = worker as any;
          if (!w) {
            return NextResponse.json({ 
              ok: false, 
              error: `Worker ${w?.id} not found`,
              errorAr: `العامل ${w?.id} غير موجود`,
              errorEn: `Worker ${w?.id} not found`
            }, { status: 404 });
          }
          
          // Check nationality match
          if (firstNationality && w.nationaliy !== firstNationality) {
            return NextResponse.json({ 
              ok: false, 
              error: `Nationality mismatch. Room has ${firstNationality} workers, cannot assign ${w.nationaliy}`,
              errorAr: `تعارض في الجنسية. الغرفة بها عمال من ${firstNationality}، لا يمكن تسكين ${w.nationaliy}`,
              errorEn: `Nationality mismatch. Room has ${firstNationality} workers, cannot assign ${w.nationaliy}`
            }, { status: 400 });
          }
        }
      } else {
        // If no existing occupants, verify all workers to assign have same nationality
        if (workers.length > 1) {
          const firstNationality = (workers[0] as any).nationaliy;
          for (const worker of workers.slice(1)) {
            const w = worker as any;
            if (w.nationaliy !== firstNationality) {
              return NextResponse.json({ 
                ok: false, 
                error: `Cannot assign workers with different nationalities to the same room`,
                errorAr: 'لا يمكن تسكين عمال من جنسيات مختلفة في نفس الغرفة',
                errorEn: 'Cannot assign workers with different nationalities to the same room'
              }, { status: 400 });
            }
          }
        }
      }
      
      // Assign workers to room
      for (const wid of toAssign) {
        const worker = workers.find((w: any) => w.id === wid);
        if (!worker) continue;
        
        await adminDb.collection('occupants').add({
          workerId: wid,
          residenceId,
          roomId,
          since: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        
        assigned.push(wid);
      }
      
      return NextResponse.json({ ok: true, assigned, count: assigned.length });
    } catch (e) {
      console.error('assign route error', e);
      return NextResponse.json({ 
        ok: false, 
        error: String(e),
        errorAr: 'خطأ في معالجة طلب التسكين',
        errorEn: 'Error processing assignment request'
      }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ 
      ok: false, 
      error: (e as any).message || 'error',
      errorAr: 'خطأ غير متوقع',
      errorEn: 'Unexpected error'
    }, { status: 500 });
  }
}
