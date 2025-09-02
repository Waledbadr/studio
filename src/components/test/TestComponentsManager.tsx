'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResidences } from '@/context/residences-context';
import { useToast } from '@/hooks/use-toast';

export function TestComponentsManager() {
  const { residences, addFacilityComponent, addFacility } = useResidences();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const addTestCorridor = async () => {
    if (residences.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد مجمعات سكنية في النظام",
        variant: "destructive"
      });
      return;
    }

    const firstComplex = residences[0];
    if (firstComplex.buildings.length === 0) {
      toast({
        title: "خطأ", 
        description: "لا توجد مباني في المجمع السكني",
        variant: "destructive"
      });
      return;
    }

    const firstBuilding = firstComplex.buildings[0];
    if (firstBuilding.floors.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد طوابق في المبنى",
        variant: "destructive"
      });
      return;
    }

    const firstFloor = firstBuilding.floors[0];
    
    try {
      setLoading(true);
      await addFacility(
        firstComplex.id,
        'floor',
        'ممر تجريبي',
        'corridor',
        1,
        firstBuilding.id,
        firstFloor.id
      );
      
      toast({
        title: "تم بنجاح!",
        description: "تم إضافة ممر تجريبي"
      });
    } catch (error) {
      console.error('Error adding test corridor:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الممر التجريبي",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSampleComponentsToCorridor = async (
    complexId: string,
    buildingId: string,
    floorId: string,
    facilityId: string,
    facilityName: string
  ) => {
    setLoading(true);
    
    const sampleComponents = [
      { name: "لمبة 1", type: "light" as const, status: "working" as const },
      { name: "لمبة 2", type: "light" as const, status: "working" as const },
      { name: "لمبة 3", type: "light" as const, status: "needs_replacement" as const },
      { name: "لمبة 4", type: "light" as const, status: "working" as const },
      { name: "لمبة 5", type: "light" as const, status: "broken" as const },
      { name: "فيش كهرباء 1", type: "outlet" as const, status: "working" as const },
      { name: "فيش كهرباء 2", type: "outlet" as const, status: "working" as const },
      { name: "مفتاح إضاءة", type: "switch" as const, status: "working" as const }
    ];

    try {
      console.log('Adding components to corridor:', {
        complexId,
        buildingId, 
        floorId,
        facilityId,
        facilityName
      });
      
      for (const component of sampleComponents) {
        console.log('Adding component:', component);
        await addFacilityComponent(
          complexId,
          facilityId,
          "floor",
          component,
          buildingId,
          floorId
        );
      }
      
      toast({
        title: "تم بنجاح!",
        description: `تم إضافة ${sampleComponents.length} مكونات للممر "${facilityName}"`
      });
    } catch (error) {
      console.error('Error adding components:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المكونات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Find corridors in all residences
  const corridors = residences.flatMap(complex =>
    complex.buildings.flatMap(building =>
      building.floors.flatMap(floor =>
        (floor.facilities || [])
          .filter(facility => 
            facility.type.toLowerCase().includes('corridor') || 
            facility.name.toLowerCase().includes('ممر')
          )
          .map(facility => ({
            complexId: complex.id,
            complexName: complex.name,
            buildingId: building.id,
            buildingName: building.name,
            floorId: floor.id,
            floorName: floor.name,
            facilityId: facility.id,
            facilityName: facility.name,
            hasComponents: !!(facility.components && facility.components.length > 0),
            componentCount: facility.components?.length || 0
          }))
      )
    )
  );

  if (corridors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>اختبار النظام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            لم يتم العثور على ممرات في النظام. تأكد من وجود تجهيزات من نوع "corridor" أو تحتوي على كلمة "ممر".
          </p>
          {residences.length > 0 && residences[0].buildings.length > 0 && residences[0].buildings[0].floors.length > 0 && (
            <div className="pt-2">
              <Button 
                onClick={addTestCorridor}
                disabled={loading}
                className="w-full"
              >
                إضافة ممر تجريبي للاختبار
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 اختبار نظام مكونات المرافق</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          اضغط على الزر لإضافة مكونات تجريبية (لمبات وأفياش) للممرات الموجودة
        </p>
        
        <div className="space-y-2">
          {corridors.map(corridor => (
            <div key={`${corridor.complexId}-${corridor.buildingId}-${corridor.floorId}-${corridor.facilityId}`} 
                 className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <div className="font-medium">{corridor.facilityName}</div>
                <div className="text-xs text-muted-foreground">
                  {corridor.complexName} → {corridor.buildingName} → {corridor.floorName}
                </div>
                {corridor.hasComponents && (
                  <div className="text-xs text-green-600 mt-1">
                    ✅ يحتوي على {corridor.componentCount} مكونات
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                variant={corridor.hasComponents ? "secondary" : "default"}
                disabled={loading}
                onClick={() => addSampleComponentsToCorridor(
                  corridor.complexId,
                  corridor.buildingId,
                  corridor.floorId,
                  corridor.facilityId,
                  corridor.facilityName
                )}
              >
                {corridor.hasComponents ? "إضافة المزيد" : "إضافة مكونات"}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <strong>ملاحظة:</strong> بعد إضافة المكونات، اذهب إلى صفحة MIV واختر "تجهيزات" ثم اختر الممر لترى المكونات المضافة.
        </div>
      </CardContent>
    </Card>
  );
}
