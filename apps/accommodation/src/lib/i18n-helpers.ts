/**
 * Internationalization Helpers
 * Provides utilities for detecting user language and selecting appropriate messages
 */

/**
 * Detects the user's preferred language
 * @returns 'ar' for Arabic, 'en' for English
 */
export function getUserLanguage(): 'ar' | 'en' {
  if (typeof window === 'undefined') return 'ar'; // Default to Arabic on server
  
  // Check localStorage first for user preference
  const savedLang = localStorage.getItem('userLanguage');
  if (savedLang === 'ar' || savedLang === 'en') {
    return savedLang;
  }
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  
  // If browser language starts with 'ar', use Arabic
  if (browserLang.startsWith('ar')) {
    return 'ar';
  }
  
  // Default to English for all other languages
  return 'en';
}

/**
 * Sets the user's preferred language
 * @param lang - 'ar' for Arabic, 'en' for English
 */
export function setUserLanguage(lang: 'ar' | 'en') {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userLanguage', lang);
  }
}

/**
 * Gets the appropriate message based on user's language
 * @param messages - Object with 'ar' and 'en' properties
 * @returns The message in the user's preferred language
 */
export function getLocalizedMessage(messages: { ar: string; en: string }): string {
  const lang = getUserLanguage();
  return messages[lang];
}

/**
 * Common error messages in both languages
 */
export const ERROR_MESSAGES = {
  CHECKIN_IN_FUTURE: {
    ar: 'تاريخ التسكين لا يمكن أن يكون في المستقبل',
    en: 'Check-in date cannot be in the future'
  },
  CHECKOUT_IN_FUTURE: {
    ar: 'تاريخ الخروج لا يمكن أن يكون في المستقبل',
    en: 'Check-out date cannot be in the future'
  },
  DATE_CONFLICT_WITH_HISTORY: {
    ar: 'يوجد تعارض في التواريخ مع سجلات العامل السابقة',
    en: 'Date conflict with previous worker records'
  },
  CHECKIN_BEFORE_LAST_CHECKOUT: {
    ar: 'تاريخ التسكين يجب أن يكون بعد آخر تاريخ خروج للعامل',
    en: 'Check-in date must be after the last check-out date'
  },
  CHECKOUT_BEFORE_CHECKIN: {
    ar: 'تاريخ الخروج لا يمكن أن يكون قبل تاريخ الدخول',
    en: 'Check-out date cannot be before check-in date'
  },
  MONTH_ALREADY_INVOICED: {
    ar: 'تم إصدار فاتورة لهذا الشهر ولا يمكن التعديل',
    en: 'Invoice has been issued for this month and cannot be modified'
  },
  'nationality-mismatch': {
    ar: 'الجنسية لا تطابق ساكني الغرفة',
    en: 'Nationality does not match room occupants'
  },
  'role-mismatch': {
    ar: 'الدور الوظيفي لا يطابق ساكني الغرفة',
    en: 'Role does not match room occupants'
  },
  'room-full': {
    ar: 'الغرفة ممتلئة',
    en: 'Room is full'
  },
  'room-not-found': {
    ar: 'الغرفة غير موجودة',
    en: 'Room not found'
  },
  'worker-not-found': {
    ar: 'العامل غير موجود',
    en: 'Worker not found'
  },
  'worker-already-assigned': {
    ar: 'العامل مسكّن بالفعل في غرفة أخرى',
    en: 'Worker already assigned to another room'
  },
  'worker-not-assigned': {
    ar: 'العامل غير مسكّن',
    en: 'Worker not assigned'
  }
} as const;

/**
 * Common UI text in both languages
 */
export const UI_TEXT = {
  titles: {
    error: { ar: 'خطأ', en: 'Error' },
    success: { ar: 'نجاح', en: 'Success' },
    warning: { ar: 'تحذير', en: 'Warning' },
    validationError: { ar: 'خطأ في التحقق من التاريخ', en: 'Date Validation Error' },
    dateConflict: { ar: 'تعارض في التواريخ', en: 'Date Conflict' },
    assignmentFailed: { ar: 'فشل التسكين', en: 'Assignment Failed' },
    assignmentIssues: { ar: 'مشاكل في التسكين', en: 'Assignment Issues' },
    cannotModify: { ar: 'لا يمكن التعديل', en: 'Cannot Modify' },
    recordUpdated: { ar: 'تم تحديث السجل', en: 'Record Updated' },
    updateFailed: { ar: 'فشل تحديث السجل', en: 'Update Failed' }
  }
} as const;
