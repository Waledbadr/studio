#!/bin/bash

# سكريبت ترحيل البيانات من Firebase إلى Cloudflare D1
# يقوم بتصدير البيانات من Firestore واستيرادها إلى D1

set -e

echo "🔄 بدء عملية ترحيل البيانات من Firebase إلى Cloudflare D1"

# التحقق من وجود Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI غير مثبت. يرجى تثبيته أولاً:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# التحقق من وجود jq لمعالجة JSON
if ! command -v jq &> /dev/null; then
    echo "❌ jq غير مثبت. يرجى تثبيته أولاً:"
    echo "Ubuntu/Debian: sudo apt-get install jq"
    echo "macOS: brew install jq"
    echo "Windows: choco install jq"
    exit 1
fi

# التحقق من تسجيل الدخول إلى Firebase
echo "🔐 التحقق من تسجيل الدخول إلى Firebase..."
if ! firebase projects:list &> /dev/null; then
    echo "📝 يرجى تسجيل الدخول إلى Firebase:"
    firebase login
fi

# طلب معرف المشروع
read -p "🏗️ أدخل معرف مشروع Firebase: " FIREBASE_PROJECT_ID
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ معرف المشروع مطلوب"
    exit 1
fi

# إنشاء مجلد للبيانات المصدرة
EXPORT_DIR="firebase_export_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXPORT_DIR"

echo "📤 تصدير البيانات من Firestore..."

# تصدير البيانات لكل مجموعة
collections=("users" "residences" "inventory" "orders" "maintenance_requests" "files" "notifications")

for collection in "${collections[@]}"; do
    echo "📋 تصدير مجموعة: $collection"
    firebase firestore:export gs://${FIREBASE_PROJECT_ID}.appspot.com/exports/$collection --project $FIREBASE_PROJECT_ID --collection-ids $collection
    
    # تحميل البيانات المصدرة
    gsutil -m cp -r gs://${FIREBASE_PROJECT_ID}.appspot.com/exports/$collection ./$EXPORT_DIR/
done

echo "✅ تم تصدير البيانات بنجاح"

# تحويل البيانات من Firestore إلى SQL
echo "🔄 تحويل البيانات إلى تنسيق SQL..."

# إنشاء ملف SQL للاستيراد
SQL_FILE="${EXPORT_DIR}/import.sql"
echo "-- ملف استيراد البيانات من Firebase إلى Cloudflare D1" > $SQL_FILE
echo "-- تم إنشاؤه في: $(date)" >> $SQL_FILE
echo "" >> $SQL_FILE

# دالة تحويل المستخدمين
convert_users() {
    echo "-- استيراد المستخدمين" >> $SQL_FILE
    
    # البحث عن ملفات البيانات وتحويلها
    find "$EXPORT_DIR" -name "*.json" -path "*/users/*" | while read -r file; do
        jq -r '
        to_entries[] | 
        select(.value.fields) |
        {
            id: .key,
            name: (.value.fields.name.stringValue // ""),
            email: (.value.fields.email.stringValue // ""),
            role: (.value.fields.role.stringValue // "user"),
            password_hash: (.value.fields.password_hash.stringValue // ""),
            is_active: (.value.fields.is_active.booleanValue // true),
            phone: (.value.fields.phone.stringValue // null),
            created_at: (.value.createTime // now | strftime("%Y-%m-%d %H:%M:%S")),
            updated_at: (.value.updateTime // now | strftime("%Y-%m-%d %H:%M:%S"))
        } |
        "INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active, phone, created_at, updated_at) VALUES (" +
        "\"" + .id + "\", " +
        "\"" + .name + "\", " +
        "\"" + .email + "\", " +
        "\"" + .role + "\", " +
        "\"" + .password_hash + "\", " +
        (.is_active | tostring) + ", " +
        (if .phone then "\"" + .phone + "\"" else "NULL" end) + ", " +
        "\"" + .created_at + "\", " +
        "\"" + .updated_at + "\"" +
        ");"
        ' "$file" >> $SQL_FILE
    done
    
    echo "" >> $SQL_FILE
}

# دالة تحويل العقارات
convert_residences() {
    echo "-- استيراد العقارات" >> $SQL_FILE
    
    find "$EXPORT_DIR" -name "*.json" -path "*/residences/*" | while read -r file; do
        jq -r '
        to_entries[] | 
        select(.value.fields) |
        {
            id: .key,
            name: (.value.fields.name.stringValue // ""),
            type: (.value.fields.type.stringValue // "apartment"),
            address: (.value.fields.address.stringValue // ""),
            total_units: (.value.fields.total_units.integerValue // 0),
            available_units: (.value.fields.available_units.integerValue // 0),
            description: (.value.fields.description.stringValue // null),
            created_by: (.value.fields.created_by.stringValue // ""),
            created_at: (.value.createTime // now | strftime("%Y-%m-%d %H:%M:%S")),
            updated_at: (.value.updateTime // now | strftime("%Y-%m-%d %H:%M:%S"))
        } |
        "INSERT OR IGNORE INTO residences (id, name, type, address, total_units, available_units, description, created_by, created_at, updated_at) VALUES (" +
        "\"" + .id + "\", " +
        "\"" + .name + "\", " +
        "\"" + .type + "\", " +
        "\"" + .address + "\", " +
        (.total_units | tostring) + ", " +
        (.available_units | tostring) + ", " +
        (if .description then "\"" + .description + "\"" else "NULL" end) + ", " +
        "\"" + .created_by + "\", " +
        "\"" + .created_at + "\", " +
        "\"" + .updated_at + "\"" +
        ");"
        ' "$file" >> $SQL_FILE
    done
    
    echo "" >> $SQL_FILE
}

# دالة تحويل المخزون
convert_inventory() {
    echo "-- استيراد المخزون" >> $SQL_FILE
    
    find "$EXPORT_DIR" -name "*.json" -path "*/inventory/*" | while read -r file; do
        jq -r '
        to_entries[] | 
        select(.value.fields) |
        {
            id: .key,
            name: (.value.fields.name.stringValue // ""),
            category: (.value.fields.category.stringValue // "general"),
            current_stock: (.value.fields.current_stock.integerValue // 0),
            min_threshold: (.value.fields.min_threshold.integerValue // 0),
            max_threshold: (.value.fields.max_threshold.integerValue // 100),
            unit_price: (.value.fields.unit_price.doubleValue // 0),
            supplier: (.value.fields.supplier.stringValue // ""),
            residence_id: (.value.fields.residence_id.stringValue // ""),
            created_by: (.value.fields.created_by.stringValue // ""),
            created_at: (.value.createTime // now | strftime("%Y-%m-%d %H:%M:%S")),
            updated_at: (.value.updateTime // now | strftime("%Y-%m-%d %H:%M:%S"))
        } |
        "INSERT OR IGNORE INTO inventory (id, name, category, current_stock, min_threshold, max_threshold, unit_price, supplier, residence_id, created_by, created_at, updated_at) VALUES (" +
        "\"" + .id + "\", " +
        "\"" + .name + "\", " +
        "\"" + .category + "\", " +
        (.current_stock | tostring) + ", " +
        (.min_threshold | tostring) + ", " +
        (.max_threshold | tostring) + ", " +
        (.unit_price | tostring) + ", " +
        "\"" + .supplier + "\", " +
        "\"" + .residence_id + "\", " +
        "\"" + .created_by + "\", " +
        "\"" + .created_at + "\", " +
        "\"" + .updated_at + "\"" +
        ");"
        ' "$file" >> $SQL_FILE
    done
    
    echo "" >> $SQL_FILE
}

# تشغيل عمليات التحويل
echo "👥 تحويل بيانات المستخدمين..."
convert_users

echo "🏠 تحويل بيانات العقارات..."
convert_residences

echo "📦 تحويل بيانات المخزون..."
convert_inventory

# إضافة المزيد من دوال التحويل حسب الحاجة...

echo "✅ تم تحويل البيانات إلى تنسيق SQL"

# استيراد البيانات إلى Cloudflare D1
echo "📥 استيراد البيانات إلى Cloudflare D1..."

# السؤال عن البيئة
read -p "🌍 هل تريد الاستيراد إلى البيئة المحلية؟ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📍 استيراد إلى البيئة المحلية..."
    wrangler d1 execute estatecare-db --local --file=$SQL_FILE
else
    echo "📍 استيراد إلى بيئة الإنتاج..."
    wrangler d1 execute estatecare-db --file=$SQL_FILE
fi

echo "✅ تم استيراد البيانات بنجاح!"

# تنظيف الملفات المؤقتة
read -p "🗑️ هل تريد حذف الملفات المؤقتة؟ (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    rm -rf "$EXPORT_DIR"
    echo "✅ تم حذف الملفات المؤقتة"
else
    echo "📁 تم الاحتفاظ بالملفات في: $EXPORT_DIR"
fi

echo ""
echo "🎉 تم إنجاز عملية الترحيل بنجاح!"
echo "📋 ملخص العملية:"
echo "   - تم تصدير البيانات من Firebase"
echo "   - تم تحويل البيانات إلى تنسيق SQL"
echo "   - تم استيراد البيانات إلى Cloudflare D1"
echo ""
echo "⚠️ تأكد من اختبار البيانات المستوردة قبل إيقاف Firebase"
