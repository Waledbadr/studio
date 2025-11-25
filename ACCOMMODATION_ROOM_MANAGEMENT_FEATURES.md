# 🎯 New Features: Room Management & Automatic Capacity Calculation

## ✨ What's New?

### 1. 🧮 Automatic Capacity Calculation
- **Formula**: Every 4m² = 1 worker
- **Auto-update**: When you edit room area, capacity is calculated automatically
- **Real-time preview**: See the calculation in the edit dialog
- **Example**: 
  - 16m² room → 4 workers capacity
  - 20m² room → 5 workers capacity
  - 18m² room → 4 workers capacity (floors down)

### 2. 🏢 Building Management
- **Edit building name**: Click the pencil icon next to building name
- **Delete building**: Click the trash icon
  - ⚠️ Warning: This will delete all floors and rooms inside!
  - Confirmation dialog prevents accidental deletion

### 3. 🏗️ Floor Management
- **Edit floor name**: Click the pencil icon next to floor name
- **Delete floor**: Click the trash icon
  - ⚠️ Warning: This will delete all rooms inside!
  - Confirmation dialog prevents accidental deletion

### 4. 🚪 Room Name Management
- **Quick edit**: Click on the room name to edit it inline
- **Edit area**: Click the pencil icon to open the edit dialog
  - Edit room name
  - Edit room area
  - See auto-calculated capacity

---

## 📖 How to Use

### Edit Room Area & Capacity:
1. Find the room you want to edit
2. Click the **pencil icon** (✏️) on the right side of the room card
3. A dialog opens showing:
   - Room name (editable)
   - Area (editable - enter in m²)
   - Capacity (auto-calculated, read-only)
4. Enter the new area
5. See the capacity calculated automatically below
6. Click **Save**

**Example:**
```
Area: 24 m²
Formula: 24 ÷ 4 = 6 workers
Result: Capacity automatically set to 6
```

### Edit Room Name (Quick):
1. Find the room you want to rename
2. **Click directly on the room name**
3. An input field appears
4. Type the new name
5. Press **Enter** or click outside to save
6. Press **Escape** to cancel

### Edit Building Name:
1. Find the building you want to rename
2. Click the **pencil icon** (✏️) next to the building name
3. An input field appears
4. Type the new name
5. Press **Enter** or click outside to save
6. Press **Escape** to cancel

### Delete Building:
1. Find the building you want to delete
2. Click the **trash icon** (🗑️) next to the building name
3. Confirm the deletion in the dialog
   - ⚠️ This will delete ALL floors and rooms inside!
4. The building and all its contents are deleted

### Edit Floor Name:
1. Expand a building
2. Find the floor you want to rename
3. Click the **pencil icon** (✏️) next to the floor name
4. An input field appears
5. Type the new name
6. Press **Enter** or click outside to save
7. Press **Escape** to cancel

### Delete Floor:
1. Expand a building
2. Find the floor you want to delete
3. Click the **trash icon** (🗑️) next to the floor name
4. Confirm the deletion in the dialog
   - ⚠️ This will delete ALL rooms inside!
5. The floor and all its rooms are deleted

---

## 🎯 Capacity Calculation Details

### The Rule:
**4m² per worker** is the standard calculation

### Examples:
| Area (m²) | Calculation | Capacity |
|-----------|-------------|----------|
| 4         | 4 ÷ 4       | 1 worker |
| 8         | 8 ÷ 4       | 2 workers |
| 12        | 12 ÷ 4      | 3 workers |
| 16        | 16 ÷ 4      | 4 workers |
| 18        | 18 ÷ 4      | 4 workers (floors down) |
| 20        | 20 ÷ 4      | 5 workers |
| 24        | 24 ÷ 4      | 6 workers |
| 30        | 30 ÷ 4      | 7 workers (floors down) |

### Why Floor Down?
- We use `Math.floor()` to ensure we don't assign more workers than the space can comfortably hold
- 18m² = 4.5 workers → rounds down to 4 workers
- This ensures compliance with space regulations

---

## 🔒 Safety Features

### Confirmation Dialogs:
- **Delete Building**: Requires confirmation
- **Delete Floor**: Requires confirmation
- **Clear warning**: Shows what will be deleted

### Data Persistence:
- All changes are saved to:
  - Firestore (if connected)
  - LocalStorage (as backup)
- Page reloads automatically after successful save

### Validation:
- Building name: Cannot be empty
- Floor name: Cannot be empty
- Room name: Cannot be empty
- Area: Must be 0 or positive number

---

## ⚠️ Important Notes

### Before Deleting:
1. ✅ Check if any rooms have occupants
2. ✅ Make sure you have the correct building/floor
3. ✅ Consider moving rooms first instead of deleting

### Capacity Calculation:
- ✅ Automatically updates when area changes
- ✅ Cannot be manually overridden (enforces standard)
- ✅ Updates in real-time in the dialog

### Inline Editing:
- ✅ Click on names to edit quickly
- ✅ Press Enter to save
- ✅ Press Escape to cancel
- ✅ Click outside to save

---

## 🎨 UI Indicators

### Edit Mode:
- Input field appears with auto-focus
- Blue border indicates editable field
- Pencil icon (✏️) shows editable items

### Delete Mode:
- Trash icon (🗑️) in red color
- Requires confirmation dialog
- Shows warning message

### Auto-calculated:
- Disabled input with gray background
- Formula explanation below
- Updates in real-time

---

## 🐛 Troubleshooting

### Changes Not Saving?
1. Check your internet connection (for Firestore)
2. Check browser console for errors
3. Try refreshing the page (Ctrl+F5)

### Capacity Not Updating?
1. Make sure you entered a valid number for area
2. The capacity updates automatically when area changes
3. If stuck, close and reopen the dialog

### Can't Delete Building/Floor?
1. Make sure you clicked "Confirm" in the dialog
2. Check if there are occupants in the rooms
3. Try again after a moment

---

## 📊 Technical Details

### Files Modified:
- `src/components/accommodation/AccommodationResidencesView.tsx`

### New Functions:
- `calculateCapacity(area)` - Calculates capacity from area
- `handleDeleteBuilding()` - Deletes building and contents
- `handleDeleteFloor()` - Deletes floor and contents
- `handleUpdateBuildingName()` - Updates building name
- `handleUpdateFloorName()` - Updates floor name
- `handleUpdateRoomName()` - Updates room name
- `updateFirestore()` - Helper to save to Firestore/localStorage

### New State:
- `editingBuilding` - Tracks building being edited
- `editingFloor` - Tracks floor being edited
- `editingRoomName` - Tracks room name being edited

### Calculation Logic:
```typescript
const calculateCapacity = (area: number) => {
  return Math.floor(area / 4);
};
```

---

**Last Updated**: October 16, 2025  
**Status**: ✅ Ready for Production  
**Version**: 3.0.0 - Enhanced Management Edition
