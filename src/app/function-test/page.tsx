'use client';

import { Button } from '@/components/ui/button';
import { useResidences } from '@/context/residences-context';
import { useState } from 'react';

export default function FunctionTestPage() {
  const context = useResidences();
  const [result, setResult] = useState('');

  const testFunction = async (functionName: string) => {
    try {
      setResult(`Testing ${functionName}...`);
      
      if (functionName === 'addComplex') {
        await context.addComplex('Test Complex', 'Test City', 'manager1');
        setResult('addComplex: Success');
      } else if (functionName === 'addFacilityComponent') {
        // Test the function
        if (context.residences.length === 0) {
          setResult('addFacilityComponent: No residences found');
          return;
        }
        
        const complex = context.residences[0];
        if (complex.buildings.length === 0) {
          setResult('addFacilityComponent: No buildings found');
          return;
        }
        
        const building = complex.buildings[0];
        if (building.floors.length === 0) {
          setResult('addFacilityComponent: No floors found');
          return;
        }
        
        const floor = building.floors[0];
        if (!floor.facilities || floor.facilities.length === 0) {
          setResult('addFacilityComponent: No facilities found');
          return;
        }
        
        const facility = floor.facilities[0];
        
        await context.addFacilityComponent(
          complex.id,
          facility.id,
          'floor',
          {
            name: 'Test Component',
            type: 'light',
            status: 'working'
          },
          building.id,
          floor.id
        );
        
        setResult('addFacilityComponent: Success');
      }
    } catch (error) {
      const e: any = error;
      setResult(`${functionName}: Error - ${e?.message || String(e)}`);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">اختبار دوال Context</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">الدوال المتاحة:</h2>
        <ul className="list-disc list-inside text-sm">
          {Object.keys(context as any).map(key => (
            <li key={key}>{key}: {typeof (context as any)[key]}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <Button onClick={() => testFunction('addComplex')}>
          اختبار addComplex
        </Button>
        
        <Button onClick={() => testFunction('addFacilityComponent')}>
          اختبار addFacilityComponent
        </Button>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">النتيجة:</h3>
        <p>{result}</p>
      </div>

      <div className="p-4 bg-blue-100 rounded">
        <h3 className="font-semibold">البيانات الحالية:</h3>
        <p>عدد المجمعات: {context.residences.length}</p>
        <p>حالة التحميل: {context.loading ? 'جاري التحميل' : 'مكتمل'}</p>
      </div>
    </div>
  );
}
