# Accommodation Assignment Improvements TODO

## Current Status
- ✅ Analyzed existing code (assign/page.tsx, transfers/page.tsx, accommodation-context.tsx)
- ✅ Created improvement plan
- ✅ Got user approval

## Pending Tasks

### 1. Update Occupant Type (accommodation-context.tsx)
- [ ] Add optional `until` field to Occupant type for check-out dates
- [ ] Update Firestore schema if needed

### 2. Add Check-in/Check-out Functionality (assign/page.tsx)
- [ ] Add check-in date picker for new assignments
- [ ] Add check-out functionality in room details dialog
- [ ] Update assignment logic to handle dates

### 3. Quick Room Switching (assign/page.tsx)
- [ ] Add "Move to Room" button in room details dialog
- [ ] Implement quick transfer without full transfer request
- [ ] Add room selection dropdown for quick moves

### 4. Enhanced Alerts and Notifications
- [ ] Add alerts for room capacity nearing full
- [ ] Add notifications for check-in/check-out events
- [ ] Improve existing notification system

### 5. Update Context Methods (accommodation-context.tsx)
- [ ] Add checkOutWorker method
- [ ] Update assignWorkerToRoom to accept dates
- [ ] Add quickTransfer method for room switching

### 6. Testing and Validation
- [ ] Test all new features
- [ ] Verify Firestore synchronization
- [ ] Check UI responsiveness

### 7. Documentation Updates
- [ ] Update relevant documentation files
- [ ] Add user guide for new features
