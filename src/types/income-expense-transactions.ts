// مدل حركات الدخل/المصروف (Transactions) بشكل مرن.
// الهدف: إدخال تفاصيل كل حركة حسب ماهيتها، مع حساب المبلغ (amount)
// من الحقول المعروفة (مثل liters * pricePerLiter).

export type FinanceTransactionKind = 'income' | 'expense';

export type FinanceFieldType = 'text' | 'number' | 'textarea';

export type FinanceFieldDef = {
  key: string;
  labelAr: string;
  labelEn: string;
  type: FinanceFieldType;
  required?: boolean;
  min?: number;
  step?: number;
  placeholderAr?: string;
  placeholderEn?: string;
  unit?: string;
};

export type FinanceAmountCompute = (details: Record<string, any>) => number;

export type FinanceTransactionTypeDef = {
  key: string;
  kind: FinanceTransactionKind;
  groupKey?: string;
  labelAr: string;
  labelEn: string;
  detailsHelpAr?: string;
  detailsHelpEn?: string;
  fields: FinanceFieldDef[];
  computeAmount: FinanceAmountCompute;
  // نص مختصر يعرض في قائمة الحركات
  buildSubtitle?: (details: Record<string, any>) => string;
};

export const FINANCE_TRANSACTION_TYPES = [
  // -------------------- المصروفات --------------------
  {
    key: 'carMaintenance',
    kind: 'expense',
    groupKey: 'buildings',
    labelAr: 'صيانة السيارات',
    labelEn: 'Car Maintenance',
    detailsHelpAr: 'أدخل نوع السيارة، الخلل، وتكلفة الإصلاح.',
    detailsHelpEn: 'Enter vehicle type, fault, and repair cost.',
    fields: [
      { key: 'vehicleType', labelAr: 'نوع السيارة', labelEn: 'Vehicle Type', type: 'text', required: true, placeholderAr: 'مثال: لاندكروزر' },
      { key: 'fault', labelAr: 'الخلل', labelEn: 'Fault', type: 'textarea', required: true, placeholderAr: 'وصف الخلل' },
      { key: 'repairCost', labelAr: 'تكاليف الإصلاح', labelEn: 'Repair Cost', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.repairCost || 0),
    buildSubtitle: (d) => `${d.vehicleType || '-'} - ${String(d.fault || '').slice(0, 42) || '-'}`,
  },
  {
    key: 'acMaintenance',
    kind: 'expense',
    groupKey: 'buildings',
    labelAr: 'صيانة المكيفات',
    labelEn: 'Air Conditioner Maintenance',
    detailsHelpAr: 'عدد المكيفات، الخلل، وتكلفة الإصلاح.',
    detailsHelpEn: 'AC count, fault, and repair cost.',
    fields: [
      { key: 'acCount', labelAr: 'عدد المكيفات', labelEn: 'AC Count', type: 'number', required: true, min: 0, step: 1, placeholderAr: '0' },
      { key: 'fault', labelAr: 'الخلل', labelEn: 'Fault', type: 'textarea', required: true, placeholderAr: 'وصف الخلل' },
      { key: 'repairCost', labelAr: 'تكاليف الإصلاح', labelEn: 'Repair Cost', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.repairCost || 0),
    buildSubtitle: (d) => `${d.acCount ?? 0} مكيف - ${String(d.fault || '').slice(0, 42) || '-'}`,
  },
  {
    key: 'waterWashing',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'مياه الشرب والغسيل',
    labelEn: 'Drinking Water & Washing',
    detailsHelpAr: 'عدد الردود، كم طن، وسعر الطن.',
    detailsHelpEn: 'Number of loads, tons, and price per ton.',
    fields: [
      { key: 'responsesCount', labelAr: 'عدد الردود', labelEn: 'Responses Count', type: 'number', required: true, min: 0, step: 1 },
      { key: 'tons', labelAr: 'كم طن', labelEn: 'Tons', type: 'number', required: true, min: 0, step: 0.01 },
      { key: 'pricePerTon', labelAr: 'سعر الطن', labelEn: 'Price per Ton', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.tons || 0) * Number(d.pricePerTon || 0),
    buildSubtitle: (d) => `${d.tons ?? 0} طن @ ${d.pricePerTon ?? 0}`,
  },
  {
    key: 'gas',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'الغاز',
    labelEn: 'Gas',
    detailsHelpAr: 'عدد السلندرات والمبلغ.',
    detailsHelpEn: 'Cylinders count and total amount.',
    fields: [
      { key: 'cylinderCount', labelAr: 'عدد السلندرات', labelEn: 'Cylinder Count', type: 'number', required: true, min: 0, step: 1 },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${d.cylinderCount ?? 0} أسطوانة`,
  },
  {
    key: 'gasoline',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'البنزين',
    labelEn: 'Gasoline',
    detailsHelpAr: 'السيارة، عدد اللترات، وسعر اللتر.',
    detailsHelpEn: 'Vehicle, liters, and price per liter.',
    fields: [
      { key: 'vehicle', labelAr: 'السيارة', labelEn: 'Vehicle', type: 'text', required: true, placeholderAr: 'مثال: كرافان 1' },
      { key: 'liters', labelAr: 'عدد اللترات', labelEn: 'Liters', type: 'number', required: true, min: 0, step: 0.01 },
      { key: 'pricePerLiter', labelAr: 'سعر اللتر', labelEn: 'Price per Liter', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.liters || 0) * Number(d.pricePerLiter || 0),
    buildSubtitle: (d) => `${d.vehicle || '-'} - ${d.liters ?? 0} لتر`,
  },
  {
    key: 'diesel',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'الديزل',
    labelEn: 'Diesel',
    detailsHelpAr: 'السيارة، عدد اللترات، وسعر اللتر (مستقبلا من عقد النظام).',
    detailsHelpEn: 'Vehicle, liters, and price per liter (future: from contract).',
    fields: [
      { key: 'vehicle', labelAr: 'السيارة', labelEn: 'Vehicle', type: 'text', required: true, placeholderAr: 'مثال: شاص 2' },
      { key: 'liters', labelAr: 'عدد اللترات', labelEn: 'Liters', type: 'number', required: true, min: 0, step: 0.01 },
      { key: 'pricePerLiter', labelAr: 'سعر اللتر', labelEn: 'Price per Liter', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.liters || 0) * Number(d.pricePerLiter || 0),
    buildSubtitle: (d) => `${d.vehicle || '-'} - ${d.liters ?? 0} لتر`,
  },

  // -------------------- مصروفات إضافية (بشكل تفصيلي مع حقل مبلغ) --------------------
  {
    key: 'electricity',
    kind: 'expense',
    groupKey: 'buildings',
    labelAr: 'كهرباء',
    labelEn: 'Electricity',
    detailsHelpAr: 'أدخل رقم العداد/الفاتورة (اختياري) والمبلغ. مستقبلاً يمكن ربطها بقراءات العداد أو العقد.',
    detailsHelpEn: 'Optional meter/bill ref and the total amount. Future: connect to meter readings or contracts.',
    fields: [
      { key: 'meterNumber', labelAr: 'رقم العداد', labelEn: 'Meter Number', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'billPeriod', labelAr: 'فترة الفاتورة', labelEn: 'Bill Period', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'invoiceNo', labelAr: 'رقم الفاتورة', labelEn: 'Invoice No', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${d.invoiceNo ? `#${d.invoiceNo}` : 'كهرباء'} `,
  },
  {
    key: 'generalMaintenance',
    kind: 'expense',
    groupKey: 'buildings',
    labelAr: 'صيانة عامة',
    labelEn: 'General Maintenance',
    detailsHelpAr: 'وصف الخدمة والمبلغ.',
    detailsHelpEn: 'Service description and the amount.',
    fields: [
      { key: 'description', labelAr: 'الوصف', labelEn: 'Description', type: 'textarea', required: true, placeholderAr: 'مثال: إصلاح باب/طلاء/ملاحظات...' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.description || '').slice(0, 30) || '-'}`,
  },
  {
    key: 'pumpsMotorsMaintenance',
    kind: 'expense',
    groupKey: 'buildings',
    labelAr: 'موازنات وموتورات',
    labelEn: 'Pumps & Motors',
    detailsHelpAr: 'عدد/نوع التجهيز (اختياري)، الخلل، وتكلفة الإصلاح.',
    detailsHelpEn: 'Count/type (optional), fault, and repair cost.',
    fields: [
      { key: 'deviceType', labelAr: 'نوع التجهيز', labelEn: 'Device Type', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'count', labelAr: 'العدد', labelEn: 'Count', type: 'number', min: 0, step: 1, placeholderAr: '0', placeholderEn: '0' },
      { key: 'fault', labelAr: 'الخلل', labelEn: 'Fault', type: 'textarea', required: true, placeholderAr: 'وصف الخلل' },
      { key: 'repairCost', labelAr: 'تكاليف الإصلاح', labelEn: 'Repair Cost', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.repairCost || 0),
    buildSubtitle: (d) => `${d.count ? `${d.count}x ` : ''}${String(d.deviceType || 'الموتورات')}${d.fault ? ` - ${String(d.fault).slice(0, 20)}` : ''}`,
  },
  {
    key: 'drainageLinesMaintenance',
    kind: 'expense',
    groupKey: 'buildings',
    labelAr: 'خطوط الصرف',
    labelEn: 'Drainage Lines',
    detailsHelpAr: 'وصف المشكلة وتكلفة الإصلاح.',
    detailsHelpEn: 'Problem description and repair cost.',
    fields: [
      { key: 'location', labelAr: 'الموقع/الجهة', labelEn: 'Location', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'fault', labelAr: 'الخلل', labelEn: 'Fault', type: 'textarea', required: true, placeholderAr: 'مثال: انسداد/تسريب/تكسر...' },
      { key: 'repairCost', labelAr: 'تكاليف الإصلاح', labelEn: 'Repair Cost', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.repairCost || 0),
    buildSubtitle: (d) => `${d.location ? `${d.location} - ` : ''}${String(d.fault || '').slice(0, 28) || '-'}`,
  },
  {
    key: 'fireCleaning',
    kind: 'expense',
    groupKey: 'buildings',
    labelAr: 'نظافة الحريق',
    labelEn: 'Fire Cleaning',
    detailsHelpAr: 'وصف الخدمة والمبلغ.',
    detailsHelpEn: 'Service description and amount.',
    fields: [
      { key: 'serviceNotes', labelAr: 'ملاحظات الخدمة', labelEn: 'Service Notes', type: 'textarea', required: true, placeholderAr: 'مثال: تنظيف شبكة/تعقيم...' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.serviceNotes || '').slice(0, 30) || '-'}`,
  },
  {
    key: 'municipalWater',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'مياه بلدية',
    labelEn: 'Municipal Water',
    detailsHelpAr: 'المبلغ (اختياري: رقم فاتورة/فترة).',
    detailsHelpEn: 'Total amount (optional: invoice period/ref).',
    fields: [
      { key: 'meterNumber', labelAr: 'رقم العداد', labelEn: 'Meter Number', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'invoiceNo', labelAr: 'رقم الفاتورة', labelEn: 'Invoice No', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => (d.invoiceNo ? `#${d.invoiceNo}` : 'مياه بلدية'),
  },
  {
    key: 'pestControl',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'مكافحة الحشرات',
    labelEn: 'Pest Control',
    detailsHelpAr: 'ماذا تم؟ وعدد/وصف (اختياري) + المبلغ.',
    detailsHelpEn: 'What was done? (optional) + amount.',
    fields: [
      { key: 'notes', labelAr: 'وصف الإجراء', labelEn: 'Action Description', type: 'textarea', required: true, placeholderAr: 'مثال: رش/مكافحة/تعقيم...' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.notes || '').slice(0, 30) || '-'}`,
  },
  {
    key: 'sewage',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'صرف صحي',
    labelEn: 'Sewage',
    detailsHelpAr: 'المبلغ (اختياري: رقم إيصال/وصف).',
    detailsHelpEn: 'Amount (optional: receipt/invoice).',
    fields: [
      { key: 'notes', labelAr: 'ملاحظات', labelEn: 'Notes', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => String(d.notes || 'صرف صحي'),
  },
  {
    key: 'drinkingWater',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'مياه شرب',
    labelEn: 'Drinking Water',
    detailsHelpAr: 'ادخل المبلغ أو (مستقبلاً) الربط مع عدد الجردلات/الطن.',
    detailsHelpEn: 'Enter amount (future: connect to barrels/tons).',
    fields: [
      { key: 'supplier', labelAr: 'المورد', labelEn: 'Supplier', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => (d.supplier ? `${d.supplier}` : 'مياه شرب'),
  },
  {
    key: 'wasteCollection',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'رفع القمامة',
    labelEn: 'Waste Collection',
    detailsHelpAr: 'وصف الخدمة والمبلغ.',
    detailsHelpEn: 'Service description and amount.',
    fields: [
      { key: 'notes', labelAr: 'وصف/ملاحظات', labelEn: 'Notes', type: 'textarea', required: true, placeholderAr: 'مثال: رفع أسبوعي/تنظيف...' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.notes || '').slice(0, 30) || '-'}`,
  },
  {
    key: 'security',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'حراسات',
    labelEn: 'Security',
    detailsHelpAr: 'وصف الفترة/عدد الحراس (اختياري) + المبلغ.',
    detailsHelpEn: 'Period/guards count (optional) + amount.',
    fields: [
      { key: 'guardsCount', labelAr: 'عدد الحراس', labelEn: 'Guards Count', type: 'number', min: 0, step: 1, placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'period', labelAr: 'الفترة', labelEn: 'Period', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${d.guardsCount ? `${d.guardsCount} حارس` : 'حراسة'} ${d.period ? `- ${d.period}` : ''}`.trim(),
  },
  {
    key: 'mobile',
    kind: 'expense',
    groupKey: 'services',
    labelAr: 'جوال',
    labelEn: 'Mobile',
    detailsHelpAr: 'ملاحظات/رقم خط (اختياري) + المبلغ.',
    detailsHelpEn: 'Notes/phone (optional) + amount.',
    fields: [
      { key: 'phoneOrPlan', labelAr: 'رقم/الخطة', labelEn: 'Phone/Plan', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => d.phoneOrPlan ? String(d.phoneOrPlan) : 'جوال',
  },
  {
    key: 'cleaning',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'نظافة',
    labelEn: 'Cleaning',
    detailsHelpAr: 'وصف الخدمة (اختياري) + المبلغ.',
    detailsHelpEn: 'Service description (optional) + amount.',
    fields: [
      { key: 'serviceNotes', labelAr: 'ملاحظات الخدمة', labelEn: 'Service Notes', type: 'textarea', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => (d.serviceNotes ? String(d.serviceNotes).slice(0, 30) : 'نظافة'),
  },
  {
    key: 'internet',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'انترنت',
    labelEn: 'Internet',
    detailsHelpAr: 'اسم المورد/الخط (اختياري) + المبلغ.',
    detailsHelpEn: 'Provider/line (optional) + amount.',
    fields: [
      { key: 'provider', labelAr: 'المزود', labelEn: 'Provider', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => d.provider ? String(d.provider) : 'انترنت',
  },
  {
    key: 'stationery',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'مكتبة',
    labelEn: 'Stationery',
    detailsHelpAr: 'وصف/مشتريات (اختياري) + المبلغ.',
    detailsHelpEn: 'Items/description (optional) + amount.',
    fields: [
      { key: 'itemsNotes', labelAr: 'الوصف', labelEn: 'Description', type: 'textarea', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => (d.itemsNotes ? String(d.itemsNotes).slice(0, 28) : 'مكتبة'),
  },
  {
    key: 'furnishings',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'فرش',
    labelEn: 'Furnishings',
    detailsHelpAr: 'وصف المشتريات + المبلغ.',
    detailsHelpEn: 'Furnishings description and amount.',
    fields: [
      { key: 'itemsNotes', labelAr: 'الوصف', labelEn: 'Description', type: 'textarea', required: true, placeholderAr: 'مثال: طقم كنب/ستائر...' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.itemsNotes || '').slice(0, 30) || '-'}`,
  },
  {
    key: 'juiceFurnishings',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'عصير فرش',
    labelEn: 'Juice Furnishings',
    detailsHelpAr: 'وصف الخدمة + المبلغ.',
    detailsHelpEn: 'Service description + amount.',
    fields: [
      { key: 'notes', labelAr: 'الوصف', labelEn: 'Description', type: 'textarea', required: true, placeholderAr: 'مثال: شراء عصير للفرش...' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.notes || '').slice(0, 30) || '-'}`,
  },
  {
    key: 'laborDelivery',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'طق عمالة',
    labelEn: 'Labor Delivery',
    detailsHelpAr: 'يمكن إدخال عدد العمال + تكلفة العامل (اختياري) أو فقط المبلغ.',
    detailsHelpEn: 'Optional: workers count + cost per worker, or enter only the total amount.',
    fields: [
      { key: 'workersCount', labelAr: 'عدد العمال', labelEn: 'Workers Count', type: 'number', min: 0, step: 1, placeholderAr: 'اختياري' },
      { key: 'costPerWorker', labelAr: 'تكلفة العامل', labelEn: 'Cost per Worker', type: 'number', min: 0, step: 0.01, placeholderAr: 'اختياري' },
      { key: 'amount', labelAr: 'المبلغ (إجمالي)', labelEn: 'Amount (Total)', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => {
      const c = Number(d.costPerWorker || 0);
      const n = Number(d.workersCount || 0);
      const derived = n > 0 && c > 0 ? n * c : Number(d.amount || 0);
      return Number.isFinite(derived) ? derived : 0;
    },
    buildSubtitle: (d) => {
      const n = Number(d.workersCount || 0);
      const c = Number(d.costPerWorker || 0);
      if (n > 0 && c > 0) return `${n} x ${c}`;
      return 'عمالة';
    },
  },
  {
    key: 'residenceRentsExpense',
    kind: 'expense',
    groupKey: 'assets',
    labelAr: 'إيجارات السكنات',
    labelEn: 'Residence Rents',
    detailsHelpAr: 'وصف الإيجار + المبلغ.',
    detailsHelpEn: 'Rent description + amount.',
    fields: [
      { key: 'notes', labelAr: 'الوصف/الموقع', labelEn: 'Notes/Location', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => d.notes ? String(d.notes) : 'إيجار',
  },
  {
    key: 'furniture',
    kind: 'expense',
    groupKey: 'assets',
    labelAr: 'الأثاث',
    labelEn: 'Furniture',
    detailsHelpAr: 'وصف المشتريات + المبلغ.',
    detailsHelpEn: 'Furniture description + amount.',
    fields: [
      { key: 'itemsNotes', labelAr: 'الوصف', labelEn: 'Description', type: 'textarea', required: true, placeholderAr: 'مثال: مراتب/دواليب...' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.itemsNotes || '').slice(0, 30) || '-'}`,
  },
  {
    key: 'staffSalaries',
    kind: 'expense',
    groupKey: 'assets',
    labelAr: 'رواتب الموظفين',
    labelEn: 'Staff Salaries',
    detailsHelpAr: 'اسم الموظف (اختياري) + المبلغ.',
    detailsHelpEn: 'Employee name (optional) + amount.',
    fields: [
      { key: 'employeeName', labelAr: 'اسم الموظف', labelEn: 'Employee Name', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => d.employeeName ? String(d.employeeName) : 'رواتب',
  },
  {
    key: 'yemenSalaries',
    kind: 'expense',
    groupKey: 'assets',
    labelAr: 'رواتب اليمن',
    labelEn: 'Yemen Salaries',
    detailsHelpAr: 'اسم الموظف (اختياري) + المبلغ.',
    detailsHelpEn: 'Employee name (optional) + amount.',
    fields: [
      { key: 'employeeName', labelAr: 'اسم العامل', labelEn: 'Worker Name', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => d.employeeName ? String(d.employeeName) : 'رواتب اليمن',
  },
  {
    key: 'residenceLicense',
    kind: 'expense',
    groupKey: 'assets',
    labelAr: 'رخصة سكن',
    labelEn: 'Residence License',
    detailsHelpAr: 'سنة/رقم (اختياري) + المبلغ.',
    detailsHelpEn: 'Year/ref (optional) + amount.',
    fields: [
      { key: 'ref', labelAr: 'المرجع', labelEn: 'Reference', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => d.ref ? String(d.ref) : 'رخصة',
  },

  // -------------------- الإيرادات --------------------
  {
    key: 'storesIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'ايراد المحلات',
    labelEn: 'Stores Income',
    detailsHelpAr: 'نوع المحل والإيجار الشهري.',
    detailsHelpEn: 'Store type and monthly rent.',
    fields: [
      { key: 'storeType', labelAr: 'نوع المحل', labelEn: 'Store Type', type: 'text', required: true, placeholderAr: 'مثال: صيدلية' },
      { key: 'monthlyRent', labelAr: 'الإيجار الشهري', labelEn: 'Monthly Rent', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.monthlyRent || 0),
    buildSubtitle: (d) => `${d.storeType || '-'}`,
  },
  {
    key: 'employeeSettlementIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'تصفية عمالة واشتراكات',
    labelEn: 'Employee Settlement & Subscriptions',
    fields: [
      { key: 'notes', labelAr: 'الوصف', labelEn: 'Description', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => String(d.notes || 'تصفية عمالة'),
  },
  {
    key: 'employeeAccommodationIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'تسكين عمالة',
    labelEn: 'Employee Accommodation',
    fields: [
      { key: 'company', labelAr: 'الشركة', labelEn: 'Company', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'workersCount', labelAr: 'عدد العمال', labelEn: 'Workers Count', type: 'number', min: 0, step: 1, placeholderAr: 'اختياري' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${d.company ? String(d.company) : 'تسكين'}${d.workersCount ? ` - ${d.workersCount}` : ''}`,
  },
  {
    key: 'serviceRoomsIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'غرف خدمات',
    labelEn: 'Service Rooms',
    fields: [
      { key: 'roomType', labelAr: 'نوع الغرفة', labelEn: 'Room Type', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => String(d.roomType || 'غرف خدمات'),
  },
  {
    key: 'housingRentIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'إيجار سكن',
    labelEn: 'Housing Rent',
    fields: [
      { key: 'tenant', labelAr: 'المستأجر', labelEn: 'Tenant', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => String(d.tenant || 'إيجار سكن'),
  },
  {
    key: 'hallsRentIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'إيجار حلقات',
    labelEn: 'Halls Rent',
    fields: [
      { key: 'hallName', labelAr: 'اسم الحلقة/القاعة', labelEn: 'Hall Name', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => String(d.hallName || 'إيجار حلقات'),
  },
  {
    key: 'restaurantRentIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'إيجار مطاعم',
    labelEn: 'Restaurant Rent',
    fields: [
      { key: 'restaurantName', labelAr: 'اسم المطعم', labelEn: 'Restaurant Name', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => String(d.restaurantName || 'إيجار مطاعم'),
  },
  {
    key: 'electricityDepositIncome',
    kind: 'income',
    groupKey: 'incomeMain',
    labelAr: 'تأمين كهرباء',
    labelEn: 'Electricity Deposit',
    fields: [
      { key: 'ref', labelAr: 'مرجع', labelEn: 'Reference', type: 'text', placeholderAr: 'اختياري', placeholderEn: 'Optional' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => String(d.ref || 'تأمين كهرباء'),
  },
  {
    key: 'customIncome',
    kind: 'income',
    groupKey: 'incomeOther',
    labelAr: 'إيراد آخر (مخصص)',
    labelEn: 'Custom Income',
    detailsHelpAr: 'اكتب وصف مختصر والمبلغ.',
    detailsHelpEn: 'Write a short description and amount.',
    fields: [
      { key: 'description', labelAr: 'الوصف', labelEn: 'Description', type: 'text', required: true, placeholderAr: 'مثال: عمولة' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.description || '')}`,
  },
  {
    key: 'customExpense',
    kind: 'expense',
    groupKey: 'other',
    labelAr: 'مصروف آخر (مخصص)',
    labelEn: 'Custom Expense',
    detailsHelpAr: 'اكتب وصف مختصر والمبلغ.',
    detailsHelpEn: 'Write a short description and amount.',
    fields: [
      { key: 'description', labelAr: 'الوصف', labelEn: 'Description', type: 'text', required: true, placeholderAr: 'مثال: رسوم' },
      { key: 'amount', labelAr: 'المبلغ', labelEn: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    ],
    computeAmount: (d) => Number(d.amount || 0),
    buildSubtitle: (d) => `${String(d.description || '')}`,
  },
] as const satisfies readonly FinanceTransactionTypeDef[];

export type FinanceTransactionTypeKey = (typeof FINANCE_TRANSACTION_TYPES)[number]['key'];

export const FINANCE_GROUPS = [
  { key: 'incomeMain', labelAr: 'الإيرادات الأساسية', labelEn: 'Main Income' },
  { key: 'incomeOther', labelAr: 'إيرادات أخرى', labelEn: 'Other Income' },
  { key: 'buildings', labelAr: 'مبانيات', labelEn: 'Buildings' },
  { key: 'assets', labelAr: 'أصول', labelEn: 'Assets' },
  { key: 'services', labelAr: 'خدمات', labelEn: 'Services' },
  { key: 'other', labelAr: 'أخرى', labelEn: 'Other' },
] as const;

export interface FinanceTransaction {
  id: string;
  residenceId: string;
  residenceName?: string;
  fiscalMonth: string; // "YYYY-MM"
  kind: FinanceTransactionKind;
  typeKey: FinanceTransactionTypeKey;
  transactionDate: string; // YYYY-MM-DD
  amount: number;
  details: Record<string, any>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getTransactionTypeDef(typeKey: FinanceTransactionTypeKey) {
  return FINANCE_TRANSACTION_TYPES.find((t) => t.key === typeKey) as FinanceTransactionTypeDef | undefined;
}

export function formatMoneySAr(value: number) {
  if (!value && value !== 0) return '-';
  return value.toLocaleString('en-US');
}

