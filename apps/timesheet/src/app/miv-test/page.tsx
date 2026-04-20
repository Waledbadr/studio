'use client';

import { useState } from 'react';
import { useResidences } from '@/context/residences-context';

export default function MIVTestPage() {
  const { residences } = useResidences();
  const [selectedResidence, setSelectedResidence] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  
  const residence = residences.find(r => r.id === selectedResidence);
  const building = residence?.buildings.find(b => b.id === selectedBuilding);
  const floor = building?.floors.find(f => f.id === selectedFloor);
  const facilities = floor?.facilities || [];
  const facility = facilities.find(f => f.id === selectedFacility);
  const components = facility?.components || [];

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">اختبار MIV - اختيار المكونات</h1>

      {/* Residence Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">اختر المجمع السكني:</label>
        <select 
          value={selectedResidence} 
          onChange={(e) => setSelectedResidence(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- اختر مجمع --</option>
          {residences.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Building Selection */}
      {residence && (
        <div>
          <label className="block text-sm font-medium mb-1">اختر المبنى:</label>
          <select 
            value={selectedBuilding} 
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- اختر مبنى --</option>
            {residence.buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Floor Selection */}
      {building && (
        <div>
          <label className="block text-sm font-medium mb-1">اختر الطابق:</label>
          <select 
            value={selectedFloor} 
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- اختر طابق --</option>
            {building.floors.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Facility Selection */}
      {floor && facilities.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">اختر المرفق:</label>
          <select 
            value={selectedFacility} 
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- اختر مرفق --</option>
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.components?.length || 0} مكونات)</option>
            ))}
          </select>
        </div>
      )}

      {/* Component Selection */}
      {facility && components.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">اختر المكون (اختياري):</label>
          <div className="space-y-2">
            <div className="p-2 border rounded bg-gray-100">
              <label className="flex items-center">
                <input type="radio" name="component" value="" className="mr-2" />
                <span>عمل عام للمرفق</span>
              </label>
            </div>
            {components.map(component => (
              <div key={component.id} className="p-2 border rounded">
                <label className="flex items-center">
                  <input type="radio" name="component" value={component.id} className="mr-2" />
                  <span>
                    {component.type === 'light' ? '💡' : 
                     component.type === 'outlet' ? '🔌' : 
                     component.type === 'switch' ? '⚡' : '⚙️'}
                  </span>
                  <span className="ml-2">{component.name}</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                    component.status === 'working' ? 'bg-green-100 text-green-700' :
                    component.status === 'broken' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {component.status === 'working' ? 'يعمل' :
                     component.status === 'broken' ? 'معطل' : 'يحتاج استبدال'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Information */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">معلومات التشخيص:</h3>
        <div className="text-sm space-y-1">
          <div>المجمعات المتاحة: {residences.length}</div>
          {residence && <div>المباني في {residence.name}: {residence.buildings.length}</div>}
          {building && <div>الطوابق في {building.name}: {building.floors.length}</div>}
          {floor && <div>المرافق في {floor.name}: {facilities.length}</div>}
          {facility && <div>المكونات في {facility.name}: {components.length}</div>}
        </div>
      </div>

      {/* Raw Data */}
      {facility && (
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <h3 className="font-semibold mb-2">البيانات الخام للمرفق:</h3>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify(facility, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
