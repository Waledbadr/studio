import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Explicitly load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

import { getAdminDb } from '../src/lib/firebase-admin';

async function migrate() {
    console.log('Checking environment variables...');

    let svc = process.env.FIREBASE_SERVICE_ACCOUNT;

    // Robust check: if dotenv failed to read multi-line JSON, try manual extraction
    if (svc === '{' || (svc && svc.trim() === '{')) {
        console.log('Detected multi-line JSON (incomplete read). Manually parsing .env.local...');
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        let found = false;
        let jsonLines = [];
        for (const line of lines) {
            if (line.trim().startsWith('FIREBASE_SERVICE_ACCOUNT=')) {
                found = true;
                const val = line.substring(line.indexOf('=') + 1).trim();
                // Remove surrounding quotes if present
                if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
                    svc = val.substring(1, val.length - 1);
                    break;
                }
                jsonLines.push(val);
                if (val.includes('}')) break;
                continue;
            }
            if (found) {
                jsonLines.push(line.trim());
                if (line.includes('}')) break;
            }
        }
        if (jsonLines.length > 0) {
            svc = jsonLines.join('\n').trim();
            // Final cleanup of quotes if it was something like FIREBASE_SERVICE_ACCOUNT='{ ... }'
            if (svc.startsWith("'") && svc.endsWith("'")) svc = svc.substring(1, svc.length - 1);
            if (svc.startsWith('"') && svc.endsWith('"')) svc = svc.substring(1, svc.length - 1);
        }
    }

    if (!svc) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT is missing in .env.local');
        process.exit(1);
    }

    try {
        const credentials = JSON.parse(svc);
        console.log('✅ FIREBASE_SERVICE_ACCOUNT is valid JSON');
        // Temporarily override the process.env so firebase-admin.ts sees it
        process.env.FIREBASE_SERVICE_ACCOUNT = svc;
    } catch (e) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT is NOT valid JSON:', e.message);
        console.log('Value starts with:', svc.substring(0, 50));
        process.exit(1);
    }

    const db = getAdminDb();
    if (!db) {
        console.error('❌ Failed to initialize Firebase Admin Database.');
        process.exit(1);
    }

    console.log('✅ Firebase Admin initialized successfully');

    const collections = [
        'workers',
        'residences',
        'occupants',
        'accommodationHistory',
        'companies',
        'contracts',
        'invoices',
        'transferRequests',
        'notifications',
        'assignments',
        'auditLogs',
        'counters',
        'feedback',
        'inventory',
        'inventory-categories',
        'inventoryTransactions',
        'mivs',
        'mrvRequests',
        'mrvs',
        'orders',
        'reconciliationRequests',
        'serviceOrders',
        'stockReconciliations',
        'unique_users_emails',
        'users'
    ];

    const tableSchemas: Record<string, string[]> = {
        'workers': ['id', 'name', 'employee_id', 'id_number', 'nationaliy', 'company', 'role', 'status', 'transfer_destination', 'updated_at'],
        'residences': ['id', 'name', 'city', 'address', 'location', 'manager_id', 'is_emergency_mode', 'buildings', 'facilities', 'disabled', 'updated_at'],
        'occupants': ['id', 'worker_id', 'residence_id', 'building_id', 'floor_id', 'room_id', 'since', 'until', 'check_in_by', 'check_out_by', 'checkout_type', 'transfer_city', 'notes', 'is_emergency', 'updated_at'],
        'accommodation_history': ['id', 'worker_id', 'worker_name', 'worker_nationality', 'action_type', 'action_date', 'action_by', 'action_by_name', 'residence_id', 'residence_name', 'building_id', 'building_name', 'floor_id', 'floor_name', 'room_id', 'room_name', 'from_residence_id', 'from_residence_name', 'from_room_id', 'from_room_name', 'to_residence_id', 'to_residence_name', 'to_room_id', 'to_room_name', 'swapped_with_worker_id', 'swapped_with_worker_name', 'reason', 'notes', 'is_emergency', 'duration', 'related_transfer_request_id', 'checkout_type', 'created_at'],
        'companies': ['id', 'name', 'name_ar', 'name_en', 'contact_email', 'contact_phone', 'address', 'created_at', 'updated_at'],
        'contracts': ['id', 'company_id', 'residence_id', 'residence_ids', 'start_date', 'end_date', 'rate_per_person_per_month', 'expected_workers', 'status', 'notes', 'created_at', 'updated_at', 'created_by'],
        'invoices': ['id', 'contract_id', 'company_id', 'residence_id', 'month', 'start_date', 'end_date', 'number_of_workers', 'number_of_days', 'rate_per_person', 'total_amount', 'status', 'generated_at', 'paid_at', 'pdf_url', 'notes'],
        'transfer_requests': ['id', 'from', 'to', 'worker_ids', 'requested_by', 'requested_at', 'status', 'reviewed_by', 'reviewed_at', 'reason'],
        'notifications': ['id', 'title', 'body', 'created_at', 'read', 'user_id'],
        'assignments': ['id', 'worker_id', 'room_id', 'residence_id', 'building_id', 'floor_id', 'company_id', 'nationality', 'role', 'start_at', 'end_at', 'status', 'created_at', 'updated_at', 'updated_at_ts', 'created_at_ts'],
        'audit_logs': ['id', 'user_id', 'user_name', 'action', 'entity_type', 'entity_id', 'summary', 'before', 'after', 'meta', 'timestamp'],
        'counters': ['id', 'last', 'updated_at'],
        'feedback': ['id', 'user_id', 'title', 'description', 'category', 'device_info', 'app_info', 'settings', 'category_auto', 'ticket_id', 'priority', 'screenshot_url', 'status', 'created_at', 'resolved_at', 'updated_at'],
        'inventory': ['id', 'name', 'name_ar', 'name_en', 'category', 'unit', 'lifespan_days', 'keywords_en', 'keywords_ar', 'variants', 'stock_by_residence', 'stock'],
        'inventory_categories': ['id', 'names'],
        'inventory_transactions': ['id', 'item_id', 'item_name_en', 'item_name_ar', 'residence_id', 'date', 'type', 'quantity', 'reference_doc_id', 'location_id', 'location_name', 'override_reason'],
        'mivs': ['id', 'date', 'residence_id', 'item_count', 'location_name'],
        'mrv_requests': ['id', 'residence_id', 'items', 'supplier_name', 'invoice_no', 'attachment_url', 'attachment_path', 'notes', 'requested_by_id', 'requested_at', 'mrv_short', 'processing_by_id', 'processing_at', 'mrv_id', 'approved_at', 'approved_by_id', 'status'],
        'mrvs': ['id', 'date', 'residence_id', 'item_count', 'supplier_name', 'invoice_no', 'notes', 'attachment_url', 'attachment_path', 'attachment_ref', 'code_short', 'order_id'],
        'orders': ['id', 'residence', 'residence_id', 'items', 'requested_by_id', 'notes', 'requested_by_name', 'requested_by_email', 'date', 'approved_by_name', 'approved_by_id', 'items_received', 'status'],
        'reconciliation_requests': ['id', 'residence_id', 'adjustments', 'requested_by_id', 'requested_at', 'reserved_id', 'approved_at', 'approved_by_id', 'reference_id', 'status'],
        'service_orders': ['id', 'code_short', 'date_created', 'residence_id', 'residence_name', 'destination', 'status', 'dispatched_at', 'created_by_id', 'dispatched_by_id', 'items'],
        'stock_reconciliations': ['id', 'residence_id', 'date', 'item_count', 'total_increase', 'total_decrease', 'performed_by_id'],
        'unique_users_emails': ['user_id', 'email'],
        'users': ['id', 'name', 'email', 'role', 'theme_settings', 'assigned_residences', 'created_at']
    };

    let sqlOutput = '-- Migration Data from Firestore\n';

    for (const collectionName of collections) {
        console.log(`📦 Exporting collection: ${collectionName}...`);
        try {
            const snapshot = await db.collection(collectionName).get();
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            console.log(`   Found ${docs.length} documents.`);

            if (docs.length === 0) {
                continue;
            }

            const tableName = collectionName === 'accommodationHistory' ? 'accommodation_history' :
                collectionName === 'transferRequests' ? 'transfer_requests' :
                    collectionName === 'auditLogs' ? 'audit_logs' :
                        collectionName === 'inventory-categories' ? 'inventory_categories' :
                            collectionName === 'inventoryTransactions' ? 'inventory_transactions' :
                                collectionName === 'mrvRequests' ? 'mrv_requests' :
                                    collectionName === 'reconciliationRequests' ? 'reconciliation_requests' :
                                        collectionName === 'serviceOrders' ? 'service_orders' :
                                            collectionName === 'stockReconciliations' ? 'stock_reconciliations' :
                                                collectionName === 'unique_users_emails' ? 'unique_users_emails' :
                                                    collectionName;

            const allowedKeys = tableSchemas[tableName];
            let tableSql = '';
            let part = 1;

            for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                const docKeys = Object.keys(doc);

                const finalKeys: string[] = [];
                const finalValues: any[] = [];

                for (const key of docKeys) {
                    const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

                    if (allowedKeys && allowedKeys.includes(dbKey)) {
                        finalKeys.push(dbKey);

                        const val = (doc as any)[key];
                        if (val === null || val === undefined) {
                            finalValues.push('NULL');
                        } else if (typeof val === 'string') {
                            finalValues.push(`'${val.replace(/'/g, "''")}'`);
                        } else if (typeof val === 'number') {
                            finalValues.push(val);
                        } else if (typeof val === 'boolean') {
                            finalValues.push(val ? 1 : 0);
                        } else if (typeof val === 'object') {
                            if (val._seconds !== undefined) {
                                finalValues.push(`'${new Date(val._seconds * 1000).toISOString()}'`);
                            } else {
                                finalValues.push(`'${JSON.stringify(val).replace(/'/g, "''")}'`);
                            }
                        } else {
                            finalValues.push(`'${String(val).replace(/'/g, "''")}'`);
                        }
                    }
                }

                if (finalKeys.length > 0) {
                    tableSql += `INSERT OR REPLACE INTO ${tableName} (${finalKeys.join(', ')}) VALUES (${finalValues.join(', ')});\n`;
                }

                // Split into chunks of 500 records to avoid "too large" errors
                if (i > 0 && i % 500 === 0) {
                    const partPath = path.join(process.cwd(), `split_${tableName}_${part}.sql`);
                    fs.writeFileSync(partPath, tableSql);
                    console.log(`   ✅ Wrote ${partPath}`);
                    tableSql = '';
                    part++;
                }
            }

            if (tableSql.length > 0) {
                const finalPartPath = path.join(process.cwd(), part === 1 ? `split_${tableName}.sql` : `split_${tableName}_${part}.sql`);
                fs.writeFileSync(finalPartPath, tableSql);
                console.log(`   ✅ Wrote ${finalPartPath}`);
            }
        } catch (err: any) {
            console.error(`❌ Error exporting ${collectionName}:`, err.message);
        }
    }

    console.log(`✅ ALL DATA EXPORTED AS SQL CHUNKS.`);
}

migrate().catch(console.error);
