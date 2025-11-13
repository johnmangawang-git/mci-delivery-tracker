# Deliveries Table Schema Fix

## Error
```
Could not find the 'signed_at' column of 'deliveries' in the schema cache
```

## Problem
The code was trying to set `signed_at` on the `deliveries` table when updating status to "Archived", but this column doesn't exist in the deliveries table.

## Root Cause
The `signed_at` timestamp is stored in the `e_pod_records` table (where signatures are saved), NOT in the `deliveries` table.

## Solution
Removed the attempt to set `signed_at` on deliveries table. The signature timestamp is properly stored in `e_pod_records` and can be retrieved from there when needed.

## Code Changes

### dataService.js - updateDeliveryStatus()
**Before:**
```javascript
if (newStatus === 'Archived') {
    updateData.signed_at = new Date().toISOString();  // ❌ Column doesn't exist
}
```

**After:**
```javascript
// Note: signed_at is stored in e_pod_records table, not deliveries table
```

## Data Flow for E-Signature

### Correct Flow:
1. **User signs** → Signature saved to `e_pod_records` table with `signed_at` timestamp
2. **Status updated** → `deliveries` table status changed to "Archived" (no signed_at needed here)
3. **Display** → When showing signed date, query `e_pod_records` table by DR number

### Tables and Their Columns:

**deliveries table:**
- id, dr_number, customer_name, status, etc.
- ❌ Does NOT have `signed_at`

**e_pod_records table:**
- id, dr_number, signature_data, **signed_at**, etc.
- ✅ Has `signed_at` timestamp

**delivery_history table:**
- id, dr_number, customer_name, status, **signed_at**, etc.
- ✅ Has `signed_at` (copied from e_pod_records when moved to history)

## Result
✅ E-signature now works without schema errors
✅ Status updates to "Archived" successfully
✅ Signature timestamp properly stored in e_pod_records
✅ Delivery shows as grayed out in active deliveries

## Testing
1. Sign a delivery
2. Verify no console errors
3. Verify status changes to "Archived"
4. Verify row shows grayed out
5. Check e_pod_records table has the signature with signed_at timestamp

## Note
If you need to display the signed date in the UI, query it from `e_pod_records`:
```javascript
const { data } = await supabase
    .from('e_pod_records')
    .select('signed_at')
    .eq('dr_number', drNumber)
    .single();
```
