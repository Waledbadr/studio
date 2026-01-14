import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const workers = sqliteTable('workers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    employeeId: text('employee_id'),
    idNumber: text('id_number'),
    nationality: text('nationality'),
    company: text('company'),
    role: text('role', { enum: ['Worker', 'Supervisor', 'Engineer'] }).default('Worker'),
    status: text('status', { enum: ['Active', 'Transferring', 'Vacation', 'Exit'] }).default('Active'),
    transferDestination: text('transfer_destination'),
    updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const residences = sqliteTable('residences', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    city: text('city'),
    address: text('address'),
    location: text('location', { mode: 'json' }), // { lat: number, lng: number }
    managerId: text('manager_id'),
    isEmergencyMode: integer('is_emergency_mode', { mode: 'boolean' }).default(false),
    buildings: text('buildings', { mode: 'json' }), // Nested structure: Building[]
    facilities: text('facilities', { mode: 'json' }),
    disabled: integer('disabled', { mode: 'boolean' }).default(false),
    updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const occupants = sqliteTable('occupants', {
    id: text('id').primaryKey(),
    workerId: text('worker_id').notNull(),
    residenceId: text('residence_id').notNull(),
    buildingId: text('building_id'),
    floorId: text('floor_id'),
    roomId: text('room_id').notNull(),
    since: text('since').notNull(), // ISO Date
    until: text('until'), // ISO Date or null
    checkInBy: text('check_in_by'),
    checkOutBy: text('check_out_by'),
    checkoutType: text('checkout_type', { enum: ['Transfer', 'Exit', 'Vacation', 'Other'] }),
    transferCity: text('transfer_city'),
    notes: text('notes'),
    isEmergency: integer('is_emergency', { mode: 'boolean' }).default(false),
    updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const accommodationHistory = sqliteTable('accommodation_history', {
    id: text('id').primaryKey(),
    workerId: text('worker_id').notNull(),
    workerName: text('worker_name'),
    workerNationality: text('worker_nationality'),
    actionType: text('action_type', { enum: ['CHECK_IN', 'CHECK_OUT', 'TRANSFER', 'SWAP'] }).notNull(),
    actionDate: text('action_date').notNull(),
    actionBy: text('action_by'),
    actionByName: text('action_by_name'),
    residenceId: text('residence_id'),
    residenceName: text('residence_name'),
    buildingId: text('building_id'),
    buildingName: text('building_name'),
    floorId: text('floor_id'),
    floorName: text('floor_name'),
    roomId: text('room_id'),
    roomName: text('room_name'),
    fromResidenceId: text('from_residence_id'),
    fromResidenceName: text('from_residence_name'),
    fromRoomId: text('from_room_id'),
    fromRoomName: text('from_room_name'),
    toResidenceId: text('to_residence_id'),
    toResidenceName: text('to_residence_name'),
    toRoomId: text('to_room_id'),
    toRoomName: text('to_room_name'),
    swappedWithWorkerId: text('swapped_with_worker_id'),
    swappedWithWorkerName: text('swapped_with_worker_name'),
    reason: text('reason'),
    notes: text('notes'),
    isEmergency: integer('is_emergency', { mode: 'boolean' }).default(false),
    duration: integer('duration'),
    relatedTransferRequestId: text('related_transfer_request_id'),
    checkoutType: text('checkout_type'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const companies = sqliteTable('companies', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    nameEn: text('name_en'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    address: text('address'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
});

export const contracts = sqliteTable('contracts', {
    id: text('id').primaryKey(),
    companyId: text('company_id').notNull(),
    residenceId: text('residence_id'),
    residenceIds: text('residence_ids', { mode: 'json' }), // string[]
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    ratePerPersonPerMonth: real('rate_per_person_per_month').notNull(),
    expectedWorkers: integer('expected_workers'),
    status: text('status', { enum: ['Active', 'Expired', 'Cancelled'] }).default('Active'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
    createdBy: text('created_by'),
});

export const invoices = sqliteTable('invoices', {
    id: text('id').primaryKey(),
    contractId: text('contract_id').notNull(),
    companyId: text('company_id').notNull(),
    residenceId: text('residence_id').notNull(),
    month: text('month').notNull(), // YYYY-MM
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    numberOfWorkers: integer('number_of_workers').notNull(),
    numberOfDays: integer('number_of_days').notNull(),
    ratePerPerson: real('rate_per_person').notNull(),
    totalAmount: real('total_amount').notNull(),
    status: text('status', { enum: ['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'] }).default('Draft'),
    generatedAt: text('generated_at').notNull(),
    paidAt: text('paid_at'),
    pdfUrl: text('pdf_url'),
    notes: text('notes'),
});

export const transferRequests = sqliteTable('transfer_requests', {
    id: text('id').primaryKey(),
    from: text('from', { mode: 'json' }), // { residenceId?: string, roomId?: string }
    to: text('to', { mode: 'json' }).notNull(), // { residenceId: string, roomId?: string }
    workerIds: text('worker_ids', { mode: 'json' }).notNull(), // string[]
    requestedBy: text('requested_by').notNull(),
    requestedAt: text('requested_at').notNull(),
    status: text('status', { enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'] }).default('Pending'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: text('reviewed_at'),
    reason: text('reason'),
});

export const notifications = sqliteTable('notifications', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    body: text('body'),
    createdAt: text('created_at').notNull(),
    read: integer('read', { mode: 'boolean' }).default(false),
    userId: text('user_id'),
});
export const assignments = sqliteTable('assignments', {
    id: text('id').primaryKey(),
    workerId: text('worker_id').notNull(),
    roomId: text('room_id'),
    residenceId: text('residence_id'),
    buildingId: text('building_id'),
    floorId: text('floor_id'),
    companyId: text('company_id'),
    nationality: text('nationality'),
    role: text('role'),
    startAt: integer('start_at'),
    endAt: integer('end_at'),
    status: text('status'),
    createdAt: integer('created_at'),
    updatedAt: integer('updated_at'),
    updatedAtTS: text('updated_at_ts', { mode: 'json' }),
    createdAtTS: text('created_at_ts', { mode: 'json' }),
});

export const auditLogs = sqliteTable('audit_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    userName: text('user_name'),
    action: text('action'),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    summary: text('summary'),
    before: text('before', { mode: 'json' }),
    after: text('after', { mode: 'json' }),
    meta: text('meta', { mode: 'json' }),
    timestamp: text('timestamp', { mode: 'json' }),
});

export const counters = sqliteTable('counters', {
    id: text('id').primaryKey(),
    last: integer('last'),
    updatedAt: text('updated_at', { mode: 'json' }),
});

export const feedback = sqliteTable('feedback', {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    title: text('title'),
    description: text('description'),
    category: text('category'),
    deviceInfo: text('device_info', { mode: 'json' }),
    appInfo: text('app_info', { mode: 'json' }),
    settings: text('settings', { mode: 'json' }),
    categoryAuto: text('category_auto'),
    ticketId: text('ticket_id'),
    priority: text('priority'),
    screenshotUrl: text('screenshot_url'),
    status: text('status'),
    createdAt: text('created_at', { mode: 'json' }),
    resolvedAt: text('resolved_at', { mode: 'json' }),
    updatedAt: text('updated_at', { mode: 'json' }),
});

export const inventory = sqliteTable('inventory', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    nameEn: text('name_en'),
    category: text('category'),
    unit: text('unit'),
    lifespanDays: integer('lifespan_days'),
    keywordsEn: text('keywords_en', { mode: 'json' }),
    keywordsAr: text('keywords_ar', { mode: 'json' }),
    variants: text('variants', { mode: 'json' }),
    stockByResidence: text('stock_by_residence', { mode: 'json' }),
    stock: integer('stock'),
});

export const inventoryCategories = sqliteTable('inventory_categories', {
    id: text('id').primaryKey(),
    names: text('names', { mode: 'json' }),
});

export const inventoryTransactions = sqliteTable('inventory_transactions', {
    id: text('id').primaryKey(),
    itemId: text('item_id').notNull(),
    itemNameEn: text('item_name_en'),
    itemNameAr: text('item_name_ar'),
    residenceId: text('residence_id'),
    date: text('date', { mode: 'json' }),
    type: text('type'),
    quantity: real('quantity'),
    referenceDocId: text('reference_doc_id'),
    locationId: text('location_id'),
    locationName: text('location_name'),
    overrideReason: text('override_reason'),
});

export const mivs = sqliteTable('mivs', {
    id: text('id').primaryKey(),
    date: text('date', { mode: 'json' }),
    residenceId: text('residence_id'),
    itemCount: integer('item_count'),
    locationName: text('location_name'),
});

export const mrvRequests = sqliteTable('mrv_requests', {
    id: text('id').primaryKey(),
    residenceId: text('residence_id'),
    items: text('items', { mode: 'json' }),
    supplierName: text('supplier_name'),
    invoiceNo: text('invoice_no'),
    attachmentUrl: text('attachment_url'),
    attachmentPath: text('attachment_path'),
    notes: text('notes'),
    requestedById: text('requested_by_id'),
    requestedAt: text('requested_at', { mode: 'json' }),
    mrvShort: text('mrv_short'),
    processingById: text('processing_by_id'),
    processingAt: text('processing_at', { mode: 'json' }),
    mrvId: text('mrv_id'),
    approvedAt: text('approved_at', { mode: 'json' }),
    approvedById: text('approved_by_id'),
    status: text('status'),
});

export const mrvs = sqliteTable('mrvs', {
    id: text('id').primaryKey(),
    date: text('date', { mode: 'json' }),
    residenceId: text('residence_id'),
    itemCount: integer('item_count'),
    supplierName: text('supplier_name'),
    invoiceNo: text('invoice_no'),
    notes: text('notes'),
    attachmentUrl: text('attachment_url'),
    attachmentPath: text('attachment_path'),
    attachmentRef: text('attachment_ref'),
    codeShort: text('code_short'),
    orderId: text('order_id'),
});

export const orders = sqliteTable('orders', {
    id: text('id').primaryKey(),
    residence: text('residence'),
    residenceId: text('residence_id'),
    items: text('items', { mode: 'json' }),
    requestedById: text('requested_by_id'),
    notes: text('notes'),
    requestedByName: text('requested_by_name'),
    requestedByEmail: text('requested_by_email'),
    date: text('date', { mode: 'json' }),
    approvedByName: text('approved_by_name'),
    approvedById: text('approved_by_id'),
    itemsReceived: text('items_received', { mode: 'json' }),
    status: text('status'),
});

export const reconciliationRequests = sqliteTable('reconciliation_requests', {
    id: text('id').primaryKey(),
    residenceId: text('residence_id'),
    adjustments: text('adjustments', { mode: 'json' }),
    requestedById: text('requested_by_id'),
    requestedAt: text('requested_at', { mode: 'json' }),
    reservedId: text('reserved_id'),
    approvedAt: text('approved_at', { mode: 'json' }),
    approvedById: text('approved_by_id'),
    referenceId: text('reference_id'),
    status: text('status'),
});

export const serviceOrders = sqliteTable('service_orders', {
    id: text('id').primaryKey(),
    codeShort: text('code_short'),
    dateCreated: text('date_created', { mode: 'json' }),
    residenceId: text('residence_id'),
    residenceName: text('residence_name'),
    destination: text('destination', { mode: 'json' }),
    status: text('status'),
    dispatchedAt: text('dispatched_at', { mode: 'json' }),
    createdById: text('created_by_id'),
    dispatchedById: text('dispatched_by_id'),
    items: text('items', { mode: 'json' }),
});

export const stockReconciliations = sqliteTable('stock_reconciliations', {
    id: text('id').primaryKey(),
    residenceId: text('residence_id'),
    date: text('date', { mode: 'json' }),
    itemCount: integer('item_count'),
    totalIncrease: integer('total_increase'),
    totalDecrease: integer('total_decrease'),
    performedById: text('performed_by_id'),
});

export const uniqueUsersEmails = sqliteTable('unique_users_emails', {
    userId: text('user_id').primaryKey(),
    email: text('email').notNull(),
});

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email'),
    passwordHash: text('password_hash'),
    role: text('role'),
    themeSettings: text('theme_settings', { mode: 'json' }),
    assignedResidences: text('assigned_residences', { mode: 'json' }),
    createdAt: text('created_at', { mode: 'json' }),
    lastSeen: text('last_seen'),
    disabled: integer('disabled', { mode: 'boolean' }).default(false),
});
