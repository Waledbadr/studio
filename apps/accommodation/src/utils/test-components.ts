// Test helper to add sample components to facilities
// يمكن استخدام هذا لإضافة مكونات تجريبية للاختبار

export const addSampleComponents = async () => {
  // هذا مثال على كيفية إضافة مكونات لممر موجود
  // استبدل القيم بالقيم الفعلية من قاعدة البيانات
  
  const sampleComponents = [
    {
      name: "لمبة 1",
      type: "light" as const,
      status: "working" as const
    },
    {
      name: "لمبة 2", 
      type: "light" as const,
      status: "needs_replacement" as const
    },
    {
      name: "لمبة 3",
      type: "light" as const,
      status: "broken" as const
    },
    {
      name: "فيش كهرباء 1",
      type: "outlet" as const,
      status: "working" as const
    },
    {
      name: "فيش كهرباء 2",
      type: "outlet" as const,
      status: "working" as const
    },
    {
      name: "مفتاح إضاءة",
      type: "switch" as const,
      status: "working" as const
    }
  ];

  // للاستخدام في الكود:
  // const { addFacilityComponent } = useResidences();
  // 
  // sampleComponents.forEach(component => {
  //   addFacilityComponent(
  //     "complexId",     // معرف السكن
  //     "facilityId",    // معرف الممر/التجهيزة
  //     "floor",         // المستوى (complex/building/floor)
  //     component,       // بيانات المكون
  //     "buildingId",    // معرف المبنى (إذا كان المستوى building أو floor)
  //     "floorId"        // معرف الطابق (إذا كان المستوى floor)
  //   );
  // });

  console.log("Sample components:", sampleComponents);
  return sampleComponents;
};

// مثال لإضافة مكونات لممر محدد
export const addComponentsToSpecificCorridor = (
  complexId: string,
  buildingId: string, 
  floorId: string,
  facilityId: string,
  addFacilityComponent: any
) => {
  const components = [
    { name: "لمبة 1", type: "light", status: "working" },
    { name: "لمبة 2", type: "light", status: "working" },  
    { name: "لمبة 3", type: "light", status: "needs_replacement" },
    { name: "لمبة 4", type: "light", status: "working" },
    { name: "لمبة 5", type: "light", status: "broken" },
    { name: "فيش 1", type: "outlet", status: "working" },
    { name: "فيش 2", type: "outlet", status: "working" },
    { name: "مفتاح", type: "switch", status: "working" }
  ];

  components.forEach(component => {
    addFacilityComponent(
      complexId,
      facilityId,
      "floor",
      component,
      buildingId,
      floorId
    );
  });
};
