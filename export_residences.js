// سكريبت Node.js لتصدير جميع بيانات السكنات من Firestore إلى ملف CSV
// يجب تثبيت الحزم: npm install firebase-admin fast-csv

const admin = require('firebase-admin');
const fs = require('fs');
const { format } = require('fast-csv');

// ضع هنا بيانات الخدمة الخاصة بك
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportResidences() {
  const residencesSnap = await db.collection('residences').get();
  const rows = [];

  residencesSnap.forEach(doc => {
    const res = doc.data();
    const resId = doc.id;
    // Flat rooms (بدون مباني)
    if (Array.isArray(res.rooms)) {
      res.rooms.forEach(room => {
        rows.push({
          residenceId: resId,
          residenceName: res.name,
          city: res.city,
          managerId: res.managerId,
          buildingId: '',
          buildingName: '',
          floorId: '',
          floorName: '',
          roomId: room.id,
          roomName: room.name,
          roomCapacity: room.capacity || '',
          ...room
        });
      });
    }
    // Nested buildings/floors/rooms
    if (Array.isArray(res.buildings)) {
      res.buildings.forEach(building => {
        if (Array.isArray(building.floors)) {
          building.floors.forEach(floor => {
            if (Array.isArray(floor.rooms)) {
              floor.rooms.forEach(room => {
                rows.push({
                  residenceId: resId,
                  residenceName: res.name,
                  city: res.city,
                  managerId: res.managerId,
                  buildingId: building.id,
                  buildingName: building.name,
                  floorId: floor.id,
                  floorName: floor.name,
                  roomId: room.id,
                  roomName: room.name,
                  roomCapacity: room.capacity || '',
                  ...room
                });
              });
            }
          });
        }
      });
    }
  });

  // كتابة ملف CSV
  const ws = fs.createWriteStream('residences_export.csv');
  const csvStream = format({ headers: true });
  csvStream.pipe(ws);
  rows.forEach(row => csvStream.write(row));
  csvStream.end();
  console.log('تم تصدير البيانات إلى residences_export.csv');
}

exportResidences().catch(console.error);