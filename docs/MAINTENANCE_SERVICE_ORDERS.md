# Service Orders (إرسال قطع للصيانة/الورشة)

هدف هذا المقترح هو تنظيم عملية إرسال قطع مثل المكيفات، المراتب، أو السيارات إلى قسم الصيانة أو الورش الخارجية، مع ربط الحركة بمخزون السكن بشكل واضح وقابل للتقارير.

## لماذا Service Order؟
- عند «خروج» القطعة من السكن للصيانة يجب أن ينقص المخزون فورًا.
- عند «العودة من الصيانة» يجب أن تضاف الكمية للمخزون.
- في حال «إتلاف» جزء من الكمية لدى الورشة، يُسجل ذلك بشكل نظامي ويُخصم من المخزون مع سبب واضح (Scrap/Depreciation/Disposal).
- نوثق كامل الرحلة: من أرسل؟ إلى أين؟ متى خرجت؟ ماذا عاد؟ ماذا أُتلف؟

## المفهوم العام
سنضيف كيان جديد يسمى ServiceOrder يمثل أمر إرسال إلى الصيانة/الورشة. يحتوي على مراحل أساسية:
1) إنشاء الطلب (Draft)
2) الإرسال الفعلي (Dispatch) → يسجل حركات OUT من مخزون السكن
3) الاستلام الجزئي/الكامل (Receive) → يسجل حركات IN للمرتجع وعمليات Depreciation لما تم إتلافه
4) إغلاق الطلب (Complete/Cancelled)

هذا يتكامل مع نظام المخزون الحالي عبر collection inventoryTransactions دون الحاجة لتغييرات كبيرة: نستخدم OUT عند الإرسال، وIN للمرتجع، وDEPRECIATION لما أُتلف.

## نموذج البيانات المقترح
Collection: serviceOrders

ServiceOrder
- id: string (مثل SVC-25-08-003 أو SVC-2583 كود قصير شهري)
- dateCreated: Timestamp
- residenceId: string
- residenceName: string
- destination: {
  - type: 'InternalMaintenance' | 'ExternalWorkshop' | 'Vendor'
  - name: string (اسم القسم/الورشة/المورد)
  - contact?: string
}
- status: 'DRAFT' | 'DISPATCHED' | 'PARTIAL_RETURN' | 'COMPLETED' | 'CANCELLED'
- dispatchedAt?: Timestamp
- receivedAt?: Timestamp
- createdById: string
- dispatchedById?: string
- receivedById?: string
- transportInfo?: { driverName?: string; vehiclePlate?: string; notes?: string }
- notes?: string
- items: Array<{
  - itemId: string
  - itemNameEn: string
  - itemNameAr: string
  - qtySent: number
  - qtyReturned: number (default 0)
  - qtyScrapped: number (default 0)
  - serials?: string[] (اختياري للقطع المسلسلة)
}>
- attachments?: { url: string; name?: string }[]
- codeShort?: string (SVC-YYM#)

قيود:
- sum(qtyReturned + qtyScrapped) ≤ qtySent لكل سطر.
- لا يُسمح بإرجاع أو إتلاف أكثر مما تم إرساله.

## التكامل مع المخزون (Inventory)
- عند DISPATCH:
  - تقليل stockByResidence للـ residenceId المعني.
  - تسجيل حركة OUT في collection inventoryTransactions لكل صنف:
    - type: 'OUT'
    - referenceDocId: serviceOrder.codeShort (مثال: SVC-2583)
    - locationName: `Sent to maintenance/workshop: <destination.name>`
    - quantity: qtySent
- عند RECEIVE:
  - زيادة stockByResidence بنفس residenceId للكمية العائدة (qtyReturned):
    - تسجيل حركة IN بمرجع نفس الـ Service Order
  - تسجيل إتلاف qtyScrapped:
    - استخدام type: 'DEPRECIATION' مع depreciationReason: 'Scrapped at workshop'
    - الخصم من نفس مخزون السكن

بهذا نستخدم أنواع الحركات الموجودة أصلًا (IN/OUT/DEPRECIATION) فلا نكسر أي تقارير حالية. إن رغبت لاحقًا بتمييزها، يمكن إضافة أنواع جديدة مثل 'SERVICE_OUT' و 'SERVICE_RETURN'، لكن البداية السريعة تبقى باستخدام الأنواع الحالية مع referenceDocId واضح.

## توليد الأكواد
- احتفظ بعدّاد شهري counters/svc-YY-MM مثل MRV/MIV/TRS الموجودة.
- الكود المختصر: SVC-<YY><M><seq> (مثل SVC-2583)
- يُحفظ في الحقل codeShort ويستخدم كـ referenceDocId في الحركات.

## تدفق الواجهة (UI)
صفحة جديدة: Inventory → Service Orders
- قائمة الطلبات مع فلاتر (الحالة، السكن، الوجهة، التاريخ)
- زر "New Service Order"

نموذج إنشاء:
- Residence
- Destination (نوع + اسم + معلومات تواصل)
- Transport (اختياري)
- Items picker (من المخزون حسب السكن) مع qtySent
- Notes/Attachments
- Actions: Save Draft | Dispatch

عرض تفاصيل الطلب:
- رأس الطلب + الحالة + رحلة التواريخ
- جدول العناصر: qtySent, qtyReturned, qtyScrapped, Outstanding
- إجراء Receive:
  - لكل صنف تدخل qtyReturned و qtyScrapped (مع تحقق القيود)
  - عند الحفظ: يسجل IN و DEPRECIATION كما أعلاه ويحدث ملخص السطور
  - إن بقي Outstanding > 0 بعد الاستلام، الحالة تصبح PARTIAL_RETURN؛ إذا صفر على الكل، الحالة COMPLETED

Permissions
- الإنشاء/الإرسال: مسؤولو السكن
- الاستلام والإغلاق: مسؤولو المخزن/الإدارة
- سجل نشاط (من قام بأي إجراء)

Notifications
- عند الإرسال: إشعار لمسؤول المخزن/الورشة
- عند الاستلام: إشعار لمنشئ الطلب

## التقارير
- استخدام stock movement report الحالي عبر referenceDocId=SVC-…
- تقرير مخصص: Service Orders Ledger
  - مرئيًا: إجمالي المرسَل/العائد/المتلف لكل أمر، ومتوسط زمن الدوران
- KPI مقترحة: Return Rate, Scrap Rate, Avg Turnaround Days

## حالات الحافة (Edge cases)
- Partial returns: يسمح بأكثر من استلام حتى إغلاق الطلب.
- Replacement: لو الورشة أعادت قطعة بديلة ItemId مختلف، ندعم سطر "ReturnedAs" (اختياري)، أو نقيد أن العودة يجب أن تكون لنفس الصنف. كبداية، نلتزم نفس الصنف.
- Serial numbers: إن وُجدت، نلتزم بتسجيلها عند الإرسال والعودة.
- Lost in transit: سجّل كـ qtyScrapped مع سبب مخصص.
- لا يسمح بالسالب: كل تحديث مخزون يُClamp إلى ≥ 0 كما هو مطبق في النظام.

## نقاط الدمج مع الشفرة الحالية (Low-risk)
- InventoryContext موجود ويحتوي على عمليات IN/OUT/DEPRECIATION ونمط counters (MRV/TRS/…)
- ننفذ دالتين جديدتين في InventoryContext أو سياق منفصل ServiceOrdersContext:
  - createAndDispatchServiceOrder(payload) → توليد SVC، كتابة مستند order، ثم runTransaction: تقليل المخزون وتسجيل OUT لكل صنف
  - receiveServiceOrder(orderId, lines[]) → runTransaction: زيادة IN للمرتجع، وإنشاء DEPRECIATION للمتلف، وتحديث سطور order والحالة
- لا نغير مخطط inventoryTransactions الحالي. فقط نستخدم referenceDocId=codeShort + locationName مميز.

## خريطة جداول Firestore المقترحة
- serviceOrders (master)
- لا حاجة لتخزين تفاصيل حركة منفصلة لأننا نستخدم inventoryTransactions الموجودة بالفعل.

## مثال سيناريو (من سؤالك)
- إرسال 30 مكيف → OUT كمية 30 (referenceDocId = SVC-2583)
- عاد 20 → IN كمية 20 (نفس المرجع)
- أُتلف 10 → DEPRECIATION كمية 10 مع السبب "Scrapped at workshop" (نفس المرجع)
- الطلب يُغلق تلقائيًا إذا Outstanding=0 لكل العناصر

## الخطوات التالية (تنفيذ تدريجي)
1) Backend/Context
   - مولد أكواد SVC (counters/svc-YY-MM)
   - create serviceOrders doc + حالات
   - دالتا dispatch/receive بالـ runTransaction وربطها بـ inventoryTransactions
2) UI
   - قائمة Service Orders + صفحة تفاصيل
   - نموذج إنشاء/إرسال + نموذج استلام جزئي/كامل
3) التقارير والإشعارات
   - عرض حسب referenceDocId
   - إشعارات بسيطة للمسؤولين

ملحوظة: البداية بأقل تغييرات ممكنة عبر IN/OUT/DEPRECIATION ستسمح لك بإطلاق الميزة سريعًا دون كسر أي تقارير حالية. لاحقًا يمكن ترقية الأنواع (SERVICE_OUT/RETURN) إذا احتجت تمييزًا دقيقًا في التحليلات.
