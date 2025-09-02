'use client';

import { Button } from '@/components/ui/button';

export default function SimpleTestPage() {
  const addTestData = () => {
    // إضافة بيانات اختبار مباشرة في localStorage
    const testData = [
      {
        id: "test-complex-1",
        name: "أم السلام",
        city: "الرياض",
        managerId: "manager1",
        buildings: [
          {
            id: "test-building-1",
            name: "B1",
            floors: [
              {
                id: "test-floor-1",
                name: "الطابق الأول",
                rooms: [
                  {
                    id: "test-room-1",
                    name: "غرفة 101"
                  }
                ],
                facilities: [
                  {
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
                  }
                ]
              }
            ],
            facilities: []
          }
        ],
        facilities: []
      }
    ];

    try {
      localStorage.setItem('estatecare_residences', JSON.stringify(testData));
      alert('تم إضافة البيانات التجريبية! قم بإعادة تحميل الصفحة.');
      window.location.reload();
    } catch (error) {
      alert('خطأ في إضافة البيانات: ' + error);
    }
  };

  const clearData = () => {
    try {
      localStorage.removeItem('estatecare_residences');
      alert('تم مسح البيانات! قم بإعادة تحميل الصفحة.');
      window.location.reload();
    } catch (error) {
      alert('خطأ في مسح البيانات: ' + error);
    }
  };

  const checkLocalStorage = () => {
    const data = localStorage.getItem('estatecare_residences');
    if (data) {
      console.log('بيانات localStorage:', JSON.parse(data));
      alert('راجع وحدة التحكم (Console) لرؤية البيانات');
    } else {
      alert('لا توجد بيانات في localStorage');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">اختبار بسيط ومباشر</h1>
      
      <div className="space-y-2">
        <Button onClick={addTestData} className="w-full">
          إضافة بيانات تجريبية مباشرة
        </Button>
        
        <Button onClick={checkLocalStorage} variant="outline" className="w-full">
          فحص البيانات الموجودة
        </Button>
        
        <Button onClick={clearData} variant="destructive" className="w-full">
          مسح جميع البيانات
        </Button>
      </div>

      <div className="text-sm text-gray-600">
        <p>هذه الصفحة تتعامل مباشرة مع localStorage بدون استخدام Context</p>
        <p>بعد إضافة البيانات، اذهب إلى صفحة التشخيص أو صفحة السكنات لرؤية النتيجة</p>
      </div>
    </div>
  );
}
