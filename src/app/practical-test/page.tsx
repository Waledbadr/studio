'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResidences } from '@/context/residences-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function PracticalTestPage() {
  const { residences, addComplex, addBuilding, addFloor, addFacility, addFacilityComponent } = useResidences();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const setupCompleteExample = async () => {
    setLoading(true);
    try {
      // Step 1: Add residence
      toast({ title: "الخطوة 1", description: "إضافة مجمع سكني..." });
      await addComplex("أم السلام", "الرياض", "manager1");
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the new complex
      const newComplex = residences.find(r => r.name === "أم السلام") || residences[residences.length - 1];
      if (!newComplex) throw new Error("Failed to create complex");
      
      // Step 2: Add building
      toast({ title: "الخطوة 2", description: "إضافة مبنى B1..." });
      await addBuilding(newComplex.id, "B1");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the new building
      const updatedComplex = residences.find(r => r.id === newComplex.id);
      const newBuilding = updatedComplex?.buildings.find(b => b.name === "B1") || updatedComplex?.buildings[0];
      if (!newBuilding) throw new Error("Failed to create building");
      
      // Step 3: Add floor
      toast({ title: "الخطوة 3", description: "إضافة الطابق الأول..." });
      await addFloor(newComplex.id, newBuilding.id, "الطابق الأول");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the new floor
      const finalComplex = residences.find(r => r.id === newComplex.id);
      const finalBuilding = finalComplex?.buildings.find(b => b.id === newBuilding.id);
      const newFloor = finalBuilding?.floors.find(f => f.name === "الطابق الأول") || finalBuilding?.floors[0];
      if (!newFloor) throw new Error("Failed to create floor");
      
      // Step 4: Add corridor
      toast({ title: "الخطوة 4", description: "إضافة ممر 1..." });
      await addFacility(newComplex.id, 'floor', 'ممر 1', 'corridor', 1, newBuilding.id, newFloor.id);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the new corridor
      const latestComplex = residences.find(r => r.id === newComplex.id);
      const latestBuilding = latestComplex?.buildings.find(b => b.id === newBuilding.id);
      const latestFloor = latestBuilding?.floors.find(f => f.id === newFloor.id);
      const corridor = latestFloor?.facilities?.find(f => f.name === 'ممر 1') || latestFloor?.facilities?.[0];
      if (!corridor) throw new Error("Failed to create corridor");
      
      // Step 5: Add components
      toast({ title: "الخطوة 5", description: "إضافة مكونات الإضاءة والكهرباء..." });
      
      const components = [
        { name: "لمبة 1", type: "light" as const, status: "working" as const },
        { name: "لمبة 2", type: "light" as const, status: "working" as const },
        { name: "لمبة 3", type: "light" as const, status: "needs_replacement" as const },
        { name: "لمبة 4", type: "light" as const, status: "working" as const },
        { name: "لمبة 5", type: "light" as const, status: "broken" as const },
        { name: "فيش كهرباء 1", type: "outlet" as const, status: "working" as const },
        { name: "فيش كهرباء 2", type: "outlet" as const, status: "working" as const },
        { name: "مفتاح إضاءة", type: "switch" as const, status: "working" as const }
      ];
      
      for (const component of components) {
        await addFacilityComponent(
          newComplex.id,
          corridor.id,
          'floor',
          component,
          newBuilding.id,
          newFloor.id
        );
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast({ 
        title: "مكتمل! 🎉", 
        description: "تم إنشاء المثال الكامل بنجاح. اذهب إلى صفحة السكنات أو MIV لرؤية النتيجة"
      });
      
    } catch (error) {
      const e: any = error;
      console.error('Setup error:', e);
      toast({
        title: "خطأ",
        description: `فشل في الإعداد: ${e?.message || String(e)}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const findExampleData = () => {
    const complexWithCorridor = residences.find(complex => 
      complex.buildings.some(building => 
        building.floors.some(floor => 
          floor.facilities?.some(facility => 
            facility.type.toLowerCase().includes('corridor') || 
            facility.name.toLowerCase().includes('ممر')
          )
        )
      )
    );

    if (complexWithCorridor) {
      const buildingWithCorridor = complexWithCorridor.buildings.find(building => 
        building.floors.some(floor => 
          floor.facilities?.some(facility => 
            facility.type.toLowerCase().includes('corridor') || 
            facility.name.toLowerCase().includes('ممر')
          )
        )
      );

      const floorWithCorridor = buildingWithCorridor?.floors.find(floor => 
        floor.facilities?.some(facility => 
          facility.type.toLowerCase().includes('corridor') || 
          facility.name.toLowerCase().includes('ممر')
        )
      );

      const corridor = floorWithCorridor?.facilities?.find(facility => 
        facility.type.toLowerCase().includes('corridor') || 
        facility.name.toLowerCase().includes('ممر')
      );

      return {
        complex: complexWithCorridor,
        building: buildingWithCorridor,
        floor: floorWithCorridor,
        corridor: corridor
      };
    }

    return null;
  };

  const exampleData = findExampleData();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🏗️ اختبار النظام العملي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">الهدف:</h3>
            <p className="text-sm text-muted-foreground">
              إنشاء مثال كامل: مجمع "أم السلام" → مبنى "B1" → "الطابق الأول" → "ممر 1" → مكونات الإضاءة
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>المجمعات الحالية:</strong> {residences.length}
            </div>
            <div>
              <strong>الممرات الموجودة:</strong> {exampleData ? '✅' : '❌'}
            </div>
          </div>

          {exampleData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-800 mb-2">📍 بيانات موجودة:</h4>
              <div className="text-sm text-green-700 space-y-1">
                <div><strong>المجمع:</strong> {exampleData.complex.name}</div>
                <div><strong>المبنى:</strong> {exampleData.building?.name}</div>
                <div><strong>الطابق:</strong> {exampleData.floor?.name}</div>
                <div><strong>الممر:</strong> {exampleData.corridor?.name}</div>
                <div>
                  <strong>المكونات:</strong> 
                  {exampleData.corridor?.components?.length ? (
                    <Badge variant="secondary" className="ml-2">
                      {exampleData.corridor.components.length} مكونات
                    </Badge>
                  ) : (
                    <span className="text-yellow-600 ml-2">لا توجد مكونات</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={setupCompleteExample}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'جاري الإنشاء...' : '🚀 إنشاء المثال الكامل'}
          </Button>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>خطوات الاختبار بعد النقر:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>انتظر انتهاء الإنشاء</li>
              <li>اذهب إلى <strong>صفحة السكنات</strong> وابحث عن "أم السلام"</li>
              <li>افتح المبنى B1 → الطابق الأول → ممر 1</li>
              <li>ستجد 8 مكونات (5 لمبات + 2 فيش + مفتاح)</li>
              <li>اذهب إلى <strong>صفحة MIV</strong> واختر السكن والتجهيزات</li>
              <li>اختر "ممر 1" ثم اختر مكون محدد مثل "لمبة 5"</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {exampleData && exampleData.corridor?.components && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 معاينة المكونات الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {exampleData.corridor.components.map(component => (
                <div key={component.id} className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                  <span>
                    {component.type === 'light' && '💡'}
                    {component.type === 'outlet' && '🔌'}
                    {component.type === 'switch' && '⚡'}
                  </span>
                  <span>{component.name}</span>
                  <Badge variant={
                    component.status === 'working' ? 'default' :
                    component.status === 'broken' ? 'destructive' : 'secondary'
                  }>
                    {component.status === 'working' && 'يعمل'}
                    {component.status === 'broken' && 'معطل'}
                    {component.status === 'needs_replacement' && 'يحتاج استبدال'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
