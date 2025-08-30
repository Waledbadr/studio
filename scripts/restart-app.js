#!/usr/bin/env node

/**
 * سكريبت إعادة تشغيل التطبيق مع مسح الـ cache
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔄 إعادة تشغيل التطبيق مع مسح الـ cache\n');

function clearCache() {
    console.log('🧹 مسح cache التطبيق...');

    const cachePaths = [
        '.next',
        'node_modules/.cache',
        '.swc'
    ];

    cachePaths.forEach(cachePath => {
        const fullPath = path.join(process.cwd(), cachePath);
        if (fs.existsSync(fullPath)) {
            try {
                if (process.platform === 'win32') {
                    execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'ignore' });
                } else {
                    execSync(`rm -rf "${fullPath}"`, { stdio: 'ignore' });
                }
                console.log(`✅ تم مسح: ${cachePath}`);
            } catch (error) {
                console.log(`⚠️ تعذر مسح: ${cachePath}`);
            }
        }
    });
}

function restartApp() {
    console.log('\n🚀 تشغيل التطبيق...');

    console.log('📋 معلومات مهمة:');
    console.log('===============================');
    console.log('🌐 رابط التطبيق: http://localhost:3001');
    console.log('');
    console.log('🔐 حسابات الاختبار:');
    console.log('   مدير: admin@estatecare.com / admin123');
    console.log('   مدير عقارات: manager@estatecare.com / manager123');
    console.log('   فني: maintenance@estatecare.com / tech123');
    console.log('');
    console.log('💡 نصائح:');
    console.log('   • افتح المتصفح في وضع التصفح الخفي');
    console.log('   • امسح cache المتصفح (Ctrl+Shift+Delete)');
    console.log('   • تأكد من تسجيل الدخول بالحسابات الجديدة');
    console.log('===============================\n');

    // تشغيل التطبيق
    const child = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    child.on('error', (error) => {
        console.error('❌ فشل في تشغيل التطبيق:', error);
    });

    // الانتظار قليلاً ثم عرض رسالة النجاح
    setTimeout(() => {
        console.log('\n✅ التطبيق يعمل الآن!');
        console.log('🌐 افتح المتصفح واذهب إلى: http://localhost:3001\n');
    }, 3000);
}

// تشغيل السكريبت
async function main() {
    try {
        clearCache();
        restartApp();
    } catch (error) {
        console.error('❌ حدث خطأ:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };