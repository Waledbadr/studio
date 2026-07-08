// ─── Income Categories ────────────────────────────────────────────────────
export const INCOME_CATEGORIES = [
  { key: 'employeeSettlement',    labelAr: 'تصفية عمالة واشتراكات',   labelEn: 'Employee Settlement & Subscriptions' },
  { key: 'employeeAccommodation', labelAr: 'تسكين عمالة (سكاميور)',   labelEn: 'Employee Accommodation' },
  { key: 'serviceRooms',          labelAr: 'غرف خدمات',               labelEn: 'Service Rooms' },
  { key: 'housingRent',           labelAr: 'إيجار سكن',               labelEn: 'Housing Rent' },
  { key: 'hallsRent',             labelAr: 'إيجار حلقات',             labelEn: 'Halls Rent' },
  { key: 'restaurantRent',        labelAr: 'إيجار مطاعم',             labelEn: 'Restaurant Rent' },
  { key: 'electricityDeposit',    labelAr: 'تأمين كهرباء',            labelEn: 'Electricity Deposit' },
  { key: 'otherIncome',           labelAr: 'أخرى',                    labelEn: 'Other Income' },
] as const;

// ─── Expense Groups & Categories ─────────────────────────────────────────
export const EXPENSE_GROUPS = [
  {
    key: 'buildings',
    labelAr: 'مبانيات',
    labelEn: 'Buildings',
    categories: [
      { key: 'vehicles',          labelAr: 'سيارات',           labelEn: 'Vehicles' },
      { key: 'electricity',       labelAr: 'كهرباء',           labelEn: 'Electricity' },
      { key: 'maintenance',       labelAr: 'صيانة',            labelEn: 'Maintenance' },
      { key: 'airConditioners',   labelAr: 'مكيفات',           labelEn: 'Air Conditioners' },
      { key: 'pumpsMotors',       labelAr: 'موازنات وموتور',   labelEn: 'Pumps & Motors' },
      { key: 'drainageLines',     labelAr: 'خطوط الصرف',       labelEn: 'Drainage Lines' },
      { key: 'fireCleaning',      labelAr: 'نظافة الحريق',     labelEn: 'Fire Cleaning' },
      { key: 'generalMaintenance',labelAr: 'صيانة عامة',       labelEn: 'General Maintenance' },
    ],
  },
  {
    key: 'assets',
    labelAr: 'أصول',
    labelEn: 'Assets',
    categories: [
      { key: 'residenceRents',    labelAr: 'إيجارات السكنات',  labelEn: 'Residence Rents' },
      { key: 'furniture',         labelAr: 'الأثاث',           labelEn: 'Furniture' },
      { key: 'staffSalaries',     labelAr: 'رواتب الموظفين',   labelEn: 'Staff Salaries' },
      { key: 'yemenSalaries',     labelAr: 'رواتب اليمن',      labelEn: 'Yemen Salaries' },
      { key: 'residenceLicense',  labelAr: 'رخصة سكن',         labelEn: 'Residence License' },
    ],
  },
  {
    key: 'services',
    labelAr: 'خدمات',
    labelEn: 'Services',
    categories: [
      { key: 'municipalWater',    labelAr: 'مياه بلدية',       labelEn: 'Municipal Water' },
      { key: 'pestControl',       labelAr: 'مكافحة الحشرات',   labelEn: 'Pest Control' },
      { key: 'sewage',            labelAr: 'صرف صحي',          labelEn: 'Sewage' },
      { key: 'drinkingWater',     labelAr: 'مياه الشرب',       labelEn: 'Drinking Water' },
      { key: 'wasteCollection',   labelAr: 'رفع القمامة',      labelEn: 'Waste Collection' },
      { key: 'security',          labelAr: 'حراسات',           labelEn: 'Security' },
      { key: 'gas',               labelAr: 'غاز',              labelEn: 'Gas' },
      { key: 'gasoline',          labelAr: 'بترين',            labelEn: 'Gasoline' },
      { key: 'mobile',            labelAr: 'جوال',             labelEn: 'Mobile' },
    ],
  },
  {
    key: 'other',
    labelAr: 'أخرى',
    labelEn: 'Other',
    categories: [
      { key: 'fuel',              labelAr: 'وقود',             labelEn: 'Fuel' },
      { key: 'cleaning',          labelAr: 'نظافة',            labelEn: 'Cleaning' },
      { key: 'internet',          labelAr: 'انترنت',           labelEn: 'Internet' },
      { key: 'stationery',        labelAr: 'مكتبة',            labelEn: 'Stationery' },
      { key: 'furnishings',       labelAr: 'فرش',              labelEn: 'Furnishings' },
      { key: 'juiceFurnishings',  labelAr: 'عصير فرش',         labelEn: 'Juice Furnishings' },
      { key: 'laborDelivery',     labelAr: 'طق عمالة',         labelEn: 'Labor Delivery' },
    ],
  },
] as const;

export type IncomeKey = typeof INCOME_CATEGORIES[number]['key'];
export type ExpenseCategoryKey =
  typeof EXPENSE_GROUPS[number]['categories'][number]['key'];

// ─── Main Data Type ───────────────────────────────────────────────────────
export interface MonthlyFinancial {
  id: string;               // "{residenceId}_{fiscalMonth}"
  residenceId: string;
  residenceName: string;
  fiscalMonth: string;      // "YYYY-MM"
  income: Partial<Record<IncomeKey, number>>;
  expenses: Partial<Record<ExpenseCategoryKey, number>>;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
export function calcTotalIncome(income: Partial<Record<IncomeKey, number>>): number {
  return Object.values(income).reduce((s, v) => s + (v || 0), 0);
}

export function calcTotalExpenses(expenses: Partial<Record<ExpenseCategoryKey, number>>): number {
  return Object.values(expenses).reduce((s, v) => s + (v || 0), 0);
}

export function makeEmptyFinancial(
  residenceId: string,
  residenceName: string,
  fiscalMonth: string,
): MonthlyFinancial {
  return {
    id: `${residenceId}_${fiscalMonth}`,
    residenceId,
    residenceName,
    fiscalMonth,
    income: {},
    expenses: {},
  };
}

export function formatSAR(value: number): string {
  if (!value) return '-';
  return value.toLocaleString('en-US');
}
