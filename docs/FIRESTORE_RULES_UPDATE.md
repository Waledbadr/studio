# Firestore Security Rules Update - Accommodation Module

## Changes Made

Updated `firestore.rules` to add security rules for three new accommodation-related collections:

### New Collections Added:

1. **companies** - Sister companies for housing contracts
2. **contracts** - Housing contracts with rates and terms
3. **invoices** - Monthly billing invoices

### Security Rules:

All three collections follow the same pattern:
- **Read**: Any signed-in user can view
- **Create/Update**: Admins and Supervisors (includes Housing Officer, Finance roles)
- **Delete**: Admin only

## Deployment Status

✅ **Rules successfully deployed to Firebase**
- Project: `sample-firebase-ai-app-55f54`
- Timestamp: October 9, 2025
- Command: `firebase deploy --only firestore:rules`

## Testing the Fix

### Before the fix:
```
Contracts snapshot error: FirebaseError: Missing or insufficient permissions
Companies snapshot error: FirebaseError: Missing or insufficient permissions
Invoices snapshot error: FirebaseError: Missing or insufficient permissions
```

### After the fix:
1. Refresh your browser (clear cache if needed)
2. The errors should be gone
3. The accommodation module should be able to:
   - Read/list companies, contracts, and invoices
   - Create new companies (if Admin/Supervisor)
   - Create new contracts (if Admin/Supervisor)
   - Generate invoices (if Admin/Supervisor)

## Verification Steps

1. Navigate to `/accommodation/companies`
   - Should load without permission errors
   - Can create a new company if you have Admin/Supervisor role

2. Navigate to `/accommodation/contracts`
   - Should load without permission errors
   - Can create contracts linked to companies and residences

3. Navigate to `/accommodation/invoices`
   - Should load without permission errors
   - Can generate monthly invoices

## User Roles with Access

The following roles can manage accommodation data:
- **Admin**: Full access (read, write, delete)
- **Supervisor**: Can read and write (but not delete)

Regular users can only view the data.

## Notes

- The CORS error for `identitytoolkit.googleapis.com` is unrelated to these permissions
- That's a network/authentication issue that may resolve on its own
- If it persists, check your Firebase Authentication configuration

## Firestore Rules Location

File: `firestore.rules` (lines 65-89)

```javascript
// Accommodation Companies (sister companies for contracts)
match /companies/{companyId} {
  allow read: if isSignedIn();
  allow create, update: if isAdmin() || isSupervisor();
  allow delete: if isAdmin();
}

// Accommodation Contracts
match /contracts/{contractId} {
  allow read: if isSignedIn();
  allow create, update: if isAdmin() || isSupervisor();
  allow delete: if isAdmin();
}

// Accommodation Invoices
match /invoices/{invoiceId} {
  allow read: if isSignedIn();
  allow create, update: if isAdmin() || isSupervisor();
  allow delete: if isAdmin();
}
```

## Rollback (if needed)

If you need to revert these changes:
```bash
git checkout HEAD -- firestore.rules
firebase deploy --only firestore:rules
```
