const { LocalCloudflareDB } = require('./src/lib/local-db');

async function testDB() {
  try {
    const db = new LocalCloudflareDB();
    const items = await db.getInventory(5, 0);
    console.log('Inventory items:', JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testDB();