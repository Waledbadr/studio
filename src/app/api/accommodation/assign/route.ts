import { NextResponse } from "next/server";
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expected body: { workerId | workerIds, residenceId, roomId }
    const { workerId, workerIds, residenceId, roomId } = body || {};
    
    if ((!workerId && !Array.isArray(workerIds)) || !residenceId || !roomId) {
      return NextResponse.json({ ok: false, error: 'missing-params' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Firebase Admin not configured' 
      }, { status: 500 });
    }

    try {
      const toAssign = Array.isArray(workerIds) ? workerIds : [workerId];
      const assigned: any[] = [];
      
      // Get workers collection to verify workers exist (using Admin SDK)
      const workersSnapshot = await adminDb.collection('workers').get();
      const workers = workersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Get existing occupants to check room capacity and nationality rules
      const occupantsSnapshot = await adminDb.collection('occupants').get();
      const existingOccupants = occupantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Get residence data to check room capacity
      const residenceDoc = await adminDb.collection('residences').doc(residenceId).get();
      const residence = residenceDoc.data();
      
      if (!residence) {
        return NextResponse.json({ ok: false, error: 'Residence not found' }, { status: 404 });
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
        return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 });
      }
      
      // Check room capacity
      const currentOccupants = existingOccupants.filter((o: any) => o.roomId === roomId);
      const roomCapacity = roomData.capacity || 0;
      
      if (currentOccupants.length + toAssign.length > roomCapacity) {
        return NextResponse.json({ 
          ok: false, 
          error: `Room capacity exceeded. Current: ${currentOccupants.length}, Capacity: ${roomCapacity}` 
        }, { status: 400 });
      }
      
      // Check nationality rule (all occupants in same room must have same nationality)
      if (currentOccupants.length > 0) {
        const firstOccupant = currentOccupants[0];
        const firstWorker = workers.find((w: any) => w.id === firstOccupant.workerId);
        const firstNationality = firstWorker?.nationaliy;
        
        for (const wid of toAssign) {
          const worker = workers.find((w: any) => w.id === wid);
          if (!worker) {
            return NextResponse.json({ ok: false, error: `Worker ${wid} not found` }, { status: 404 });
          }
          
          // Check if already assigned
          const alreadyAssigned = existingOccupants.find((o: any) => o.workerId === wid);
          if (alreadyAssigned) {
            return NextResponse.json({ 
              ok: false, 
              error: `Worker ${worker.name} is already assigned to a room` 
            }, { status: 400 });
          }
          
          // Check nationality match
          if (firstNationality && worker.nationaliy !== firstNationality) {
            return NextResponse.json({ 
              ok: false, 
              error: `Nationality mismatch. Room has ${firstNationality} workers, cannot assign ${worker.nationaliy}` 
            }, { status: 400 });
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
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
