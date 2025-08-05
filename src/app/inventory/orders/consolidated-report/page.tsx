'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useUsers } from '@/context/users-context';

interface AggregatedItem {
    id: string;
    nameAr: string;
    nameEn: string;
    category: string;
    unit: string;
    totalQuantity: number;
}

interface GroupedAggregatedItems {
    [category: string]: AggregatedItem[];
}

export default function ConsolidatedReportPage() {
    const router = useRouter();
    const { orders, loading, loadOrders } = useOrders();
    const { currentUser } = useUsers();
    
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const { groupedItems, residenceNames, totalItems, totalCategories } = useMemo(() => {
        if (loading || !currentUser || currentUser.role !== 'Admin') {
            return { groupedItems: {}, residenceNames: [], totalItems: 0, totalCategories: 0 };
        }

        const pendingOrders = orders.filter(o => o.status === 'Pending');
        const itemMap = new Map<string, AggregatedItem>();
        const uniqueResidenceNames = new Set<string>();

        pendingOrders.forEach(order => {
            uniqueResidenceNames.add(order.residence);
            order.items.forEach(item => {
                const existing = itemMap.get(item.id);
                if (existing) {
                    existing.totalQuantity += item.quantity;
                } else {
                    itemMap.set(item.id, {
                        id: item.id,
                        nameAr: item.nameAr,
                        nameEn: item.nameEn,
                        category: item.category || 'Uncategorized',
                        unit: item.unit,
                        totalQuantity: item.quantity
                    });
                }
            });
        });

        const sortedItems = Array.from(itemMap.values()).sort((a,b) => a.nameAr.localeCompare(b.nameAr));
        
        const grouped = sortedItems.reduce((acc, item) => {
            const category = item.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as GroupedAggregatedItems);
        
        // ترتيب الفئات حسب عدد الأصناف (من الأكثر للأقل)
        const sortedGrouped = Object.entries(grouped)
            .sort(([,a], [,b]) => b.length - a.length)
            .reduce((acc, [category, items]) => {
                acc[category] = items;
                return acc;
            }, {} as GroupedAggregatedItems);
        
        return { 
            groupedItems: sortedGrouped, 
            residenceNames: Array.from(uniqueResidenceNames),
            totalItems: sortedItems.length,
            totalCategories: Object.keys(grouped).length
        };
        
    }, [orders, loading, currentUser]);

    // نظام ذكي أنيق ومرتب لتوزيع الكروت
    const getElegantLayout = useMemo(() => {
        const categoriesData = Object.entries(groupedItems).map(([category, items]) => ({
            category,
            items,
            itemCount: items.length
        }));
        
        if (categoriesData.length === 0) {
            return { layoutConfig: [], gridColumns: 3, gridRows: 2 };
        }
        
        // ترتيب الفئات حسب عدد الأصناف (من الأكثر للأقل)
        categoriesData.sort((a, b) => b.itemCount - a.itemCount);
        
        // تحديد التخطيط الأنيق بناءً على عدد الفئات
        let gridColumns = 3;
        let gridRows = Math.ceil(categoriesData.length / 3);
        
        if (categoriesData.length <= 2) {
            gridColumns = 2;
        } else if (categoriesData.length <= 4) {
            gridColumns = 2;
            gridRows = 2;
        } else if (categoriesData.length <= 6) {
            gridColumns = 3;
            gridRows = 2;
        } else if (categoriesData.length <= 9) {
            gridColumns = 3;
            gridRows = 3;
        } else {
            gridColumns = 4;
            gridRows = Math.ceil(categoriesData.length / 4);
        }
        
        // حساب عتبات أنيقة للأحجام
        const totalItems = categoriesData.reduce((sum, cat) => sum + cat.itemCount, 0);
        const averageItems = totalItems / categoriesData.length;
        
            // تصنيف أنيق للكروت - تركيز على الطول وليس العرض
            const layoutConfig = categoriesData.map((catData, index) => {
                let cardType = 'normal';
                let heightMultiplier = 1;
                let widthMultiplier = 1; // دائماً عمود واحد
                
                // تحديد نوع الكرت بشكل أنيق - تركيز على الطول
                if (catData.itemCount > averageItems * 2.5) {
                    cardType = 'extra-large';
                    heightMultiplier = 3; // ثلاثة سطور للكروت الضخمة
                } else if (catData.itemCount > averageItems * 1.8) {
                    cardType = 'large';
                    heightMultiplier = 2; // سطرين للكروت الكبيرة
                } else if (catData.itemCount > averageItems * 1.3) {
                    cardType = 'medium-large';
                    heightMultiplier = 1.5; // سطر ونصف للكروت المتوسطة الكبيرة
                } else if (catData.itemCount < averageItems * 0.7) {
                    cardType = 'small';
                    heightMultiplier = 0.8; // أقل من السطر الواحد للكروت الصغيرة
                }
                
                return {
                    ...catData,
                    cardType,
                    heightMultiplier,
                    widthMultiplier: 1, // دائماً عمود واحد
                    gridColumn: 'span 1', // دائماً عمود واحد
                    gridRow: heightMultiplier >= 3 ? 'span 3' : 
                            heightMultiplier >= 2 ? 'span 2' : 
                            heightMultiplier >= 1.5 ? 'span 2' : 'span 1'
                };
            });        return { 
            layoutConfig, 
            gridColumns, 
            gridRows,
            totalItems,
            averageItems: Math.round(averageItems)
        };
    }, [groupedItems, totalCategories, totalItems]);

    // دالة ترجمة أسماء الفئات إلى العربية
    const getCategoryNameAr = (categoryEn: string): string => {
        const translations: { [key: string]: string } = {
            // الفئات الأساسية
            'CLEANING': 'التنظيف',
            'PLUMBING': 'السباكة',
            'ELECTRICAL': 'الكهرباء',
            'SLEEP KIT': 'أدوات النوم',
            'A/C': 'التكييف',
            'OFFICE': 'المكتب',
            'CAR MAINTENANCE': 'صيانة السيارات',
            'MAINTENANCE': 'الصيانة العامة',
            
            // فئات إضافية شائعة
            'KITCHEN': 'المطبخ',
            'BATHROOM': 'الحمام',
            'LAUNDRY': 'الغسيل',
            'SAFETY': 'السلامة',
            'TOOLS': 'الأدوات',
            'FURNITURE': 'الأثاث',
            'MEDICAL': 'المستلزمات الطبية',
            'FOOD': 'المواد الغذائية',
            'GARDEN': 'الحديقة',
            'PAINT': 'الدهان',
            'CONSTRUCTION': 'البناء والإنشاء',
            'HARDWARE': 'الأجهزة',
            'STATIONERY': 'القرطاسية',
            'TEXTILES': 'المنسوجات',
            'LIGHTING': 'الإضاءة',
            'SECURITY': 'الأمن',
            'COMMUNICATION': 'الاتصالات',
            'TRANSPORTATION': 'النقل',
            'STORAGE': 'التخزين',
            'DECORATION': 'الديكور',
            
            // حالات خاصة
            'Uncategorized': 'غير مصنف',
            'OTHERS': 'أخرى',
            'MISC': 'متنوعة',
            'GENERAL': 'عام'
        };
        
        // البحث بطرق متعددة لضمان الدقة
        const upperCategory = categoryEn.toUpperCase().trim();
        
        // البحث المباشر
        if (translations[upperCategory]) {
            return translations[upperCategory];
        }
        
        // البحث الجزئي للكلمات المركبة
        for (const [eng, ar] of Object.entries(translations)) {
            if (upperCategory.includes(eng) || eng.includes(upperCategory)) {
                return ar;
            }
        }
        
        // إذا لم توجد ترجمة، أرجع النص الأصلي
        return categoryEn;
    };
    
    const handlePrint = () => {
        window.print();
    }
    
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="border rounded-lg p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <div className="mt-6 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (currentUser?.role !== 'Admin') {
         return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">Access Denied.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @page {
                    size: A4;
                    margin: 3mm;
                }
                
                @media print {
                    .no-print { 
                        display: none !important; 
                    }
                    
                    body { 
                        font-size: 8px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    .space-y-6 {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .bg-white {
                        margin: 0 !important;
                        padding: 6px !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    
                    /* تصغير أحجام الخطوط للطباعة */
                    div[style*="fontSize: '20px'"] {
                        font-size: 11px !important;
                    }
                    
                    div[style*="fontSize: '16px'"] {
                        font-size: 9px !important;
                    }
                    
                    div[style*="fontSize: '14px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '13px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '12px'"] {
                        font-size: 7px !important;
                    }
                    
                    div[style*="fontSize: '11px'"] {
                        font-size: 6px !important;
                    }
                    
                    div[style*="fontSize: '10px'"] {
                        font-size: 6px !important;
                    }
                    
                    div[style*="fontSize: '9px'"] {
                        font-size: 5px !important;
                    }
                    
                    div[style*="fontSize: '8px'"] {
                        font-size: 5px !important;
                    }
                    
                    /* تصغير المسافات */
                    div[style*="marginBottom: '20px'"] {
                        margin-bottom: 8px !important;
                    }
                    
                    div[style*="margin: '15px 0'"] {
                        margin: 6px 0 !important;
                    }
                    
                    div[style*="padding: '15px 20px'"] {
                        padding: 4px 8px !important;
                    }
                    
                    div[style*="padding: '8px 12px'"] {
                        padding: 3px 5px !important;
                    }
                    
                    div[style*="padding: '6px 10px'"] {
                        padding: 2px 4px !important;
                    }
                    
                    div[style*="gap: '12px'"] {
                        gap: 3px !important;
                    }
                    
                    div[style*="gap: '8px'"] {
                        gap: 2px !important;
                    }
                    
                    div[style*="gap: '30px'"] {
                        gap: 8px !important;
                    }
                    
                    /* تحسين Grid الأنيق للطباعة */
                    .elegant-grid {
                        gap: 8px !important;
                    }
                    
                    /* إزالة جميع القيود على الارتفاع لضمان عرض جميع الأصناف */
                    div[style*="maxHeight"] {
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    
                    /* السماح بالتمدد الطبيعي للكروت الأنيقة */
                    div[style*="overflowY: 'auto'"] {
                        overflow: visible !important;
                        max-height: none !important;
                    }
                    
                    /* ضمان ظهور جميع الأصناف في التصميم الأنيق */
                    .elegant-grid > div {
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    
                    /* تحسين العناوين جنباً إلى جنب للطباعة */
                    div[style*="gap: '8px'"] {
                        gap: 4px !important;
                    }
                    div[style*="padding: '8px 12px'"] {
                        padding: 4px 6px !important;
                    }
                    
                    div[style*="minHeight: '40px'"] {
                        min-height: 24px !important;
                    }
                    
                    div[style*="marginBottom: '1px'"] {
                        margin-bottom: 0px !important;
                    }
                    
                    div[style*="padding: '4px 8px'"] {
                        padding: 2px 4px !important;
                    }
                    
                    div[style*="borderRadius: '12px'"] {
                        border-radius: 6px !important;
                    }
                    
                    div[style*="padding: '6px'"] {
                        padding: 3px !important;
                    }
                    
                    div[style*="padding: '6px 10px'"] {
                        padding: 3px 5px !important;
                    }
                    
                    div[style*="marginBottom: '3px'"] {
                        margin-bottom: 1px !important;
                    }
                    
                    div[style*="borderRadius: '4px'"] {
                        border-radius: 2px !important;
                    }
                    
                    div[style*="marginBottom: '1px'"] {
                        margin-bottom: 0px !important;
                    }
                    
                    /* تقليل حجم النص المحدث للطباعة */
                    div[style*="fontSize: '11px'"] {
                        font-size: 6px !important;
                    }
                    
                    div[style*="fontSize: '9px'"] {
                        font-size: 5px !important;
                    }
                    
                    div[style*="fontSize: '13px'"] {
                        font-size: 7px !important;
                    }
                    
                    div[style*="fontSize: '8px'"] {
                        font-size: 4px !important;
                    }
                    
                    /* تحسين ارتفاع الصفوف */
                    div[style*="minHeight: '28px'"] {
                        min-height: 18px !important;
                    }
                    
                    /* تحسين المسافات الداخلية للعناصر */
                    div[style*="marginTop: '25px'"] {
                        margin-top: 15px !important;
                    }
                    
                    div[style*="paddingTop: '15px'"] {
                        padding-top: 8px !important;
                    }
                    
                    /* الحفاظ على حجم خط التوقيعات قابل للقراءة */
                    div[style*="fontSize: '11px'"][style*="fontWeight: 'bold'"] {
                        font-size: 8px !important;
                        font-weight: bold !important;
                    }
                    
                    div[style*="fontSize: '9px'"][style*="color: '#6c757d'"] {
                        font-size: 7px !important;
                    }
                    
                    /* ضمان ظهور أقسام التوقيعات */
                    div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 15px !important;
                    }
                    
                    div[style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 80px !important;
                    }
                    
                    /* منع إخفاء التوقيعات في الطباعة */
                    div[style*="textAlign: 'center'"][style*="border: '1px solid #dee2e6'"] {
                        display: block !important;
                        visibility: visible !important;
                        page-break-inside: avoid !important;
                        margin-bottom: 0 !important;
                    }
                    
                    /* ضمان ظهور footer والتوقيعات */
                    div[style*="marginTop: '25px'"][style*="borderTop: '2px solid #000'"] {
                        display: block !important;
                        visibility: visible !important;
                        page-break-inside: avoid !important;
                        margin-top: 10px !important;
                        padding-top: 5px !important;
                        border-top: 1px solid #000 !important;
                    }
                    
                    /* التأكد من ظهور grid التوقيعات */
                    div[style*="display: 'grid'"][style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 10px !important;
                        margin-top: 5px !important;
                    }
                    
                    /* ضمان وضوح نص التوقيعات */
                    div[style*="طلب من"], 
                    div[style*="موافق من"], 
                    div[style*="تم الاستلام"],
                    div[style*="Requested By"],
                    div[style*="Approved By"],
                    div[style*="Received By"] {
                        font-size: 7px !important;
                        font-weight: bold !important;
                        color: #000 !important;
                    }
                    
                    /* التأكد من ظهور خطوط التوقيع */
                    div[style*="width: '100px'"][style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 60px !important;
                        margin: 5px auto !important;
                    }
                    
                    /* ضمان ظهور حقول Name, Position, Date */
                    div[style*="Name: _______________"],
                    div[style*="Position: ___________"],
                    div[style*="Date: _____________"] {
                        font-size: 6px !important;
                        color: #333 !important;
                        margin-bottom: 2px !important;
                    }
                }
                
                /* استجابة أنيقة للشاشات المختلفة */
                @media screen and (max-width: 1200px) {
                    .elegant-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }
                
                @media screen and (max-width: 1024px) {
                    .elegant-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 12px !important;
                    }
                }
                
                @media screen and (max-width: 768px) {
                    .elegant-grid {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }
                    
                    .bg-white {
                        padding: 12px !important;
                        font-size: 12px !important;
                    }
                    
                    div[style*="gridColumn"] {
                        grid-column: span 1 !important;
                    }
                    
                    div[style*="gridRow"] {
                        grid-row: span 1 !important;
                    }
                }
                `
            }} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between no-print mb-6">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Requests
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        طباعة التقرير (Print Report)
                    </Button>
                </div>

                <div 
                    className="bg-white p-6 rounded-lg border shadow-sm" 
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.4'
                    }}
                >
                    {/* Enhanced Header */}
                    <div 
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '20px',
                            padding: '15px 20px',
                            border: '2px solid #000',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: '#000',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Consolidated Pending Requests
                            </div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#333',
                                marginBottom: '8px'
                            }}>
                                الطلبات المجمعة المعلقة
                            </div>
                        </div>
                        <div style={{
                            textAlign: 'right',
                            borderLeft: '2px solid #007bff',
                            paddingLeft: '15px'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#007bff',
                                backgroundColor: '#fff3cd',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '2px solid #ffeeba',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                Report Date: {format(new Date(), 'MMMM do, yyyy')}
                            </div>
                        </div>
                    </div>

                    {/* Locations Section */}
                    {residenceNames.length > 0 && (
                        <div style={{
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                color: '#495057'
                            }}>
                                المواقع المطلوبة • Requested Locations
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                {residenceNames.map((name) => (
                                    <span key={name} style={{
                                        background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                        color: 'white',
                                        padding: '6px 14px',
                                        borderRadius: '15px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
                                        border: '1px solid #0056b3'
                                    }}>
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Stats - Simplified */}
                    <div style={{
                        margin: '15px 0',
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        border: '1px solid #2196f3',
                        borderRadius: '6px'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#1976d2',
                            marginBottom: '6px'
                        }}>ملخص الطلب • Request Summary</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                            gap: '6px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Total Categories</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{totalCategories}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Total Items</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{totalItems}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Locations</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{residenceNames.length}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Status</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>Pending</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Elegant Design */}
                    <div style={{ padding: '0' }}>
                        {getElegantLayout.layoutConfig.length > 0 ? (
                            <div 
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${getElegantLayout.gridColumns}, 1fr)`,
                                    gap: '16px',
                                    marginBottom: '20px',
                                    gridAutoRows: 'minmax(200px, auto)'
                                }}
                                className="elegant-grid"
                            >
                                {getElegantLayout.layoutConfig.map((cardConfig) => (
                                    <div 
                                        key={cardConfig.category} 
                                        style={{
                                            border: '1px solid #dee2e6',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            backgroundColor: 'white',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            gridColumn: cardConfig.gridColumn,
                                            gridRow: cardConfig.gridRow,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {/* Card Header - Bilingual & Elegant */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, #495057 0%, #343a40 100%)', // لون موحد رمادي أنيق
                                            color: 'white',
                                            padding: '8px 12px', // زيادة قليلة للمساحة للنصين
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            letterSpacing: '0.2px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            minHeight: '40px' // زيادة قليلة للاستيعاب
                                        }}>
                                            {/* Category Names - Equal Formatting */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <div style={{
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: 'white',
                                                    direction: 'ltr'
                                                }}>
                                                    {cardConfig.category}
                                                </div>
                                                <div style={{
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: 'white',
                                                    direction: 'rtl'
                                                }}>
                                                    {getCategoryNameAr(cardConfig.category)}
                                                </div>
                                            </div>
                                            
                                            {/* Items Count Badge */}
                                            <div style={{
                                                fontSize: '10px',
                                                fontWeight: '600',
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                minWidth: '35px',
                                                textAlign: 'center',
                                                border: '1px solid rgba(255,255,255,0.2)'
                                            }}>
                                                {cardConfig.itemCount}
                                            </div>
                                        </div>
                                        
                                        {/* Card Content - Optimized for Height */}
                                        <div style={{
                                            padding: '6px', // تقليل المسافة الداخلية
                                            maxHeight: cardConfig.cardType === 'extra-large' ? '500px' : // زيادة الارتفاع للكروت الضخمة
                                                      cardConfig.cardType === 'large' ? '400px' : // زيادة للكروت الكبيرة
                                                      cardConfig.cardType === 'medium-large' ? '300px' :
                                                      '250px',
                                            overflowY: 'auto'
                                        }}>
                                            {cardConfig.items.map((item: any, index: number) => (
                                                <div key={item.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '6px 10px', // تقليل المسافة من 8px إلى 6px
                                                    marginBottom: index === cardConfig.items.length - 1 ? '0' : '3px', // تقليل من 4px إلى 3px
                                                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                                                    borderRadius: '4px', // تقليل من 6px إلى 4px
                                                    border: '1px solid #f1f3f4'
                                                }}>
                                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                                        <div style={{
                                                            fontSize: '11px', // تقليل من 12px إلى 11px
                                                            fontWeight: '600',
                                                            color: '#2c3e50',
                                                            lineHeight: '1.2', // تقليل المسافة بين الأسطر
                                                            marginBottom: '1px' // تقليل من 2px إلى 1px
                                                        }}>
                                                            {item.nameAr}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '9px', // تقليل من 10px إلى 9px
                                                            color: '#7f8c8d',
                                                            lineHeight: '1.1'
                                                        }}>
                                                            {item.nameEn}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        minWidth: '45px' // تقليل من 50px إلى 45px
                                                    }}>
                                                        <div style={{
                                                            fontSize: '13px', // تقليل من 14px إلى 13px
                                                            fontWeight: 'bold',
                                                            color: '#2980b9'
                                                        }}>
                                                            {item.totalQuantity}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '8px', // تقليل من 9px إلى 8px
                                                            color: '#95a5a6',
                                                            textAlign: 'center'
                                                        }}>
                                                            {item.unit}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '60px 20px', 
                                color: '#6c757d', 
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>
                                <div style={{ marginBottom: '8px', fontSize: '18px' }}>📋</div>
                                No pending material requests found.
                            </div>
                        )}
                    </div>

                    {/* Enhanced Footer */}
                    <div style={{
                        marginTop: '25px',
                        borderTop: '2px solid #000',
                        paddingTop: '15px'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '30px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                backgroundColor: '#f8f9fa'
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginBottom: '20px',
                                    color: '#495057'
                                }}>طلب من • Requested By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{ marginBottom: '4px' }}>Name: _______________</div>
                                    <div style={{ marginBottom: '4px' }}>Position: ___________</div>
                                    <div style={{ marginBottom: '4px' }}>Date: _____________</div>
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                backgroundColor: '#f8f9fa'
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginBottom: '20px',
                                    color: '#495057'
                                }}>موافق من • Approved By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{ marginBottom: '4px' }}>Name: _______________</div>
                                    <div style={{ marginBottom: '4px' }}>Position: ___________</div>
                                    <div style={{ marginBottom: '4px' }}>Date: _____________</div>
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                backgroundColor: '#f8f9fa'
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginBottom: '20px',
                                    color: '#495057'
                                }}>تم الاستلام • Received By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{ marginBottom: '4px' }}>Name: _______________</div>
                                    <div style={{ marginBottom: '4px' }}>Position: ___________</div>
                                    <div style={{ marginBottom: '4px' }}>Date: _____________</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
