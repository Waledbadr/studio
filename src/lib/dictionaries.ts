
const en = {
    // General
    viewAll: 'View All',
    location: 'Location',
    status: 'Status',
    orderId: 'Order ID',
    mivId: 'MIV ID',
    date: 'Date',
    loading: 'Loading...',

    // Header
    changeLanguage: 'Change Language',
    notifications: 'Notifications',
    myAccount: 'My Account',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',

    // Sidebar
    sidebar: {
        dashboard: 'Dashboard',
        residences: 'Residences',
        maintenance: 'Maintenance',
        inventory: 'Inventory',
        stockTransfer: 'Stock Transfer',
        stockTransferHistory: 'Transfer History',
        materialRequests: 'Material Requests',
        receiveMaterials: 'Receive Materials',
        issueMaterials: 'Issue Materials',
        reports: 'Reports',
        users: 'Users',
        aiTools: 'AI Tools',
        setup: 'Setup',
        lifespanReport: 'Lifespan Report'
    },

    // Dashboard Page
    dashboard: {
        totalRequests: 'Total Requests',
        totalMaintenanceRequests: 'Total maintenance requests',
        pending: 'Pending',
        requestsNeedAttention: 'Requests that need attention',
        completed: 'Completed',
        completedRequests: 'Completed requests',
        recentMaintenance: 'Recent Maintenance',
        noMaintenanceRequestsFound: 'No maintenance requests found.',
        recentMaterialRequests: 'Recent Material Requests',
        noMaterialRequestsFound: 'No material requests found.',
        recentReceipts: 'Recent Receipts',
        noRecentReceiptsFound: 'No recent receipts found.',
        recentIssues: 'Recent Issues',
        noRecentIssuesFound: 'No recent issues found.',
    },
};

const ar: typeof en = {
    // General
    viewAll: 'عرض الكل',
    location: 'الموقع',
    status: 'الحالة',
    orderId: 'رقم الطلب',
    mivId: 'رقم المذكرة',
    date: 'التاريخ',
    loading: 'جار التحميل...',

    // Header
    changeLanguage: 'تغيير اللغة',
    notifications: 'الإشعارات',
    myAccount: 'حسابي',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',

    // Sidebar
    sidebar: {
        dashboard: 'الرئيسية',
        residences: 'المجمعات السكنية',
        maintenance: 'الصيانة',
        inventory: 'المخزون',
        stockTransfer: 'تحويل مخزني',
        stockTransferHistory: 'سجل التحويلات',
        materialRequests: 'طلبات المواد',
        receiveMaterials: 'استلام المواد',
        issueMaterials: 'صرف المواد',
        reports: 'التقارير',
        users: 'المستخدمون',
        aiTools: 'أدوات الذكاء الاصطناعي',
        setup: 'الإعدادات',
        lifespanReport: 'تقرير العمر الافتراضي'
    },

    // Dashboard Page
    dashboard: {
        totalRequests: 'إجمالي الطلبات',
        totalMaintenanceRequests: 'إجمالي طلبات الصيانة',
        pending: 'قيد الانتظار',
        requestsNeedAttention: 'طلبات تحتاج إلى متابعة',
        completed: 'مكتملة',
        completedRequests: 'الطلبات المكتملة',
        recentMaintenance: 'صيانة حديثة',
        noMaintenanceRequestsFound: 'لم يتم العثور على طلبات صيانة.',
        recentMaterialRequests: 'طلبات مواد حديثة',
        noMaterialRequestsFound: 'لم يتم العثور على طلبات مواد.',
        recentReceipts: 'استلامات حديثة',
        noRecentReceiptsFound: 'لم يتم العثور على استلامات حديثة.',
        recentIssues: 'مذكرات صرف حديثة',
        noRecentIssuesFound: 'لم يتم العثور على مذكرات صرف حديثة.',
    },
};

export const dictionaries = { en, ar };
export type Dictionary = typeof en;
