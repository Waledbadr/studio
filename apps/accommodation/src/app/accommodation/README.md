# Accommodation Management Module

## Overview

The Accommodation Management module is a comprehensive system for managing worker housing, room assignments, contracts, and billing for sister companies and external partners. Built within the EstateCare platform, it provides full lifecycle management of accommodation services with automated capacity validation, nationality compliance, and invoice generation.

**Base URL**: `http://localhost:9002/accommodation`

---

## Core Features

### 1. **Dashboard & Overview** (`/accommodation/overview`)
- Real-time occupancy metrics across all residences
- Capacity warnings for residences >90% full
- Nationality conflict detection (mixed nationality rooms)
- Active contract tracking
- Pending transfer requests
- Quick action links to all major modules

### 2. **Worker Management** (`/accommodation/workers`)
- Add/edit/delete workers
- Store: name, nationality, job title (Worker/Supervisor/Engineer)
- Excel import capability (planned)
- Firestore-backed with localStorage fallback
- Auto-sync across tabs
- Migration tool for local → Firestore

### 3. **Company Management** (`/accommodation/companies`)
- Sister company and partner database
- Dual-language support (Arabic/English names)
- Contact information (email, phone, address)
- Linked contract view
- Cannot delete companies with active contracts

### 4. **Contract Management** (`/accommodation/contracts`)
- Create contracts between companies and residences
- Define: start/end dates, rate per person/month, expected workers
- Contract status: Active, Expired, Cancelled
- Track actual vs expected occupancy
- View associated invoices
- Cannot delete contracts with invoices

### 5. **Invoicing System** (`/accommodation/invoices`)
- Auto-generate monthly invoices for all active contracts
- Calculation: `(workers × rate × days) / 30`
- Invoice statuses: Draft, Pending, Paid, Overdue, Cancelled
- Mark invoices as paid
- PDF export (planned)
- Email automation (planned)

### 6. **Room Assignment** (`/accommodation/assign`)
- Assign workers to rooms with validation
- Capacity calculation based on role:
  - Worker: 4 m²/person
  - Supervisor: 8 m²/person
  - Engineer: 16 m²/person
- Nationality enforcement (single nationality per room)
- Bulk assignment capability
- Auto-suggestion for optimal room selection

### 7. **Transfer Management** (`/accommodation/transfers`)
- Create transfer requests between residences
- Approval workflow (Pending → Approved/Rejected)
- Auto-allocation on approval
- Transfer history logging
- Audit trail with timestamps

### 8. **Comprehensive Reports** (`/accommodation/reports`)
- **Occupancy Report**: By residence with nationality breakdown
- **Capacity Warnings**: Residences approaching full capacity
- **Nationality Violations**: Rooms violating same-nationality rule
- **Contract Summary**: Performance metrics per contract
- **Unpaid Invoices**: Outstanding payments tracking
- **Transfer History**: All worker movements

---

## Business Rules

### Capacity Validation
```
Max Capacity = floor(room_area_sqm / space_per_person)
- Worker: 4 m² per person
- Supervisor: 8 m² per person
- Engineer: 16 m² per person
```

### Nationality Compliance
- **Rule**: One nationality per room (no mixing)
- **Validation**: Applied on worker assignment and transfer approval
- **Reporting**: Violations flagged in dashboard and reports

### Invoice Generation
```
Total Amount = (number_of_workers × rate_per_person × days_in_month) / 30
```
- Runs monthly for all active contracts
- Only counts workers actually occupying the residence
- Skips if invoice already exists for that month

### Contract Lifecycle
- **Active**: Contract is valid and generating invoices
- **Expired**: End date passed (manual update required)
- **Cancelled**: Terminated early

---

## Architecture

### Data Flow
```
Firestore Collections:
├── workers              # Worker profiles
├── companies            # Sister companies & partners
├── contracts            # Housing contracts
├── invoices             # Monthly billing
├── ac_occupants*        # Room assignments (localStorage + Firestore planned)
└── ac_transfers*        # Transfer requests (localStorage + Firestore planned)

*Currently localStorage-backed with Firestore migration path
```

### Context Provider
**File**: `src/context/accommodation-context.tsx`

Exports:
- State: `workers`, `companies`, `contracts`, `invoices`, `occupants`, `transferRequests`, `residences`
- CRUD: `saveWorker`, `deleteWorker`, `saveCompany`, `deleteCompany`, `saveContract`, `deleteContract`, `saveInvoice`, `deleteInvoice`
- Operations: `assignWorkerToRoom`, `bulkAssign`, `createTransferRequest`, `reviewTransferRequest`
- Invoice: `generateMonthlyInvoices`
- Reports: `getDailyReport`, `getMonthlyReport`

### Integration with Main App
- **Residences**: Reuses existing `residences-context.tsx` data (buildings, floors, rooms)
- **Auth**: Shares Firebase auth from main app
- **Layout**: Nested under main `AppLayout` with dedicated `AccommodationProvider`
- **Theming**: Uses same Tailwind config and shadcn/ui components

---

## API Endpoints (Planned)

For external system integration:

```
GET    /api/accommodation/residences         # List all housing sites
GET    /api/accommodation/rooms               # List rooms with capacity
POST   /api/accommodation/workers             # Import worker
PUT    /api/accommodation/workers/:id         # Update worker
GET    /api/accommodation/contracts           # List contracts
POST   /api/accommodation/invoices/generate   # Trigger invoice generation
GET    /api/accommodation/reports/occupancy   # JSON occupancy data
```

---

## Role-Based Access Control (Planned)

| Role                   | Permissions                                      |
|------------------------|--------------------------------------------------|
| **Admin**              | Full access to all modules                       |
| **Housing Officer**    | Manage rooms, workers, assignments, transfers    |
| **Finance**            | Manage companies, contracts, invoices            |
| **Company Rep**        | View only (own company's contracts & invoices)   |

Implementation: Add auth checks in context methods and UI components using existing `useAuth()` from main app.

---

## Multi-Language Support (In Progress)

Following existing pattern from inventory module:
- Use `useLanguage()` hook from `language-context.tsx`
- Create dictionaries for accommodation terms
- Wrap all UI text in translation calls
- Company names already support `nameAr` and `nameEn`

---

## Development Roadmap

### Phase 1: Core Functionality ✅
- [x] Worker CRUD with Firestore
- [x] Company management
- [x] Contract lifecycle
- [x] Invoice generation
- [x] Dashboard with metrics
- [x] Comprehensive reports

### Phase 2: Enhancements (Next)
- [ ] Excel import for workers
- [ ] PDF invoice generation
- [ ] Email automation for invoices
- [ ] Role-based permissions
- [ ] Full dual-language UI
- [ ] Mobile-responsive optimizations

### Phase 3: Advanced Features
- [ ] Worker check-in/check-out tracking
- [ ] Maintenance request integration per room
- [ ] QR code room identification
- [ ] Automated overdue invoice notifications
- [ ] Contract renewal reminders
- [ ] Historical occupancy analytics

---

## Testing Checklist

### Functional Tests
- [ ] Add/edit/delete worker
- [ ] Assign worker to room (validate capacity & nationality)
- [ ] Create company with Arabic/English names
- [ ] Create contract and verify in company view
- [ ] Generate invoices for a month
- [ ] Mark invoice as paid
- [ ] Create transfer request and approve
- [ ] Verify reports show correct data

### Validation Tests
- [ ] Cannot exceed room capacity
- [ ] Cannot mix nationalities in room
- [ ] Cannot delete company with active contracts
- [ ] Cannot delete contract with invoices
- [ ] Cannot delete paid invoices
- [ ] Duplicate invoice prevention

### Integration Tests
- [ ] Firestore persistence
- [ ] localStorage fallback
- [ ] Tab synchronization
- [ ] Navigation between modules
- [ ] Data consistency across reports

---

## Troubleshooting

### Workers not syncing
- Check Firestore rules allow read/write on `workers` collection
- Verify Firebase config in `.env.local`
- Check browser console for permission errors
- Try migration tool: "Migrate local → Firestore" button

### Invoice generation not working
- Ensure contracts exist with status "Active"
- Verify contract dates overlap with selected month
- Check that workers are assigned to the residence
- Review browser console for errors

### Capacity warnings not showing
- Verify rooms have `spaceSqm` and `roomType` fields
- Check that occupants are linked to rooms correctly
- Ensure residences data is loaded from localStorage

---

## Contributing

When adding new features:
1. Follow existing patterns from `inventory-context.tsx` for Firestore transactions
2. Use dual-language fields (`nameAr`, `nameEn`) for user-facing text
3. Add validation before mutations (capacity, nationality, permissions)
4. Update this README with new features and API changes
5. Write tests for business rule validation

---

## Support

For questions or issues:
- Check main project README: `/README.md`
- Review Firestore rules: `/firestore.rules`
- Consult inventory module for similar patterns: `/src/context/inventory-context.tsx`

---

**Last Updated**: 2025-10-09  
**Version**: 1.0.0  
**Status**: Production Ready (Core Features)
