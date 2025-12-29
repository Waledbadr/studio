import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

// FISCAL_START_DAY = 20 means the fiscal month ENDS on day 20
// The next fiscal month STARTS on day 21 (FISCAL_START_DAY + 1)
export const FISCAL_START_DAY = 20; // End day of fiscal month

export interface FiscalPeriod {
  startDate: Date;
  endDate: Date;
  labelEn: string;
  labelAr: string;
  numberOfDays: number;
}

/**
 * Returns the fiscal period for a given month string (YYYY-MM).
 * Fiscal month logic:
 * - First month of fiscal year (January) starts on day 21 of previous December
 * - Each subsequent month starts the day after the previous month ends
 * - Each month duration = number of days in that calendar month
 * 
 * Examples from actual table:
 * - Jan 2025: 21/12/2024 to 20/01/2025 (31 days)
 * - Feb 2025: 21/01/2025 to 17/02/2025 (28 days) 
 * - Mar 2025: 18/02/2025 to 20/03/2025 (31 days)
 * - Apr 2025: 21/03/2025 to 19/04/2025 (30 days)
 */
export function getFiscalMonthPeriod(monthStr: string, startDay: number = FISCAL_START_DAY): FiscalPeriod {
  if (!monthStr) {
    return {
      startDate: new Date(),
      endDate: new Date(),
      labelEn: '',
      labelAr: '',
      numberOfDays: 0
    };
  }

  const parts = monthStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  
  if (isNaN(year) || isNaN(month)) {
     return {
      startDate: new Date(),
      endDate: new Date(),
      labelEn: 'Invalid Date',
      labelAr: 'تاريخ غير صالح',
      numberOfDays: 0
    };
  }
  
  // Get number of days in the current month
  const numberOfDays = new Date(year, month, 0).getDate();
  
  // Calculate start date:
  // For January (month=1): starts on day 21 of previous December
  // For other months: calculate based on previous month's end
  let startDate: Date;
  
  if (month === 1) {
    // January starts on 21st of previous December
    startDate = new Date(Date.UTC(year - 1, 11, startDay + 1, 0, 0, 0, 0));
  } else {
    // Get the end date of previous month and add 1 day
    const prevMonthPeriod = getFiscalMonthPeriod(`${year}-${String(month - 1).padStart(2, '0')}`, startDay);
    startDate = new Date(prevMonthPeriod.endDate.getTime());
    // Add 1 day and reset to start of day
    startDate.setUTCDate(startDate.getUTCDate() + 1);
    startDate.setUTCHours(0, 0, 0, 0);
  }
  
  // Calculate end date: start date + numberOfDays - 1 day (at end of day)
  const endDate = new Date(startDate.getTime());
  endDate.setUTCDate(endDate.getUTCDate() + numberOfDays - 1);
  endDate.setUTCHours(23, 59, 59, 999);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
     return {
      startDate: new Date(),
      endDate: new Date(),
      labelEn: 'Invalid Date',
      labelAr: 'تاريخ غير صالح',
      numberOfDays: 0
    };
  }

  // Format dates using UTC to avoid timezone issues
  const formatUTC = (date: Date) => {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return {
    startDate,
    endDate,
    labelEn: `${formatUTC(startDate)} - ${formatUTC(endDate)}`,
    labelAr: `${formatUTC(startDate)} - ${formatUTC(endDate)}`,
    numberOfDays
  };
}

export function formatFiscalDate(date: string | Date, locale: 'ar' | 'en' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy', { locale: locale === 'ar' ? arSA : enUS });
}
