// ============================================================
// أنواع العقود - Contracts Types
// ============================================================

// ---- التصنيف الأساسي ----
export type ContractCategory = 'revenue' | 'expense';

// ---- أنواع العقود المدعومة (10 أنواع) ----
export type ContractType =
  // 🟢 إيرادات
  | 'worker_housing_revenue'    // تسكين عمال شركات أخرى
  | 'commercial_rent'           // إيجار محلات/بقالات/مطاعم
  | 'full_residence_rental'     // إيجار السكن بالكامل لشركة أخرى
  // 🔴 مصروفات
  | 'worker_housing_expense'    // تسكين عمالتنا لدى سكن آخر
  | 'residence_rent'            // إيجار سكن/أرض (لدينا لدى الغير)
  | 'service_maintenance'       // عقود خدمات (صيانة، نظافة، مبيدات، طفايات)
  | 'water_drinking'            // مياه شرب
  | 'water_washing'             // مياه غسيل
  | 'gas'                       // غاز
  | 'internet_distribution';    // توزيع إنترنت

// ---- أنواع الفوترة ----
export type BillingType =
  | 'per_person_per_day'      // للشخص/اليوم
  | 'per_person_per_month'    // للشخص/الشهر
  | 'per_room_per_month'      // للغرفة/الشهر
  | 'fixed_monthly'           // مبلغ شهري ثابت
  | 'one_time'                // مبلغ لمرة واحدة
  | 'per_invoice'             // حسب الفاتورة المقدمة
  | 'per_unit';               // حسب الوحدة (دبة غاز، خزان مياه)

// ---- أنواع التجديد ----
export type RenewalType =
  | 'manual'                // يدوي
  | 'auto_monthly'          // تلقائي شهري
  | 'auto_quarterly'        // تلقائي ربع سنوي
  | 'auto_yearly';          // تلقائي سنوي

// ---- حالة العقد ----
export type ContractStatus =
  | 'Active'
  | 'Suspended'
  | 'Expired'
  | 'Cancelled'
  | 'Draft';

// ---- حالة فاتورة العقد ----
export type ContractInvoiceStatus =
  | 'Draft'
  | 'Issued'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled';

// ---- نوع الطرف الآخر ----
export type PartyType = 'company' | 'vendor' | 'individual';

// ---- خدمة داخل العقد (لعقود الخدمات المتعددة) ----
export interface ContractService {
  name: string;
  description?: string;
  rate: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
}

// ---- العقد الرئيسي ----
export interface Contract {
  id: string;

  // التصنيف
  contractType: ContractType;
  contractCategory: ContractCategory;

  // الطرف الآخر
  partyType: PartyType;
  partyId: string;
  partyName: string;
  partyContact?: string;
  partyPhone?: string;
  partyEmail?: string;

  // السكنات المرتبطة
  linkedResidences: string[];
  linkedResidenceNames?: string[];

  // المدة
  startDate: string; // ISO date
  endDate: string;   // ISO date
  isOpenEnded: boolean;

  // الفوترة
  billingType: BillingType;
  billingRate: number;
  billingUnit: string;
  paymentTerms?: string;
  advancePayment?: number;

  // الخدمات (لعقود الخدمات)
  services?: ContractService[];

  // التجديد
  renewalType: RenewalType;
  autoRenew: boolean;
  noticePeriodDays: number;
  lastRenewedDate?: string;
  renewalCount: number;

  // الحالة
  status: ContractStatus;

  // مذكرات ومرفقات
  notes?: string;
  attachments?: string[];

  // الربط مع النظام المالي
  linkedFinancialCategory?: string;

  // النظام
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

// ---- فاتورة العقد ----
export interface ContractInvoice {
  id: string;
  contractId: string;
  month: string; // YYYY-MM
  amount: number;
  description?: string;
  status: ContractInvoiceStatus;
  issuedAt: string;
  paidAt?: string;
  invoiceNumber?: string;
  notes?: string;
}

// ---- تنبيه العقد ----
export interface ContractAlert {
  id: string;
  contractId: string;
  alertType: 'expiry_7days' | 'expiry_14days' | 'expiry_30days' | 'renewal_due' | 'payment_due';
  sent: boolean;
  sentAt?: string;
  read: boolean;
  createdAt: string;
}

// ---- إحصائيات العقود ----
export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  suspendedContracts: number;
  draftContracts: number;
  totalMonthlyRevenue: number;
  totalMonthlyExpense: number;
  expiringThisMonth: number;
  expiringNextMonth: number;
  contractsByType: Record<ContractType, number>;
  contractsByCategory: Record<ContractCategory, number>;
}

// ---- بيانات الفورم (لإنشاء/تعديل العقد) ----
export interface ContractFormData {
  contractType: ContractType;
  contractCategory: ContractCategory;

  // الطرف الآخر
  partyType: PartyType;
  partyId: string;
  partyName: string;
  partyContact?: string;
  partyPhone?: string;
  partyEmail?: string;

  // السكنات
  linkedResidences: string[];

  // المدة
  startDate: string;
  endDate: string;
  isOpenEnded: boolean;

  // الفوترة
  billingType: BillingType;
  billingRate: number;
  billingUnit: string;
  paymentTerms?: string;
  advancePayment?: number;

  // الخدمات
  services?: ContractService[];

  // التجديد
  renewalType: RenewalType;
  autoRenew: boolean;
  noticePeriodDays: number;

  // أخرى
  notes?: string;
  linkedFinancialCategory?: string;
}

// ---- معلومات نوع العقد للعرض ----
export interface ContractTypeInfo {
  type: ContractType;
  category: ContractCategory;
  labelAr: string;
  labelEn: string;
  icon: string;
  defaultBillingType: BillingType;
  defaultBillingUnit: string;
  hasServices: boolean;
  hasMultipleResidences: boolean;
}

// ---- قائمة أنواع العقود مع معلوماتها ----
export const CONTRACT_TYPES: ContractTypeInfo[] = [
  // 🟢 إيرادات
  {
    type: 'worker_housing_revenue',
    category: 'revenue',
    labelAr: 'تسكين عمال شركات',
    labelEn: 'Worker Housing (Revenue)',
    icon: 'Users',
    defaultBillingType: 'per_person_per_day',
    defaultBillingUnit: 'شخص/يوم',
    hasServices: false,
    hasMultipleResidences: true,
  },
  {
    type: 'commercial_rent',
    category: 'revenue',
    labelAr: 'إيجار محلات/بقالات/مطاعم',
    labelEn: 'Commercial Rent',
    icon: 'Store',
    defaultBillingType: 'fixed_monthly',
    defaultBillingUnit: 'شهري',
    hasServices: false,
    hasMultipleResidences: false,
  },
  {
    type: 'full_residence_rental',
    category: 'revenue',
    labelAr: 'تأجير سكن كامل لشركة',
    labelEn: 'Full Residence Rental',
    icon: 'Building2',
    defaultBillingType: 'fixed_monthly',
    defaultBillingUnit: 'شهري',
    hasServices: false,
    hasMultipleResidences: true,
  },
  // 🔴 مصروفات
  {
    type: 'worker_housing_expense',
    category: 'expense',
    labelAr: 'تسكين عمالتنا لدى الغير',
    labelEn: 'Worker Housing (Expense)',
    icon: 'Users',
    defaultBillingType: 'per_person_per_month',
    defaultBillingUnit: 'شخص/شهر',
    hasServices: false,
    hasMultipleResidences: false,
  },
  {
    type: 'residence_rent',
    category: 'expense',
    labelAr: 'إيجار سكن/أرض',
    labelEn: 'Residence Rent',
    icon: 'Home',
    defaultBillingType: 'fixed_monthly',
    defaultBillingUnit: 'شهري',
    hasServices: false,
    hasMultipleResidences: false,
  },
  {
    type: 'service_maintenance',
    category: 'expense',
    labelAr: 'عقود خدمات (صيانة/نظافة/مبيدات)',
    labelEn: 'Service & Maintenance',
    icon: 'Wrench',
    defaultBillingType: 'fixed_monthly',
    defaultBillingUnit: 'شهري',
    hasServices: true,
    hasMultipleResidences: true,
  },
  {
    type: 'water_drinking',
    category: 'expense',
    labelAr: 'مياه شرب',
    labelEn: 'Drinking Water',
    icon: 'Droplets',
    defaultBillingType: 'per_invoice',
    defaultBillingUnit: 'خزان',
    hasServices: false,
    hasMultipleResidences: true,
  },
  {
    type: 'water_washing',
    category: 'expense',
    labelAr: 'مياه غسيل',
    labelEn: 'Washing Water',
    icon: 'Droplets',
    defaultBillingType: 'per_invoice',
    defaultBillingUnit: 'خزان',
    hasServices: false,
    hasMultipleResidences: true,
  },
  {
    type: 'gas',
    category: 'expense',
    labelAr: 'غاز',
    labelEn: 'Gas',
    icon: 'Flame',
    defaultBillingType: 'per_unit',
    defaultBillingUnit: 'دبة',
    hasServices: false,
    hasMultipleResidences: true,
  },
  {
    type: 'internet_distribution',
    category: 'expense',
    labelAr: 'توزيع إنترنت',
    labelEn: 'Internet Distribution',
    icon: 'Wifi',
    defaultBillingType: 'fixed_monthly',
    defaultBillingUnit: 'شهري',
    hasServices: false,
    hasMultipleResidences: true,
  },
];

// ---- دوال مساعدة ----
export function getContractTypeInfo(type: ContractType): ContractTypeInfo {
  return CONTRACT_TYPES.find(t => t.type === type) || CONTRACT_TYPES[0];
}

export function getContractCategoryLabel(category: ContractCategory, isAr: boolean): string {
  return category === 'revenue'
    ? (isAr ? 'إيراد' : 'Revenue')
    : (isAr ? 'مصروف' : 'Expense');
}

export function getContractStatusLabel(status: ContractStatus, isAr: boolean): string {
  const labels: Record<ContractStatus, { ar: string; en: string }> = {
    Active: { ar: 'نشط', en: 'Active' },
    Suspended: { ar: 'موقوف', en: 'Suspended' },
    Expired: { ar: 'منتهي', en: 'Expired' },
    Cancelled: { ar: 'ملغي', en: 'Cancelled' },
    Draft: { ar: 'مسودة', en: 'Draft' },
  };
  return isAr ? labels[status].ar : labels[status].en;
}

export function getBillingTypeLabel(type: BillingType, isAr: boolean): string {
  const labels: Record<BillingType, { ar: string; en: string }> = {
    per_person_per_day: { ar: 'للشخص/اليوم', en: 'Per Person/Day' },
    per_person_per_month: { ar: 'للشخص/الشهر', en: 'Per Person/Month' },
    per_room_per_month: { ar: 'للغرفة/الشهر', en: 'Per Room/Month' },
    fixed_monthly: { ar: 'مبلغ شهري ثابت', en: 'Fixed Monthly' },
    one_time: { ar: 'مبلغ لمرة واحدة', en: 'One Time' },
    per_invoice: { ar: 'حسب الفاتورة', en: 'Per Invoice' },
    per_unit: { ar: 'حسب الوحدة', en: 'Per Unit' },
  };
  return isAr ? labels[type].ar : labels[type].en;
}

export function formatSAR(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
