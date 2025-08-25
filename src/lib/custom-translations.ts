import { dictionaries as originalDictionaries, type Dictionary } from './dictionaries';

// دالة لتحميل الترجمات المخصصة من localStorage
export function loadCustomTranslations(): Dictionary {
  if (typeof window === 'undefined') {
    return originalDictionaries.en;
  }

  try {
    const customTranslations = localStorage.getItem('customTranslations');
    if (!customTranslations) {
      return originalDictionaries.en;
    }

    const parsed = JSON.parse(customTranslations);
    
    // دمج الترجمات المخصصة مع الأصلية
    const mergedEn = { ...originalDictionaries.en };
    const mergedAr = { ...originalDictionaries.ar };

    Object.keys(parsed).forEach(key => {
      if (parsed[key].english !== undefined) {
        (mergedEn as any)[key] = parsed[key].english;
      }
      if (parsed[key].arabic !== undefined) {
        (mergedAr as any)[key] = parsed[key].arabic;
      }
    });

    return mergedEn;
  } catch (error) {
    console.error('Error loading custom translations:', error);
    return originalDictionaries.en;
  }
}

// دالة لتحميل القواميس مع الترجمات المخصصة
export function getCustomDictionaries() {
  if (typeof window === 'undefined') {
    return originalDictionaries;
  }

  try {
    const customTranslations = localStorage.getItem('customTranslations');
    if (!customTranslations) {
      return originalDictionaries;
    }

    const parsed = JSON.parse(customTranslations);
    
    // دمج الترجمات المخصصة مع الأصلية
    const mergedEn = JSON.parse(JSON.stringify(originalDictionaries.en)); // نسخ عميق
    const mergedAr = JSON.parse(JSON.stringify(originalDictionaries.ar)); // نسخ عميق

    Object.keys(parsed).forEach(key => {
      if (parsed[key].english !== undefined) {
        setNestedValue(mergedEn, key, parsed[key].english);
      }
      if (parsed[key].arabic !== undefined) {
        setNestedValue(mergedAr, key, parsed[key].arabic);
      }
    });

    return {
      en: mergedEn,
      ar: mergedAr
    };
  } catch (error) {
    console.error('Error loading custom dictionaries:', error);
    return originalDictionaries;
  }
}

// دالة مساعدة لتعيين قيمة في كائن متداخل
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

// دالة لحفظ ترجمة مخصصة
export function saveCustomTranslation(key: string, english?: string, arabic?: string) {
  if (typeof window === 'undefined') return;

  try {
    const existingTranslations = JSON.parse(localStorage.getItem('customTranslations') || '{}');
    
    existingTranslations[key] = {
      ...existingTranslations[key],
      ...(english !== undefined && { english }),
      ...(arabic !== undefined && { arabic })
    };

    localStorage.setItem('customTranslations', JSON.stringify(existingTranslations));
    
    // إرسال حدث لتحديث السياق
    window.dispatchEvent(new CustomEvent('customTranslationsUpdated'));
  } catch (error) {
    console.error('Error saving custom translation:', error);
  }
}

// دالة لحذف الترجمات المخصصة
export function clearCustomTranslations() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('customTranslations');
  window.dispatchEvent(new CustomEvent('customTranslationsUpdated'));
}

// دالة للحصول على إحصائيات الترجمات المخصصة
export function getCustomTranslationsStats() {
  if (typeof window === 'undefined') {
    return { totalCustom: 0, totalOriginal: 0 };
  }

  try {
    const customTranslations = localStorage.getItem('customTranslations');
    const totalOriginal = Object.keys(originalDictionaries.en).length;
    const totalCustom = customTranslations ? Object.keys(JSON.parse(customTranslations)).length : 0;

    return { totalCustom, totalOriginal };
  } catch (error) {
    console.error('Error getting custom translations stats:', error);
    return { totalCustom: 0, totalOriginal: Object.keys(originalDictionaries.en).length };
  }
}
