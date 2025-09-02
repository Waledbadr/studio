"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StorageCheckPage() {
  const [storageData, setStorageData] = useState<string>("");

  const checkStorage = () => {
    try {
      const residencesData = localStorage.getItem('residences');
      if (residencesData) {
        const data = JSON.parse(residencesData);
        console.log('Residences data:', data);
        
        // إيجاد الكومبوننتات في البيانات
        let componentsFound = 0;
        const checkComponents = (obj: any) => {
          if (obj && typeof obj === 'object') {
            if (obj.facilityComponents && Array.isArray(obj.facilityComponents)) {
              componentsFound += obj.facilityComponents.length;
              console.log('Found components in facility:', obj.name || obj.id, obj.facilityComponents);
            }
            Object.values(obj).forEach(value => checkComponents(value));
          }
        };
        
        checkComponents(data);
        
        setStorageData(`
البيانات في localStorage:
${JSON.stringify(data, null, 2)}

إجمالي الكومبوننتات الموجودة: ${componentsFound}
        `);
      } else {
        setStorageData("لا توجد بيانات في localStorage");
      }
    } catch (error) {
      setStorageData(`خطأ في قراءة البيانات: ${error}`);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('residences');
    setStorageData("تم مسح البيانات");
  };

  useEffect(() => {
    checkStorage();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">فحص البيانات المحفوظة</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button onClick={checkStorage}>
            إعادة فحص البيانات
          </Button>
          <Button onClick={clearStorage} variant="destructive">
            مسح البيانات
          </Button>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">نتائج الفحص:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {storageData}
          </pre>
        </div>
      </div>
    </div>
  );
}
