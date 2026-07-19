import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

/**
 * FISCAL CALIBRATION RULE (User Defined):
 * Reference Month: March 2026 ("2026-03")
 * Reference Start: February 18, 2026 (18/02/2026) -> In JS UTC: Date.UTC(2026, 1, 18)
 * 
 * Logic: CHAIN-LINK Sequence
 * End of Month = (Start of Month + Days in Calendar Month) - 1
 * Start of Next = End + 1
 * Start of Prev = Start - Days in Previous Calendar Month
 */

const REF_MONTH_STR = "2026-03";
const REF_START_DATE = new Date(Date.UTC(2026, 1, 18, 0, 0, 0, 0)); // 18/02/2026

// Exported constant used by invoice pages as a default fiscal period start day.
// Matches the reference start date day in the chain-link rule: 18/02/2026.
export const FISCAL_START_DAY = 18;


export interface FiscalPeriod {
  startDate: Date;
  endDate: Date;
  labelEn: string;
  labelAr: string;
  numberOfDays: number;
}

/**
 * Calculates the fiscal period (start/end) for a given YYYY-MM string
 * using the iterative chain-link rule starting from 2026-03.
 */
export function getFiscalMonthPeriod(monthStr: string): FiscalPeriod {
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

  // Calculate days in the TARGET month (e.g. March has 31 days)
  const numberOfDaysInTarget = new Date(Date.UTC(year, month, 0)).getUTCDate();
  
  // Calculate Start Date by iterating from Reference
  const [refY, refM] = REF_MONTH_STR.split('-').map(Number);
  const targetVal = year * 12 + (month - 1);
  const refVal = refY * 12 + (refM - 1);

  const startDate = new Date(REF_START_DATE.getTime());


  if (targetVal > refVal) {
    // Go Forward: add calendar days of each intermediate month
    for (let v = refVal; v < targetVal; v++) {
      const vY = Math.floor(v / 12);
      const vM = (v % 12) + 1; // 1-indexed
      const daysInV = new Date(Date.UTC(vY, vM, 0)).getUTCDate();
      startDate.setUTCDate(startDate.getUTCDate() + daysInV);
    }
  } else if (targetVal < refVal) {
    // Go Backward: subtract calendar days of previous month
    for (let v = refVal - 1; v >= targetVal; v--) {
      const vY = Math.floor(v / 12);
      const vM = (v % 12) + 1;
      const daysInPrev = new Date(Date.UTC(vY, vM, 0)).getUTCDate();
      startDate.setUTCDate(startDate.getUTCDate() - daysInPrev);
    }
  }
  
  // Calculate end date: start date + numberOfDays - 1 day
  const endDate = new Date(startDate.getTime());
  endDate.setUTCDate(endDate.getUTCDate() + numberOfDaysInTarget - 1);
  endDate.setUTCHours(23, 59, 59, 999);
  
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
    numberOfDays: numberOfDaysInTarget
  };
}

/**
 * Returns the YYYY-MM string representing the fiscal period for a given date.
 * Strictly uses the iterative search to match the Chain-Link sequence.
 */
export function getFiscalMonthForDate(d: Date): string {
    const dTime = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    
    // Start searching from a reasonable range (e.g. +/- 24 months from reference)
    const [refY, refM] = REF_MONTH_STR.split('-').map(Number);
    const refVal = refY * 12 + (refM - 1);
    
    // We search across 4 years to find the period
    for (let v = refVal - 24; v <= refVal + 24; v++) {
        const vY = Math.floor(v / 12);
        const vM = (v % 12) + 1;
        const monthStr = `${vY}-${String(vM).padStart(2, '0')}`;
        const period = getFiscalMonthPeriod(monthStr);
        if (dTime >= period.startDate.getTime() && dTime <= period.endDate.getTime()) {
            return monthStr;
        }
    }
    
    // Fallback to naive logic if way out of range
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns the YYYY-MM string for the previous fiscal month.
 */
export function getPreviousFiscalMonth(monthStr: string): string {
    const parts = monthStr.split('-');
    let year = Number(parts[0]);
    let month = Number(parts[1]);
    if (month === 1) {
        year -= 1;
        month = 12;
    } else {
        month -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatFiscalDate(date: string | Date, locale: 'ar' | 'en' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy', { locale: locale === 'ar' ? arSA : enUS });
}

/**
 * Splits a date range into chunks of specified days.
 * Used to avoid timeouts when fetching large ranges from slow sources.
 */
export function getDateChunks(startDate: string, endDate: string, daysPerChunk = 7): { start: string, end: string }[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const chunks = [];
  
let current = new Date(start);
  while (current <= end) {
    let currentEnd = new Date(current);
    currentEnd.setDate(currentEnd.getDate() + daysPerChunk - 1);
    
    if (currentEnd > end) {
      currentEnd = new Date(end);
    }
    
chunks.push({
      start: current.toISOString().split('T')[0],
      end: currentEnd.toISOString().split('T')[0]
    });
    
    current = new Date(current.getTime());
    current.setDate(current.getDate() + daysPerChunk);
  }
  
  return chunks;
}
