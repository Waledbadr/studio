# 🔧 Update Default Room Areas - Feature Documentation

## Overview
This feature updates all rooms in the system that don't have an area value, setting them to default values:
- **Default Area**: 24m²
- **Default Capacity**: 6 workers (based on 24 ÷ 4 = 6)

## 📋 Two Ways to Update

### Method 1: Using the UI Button (Recommended)
The easiest way for administrators to update rooms.

#### Steps:
1. Navigate to **Accommodation → Residences** page
2. Look for the blue button: **"Update Default Room Areas"**
3. Click the button
4. Wait for confirmation toast
5. Page will reload automatically with updated data

#### Features:
- ✅ Visual feedback with toast notifications
- ✅ Shows count of updated rooms
- ✅ Automatic page reload
- ✅ Works with both Firestore and localStorage
- ✅ Safe - only updates rooms without area

#### Location:
```
http://localhost:9002/accommodation/residences
```

---

### Method 2: Using the Script (For Developers)
Run the script directly from terminal for batch operations.

#### Steps:

**PowerShell:**
```powershell
npm run update:room-areas
```

**Or directly:**
```powershell
node --env-file=.env.local scripts/update-rooms-default-area.mjs
```

#### Features:
- ✅ Detailed console output
- ✅ Shows progress per residence
- ✅ Lists each updated room
- ✅ Summary statistics at the end
- ✅ Works with Firestore only
- ✅ Requires Firebase credentials in .env.local

#### Sample Output:
```
🚀 Starting room area update script...

📊 Reading residences from Firestore...

✅ Found 3 residence(s)

────────────────────────────────────────────────────────────────────────────────

🏢 Processing: North Complex
   City: Riyadh
   📦 Rooms checked: 24
   ✨ Rooms updated: 8

   Updated rooms:
   1. Room 101
      Building: Building A, Floor: Ground Floor
      Old area: None → New area: 24m²
      New capacity: 6 workers
   ...

═══════════════════════════════════════════════════════════════════════════════
📊 SUMMARY
═══════════════════════════════════════════════════════════════════════════════
✅ Total residences processed: 3
📦 Total rooms checked: 72
✨ Total rooms updated: 15
🎯 Default values applied:
   - Area: 24m²
   - Capacity: 6 workers
   - Formula: Area ÷ 4 = Capacity

🎉 Successfully updated 15 room(s)!
────────────────────────────────────────────────────────────────────────────────

✅ Script completed successfully!
```

---

## 🎯 What Gets Updated?

### Criteria:
A room will be updated if:
- `area` is `undefined`
- `area` is `null`
- `area` is `0`
- `area` is missing from the document

### What Happens:
For each matching room:
1. Set `area = 24`
2. Set `capacity = 6`
3. Save to Firestore/localStorage

### What's NOT Changed:
- ✅ Rooms that already have an area value (even if it's not 24)
- ✅ Room names
- ✅ Room IDs
- ✅ Occupant assignments
- ✅ Other room properties

---

## 📊 Technical Details

### Files Modified:
1. **Script**: `scripts/update-rooms-default-area.mjs`
2. **UI Component**: `src/components/accommodation/AccommodationResidencesView.tsx`
3. **Package Scripts**: `package.json`

### Functions Added:

#### In UI Component:
```typescript
const handleUpdateAllRoomsDefaultArea = async () => {
  // Iterates through all residences
  // Checks each room for missing area
  // Updates with default values
  // Shows toast notification
}
```

#### In Script:
```javascript
function roomNeedsUpdate(room) {
  return !room.area || room.area === 0 || 
         room.area === null || room.area === undefined;
}

async function updateResidence(residenceId, residenceData) {
  // Deep clones residence
  // Finds rooms needing update
  // Applies default values
  // Updates Firestore
}
```

### Data Structure:
```typescript
interface Room {
  id: string;
  name: string;
  area?: number;        // ← This gets updated
  capacity?: number;    // ← This gets updated
  // ... other properties
}
```

### Database Operations:
- Uses `updateDoc` from Firestore
- Updates entire residence document
- Preserves all nested structures
- No data loss - only adds missing values

---

## ⚠️ Important Notes

### Before Running:
1. ✅ **Backup your data** (recommended for scripts)
2. ✅ Make sure you have the correct Firebase credentials
3. ✅ Understand that this will update ALL rooms without area
4. ✅ Test on a small dataset first if unsure

### After Running:
1. ✅ Verify updated rooms have correct area (24m²)
2. ✅ Verify capacity is correct (6 workers)
3. ✅ Check that rooms with existing area were NOT changed
4. ✅ Test room editing still works normally

### Permissions:
- UI button: Available to all users with access to Residences page
- Script: Requires Firebase admin credentials in .env.local

---

## 🔍 Troubleshooting

### Issue: "Firebase configuration not found"
**Solution**: Make sure `.env.local` exists with all Firebase variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Issue: "No residences found"
**Solution**: Check that:
1. You're connected to the correct Firebase project
2. The `residences` collection exists
3. You have read permissions

### Issue: Script runs but no rooms updated
**Solution**: This means all rooms already have area values. This is normal!

### Issue: UI button does nothing
**Solution**: Check:
1. Browser console for errors
2. That you're logged in
3. That residences are loaded
4. Network tab for Firestore errors

---

## 📖 Usage Examples

### Example 1: Update All Rooms (UI)
```
1. Open http://localhost:9002/accommodation/residences
2. Click "Update Default Room Areas" button
3. See toast: "Updated 15 room(s) with default area (24m²) and capacity (6 workers)"
4. Page reloads automatically
5. Edit any room to verify area is 24m²
```

### Example 2: Update All Rooms (Script)
```powershell
# Run from project root
npm run update:room-areas

# Wait for completion
# Check output for number of updates
# Verify in Firebase Console or UI
```

### Example 3: Verify Updates
```
1. Go to any residence
2. Expand a building
3. Expand a floor
4. Click on any room that was updated
5. Should show:
   - Area: 24 m²
   - Capacity: 6 workers (read-only)
   - Formula: 24 ÷ 4 = 6 workers
```

---

## 🎨 UI Integration

### Button Design:
- **Color**: Blue theme (bg-blue-50, hover:bg-blue-100)
- **Icon**: DoorOpen icon
- **Text**: "Update Default Room Areas"
- **Position**: Below view mode buttons
- **Tooltip**: "Update all rooms without area to 24m² (6 capacity)"

### User Feedback:
- **Success Toast**: Shows count of updated rooms
- **Info Toast**: If no rooms need updating
- **Error Toast**: If update fails with error message
- **Loading**: Page reload after success

---

## 🔐 Safety Features

### Built-in Protections:
1. ✅ Only updates rooms without area (no overwrites)
2. ✅ Validates room structure before update
3. ✅ Uses Firebase transactions where possible
4. ✅ Provides detailed error messages
5. ✅ Logs all operations for debugging

### Rollback:
If you need to undo:
1. Restore from Firebase backup (if available)
2. Or manually edit rooms that were changed
3. Or run a custom script to set different values

---

## 📈 Performance

### Expected Performance:
- **UI Method**: 1-2 seconds per residence
- **Script Method**: ~1 second per residence
- **Large Scale**: For 100+ residences, prefer script method

### Optimization:
- Updates are batched per residence
- Only residences with changes are saved
- Uses efficient Firestore operations
- Minimal network calls

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Add confirmation dialog before UI update
- [ ] Allow custom default values in UI
- [ ] Add progress indicator for large updates
- [ ] Export report of updated rooms
- [ ] Add undo functionality
- [ ] Batch updates with retry logic

---

## 📞 Support

### Need Help?
- Check the console logs for detailed error messages
- Verify Firebase permissions
- Test with a single residence first
- Contact system administrator if issues persist

### Documentation:
- Main feature docs: `ACCOMMODATION_ROOM_MANAGEMENT_FEATURES.md`
- System architecture: `.github/copilot-instructions.md`
- Firebase setup: `README.md`

---

**Created**: October 16, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Compatibility**: Works with existing room management features
