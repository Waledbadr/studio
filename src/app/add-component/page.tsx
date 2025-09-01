'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResidences } from '@/context/residences-context';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddComponentPage() {
  const { residences, addFacilityComponent } = useResidences();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedComplex, setSelectedComplex] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [componentName, setComponentName] = useState('');
  const [componentType, setComponentType] = useState('light');
  const [componentStatus, setComponentStatus] = useState('working');

  // Get related data
  const complex = residences.find(r => r.id === selectedComplex);
  const building = complex?.buildings.find(b => b.id === selectedBuilding);
  const floor = building?.floors.find(f => f.id === selectedFloor);
  const facilities = floor?.facilities || [];
  const facility = facilities.find(f => f.id === selectedFacility);

  const addComponent = async () => {
    if (!selectedComplex || !selectedBuilding || !selectedFloor || !selectedFacility || !componentName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addFacilityComponent(
        selectedComplex,
        selectedFacility,
        'floor',
        {
          name: componentName.trim(),
          type: componentType as any,
          status: componentStatus as any
        },
        selectedBuilding,
        selectedFloor
      );

      toast({
        title: "تم!",
        description: `تم إضافة ${componentName} بنجاح`
      });

      // Reset form
      setComponentName('');
    } catch (error) {
      console.error('Error adding component:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المكون",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSampleComponents = async () => {
    if (!selectedComplex || !selectedBuilding || !selectedFloor || !selectedFacility) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المرفق أولاً",
        variant: "destructive"
      });
      return;
    }

    const samples = [
      { name: "لمبة 1", type: "light", status: "working" },
      { name: "لمبة 2", type: "light", status: "working" },
      { name: "لمبة 3", type: "light", status: "needs_replacement" },
      { name: "لمبة 4", type: "light", status: "working" },
      { name: "لمبة 5", type: "light", status: "broken" },
      { name: "فيش كهرباء 1", type: "outlet", status: "working" },
      { name: "فيش كهرباء 2", type: "outlet", status: "working" },
      { name: "مفتاح إضاءة", type: "switch", status: "working" }
    ];

    setLoading(true);
    try {
      for (const sample of samples) {
        await addFacilityComponent(
          selectedComplex,
          selectedFacility,
          'floor',
          sample as any,
          selectedBuilding,
          selectedFloor
        );
      }

      toast({
        title: "تم!",
        description: `تم إضافة ${samples.length} مكونات تجريبية`
      });
    } catch (error) {
      console.error('Error adding sample components:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المكونات التجريبية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>➕ إضافة مكونات للمرافق</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Complex Selection */}
          <div>
            <Label htmlFor="complex">المجمع السكني</Label>
            <Select value={selectedComplex} onValueChange={setSelectedComplex}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المجمع" />
              </SelectTrigger>
              <SelectContent>
                {residences.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Building Selection */}
          {complex && (
            <div>
              <Label htmlFor="building">المبنى</Label>
              <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المبنى" />
                </SelectTrigger>
                <SelectContent>
                  {complex.buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Floor Selection */}
          {building && (
            <div>
              <Label htmlFor="floor">الطابق</Label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطابق" />
                </SelectTrigger>
                <SelectContent>
                  {building.floors.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Facility Selection */}
          {floor && facilities.length > 0 && (
            <div>
              <Label htmlFor="facility">المرفق</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرفق" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.components?.length || 0} مكونات)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Add Sample Components */}
          {facility && (
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium mb-2">إضافة سريعة:</h3>
              <Button 
                onClick={addSampleComponents}
                disabled={loading}
                className="w-full"
              >
                ⚡ إضافة 8 مكونات تجريبية (لمبات وأفياش)
              </Button>
            </div>
          )}

          {/* Manual Component Addition */}
          {facility && (
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-4">إضافة مكون فردي:</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="componentName">اسم المكون</Label>
                  <Input
                    id="componentName"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    placeholder="مثل: لمبة 6"
                  />
                </div>

                <div>
                  <Label htmlFor="componentType">نوع المكون</Label>
                  <Select value={componentType} onValueChange={setComponentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">💡 لمبة</SelectItem>
                      <SelectItem value="outlet">🔌 فيش كهرباء</SelectItem>
                      <SelectItem value="switch">⚡ مفتاح</SelectItem>
                      <SelectItem value="fan">🌀 مروحة</SelectItem>
                      <SelectItem value="sensor">📡 مستشعر</SelectItem>
                      <SelectItem value="other">⚙️ أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="componentStatus">حالة المكون</Label>
                  <Select value={componentStatus} onValueChange={setComponentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">✅ يعمل</SelectItem>
                      <SelectItem value="broken">❌ معطل</SelectItem>
                      <SelectItem value="needs_replacement">⚠️ يحتاج استبدال</SelectItem>
                      <SelectItem value="maintenance">🔧 صيانة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={addComponent}
                    disabled={loading || !componentName.trim()}
                    className="w-full"
                  >
                    ➕ إضافة المكون
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Current Components Display */}
          {facility && facility.components && facility.components.length > 0 && (
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="font-medium mb-2">المكونات الحالية في {facility.name}:</h3>
              <div className="grid grid-cols-2 gap-2">
                {facility.components.map(comp => (
                  <div key={comp.id} className="flex items-center gap-2 p-2 bg-white rounded text-sm">
                    <span>
                      {comp.type === 'light' ? '💡' :
                       comp.type === 'outlet' ? '🔌' :
                       comp.type === 'switch' ? '⚡' :
                       comp.type === 'fan' ? '🌀' : '⚙️'}
                    </span>
                    <span>{comp.name}</span>
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      comp.status === 'working' ? 'bg-green-100 text-green-700' :
                      comp.status === 'broken' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {comp.status === 'working' ? 'يعمل' :
                       comp.status === 'broken' ? 'معطل' : 
                       comp.status === 'needs_replacement' ? 'يحتاج استبدال' : 'صيانة'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📝 تعليمات</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>اختر المجمع السكني → المبنى → الطابق → المرفق</li>
            <li>استخدم "إضافة 8 مكونات تجريبية" للحصول على بيانات سريعة</li>
            <li>أو أضف مكونات فردية بأسماء مخصصة</li>
            <li>بعد الإضافة، اذهب إلى صفحة السكنات أو MIV لرؤية النتيجة</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
