import { sqliteTable, text, integer, real, customType } from 'drizzle-orm/sqlite-core';

const jsonText = customType<{ data: unknown; driverData: string }>(
    {
        dataType() {
            return 'text';
        },
        toDriver(value) {
            // Mirror Drizzle's default `mode: 'json'` behavior: always JSON.stringify.
            // This ensures strings are stored as JSON strings (quoted) rather than raw text.
            return JSON.stringify(value);
        },
        fromDriver(value) {
            if (value == null) return null;
            if (typeof value !== 'string') return value as unknown;
            const trimmed = value.trim();
            if (!trimmed) return null;
            try {
                return JSON.parse(trimmed);
            } catch {
                // If the DB contains legacy/non-JSON text (e.g. ISO strings stored without quotes),
                // return the raw string rather than crashing the entire request.
                return value;
            }
        },
    },
    { mode: 'json' }
);

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
    location: jsonText('location'), // { lat: number, lng: number }
    managerId: text('manager_id'),
    isEmergencyMode: integer('is_emergency_mode', { mode: 'boolean' }).default(false),
    buildings: jsonText('buildings'), // Nested structure: Building[]
    facilities: jsonText('facilities'),
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
    residenceIds: jsonText('residence_ids'), // string[]
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
    from: jsonText('from'), // { residenceId?: string, roomId?: string }
    to: jsonText('to').notNull(), // { residenceId: string, roomId?: string }
    workerIds: jsonText('worker_ids').notNull(), // string[]
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
    updatedAtTS: jsonText('updated_at_ts'),
    createdAtTS: jsonText('created_at_ts'),
});

export const auditLogs = sqliteTable('audit_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    userName: text('user_name'),
    action: text('action'),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    summary: text('summary'),
    before: jsonText('before'),
    after: jsonText('after'),
    meta: jsonText('meta'),
    timestamp: jsonText('timestamp'),
});

export const counters = sqliteTable('counters', {
    id: text('id').primaryKey(),
    last: integer('last'),
    yy: integer('yy'),
    mm: integer('mm'),
    updatedAt: jsonText('updated_at'),
});

export const feedback = sqliteTable('feedback', {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    title: text('title'),
    description: text('description'),
    category: text('category'),
    deviceInfo: jsonText('device_info'),
    appInfo: jsonText('app_info'),
    settings: jsonText('settings'),
    categoryAuto: text('category_auto'),
    ticketId: text('ticket_id'),
    priority: text('priority'),
    screenshotUrl: text('screenshot_url'),
    status: text('status'),
    createdAt: jsonText('created_at'),
    resolvedAt: jsonText('resolved_at'),
    updatedAt: jsonText('updated_at'),
});

export const inventory = sqliteTable('inventory', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    nameEn: text('name_en'),
    category: text('category'),
    unit: text('unit'),
    lifespanDays: integer('lifespan_days'),
    keywordsEn: jsonText('keywords_en'),
    keywordsAr: jsonText('keywords_ar'),
    variants: jsonText('variants'),
    stockByResidence: jsonText('stock_by_residence'),
    stock: integer('stock'),
});

export const inventoryCategories = sqliteTable('inventory_categories', {
    id: text('id').primaryKey(),
    names: jsonText('names'),
});

export const inventoryTransactions = sqliteTable('inventory_transactions', {
    id: text('id').primaryKey(),
    itemId: text('item_id').notNull(),
    itemNameEn: text('item_name_en'),
    itemNameAr: text('item_name_ar'),
    residenceId: text('residence_id'),
    date: jsonText('date'),
    type: text('type'),
    quantity: real('quantity'),
    referenceDocId: text('reference_doc_id'),
    locationId: text('location_id'),
    locationName: text('location_name'),
    overrideReason: text('override_reason'),
});

export const mivs = sqliteTable('mivs', {
    id: text('id').primaryKey(),
    date: jsonText('date'),
    residenceId: text('residence_id'),
    itemCount: integer('item_count'),
    locationName: text('location_name'),
});

export const mrvRequests = sqliteTable('mrv_requests', {
    id: text('id').primaryKey(),
    residenceId: text('residence_id'),
    items: jsonText('items'),
    supplierName: text('supplier_name'),
    invoiceNo: text('invoice_no'),
    attachmentUrl: text('attachment_url'),
    attachmentPath: text('attachment_path'),
    notes: text('notes'),
    requestedById: text('requested_by_id'),
    requestedAt: jsonText('requested_at'),
    mrvShort: text('mrv_short'),
    processingById: text('processing_by_id'),
    processingAt: jsonText('processing_at'),
    mrvId: text('mrv_id'),
    approvedAt: jsonText('approved_at'),
    approvedById: text('approved_by_id'),
    status: text('status'),
});

export const mrvs = sqliteTable('mrvs', {
    id: text('id').primaryKey(),
    date: jsonText('date'),
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
    items: jsonText('items'),
    requestedById: text('requested_by_id'),
    notes: text('notes'),
    requestedByName: text('requested_by_name'),
    requestedByEmail: text('requested_by_email'),
    date: jsonText('date'),
    approvedByName: text('approved_by_name'),
    approvedById: text('approved_by_id'),
    itemsReceived: jsonText('items_received'),
    status: text('status'),
});

export const reconciliationRequests = sqliteTable('reconciliation_requests', {
    id: text('id').primaryKey(),
    residenceId: text('residence_id'),
    adjustments: jsonText('adjustments'),
    requestedById: text('requested_by_id'),
    requestedAt: jsonText('requested_at'),
    reservedId: text('reserved_id'),
    approvedAt: jsonText('approved_at'),
    approvedById: text('approved_by_id'),
    referenceId: text('reference_id'),
    status: text('status'),
});

export const serviceOrders = sqliteTable('service_orders', {
    id: text('id').primaryKey(),
    codeShort: text('code_short'),
    dateCreated: jsonText('date_created'),
    residenceId: text('residence_id'),
    residenceName: text('residence_name'),
    destination: jsonText('destination'),
    status: text('status'),
    dispatchedAt: jsonText('dispatched_at'),
    createdById: text('created_by_id'),
    dispatchedById: text('dispatched_by_id'),
    items: jsonText('items'),
});

export const stockReconciliations = sqliteTable('stock_reconciliations', {
    id: text('id').primaryKey(),
    residenceId: text('residence_id'),
    date: jsonText('date'),
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
    themeSettings: jsonText('theme_settings'),
    assignedResidences: jsonText('assigned_residences'),
    createdAt: jsonText('created_at'),
    lastSeen: text('last_seen'),
    disabled: integer('disabled', { mode: 'boolean' }).default(false),
});

export const webauthnCredentials = sqliteTable('webauthn_credentials', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    credentialId: text('credential_id').notNull(),
    publicKey: text('public_key').notNull(),
    counter: integer('counter').notNull().default(0),
    transports: jsonText('transports'),
    deviceType: text('device_type'),
    backedUp: integer('backed_up', { mode: 'boolean' }).default(false),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
    usedAt: text('used_at'),
    requestedIp: text('requested_ip'),
    requestedUa: text('requested_ua'),
});
