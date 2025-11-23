import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

export const FISCAL_START_DAY = 20;

export interface FiscalPeriod {
  startDate: Date;
  endDate: Date;
  labelEn: string;
  labelAr: string;
}

/**
 * Returns the fiscal period for a given month string (YYYY-MM).
 * The fiscal month for "2025-10" starts on Sep 20, 2025 and ends on Oct 19, 2025.
 * (Adjust logic if the user meant 20th to 20th inclusive, but usually it's non-overlapping)
 */
export function getFiscalMonthPeriod(monthStr: string, startDay: number = FISCAL_START_DAY): FiscalPeriod {
  if (!monthStr) {
    return {
      startDate: new Date(),
      endDate: new Date(),
      labelEn: '',
      labelAr: ''
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
      labelAr: 'تاريخ غير صالح'
    };
  }
  
  // Fiscal month X covers:
  // Start: startDay of (X-1)
  // End: (startDay - 1) of X
  
  // Note: Month in Date constructor is 0-indexed.
  // month is 1-based (e.g. 10 for Oct).
  // Prev month index: month - 2.
  // Current month index: month - 1.
  
  const startDate = new Date(Date.UTC(year, month - 2, startDay));
  const endDate = new Date(Date.UTC(year, month - 1, startDay)); // Using startDay as end date (exclusive)
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
     return {
      startDate: new Date(),
      endDate: new Date(),
      labelEn: 'Invalid Date',
      labelAr: 'تاريخ غير صالح'
    };
  }

  return {
    startDate,
    endDate,
    labelEn: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
    labelAr: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
  };
}

export function formatFiscalDate(date: string | Date, locale: 'ar' | 'en' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy', { locale: locale === 'ar' ? arSA : enUS });
}
