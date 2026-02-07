const fs = require('fs');
const path = require('path');
const { createInventoryItem } = require('./src/lib/d1-client');

async function uploadInventory() {
  const items = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventory_ready_for_upload.json'), 'utf8'));
  for (const item of items) {
    // تحويل الحقول حسب متطلبات النظام
    const payload = {
      name: item.nameEn || item.nameAr,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      category: item.category,
      unit: item.unit,
      lifespanDays: item.lifespanDays,
      keywordsAr: item.keywordsAr,
      keywordsEn: item.keywordsEn,
      variants: item.variants,
      stock: 0,
      stockByResidence: {}
    };
    try {
      await createInventoryItem(payload);
      console.log('Uploaded:', payload.nameEn || payload.nameAr);
    } catch (err) {
      console.error('Error uploading', payload.nameEn || payload.nameAr, err);
    }
  }
}

uploadInventory();