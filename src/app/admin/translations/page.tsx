'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { Search, Save, RotateCcw, Languages, Edit3, Globe, Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// استيراد القواميس الأصلية
import { dictionaries as originalDictionaries } from "@/lib/dictionaries";

interface TranslationEntry {
  key: string;
  english: string;
  arabic: string;
  category: string;
  description?: string;
}

export default function TranslationsManagementPage() {
  const { dict, locale, setLocale } = useLanguage();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [editedTranslations, setEditedTranslations] = useState<Record<string, { english?: string; arabic?: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // تصنيف الترجمات حسب الاستخدام
  const categorizeTranslations = () => {
    const englishDict = originalDictionaries.en;
    const arabicDict = originalDictionaries.ar;
    
    const translationEntries: TranslationEntry[] = [];
    
    // دالة مساعدة لاستخراج الترجمات من كائن متداخل
    const extractTranslations = (obj: any, prefix = '', arabicObj: any = null) => {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'string') {
          // البحث عن الترجمة العربية المقابلة
          let arabicValue = '';
          if (arabicObj && typeof arabicObj[key] === 'string') {
            arabicValue = arabicObj[key];
          } else if (prefix === '' && (arabicDict as any)[key]) {
            arabicValue = typeof (arabicDict as any)[key] === 'string' ? (arabicDict as any)[key] : '';
          }
          
          let category = 'general';
          let description = '';
          
          // تصنيف الكلمات حسب المحتوى
          if (fullKey.includes('sidebar') || fullKey.includes('navigation') || key === 'mainPage' || key === 'dashboard') {
            category = 'navigation';
            description = 'عناصر التنقل والقوائم الجانبية';
          } else if (fullKey.includes('button') || key.includes('save') || key.includes('cancel') || key.includes('delete')) {
            category = 'buttons';
            description = 'أزرار الإجراءات';
          } else if (fullKey.includes('form') || key.includes('input') || key.includes('placeholder')) {
            category = 'forms';
            description = 'النماذج وحقول الإدخال';
          } else if (fullKey.includes('error') || key.includes('success') || key.includes('warning')) {
            category = 'messages';
            description = 'الرسائل والتنبيهات';
          } else if (fullKey.includes('inventory') || key.includes('stock') || key.includes('item')) {
            category = 'inventory';
            description = 'إدارة المخزون';
          } else if (fullKey.includes('maintenance') || key.includes('service') || fullKey.includes('ServiceOrders')) {
            category = 'maintenance';
            description = 'الصيانة والخدمات';
          } else if (fullKey.includes('user') || key.includes('profile') || key.includes('auth')) {
            category = 'users';
            description = 'المستخدمين والحسابات';
          } else if (fullKey.includes('report') || key.includes('analytics')) {
            category = 'reports';
            description = 'التقارير والتحليلات';
          }
          
          translationEntries.push({
            key: fullKey,
            english: value,
            arabic: arabicValue,
            category,
            description
          });
        } else if (typeof value === 'object' && value !== null) {
          // معالجة الكائنات المتداخلة - البحث عن الكائن العربي المقابل
          const correspondingArabicObj = arabicObj && arabicObj[key] ? arabicObj[key] : 
                                       (prefix === '' && (arabicDict as any)[key] ? (arabicDict as any)[key] : null);
          extractTranslations(value, fullKey, correspondingArabicObj);
        }
      });
    };
    
    extractTranslations(englishDict, '', arabicDict);
    
    return translationEntries.sort((a, b) => a.key.localeCompare(b.key));
  };

  useEffect(() => {
    const entries = categorizeTranslations();
    setTranslations(entries);
    
    // تحميل الترجمات المحفوظة محلياً
    const savedTranslations = localStorage.getItem('customTranslations');
    if (savedTranslations) {
      try {
        const parsed = JSON.parse(savedTranslations);
        setEditedTranslations(parsed);
      } catch (error) {
        console.error('Error loading saved translations:', error);
      }
    }
  }, []);

  // تصفية الترجمات حسب البحث والفئة
  const filteredTranslations = translations.filter(translation => {
    const englishText = typeof translation.english === 'string' ? translation.english : '';
    const arabicText = typeof translation.arabic === 'string' ? translation.arabic : '';
    
    const matchesSearch = searchTerm === '' || 
      translation.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      englishText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arabicText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || translation.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // الحصول على الفئات المتاحة
  const categories = [
    { value: 'all', label: 'جميع الفئات', count: translations.length },
    { value: 'navigation', label: 'التنقل', count: translations.filter(t => t.category === 'navigation').length },
    { value: 'buttons', label: 'الأزرار', count: translations.filter(t => t.category === 'buttons').length },
    { value: 'forms', label: 'النماذج', count: translations.filter(t => t.category === 'forms').length },
    { value: 'messages', label: 'الرسائل', count: translations.filter(t => t.category === 'messages').length },
    { value: 'inventory', label: 'المخزون', count: translations.filter(t => t.category === 'inventory').length },
    { value: 'maintenance', label: 'الصيانة', count: translations.filter(t => t.category === 'maintenance').length },
    { value: 'users', label: 'المستخدمين', count: translations.filter(t => t.category === 'users').length },
    { value: 'reports', label: 'التقارير', count: translations.filter(t => t.category === 'reports').length },
    { value: 'general', label: 'عام', count: translations.filter(t => t.category === 'general').length }
  ].filter(cat => cat.count > 0);

  // تحديث ترجمة
  const updateTranslation = (key: string, field: 'english' | 'arabic', value: string) => {
    setEditedTranslations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // الحصول على القيمة المحدثة أو الأصلية
  const getValue = (translation: TranslationEntry, field: 'english' | 'arabic') => {
    return editedTranslations[translation.key]?.[field] ?? translation[field];
  };

  // حفظ التغييرات
  const saveChanges = () => {
    try {
      localStorage.setItem('customTranslations', JSON.stringify(editedTranslations));
      
      // تطبيق التغييرات على القواميس (سيتطلب إعادة تحميل الصفحة لتطبيق التغييرات)
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ التغييرات. سيتم تطبيقها عند إعادة تحميل الصفحة.",
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التغييرات.",
        variant: "destructive"
      });
    }
  };

  // إعادة تعيين التغييرات
  const resetChanges = () => {
    setEditedTranslations({});
    localStorage.removeItem('customTranslations');
    setHasChanges(false);
    toast({
      title: "تم الإعادة تعيين",
      description: "تم إعادة جميع الترجمات للقيم الافتراضية.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Languages className="h-8 w-8 text-primary" />
            إدارة الترجمات
          </h1>
          <p className="text-muted-foreground mt-2">
            قم بتخصيص الترجمات العربية والإنجليزية حسب احتياجاتك
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} 
            variant="outline"
            size="sm"
          >
            <Globe className="h-4 w-4 mr-2" />
            {locale === 'ar' ? 'English' : 'العربية'}
          </Button>
          
          {hasChanges && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    إعادة تعيين
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>إعادة تعيين التغييرات</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من إعادة جميع الترجمات للقيم الافتراضية؟ سيتم فقدان جميع التخصيصات.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={resetChanges}>إعادة تعيين</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button onClick={saveChanges} size="sm">
                <Save className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </Button>
            </>
          )}
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الترجمات</p>
                <p className="text-2xl font-bold">{translations.length}</p>
              </div>
              <Type className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المُعدّلة</p>
                <p className="text-2xl font-bold text-primary">{Object.keys(editedTranslations).length}</p>
              </div>
              <Edit3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الفئات</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <Languages className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">اللغة الحالية</p>
                <p className="text-2xl font-bold">{locale === 'ar' ? 'العربية' : 'English'}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">البحث في الترجمات</Label>
              <Input
                id="search"
                placeholder="ابحث بالمفتاح أو النص الإنجليزي أو العربي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label>الفئات</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map(category => (
                <Badge
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label} ({category.count})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الترجمات */}
      <Card>
        <CardHeader>
          <CardTitle>الترجمات ({filteredTranslations.length})</CardTitle>
          <CardDescription>
            انقر على أي حقل لتحريره. التغييرات ستُحفظ محلياً وتُطبق عند إعادة تحميل الصفحة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredTranslations.map((translation, index) => (
                <div key={translation.key} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {translation.key}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.value === translation.category)?.label}
                      </Badge>
                    </div>
                    
                    {editedTranslations[translation.key] && (
                      <Badge variant="default" className="text-xs">
                        معدّل
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`en-${translation.key}`} className="text-sm font-medium">
                        🇺🇸 English
                      </Label>
                      <Textarea
                        id={`en-${translation.key}`}
                        value={getValue(translation, 'english')}
                        onChange={(e) => updateTranslation(translation.key, 'english', e.target.value)}
                        className="mt-1 min-h-[60px]"
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`ar-${translation.key}`} className="text-sm font-medium">
                        🇸🇦 العربية
                      </Label>
                      <Textarea
                        id={`ar-${translation.key}`}
                        value={getValue(translation, 'arabic')}
                        onChange={(e) => updateTranslation(translation.key, 'arabic', e.target.value)}
                        className="mt-1 min-h-[60px]"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  
                  {translation.description && (
                    <p className="text-sm text-muted-foreground">
                      {translation.description}
                    </p>
                  )}
                  
                  {index < filteredTranslations.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* تنبيه للتغييرات غير المحفوظة */}
      {hasChanges && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-sm text-amber-700">
                  لديك تغييرات غير محفوظة. لا تنسَ حفظها قبل مغادرة الصفحة.
                </p>
              </div>
              
              <Button onClick={saveChanges} size="sm" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                حفظ الآن
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
