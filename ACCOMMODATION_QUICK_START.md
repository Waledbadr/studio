# 🚀 Accommodation Module - Quick Start Guide

## Step 1: Update Firestore Rules

1. Open `firestore.rules` in your project root
2. Copy the rules from `firestore-rules-accommodation.txt`
3. Merge them with your existing rules
4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 2: Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:9002`

## Step 3: Access the Accommodation Module

Navigate to: `http://localhost:9002/accommodation`

You'll be automatically redirected to the Overview dashboard.

## Step 4: Initial Setup (First Time)

### 1. Add a Company
- Go to **Companies** page
- Click "Add Company"
- Fill in:
  - Company Name (required)
  - English/Arabic names (optional)
  - Contact email
  - Contact phone
  - Address
- Click "Add Company"

### 2. Create a Contract
- Go to **Contracts** page
- Click "New Contract"
- Select the company you just created
- Select a residence (from existing residences)
- Set start and end dates
- Enter rate per person per month (in SAR)
- Optionally set expected number of workers
- Click "Create Contract"

### 3. Add Workers (if not already done)
- Go to **Workers** page
- Click "Add worker"
- Enter worker details:
  - ID (auto-generated or custom)
  - Name
  - Nationality
  - Role (Worker/Supervisor/Engineer)
- Click "Save"

### 4. Assign Workers to Rooms
- Go to **Assign** page (via sidebar or quick link)
- Select a worker
- Select a residence and room
- System will validate:
  - ✅ Room has capacity
  - ✅ Nationality matches existing occupants
- Click "Assign"

### 5. Generate Monthly Invoices
- Go to **Invoices** page
- Click "Generate Invoices"
- Select the month (e.g., current month)
- Click "Generate Invoices"
- System will automatically:
  - Find all active contracts for that month
  - Count workers in each residence
  - Calculate amounts based on contract rates
  - Create invoice records

### 6. Review Reports
- Go to **Reports** page
- Explore tabs:
  - **Occupancy**: See utilization by residence
  - **Capacity Warnings**: Identify residences >90% full
  - **Nationality Violations**: Find mixed-nationality rooms
  - **Contract Summary**: Revenue and performance
  - **Unpaid Invoices**: Outstanding payments
  - **Transfer History**: Worker movements

## Common Workflows

### Monthly Billing Cycle
1. End of month: Go to Invoices → Generate Invoices
2. Review generated invoices
3. Export or send invoices (manual/email)
4. Mark invoices as "Paid" when payment received
5. Check Reports → Unpaid Invoices for follow-ups

### Worker Transfer
1. Go to Transfers page
2. Create transfer request:
   - Select worker(s)
   - Choose destination residence
   - Optionally select target room
3. Request status: Pending
4. Admin/Housing Officer reviews and approves
5. System auto-assigns workers to new rooms

### Capacity Management
1. Check Overview dashboard for warnings
2. If residence is >90% full:
   - Option A: Transfer workers to less-occupied residences
   - Option B: Add more rooms to the residence
   - Option C: Adjust contract expectations

### Troubleshooting

#### "Firestore permission denied" error
- Ensure you've updated `firestore.rules`
- Verify Firebase config in `.env.local`
- Check that you're authenticated
- Verify your user role has correct permissions

#### Invoice generation creates 0 invoices
- Ensure contracts exist with status "Active"
- Verify contract dates overlap with selected month
- Check that workers are actually assigned to the residence
- Look in browser console for detailed errors

#### Workers not showing up
- If using Firestore: Check Firestore rules allow read
- If using localStorage: Click "Migrate local → Firestore" button
- Verify workers exist in the database

#### Capacity validation failing
- Ensure rooms have `spaceSqm` field set
- Verify rooms have `roomType` (Worker/Supervisor/Engineer)
- Check calculation: capacity = floor(area / space_per_person)

## Tips for Best Results

1. **Set up residences first** - Use the existing Residences module to create buildings, floors, and rooms with proper area measurements

2. **Define room types** - Make sure each room has a `roomType` field (Worker/Supervisor/Engineer) for accurate capacity calculation

3. **Keep nationalities consistent** - The system enforces single nationality per room for compliance

4. **Regular invoice generation** - Set a reminder to generate invoices on the 1st of each month

5. **Review reports weekly** - Check for capacity warnings and nationality violations

6. **Use descriptive contract notes** - Add important terms or special conditions in the notes field

7. **Track worker movements** - Use the transfer system rather than manually changing assignments

## Next Steps

- Explore each module in detail
- Customize company information
- Set up recurring tasks for monthly invoicing
- Train users on the transfer approval workflow
- Review and export reports regularly

## Support

- Full documentation: `/src/app/accommodation/README.md`
- Implementation details: `/ACCOMMODATION_IMPLEMENTATION_SUMMARY.md`
- Firestore rules: `/firestore-rules-accommodation.txt`

---

**Happy Managing! 🏠**
