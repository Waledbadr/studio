/**
 * Script لاستنساخ البيانات من Firestore إلى Cloudflare D1
 * يقوم بنسخ جميع المجموعات الرئيسية دون التأثير على Firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// تكوين Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
let serviceAccount;

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = require(serviceAccountPath);
} else {
  // استخدام متغيرات البيئة إذا لم يكن ملف الخدمة متوفراً
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };
}

// تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

// وظائف مساعدة لتحويل البيانات
function convertFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
}

function sanitizeForSQL(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// وظائف النسخ لكل مجموعة
async function migrateUsers() {
  console.log('📥 نسخ المستخدمين من Firestore...');
  const usersSnapshot = await db.collection('users').get();
  const users = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const user = {
      id: doc.id,
      name: sanitizeForSQL(data.name),
      email: sanitizeForSQL(data.email),
      phone: sanitizeForSQL(data.phone),
      role: sanitizeForSQL(data.role) || 'user',
      password_hash: sanitizeForSQL(data.password_hash) || sanitizeForSQL(data.passwordHash) || 'temp_hash',
      avatar_url: sanitizeForSQL(data.avatar_url) || sanitizeForSQL(data.avatarUrl),
      is_active: data.is_active !== false && data.isActive !== false,
      created_at: convertFirestoreTimestamp(data.created_at) || convertFirestoreTimestamp(data.createdAt) || new Date().toISOString(),
      updated_at: convertFirestoreTimestamp(data.updated_at) || convertFirestoreTimestamp(data.updatedAt) || new Date().toISOString(),
      last_login: convertFirestoreTimestamp(data.last_login) || convertFirestoreTimestamp(data.lastLogin)
    };
    users.push(user);
  });

  console.log(`✅ تم العثور على ${users.length} مستخدم`);
  return users;
}

async function migrateResidences() {
  console.log('📥 نسخ العقارات من Firestore...');
  const residencesSnapshot = await db.collection('residences').get();
  const residences = [];

  residencesSnapshot.forEach(doc => {
    const data = doc.data();
    const residence = {
      id: doc.id,
      address: sanitizeForSQL(data.address) || 'عنوان غير محدد',
      unit_number: sanitizeForSQL(data.unit_number) || sanitizeForSQL(data.unitNumber),
      building_name: sanitizeForSQL(data.building_name) || sanitizeForSQL(data.buildingName),
      floor_number: data.floor_number || data.floorNumber,
      property_type: sanitizeForSQL(data.property_type) || sanitizeForSQL(data.propertyType) || 'apartment',
      area_sqm: data.area_sqm || data.areaSqm,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      rent_amount: data.rent_amount || data.rentAmount || 0,
      deposit_amount: data.deposit_amount || data.depositAmount,
      utilities_included: data.utilities_included !== false && data.utilitiesIncluded !== false,
      tenant_id: sanitizeForSQL(data.tenant_id) || sanitizeForSQL(data.tenantId),
      lease_start_date: convertFirestoreTimestamp(data.lease_start_date) || convertFirestoreTimestamp(data.leaseStartDate),
      lease_end_date: convertFirestoreTimestamp(data.lease_end_date) || convertFirestoreTimestamp(data.leaseEndDate),
      status: sanitizeForSQL(data.status) || 'available',
      description: sanitizeForSQL(data.description),
      amenities: sanitizeForSQL(data.amenities),
      images: sanitizeForSQL(data.images),
      created_at: convertFirestoreTimestamp(data.created_at) || convertFirestoreTimestamp(data.createdAt) || new Date().toISOString(),
      updated_at: convertFirestoreTimestamp(data.updated_at) || convertFirestoreTimestamp(data.updatedAt) || new Date().toISOString()
    };
    residences.push(residence);
  });

  console.log(`✅ تم العثور على ${residences.length} عقار`);
  return residences;
}

async function migrateInventory() {
  console.log('📥 نسخ المخزون من Firestore...');
  const inventorySnapshot = await db.collection('inventory').get();
  const inventory = [];

  inventorySnapshot.forEach(doc => {
    const data = doc.data();
    const item = {
      id: doc.id,
      name: sanitizeForSQL(data.name) || 'عنصر غير محدد',
      description: sanitizeForSQL(data.description),
      category: sanitizeForSQL(data.category) || 'general',
      subcategory: sanitizeForSQL(data.subcategory),
      sku: sanitizeForSQL(data.sku),
      barcode: sanitizeForSQL(data.barcode),
      quantity: data.quantity || 0,
      unit_of_measure: sanitizeForSQL(data.unit_of_measure) || sanitizeForSQL(data.unitOfMeasure) || 'piece',
      unit_price: data.unit_price || data.unitPrice,
      minimum_stock: data.minimum_stock || data.minimumStock || 0,
      maximum_stock: data.maximum_stock || data.maximumStock,
      supplier_name: sanitizeForSQL(data.supplier_name) || sanitizeForSQL(data.supplierName),
      supplier_contact: sanitizeForSQL(data.supplier_contact) || sanitizeForSQL(data.supplierContact),
      purchase_date: convertFirestoreTimestamp(data.purchase_date) || convertFirestoreTimestamp(data.purchaseDate),
      expiry_date: convertFirestoreTimestamp(data.expiry_date) || convertFirestoreTimestamp(data.expiryDate),
      location: sanitizeForSQL(data.location),
      condition_status: sanitizeForSQL(data.condition_status) || sanitizeForSQL(data.conditionStatus) || 'new',
      image_url: sanitizeForSQL(data.image_url) || sanitizeForSQL(data.imageUrl),
      notes: sanitizeForSQL(data.notes),
      is_active: data.is_active !== false && data.isActive !== false,
      created_at: convertFirestoreTimestamp(data.created_at) || convertFirestoreTimestamp(data.createdAt) || new Date().toISOString(),
      updated_at: convertFirestoreTimestamp(data.updated_at) || convertFirestoreTimestamp(data.updatedAt) || new Date().toISOString()
    };
    inventory.push(item);
  });

  console.log(`✅ تم العثور على ${inventory.length} عنصر مخزون`);
  return inventory;
}

async function migrateOrders() {
  console.log('📥 نسخ الطلبات من Firestore...');
  const ordersSnapshot = await db.collection('orders').get();
  const orders = [];

  ordersSnapshot.forEach(doc => {
    const data = doc.data();
    const order = {
      id: doc.id,
      order_number: sanitizeForSQL(data.order_number) || sanitizeForSQL(data.orderNumber) || `ORDER-${Date.now()}`,
      customer_name: sanitizeForSQL(data.customer_name) || sanitizeForSQL(data.customerName) || 'عميل غير محدد',
      customer_email: sanitizeForSQL(data.customer_email) || sanitizeForSQL(data.customerEmail),
      customer_phone: sanitizeForSQL(data.customer_phone) || sanitizeForSQL(data.customerPhone),
      customer_address: sanitizeForSQL(data.customer_address) || sanitizeForSQL(data.customerAddress),
      order_type: sanitizeForSQL(data.order_type) || sanitizeForSQL(data.orderType) || 'purchase',
      status: sanitizeForSQL(data.status) || 'pending',
      priority: sanitizeForSQL(data.priority) || 'normal',
      total_amount: data.total_amount || data.totalAmount || 0,
      discount_amount: data.discount_amount || data.discountAmount || 0,
      tax_amount: data.tax_amount || data.taxAmount || 0,
      payment_status: sanitizeForSQL(data.payment_status) || sanitizeForSQL(data.paymentStatus) || 'pending',
      payment_method: sanitizeForSQL(data.payment_method) || sanitizeForSQL(data.paymentMethod),
      currency: sanitizeForSQL(data.currency) || 'SAR',
      delivery_date: convertFirestoreTimestamp(data.delivery_date) || convertFirestoreTimestamp(data.deliveryDate),
      delivery_address: sanitizeForSQL(data.delivery_address) || sanitizeForSQL(data.deliveryAddress),
      assigned_to: sanitizeForSQL(data.assigned_to) || sanitizeForSQL(data.assignedTo),
      notes: sanitizeForSQL(data.notes),
      created_at: convertFirestoreTimestamp(data.created_at) || convertFirestoreTimestamp(data.createdAt) || new Date().toISOString(),
      updated_at: convertFirestoreTimestamp(data.updated_at) || convertFirestoreTimestamp(data.updatedAt) || new Date().toISOString()
    };
    orders.push(order);
  });

  console.log(`✅ تم العثور على ${orders.length} طلب`);
  return orders;
}

async function migrateMaintenanceRequests() {
  console.log('📥 نسخ طلبات الصيانة من Firestore...');
  const maintenanceSnapshot = await db.collection('maintenance_requests').get();
  const maintenanceRequests = [];

  maintenanceSnapshot.forEach(doc => {
    const data = doc.data();
    const request = {
      id: doc.id,
      request_number: sanitizeForSQL(data.request_number) || sanitizeForSQL(data.requestNumber) || `REQ-${Date.now()}`,
      residence_id: sanitizeForSQL(data.residence_id) || sanitizeForSQL(data.residenceId) || 'unknown',
      tenant_id: sanitizeForSQL(data.tenant_id) || sanitizeForSQL(data.tenantId),
      title: sanitizeForSQL(data.title) || 'طلب صيانة',
      description: sanitizeForSQL(data.description) || 'وصف غير محدد',
      category: sanitizeForSQL(data.category) || 'general',
      priority: sanitizeForSQL(data.priority) || 'normal',
      status: sanitizeForSQL(data.status) || 'pending',
      assigned_to: sanitizeForSQL(data.assigned_to) || sanitizeForSQL(data.assignedTo),
      estimated_cost: data.estimated_cost || data.estimatedCost,
      actual_cost: data.actual_cost || data.actualCost,
      estimated_completion: convertFirestoreTimestamp(data.estimated_completion) || convertFirestoreTimestamp(data.estimatedCompletion),
      completion_date: convertFirestoreTimestamp(data.completion_date) || convertFirestoreTimestamp(data.completionDate),
      tenant_rating: data.tenant_rating || data.tenantRating,
      tenant_feedback: sanitizeForSQL(data.tenant_feedback) || sanitizeForSQL(data.tenantFeedback),
      images: sanitizeForSQL(data.images),
      before_images: sanitizeForSQL(data.before_images) || sanitizeForSQL(data.beforeImages),
      after_images: sanitizeForSQL(data.after_images) || sanitizeForSQL(data.afterImages),
      required_materials: sanitizeForSQL(data.required_materials) || sanitizeForSQL(data.requiredMaterials),
      work_log: sanitizeForSQL(data.work_log) || sanitizeForSQL(data.workLog),
      created_at: convertFirestoreTimestamp(data.created_at) || convertFirestoreTimestamp(data.createdAt) || new Date().toISOString(),
      updated_at: convertFirestoreTimestamp(data.updated_at) || convertFirestoreTimestamp(data.updatedAt) || new Date().toISOString()
    };
    maintenanceRequests.push(request);
  });

  console.log(`✅ تم العثور على ${maintenanceRequests.length} طلب صيانة`);
  return maintenanceRequests;
}

// وظيفة توليد SQL للإدراج
function generateInsertSQL(tableName, data) {
  if (!data || data.length === 0) return '';

  const columns = Object.keys(data[0]);
  const placeholders = columns.map(() => '?').join(', ');
  
  let sql = `-- إدراج البيانات في جدول ${tableName}\n`;
  sql += `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES\n`;
  
  const values = data.map(row => {
    const rowValues = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }).join(', ');
    return `  (${rowValues})`;
  }).join(',\n');

  sql += values + ';\n\n';
  return sql;
}

// وظيفة رئيسية لنسخ جميع البيانات
async function migrateAllData() {
  try {
    console.log('🚀 بدء عملية نسخ البيانات من Firestore إلى Cloudflare D1...\n');

    // نسخ جميع المجموعات
    const [users, residences, inventory, orders, maintenanceRequests] = await Promise.all([
      migrateUsers(),
      migrateResidences(),
      migrateInventory(),
      migrateOrders(),
      migrateMaintenanceRequests()
    ]);

    // إنشاء ملف SQL
    let sqlOutput = `-- ملف نسخ البيانات من Firestore إلى Cloudflare D1
-- تم إنشاؤه في: ${new Date().toISOString()}
-- المشروع: ${serviceAccount.project_id}

-- بدء المعاملة
BEGIN TRANSACTION;

`;

    // إضافة البيانات لكل جدول
    sqlOutput += generateInsertSQL('users', users);
    sqlOutput += generateInsertSQL('residences', residences);
    sqlOutput += generateInsertSQL('inventory', inventory);
    sqlOutput += generateInsertSQL('orders', orders);
    sqlOutput += generateInsertSQL('maintenance_requests', maintenanceRequests);

    sqlOutput += `-- إنهاء المعاملة
COMMIT;

-- إحصائيات النسخ:
-- المستخدمون: ${users.length}
-- العقارات: ${residences.length}
-- المخزون: ${inventory.length}
-- الطلبات: ${orders.length}
-- طلبات الصيانة: ${maintenanceRequests.length}
-- إجمالي السجلات: ${users.length + residences.length + inventory.length + orders.length + maintenanceRequests.length}
`;

    // حفظ الملف
    const outputPath = path.join(__dirname, 'firestore-to-cloudflare-migration.sql');
    fs.writeFileSync(outputPath, sqlOutput, 'utf8');

    // إنشاء ملف JSON للبيانات المهيكلة (للنسخ الاحتياطي)
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        projectId: serviceAccount.project_id,
        totalRecords: users.length + residences.length + inventory.length + orders.length + maintenanceRequests.length
      },
      users,
      residences,
      inventory,
      orders,
      maintenanceRequests
    };

    const jsonPath = path.join(__dirname, 'firestore-backup.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

    console.log('\n✅ اكتملت عملية النسخ بنجاح!');
    console.log(`📄 ملف SQL: ${outputPath}`);
    console.log(`📄 ملف JSON: ${jsonPath}`);
    console.log('\n📊 إحصائيات النسخ:');
    console.log(`   👥 المستخدمون: ${users.length}`);
    console.log(`   🏠 العقارات: ${residences.length}`);
    console.log(`   📦 المخزون: ${inventory.length}`);
    console.log(`   📋 الطلبات: ${orders.length}`);
    console.log(`   🔧 طلبات الصيانة: ${maintenanceRequests.length}`);
    console.log(`   📈 إجمالي السجلات: ${jsonData.metadata.totalRecords}`);

    console.log('\n📝 الخطوات التالية:');
    console.log('1. قم بتشغيل ملف SQL في قاعدة بيانات Cloudflare D1');
    console.log('2. تحقق من صحة البيانات المنسوخة');
    console.log('3. قم بتحديث إعدادات التطبيق للاتصال بـ Cloudflare D1');

  } catch (error) {
    console.error('❌ خطأ في عملية النسخ:', error);
    throw error;
  }
}

// تشغيل الـ script
if (require.main === module) {
  migrateAllData()
    .then(() => {
      console.log('\n🎉 تمت العملية بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشلت العملية:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateAllData,
  migrateUsers,
  migrateResidences,
  migrateInventory,
  migrateOrders,
  migrateMaintenanceRequests
};