'use client';

import { useResidences } from '@/context/residences-context';

export default function DiagnosticPage() {
  const { residences, loading } = useResidences();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">تشخيص البيانات</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">عدد المجمعات: {residences.length}</h2>
        </div>

        {residences.map((complex, index) => (
          <div key={complex.id} className="border p-4 rounded">
            <h3 className="font-semibold">مجمع {index + 1}: {complex.name}</h3>
            <p>عدد المباني: {complex.buildings.length}</p>
            
            {complex.buildings.map((building, bIndex) => (
              <div key={building.id} className="ml-4 mt-2 border-l-2 pl-2">
                <h4 className="font-medium">مبنى {bIndex + 1}: {building.name}</h4>
                <p>عدد الطوابق: {building.floors.length}</p>
                
                {building.floors.map((floor, fIndex) => (
                  <div key={floor.id} className="ml-4 mt-2 border-l-2 pl-2">
                    <h5 className="font-medium">طابق {fIndex + 1}: {floor.name}</h5>
                    <p>عدد الغرف: {floor.rooms.length}</p>
                    <p>عدد المرافق: {floor.facilities?.length || 0}</p>
                    
                    {floor.facilities?.map((facility, facilityIndex) => (
                      <div key={facility.id} className="ml-4 mt-2 bg-gray-100 p-2 rounded">
                        <h6 className="font-medium">مرفق {facilityIndex + 1}: {facility.name}</h6>
                        <p>النوع: {facility.type}</p>
                        <p>عدد المكونات: {facility.components?.length || 0}</p>
                        
                        {facility.components?.map((component, cIndex) => (
                          <div key={component.id} className="ml-4 mt-1 bg-white p-1 rounded text-sm">
                            مكون {cIndex + 1}: {component.name} ({component.type}) - {component.status || 'لا توجد حالة'}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">البيانات الخام:</h3>
          <pre className="text-xs overflow-auto max-h-64">
            {JSON.stringify(residences, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
