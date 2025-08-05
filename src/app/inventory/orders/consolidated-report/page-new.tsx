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
        
        return { 
            groupedItems: grouped, 
            residenceNames: Array.from(uniqueResidenceNames),
            totalItems: sortedItems.length,
            totalCategories: Object.keys(grouped).length
        };
        
    }, [orders, loading, currentUser]);
    
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
                @media print {
                    .no-print { display: none !important; }
                    body { font-size: 9px !important; }
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
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#000',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Consolidated Pending Requests
                            </div>
                            <div style={{
                                fontSize: '18px',
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
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginBottom: '3px',
                                color: '#007bff'
                            }}>Gypsum Factory</div>
                            <div style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginBottom: '3px',
                                color: '#007bff'
                            }}>New Logistics Hub</div>
                            <div style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginBottom: '3px',
                                color: '#007bff'
                            }}>Um Al-Salam</div>
                            <div style={{
                                fontSize: '11px',
                                color: '#666',
                                backgroundColor: '#fff3cd',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: '1px solid #ffeeba'
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

                    {/* Summary Stats */}
                    <div style={{
                        margin: '20px 0',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        border: '1px solid #2196f3',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#1976d2',
                            marginBottom: '8px'
                        }}>ملخص الطلب • Request Summary</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: '12px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '6px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#666',
                                    marginBottom: '4px'
                                }}>Total Categories</div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{totalCategories}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '6px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#666',
                                    marginBottom: '4px'
                                }}>Total Items</div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{totalItems}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '6px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#666',
                                    marginBottom: '4px'
                                }}>Locations</div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{residenceNames.length}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '6px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#666',
                                    marginBottom: '4px'
                                }}>Status</div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>Pending</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ padding: '0' }}>
                        {Object.keys(groupedItems).length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '12px',
                                marginBottom: '20px'
                            }}>
                                {Object.entries(groupedItems).map(([category, items]) => (
                                    <div key={category} style={{
                                        border: '2px solid #343a40',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: 'white',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #495057, #343a40)',
                                            color: 'white',
                                            padding: '8px 12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {category}
                                        </div>
                                        <div style={{
                                            padding: '0',
                                            maxHeight: '300px',
                                            overflowY: 'auto'
                                        }}>
                                            {items.map((item, index) => (
                                                <div key={item.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    padding: '6px 10px',
                                                    borderBottom: index === items.length - 1 ? 'none' : '1px solid #e9ecef',
                                                    minHeight: '28px',
                                                    backgroundColor: index % 2 === 1 ? '#f8f9fa' : 'white'
                                                }}>
                                                    <div style={{
                                                        flex: 1,
                                                        marginRight: '8px'
                                                    }}>
                                                        <div style={{
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            color: '#000',
                                                            lineHeight: '1.3',
                                                            marginBottom: '2px'
                                                        }}>
                                                            {item.nameAr}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '9px',
                                                            color: '#6c757d',
                                                            lineHeight: '1.2',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            {item.nameEn}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        color: '#007bff',
                                                        whiteSpace: 'nowrap',
                                                        textAlign: 'right',
                                                        minWidth: '40px'
                                                    }}>
                                                        {item.totalQuantity}
                                                        <span style={{
                                                            fontSize: '9px',
                                                            color: '#6c757d',
                                                            marginLeft: '3px',
                                                            fontWeight: 'normal'
                                                        }}>{item.unit}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d', fontSize: '14px' }}>
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
