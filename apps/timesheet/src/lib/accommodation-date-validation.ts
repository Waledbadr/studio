import { Timestamp } from 'firebase/firestore';

/**
 * Accommodation Date Validation Utilities
 * Provides validation functions for accommodation date operations
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ValidationError {
  isValid: false;
  errorAr: string;
  errorEn: string;
  errorCode: string;
}

export interface ValidationSuccess {
  isValid: true;
}

export type ValidationResult = ValidationSuccess | ValidationError;

export interface WorkerHistoryRecord {
  id: string;
  workerId: string;
  checkInDate: Date | Timestamp;
  checkOutDate?: Date | Timestamp | null;
  roomId: string;
  residenceId: string;
}

export interface InvoiceRecord {
  id: string;
  month: number;
  year: number;
  residenceId: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  createdAt: Date | Timestamp;
}

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES = {
  CHECKIN_IN_FUTURE: {
    ar: 'تاريخ الدخول لا يمكن أن يكون في المستقبل',
    en: 'Check-in date cannot be in the future',
    code: 'CHECKIN_IN_FUTURE',
  },
  CHECKOUT_IN_FUTURE: {
    ar: 'تاريخ الخروج لا يمكن أن يكون في المستقبل',
    en: 'Check-out date cannot be in the future',
    code: 'CHECKOUT_IN_FUTURE',
  },
  CHECKIN_BEFORE_LAST_CHECKOUT: {
    ar: 'تاريخ الدخول الجديد يجب أن يكون بعد آخر تاريخ خروج للعامل',
    en: 'New check-in date must be after the last check-out date',
    code: 'CHECKIN_BEFORE_LAST_CHECKOUT',
  },
  DATE_CONFLICT_WITH_HISTORY: {
    ar: 'يوجد تعارض في التواريخ مع سجلات العامل السابقة',
    en: 'Date conflict with previous worker records',
    code: 'DATE_CONFLICT_WITH_HISTORY',
  },
  MONTH_ALREADY_INVOICED: {
    ar: 'تم إصدار فاتورة لهذا الشهر بالفعل ولا يمكن التعديل',
    en: 'Invoice has been issued for this month and cannot be modified',
    code: 'MONTH_ALREADY_INVOICED',
  },
  CANNOT_MODIFY_INVOICED_PERIOD: {
    ar: 'لا يمكن تعديل السجلات في فترة تم إصدار فاتورة لها',
    en: 'Cannot modify records in an invoiced period',
    code: 'CANNOT_MODIFY_INVOICED_PERIOD',
  },
  INVALID_DATE_RANGE: {
    ar: 'تاريخ الدخول يجب أن يكون قبل تاريخ الخروج',
    en: 'Check-in date must be before check-out date',
    code: 'INVALID_DATE_RANGE',
  },
  CHECKOUT_BEFORE_CHECKIN: {
    ar: 'تاريخ الخروج لا يمكن أن يكون قبل تاريخ الدخول',
    en: 'Check-out date cannot be before check-in date',
    code: 'CHECKOUT_BEFORE_CHECKIN',
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Converts Firestore Timestamp or Date to Date object
 */
function toDate(dateValue: Date | Timestamp | null | undefined): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if ('toDate' in dateValue) return dateValue.toDate();
  return null;
}

/**
 * Gets the start of day (00:00:00) for a given date
 */
function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of day (23:59:59) for a given date
 */
function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Checks if a date falls within a specific month and year
 */
function isDateInMonth(date: Date, month: number, year: number): boolean {
  return date.getMonth() === month && date.getFullYear() === year;
}

/**
 * Checks if a date range overlaps with a specific month
 */
function dateRangeOverlapsMonth(
  startDate: Date,
  endDate: Date | null,
  month: number,
  year: number
): boolean {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // If no end date, assume still ongoing
  const effectiveEndDate = endDate || new Date();

  // Check for any overlap
  return startDate <= monthEnd && effectiveEndDate >= monthStart;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates that check-in date is not in the future
 * @param checkInDate - The check-in date to validate
 * @returns ValidationResult indicating if the date is valid
 */
export function validateCheckInDate(
  checkInDate: Date | Timestamp | null | undefined
): ValidationResult {
  if (!checkInDate) {
    // No check-in date means use current date - this is valid
    return { isValid: true };
  }

  const date = toDate(checkInDate);
  if (!date) {
    return { isValid: true };
  }

  const now = new Date();
  const checkinStartOfDay = getStartOfDay(date);
  const todayStartOfDay = getStartOfDay(now);

  // Only reject if check-in date is strictly after today (future dates only)
  if (checkinStartOfDay > todayStartOfDay) {
    return {
      isValid: false,
      errorAr: ERROR_MESSAGES.CHECKIN_IN_FUTURE.ar,
      errorEn: ERROR_MESSAGES.CHECKIN_IN_FUTURE.en,
      errorCode: ERROR_MESSAGES.CHECKIN_IN_FUTURE.code,
    };
  }

  return { isValid: true };
}

/**
 * Validates that check-out date is not in the future
 * @param checkOutDate - The check-out date to validate
 * @returns ValidationResult indicating if the date is valid
 */
export function validateCheckOutDate(
  checkOutDate: Date | Timestamp | null | undefined
): ValidationResult {
  if (!checkOutDate) {
    // No checkout date means still checked in - this is valid
    return { isValid: true };
  }

  const date = toDate(checkOutDate);
  if (!date) {
    return { isValid: true };
  }

  const now = new Date();
  const checkoutStartOfDay = getStartOfDay(date);
  const todayStartOfDay = getStartOfDay(now);

  // Only reject if checkout date is strictly after today (future dates only)
  if (checkoutStartOfDay > todayStartOfDay) {
    return {
      isValid: false,
      errorAr: ERROR_MESSAGES.CHECKOUT_IN_FUTURE.ar,
      errorEn: ERROR_MESSAGES.CHECKOUT_IN_FUTURE.en,
      errorCode: ERROR_MESSAGES.CHECKOUT_IN_FUTURE.code,
    };
  }

  return { isValid: true };
}

/**
 * Validates date range consistency (check-in before check-out)
 * @param checkInDate - The check-in date
 * @param checkOutDate - The check-out date (optional)
 * @returns ValidationResult
 */
export function validateDateRange(
  checkInDate: Date | Timestamp,
  checkOutDate?: Date | Timestamp | null
): ValidationResult {
  if (!checkOutDate) {
    return { isValid: true };
  }

  const checkIn = toDate(checkInDate);
  const checkOut = toDate(checkOutDate);

  if (!checkIn || !checkOut) {
    return { isValid: true };
  }

  const checkInStart = getStartOfDay(checkIn);
  const checkOutEnd = getEndOfDay(checkOut);

  if (checkOutEnd < checkInStart) {
    return {
      isValid: false,
      errorAr: ERROR_MESSAGES.CHECKOUT_BEFORE_CHECKIN.ar,
      errorEn: ERROR_MESSAGES.CHECKOUT_BEFORE_CHECKIN.en,
      errorCode: ERROR_MESSAGES.CHECKOUT_BEFORE_CHECKIN.code,
    };
  }

  return { isValid: true };
}

/**
 * Validates that new check-in doesn't conflict with worker's previous records
 * @param workerId - The worker ID
 * @param newCheckInDate - The new check-in date
 * @param workerHistory - Array of previous worker records (sorted by check-in date desc)
 * @param excludeRecordId - Optional record ID to exclude (for edit scenarios)
 * @returns ValidationResult
 */
export function validateDateConflicts(
  workerId: string,
  newCheckInDate: Date | Timestamp,
  workerHistory: WorkerHistoryRecord[],
  excludeRecordId?: string
): ValidationResult {
  const checkIn = toDate(newCheckInDate);
  if (!checkIn) {
    return { isValid: true };
  }

  // Filter out the record being edited (if any)
  const relevantHistory = workerHistory.filter(
    (record) => record.workerId === workerId && record.id !== excludeRecordId
  );

  if (relevantHistory.length === 0) {
    return { isValid: true };
  }

  // Sort by check-in date descending to find the most recent record
  const sortedHistory = [...relevantHistory].sort((a, b) => {
    const dateA = toDate(a.checkInDate)?.getTime() || 0;
    const dateB = toDate(b.checkInDate)?.getTime() || 0;
    return dateB - dateA;
  });

  // Get the most recent record
  const lastRecord = sortedHistory[0];
  const lastCheckOut = toDate(lastRecord.checkOutDate);

  // If the last record has no checkout date (still checked in), there's a conflict
  if (!lastCheckOut) {
    return {
      isValid: false,
      errorAr: 'العامل لديه سجل إقامة نشط بالفعل. يجب تسجيل خروجه أولاً',
      errorEn: 'Worker has an active accommodation record. Must check out first',
      errorCode: 'WORKER_STILL_CHECKED_IN',
    };
  }

  // New check-in must be after (or same day as) last check-out
  const checkInStart = getStartOfDay(checkIn);
  const lastCheckOutStart = getStartOfDay(lastCheckOut);

  if (checkInStart < lastCheckOutStart) {
    return {
      isValid: false,
      errorAr: ERROR_MESSAGES.CHECKIN_BEFORE_LAST_CHECKOUT.ar,
      errorEn: ERROR_MESSAGES.CHECKIN_BEFORE_LAST_CHECKOUT.en,
      errorCode: ERROR_MESSAGES.CHECKIN_BEFORE_LAST_CHECKOUT.code,
    };
  }

  return { isValid: true };
}

/**
 * Checks if a specific month has been invoiced
 * @param month - Month number (0-11, JavaScript convention)
 * @param year - Year
 * @param residenceId - Residence ID
 * @param invoices - Array of invoice records
 * @returns boolean indicating if the month is invoiced
 */
export function isMonthInvoiced(
  month: number,
  year: number,
  residenceId: string,
  invoices: InvoiceRecord[]
): boolean {
  return invoices.some(
    (invoice) =>
      invoice.month === month &&
      invoice.year === year &&
      invoice.residenceId === residenceId &&
      invoice.status === 'issued' // Only issued invoices prevent modification
  );
}

/**
 * Checks if a date range has been invoiced
 * @param startDate - Start date of the range
 * @param endDate - End date of the range (null for ongoing)
 * @param residenceId - Residence ID
 * @param invoices - Array of invoice records
 * @returns boolean indicating if any part of the range is invoiced
 */
export function isDateRangeInvoiced(
  startDate: Date | Timestamp,
  endDate: Date | Timestamp | null | undefined,
  residenceId: string,
  invoices: InvoiceRecord[]
): boolean {
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!start) return false;

  // Check each invoice to see if it overlaps with the date range
  return invoices.some((invoice) => {
    if (invoice.residenceId !== residenceId) return false;
    if (invoice.status !== 'issued') return false;

    return dateRangeOverlapsMonth(
      start,
      end,
      invoice.month,
      invoice.year
    );
  });
}

/**
 * Checks if a history record can be modified based on invoice status
 * @param record - The history record to check
 * @param invoices - Array of invoice records
 * @returns ValidationResult
 */
export function canModifyHistoryRecord(
  record: WorkerHistoryRecord,
  invoices: InvoiceRecord[]
): ValidationResult {
  const checkIn = toDate(record.checkInDate);
  const checkOut = toDate(record.checkOutDate);

  if (!checkIn) {
    return { isValid: true };
  }

  // Check if the record's date range has been invoiced
  const isInvoiced = isDateRangeInvoiced(
    checkIn,
    checkOut,
    record.residenceId,
    invoices
  );

  if (isInvoiced) {
    return {
      isValid: false,
      errorAr: ERROR_MESSAGES.CANNOT_MODIFY_INVOICED_PERIOD.ar,
      errorEn: ERROR_MESSAGES.CANNOT_MODIFY_INVOICED_PERIOD.en,
      errorCode: ERROR_MESSAGES.CANNOT_MODIFY_INVOICED_PERIOD.code,
    };
  }

  return { isValid: true };
}

/**
 * Validates a complete accommodation operation (check-in or check-out)
 * @param params - Validation parameters
 * @returns ValidationResult with detailed error information
 */
export function validateAccommodationOperation(params: {
  workerId: string;
  checkInDate: Date | Timestamp;
  checkOutDate?: Date | Timestamp | null;
  residenceId: string;
  workerHistory: WorkerHistoryRecord[];
  invoices: InvoiceRecord[];
  excludeRecordId?: string;
}): ValidationResult {
  const {
    workerId,
    checkInDate,
    checkOutDate,
    residenceId,
    workerHistory,
    invoices,
    excludeRecordId,
  } = params;

  // 1. Validate date range
  const rangeValidation = validateDateRange(checkInDate, checkOutDate);
  if (!rangeValidation.isValid) {
    return rangeValidation;
  }

  // 2. Validate checkout date is not in future
  if (checkOutDate) {
    const checkoutValidation = validateCheckOutDate(checkOutDate);
    if (!checkoutValidation.isValid) {
      return checkoutValidation;
    }
  }

  // 3. Validate no conflicts with worker history
  const conflictValidation = validateDateConflicts(
    workerId,
    checkInDate,
    workerHistory,
    excludeRecordId
  );
  if (!conflictValidation.isValid) {
    return conflictValidation;
  }

  // 4. Check if the period has been invoiced
  const checkIn = toDate(checkInDate);
  const checkOut = toDate(checkOutDate);

  if (checkIn) {
    const isInvoiced = isDateRangeInvoiced(
      checkIn,
      checkOut,
      residenceId,
      invoices
    );

    if (isInvoiced) {
      return {
        isValid: false,
        errorAr: ERROR_MESSAGES.CANNOT_MODIFY_INVOICED_PERIOD.ar,
        errorEn: ERROR_MESSAGES.CANNOT_MODIFY_INVOICED_PERIOD.en,
        errorCode: ERROR_MESSAGES.CANNOT_MODIFY_INVOICED_PERIOD.code,
      };
    }
  }

  return { isValid: true };
}

// ============================================================================
// Helper Functions for UI
// ============================================================================

/**
 * Gets user-friendly error message in the specified language
 * @param validationResult - The validation result
 * @param language - Language preference ('ar' or 'en')
 * @returns Formatted error message or empty string if valid
 */
export function getValidationErrorMessage(
  validationResult: ValidationResult,
  language: 'ar' | 'en' = 'ar'
): string {
  if (validationResult.isValid) {
    return '';
  }

  return language === 'ar' ? validationResult.errorAr : validationResult.errorEn;
}

/**
 * Checks if a date can be selected for checkout based on invoicing status
 * @param date - The date to check
 * @param checkInDate - The check-in date of the record
 * @param residenceId - Residence ID
 * @param invoices - Array of invoice records
 * @returns boolean indicating if the date can be selected
 */
export function canSelectCheckoutDate(
  date: Date,
  checkInDate: Date | Timestamp,
  residenceId: string,
  invoices: InvoiceRecord[]
): boolean {
  // Can't select future dates
  const now = new Date();
  if (date > now) {
    return false;
  }

  // Can't select date before check-in
  const checkIn = toDate(checkInDate);
  if (checkIn && date < checkIn) {
    return false;
  }

  // Can't select date in an invoiced period
  const isInvoiced = isDateRangeInvoiced(checkIn!, date, residenceId, invoices);
  return !isInvoiced;
}

/**
 * Gets the earliest allowed checkout date based on invoicing
 * @param checkInDate - The check-in date
 * @param residenceId - Residence ID
 * @param invoices - Array of invoice records
 * @returns Date representing the earliest allowed checkout, or null if none
 */
export function getEarliestAllowedCheckout(
  checkInDate: Date | Timestamp,
  residenceId: string,
  invoices: InvoiceRecord[]
): Date | null {
  const checkIn = toDate(checkInDate);
  if (!checkIn) return null;

  // Find the latest invoiced month that overlaps with or is after check-in
  const relevantInvoices = invoices
    .filter(
      (inv) =>
        inv.residenceId === residenceId &&
        inv.status === 'issued' &&
        (inv.year > checkIn.getFullYear() ||
          (inv.year === checkIn.getFullYear() && inv.month >= checkIn.getMonth()))
    )
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  if (relevantInvoices.length === 0) {
    return checkIn; // No invoices, can checkout from check-in date
  }

  const latestInvoice = relevantInvoices[0];
  // Return the first day of the month after the latest invoiced month
  return new Date(latestInvoice.year, latestInvoice.month + 1, 1);
}
