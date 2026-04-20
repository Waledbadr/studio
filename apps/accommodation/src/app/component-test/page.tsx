'use client';

import React from 'react';

// Simple component icons
const componentIcons: { [key: string]: string } = {
  'light': '💡',
  'outlet': '🔌', 
  'switch': '⚡',
  'fan': '🌀',
  'sensor': '📡',
  'other': '⚙️'
};

const testFacility = {
  id: "test-facility-1",
  name: "ممر 1",
  type: "corridor",
  components: [
    {
      id: "comp-1",
      name: "لمبة 1",
      type: "light",
      status: "working"
    },
    {
      id: "comp-2",
      name: "لمبة 2",
      type: "light",
      status: "working"
    },
    {
      id: "comp-3",
      name: "لمبة 3",
      type: "light",
      status: "needs_replacement"
    },
    {
      id: "comp-4",
      name: "لمبة 4",
      type: "light",
      status: "working"
    },
    {
      id: "comp-5",
      name: "لمبة 5",
      type: "light",
      status: "broken"
    },
    {
      id: "comp-6",
      name: "فيش كهرباء 1",
      type: "outlet",
      status: "working"
    },
    {
      id: "comp-7",
      name: "فيش كهرباء 2",
      type: "outlet",
      status: "working"
    },
    {
      id: "comp-8",
      name: "مفتاح إضاءة",
      type: "switch",
      status: "working"
    }
  ]
};

export default function ComponentTestPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">اختبار عرض المكونات</h1>
      
      <div className="border p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-4">مرفق تجريبي: {testFacility.name}</h2>
        
        {/* عرض معلومات المرفق */}
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="flex items-center justify-between">
            <span className="font-medium">{testFacility.name}</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {testFacility.components?.length || 0} مكونات
            </span>
          </div>
        </div>

        {/* عرض المكونات */}
        {testFacility.components && testFacility.components.length > 0 && (
          <div className="ml-4 pl-3 border-l-2 border-muted">
            <h3 className="text-sm font-medium mb-2">المكونات:</h3>
            <div className="grid grid-cols-3 gap-1 text-xs">
              {testFacility.components.map(component => (
                <div 
                  key={component.id}
                  className="flex items-center gap-1 p-1 bg-muted/50 rounded text-xs"
                  title={`${component.name} - ${component.status || 'working'}`}
                >
                  <span>{componentIcons[component.type] || '⚙️'}</span>
                  <span className="truncate">{component.name}</span>
                  {component.status === 'broken' && <span className="text-red-500">❌</span>}
                  {component.status === 'needs_replacement' && <span className="text-yellow-500">⚠️</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p>هذا اختبار مباشر لعرض المكونات بنفس الكود المستخدم في صفحة السكنات</p>
        <p>إذا كانت المكونات تظهر هنا ولا تظهر في صفحة السكنات، فالمشكلة في البيانات أو الحالة</p>
      </div>

      <div className="p-4 bg-blue-100 rounded">
        <h3 className="font-semibold mb-2">نصائح التشخيص:</h3>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>تأكد من وجود بيانات في localStorage باستخدام صفحة simple-test</li>
          <li>تحقق من صفحة diagnostic لرؤية البيانات الكاملة</li>
          <li>تأكد من أن المرافق تحتوي على مكونات</li>
          <li>تحقق من أن showFacilities = true في صفحة السكنات</li>
        </ol>
      </div>
    </div>
  );
}
