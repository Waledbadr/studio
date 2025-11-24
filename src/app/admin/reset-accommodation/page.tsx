"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ResetAccommodationPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const { toast } = useToast();

  const handleReset = async () => {
    if (!confirm("⚠️ تحذير: هل أنت متأكد من حذف جميع بيانات التسكين؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    setLoading(true);
    setProgress("جاري البدء...");

    try {
      // 1. Delete occupants
      setProgress("جاري حذف الساكنين (Occupants)...");
      await deleteCollection('occupants');

      // 2. Delete history
      setProgress("جاري حذف السجل التاريخي (History)...");
      await deleteCollection('accommodationHistory');

      // 3. Reset residences
      setProgress("جاري تصفير الغرف في المجمعات (Residences)...");
      await resetResidences();

      setProgress("تمت العملية بنجاح! ✅");
      toast({
        title: "تمت العملية بنجاح",
        description: "تم حذف جميع بيانات التسكين وتفريغ الغرف.",
        variant: "default",
      });

    } catch (error: any) {
      console.error("Error resetting data:", error);
      setProgress(`حدث خطأ: ${error.message}`);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionName: string) => {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) return;

    const batchSize = 400; // Firestore limit is 500
    let batch = writeBatch(db);
    let count = 0;
    let totalDeleted = 0;

    for (const docSnapshot of snapshot.docs) {
      batch.delete(docSnapshot.ref);
      count++;

      if (count >= batchSize) {
        await batch.commit();
        totalDeleted += count;
        batch = writeBatch(db);
        count = 0;
        setProgress(`تم حذف ${totalDeleted} مستند من ${collectionName}...`);
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  };

  const resetResidences = async () => {
    const residencesRef = collection(db, 'residences');
    const snapshot = await getDocs(residencesRef);

    if (snapshot.empty) return;

    let updatedCount = 0;

    for (const docSnapshot of snapshot.docs) {
      const residence = docSnapshot.data();
      let hasChanges = false;

      // Helper to reset rooms
      const resetRooms = (rooms: any[]) => {
        if (!rooms) return rooms;
        return rooms.map(room => {
          if (room.occupied || (room.occupants && room.occupants.length > 0)) {
            hasChanges = true;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { occupied, occupants, ...rest } = room;
            return { ...rest, occupied: false, occupants: [] };
          }
          return room;
        });
      };

      // Helper to reset floors
      const resetFloors = (floors: any[]) => {
        if (!floors) return floors;
        return floors.map(floor => ({
          ...floor,
          rooms: resetRooms(floor.rooms)
        }));
      };

      // Helper to reset buildings
      const resetBuildings = (buildings: any[]) => {
        if (!buildings) return buildings;
        return buildings.map(building => ({
          ...building,
          floors: resetFloors(building.floors)
        }));
      };

      let updatedBuildings = residence.buildings;
      let updatedRooms = residence.rooms;

      if (residence.buildings) {
        updatedBuildings = resetBuildings(residence.buildings);
      }
      
      if (residence.rooms) {
        updatedRooms = resetRooms(residence.rooms);
      }

      if (hasChanges) {
        const updatePayload: any = {};
        if (updatedBuildings) updatePayload.buildings = updatedBuildings;
        if (updatedRooms) updatePayload.rooms = updatedRooms;
        
        await updateDoc(docSnapshot.ref, updatePayload);
        updatedCount++;
      }
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            إعادة تعيين بيانات التسكين
          </CardTitle>
          <CardDescription>
            هذه الأداة ستقوم بحذف جميع بيانات التسكين (Occupants)، السجل التاريخي (History)، وتفريغ جميع الغرف في المجمعات السكنية.
            <br />
            <strong>⚠️ هذا الإجراء لا يمكن التراجع عنه!</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md text-sm font-mono">
            الخطوات التي سيتم تنفيذها:
            <ul className="list-disc list-inside mt-2">
              <li>حذف جميع المستندات في مجموعة <code>occupants</code></li>
              <li>حذف جميع المستندات في مجموعة <code>accommodationHistory</code></li>
              <li>تحديث جميع مستندات <code>residences</code> لإزالة حالة الإشغال من الغرف</li>
            </ul>
          </div>

          {progress && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {progress}
            </div>
          )}

          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? "جاري التنفيذ..." : "حذف جميع البيانات وتفريغ الغرف"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
