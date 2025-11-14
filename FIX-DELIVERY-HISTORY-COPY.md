# Fix: Delivery History Not Showing Signed DRs

## Problem
After e-signing a DR:
- ✅ Status changes to "Archived" 
- ✅ Row shows grayed out in Active Deliveries
- ❌ DR does NOT appear in Delivery History tab

## Root Cause
The e-signature flow was only adding to the in-memory `window.deliveryHistory` array, but NOT saving to the database `delivery_history` table. When the Delivery History tab loads, it queries the database, not the in-memory array.

## Solution
Created a new `copyDeliveryToHistory()` function in dataService that:
1. Fetches the delivery from the `deliveries` table
2. Inserts a copy into the `delivery_history` table
3. Keeps the original in `deliveries` table (grayed out)
4. Includes the `signed_at` timestamp from e-signature

## Code Changes

### 1. dataService.js - New Function
Added `copyDeliveryToHistory(drNumber, additionalData)`:
```javascript
/**
 * Copy a delivery to history table WITHOUT deleting from active deliveries
 * Used for e-signature workflow where DR stays in active (grayed out) AND appears in history
 */
async copyDeliveryToHistory(drNumber, additionalData = {}) {
    // 1. Fetch delivery from deliveries table
    // 2. Build history record with signed_at, moved_to_history_at, etc.
    // 3. Insert into delivery_history table
    // 4. Keep original in deliveries table
}
```

### 2. e-signature.js - Updated Flow
**Before:**
```javascript
// Only added to in-memory array
window.deliveryHistory.unshift(historyRecord);
```

**After:**
```javascript
// Save to database table
const historyResult = await window.dataService.copyDeliveryToHistory(
    signatureInfo.drNumber,
    { signed_at: timestamp }
);
```

### 3. e-signature.js - Reload History from Database
**Before:**
```javascript
// Only refreshed UI from in-memory array
window.populateDeliveryHistoryTable();
```

**After:**
```javascript
// Reload from database
await window.loadDeliveryHistoryWithPagination();
```

## Workflow Now

### E-Signature Flow:
1. **User signs** → Signature saved to `e_pod_records` table ✅
2. **Status updated** → `deliveries.status` = "Archived" ✅
3. **Copy to history** → Record inserted into `delivery_history` table ✅
4. **Active view** → DR shows grayed out in Active Deliveries ✅
5. **History view** → DR appears in Delivery History tab ✅

### Database State After Signing:
- **deliveries table:** DR with status="Archived" (shows grayed out)
- **delivery_history table:** Copy of DR with signed_at timestamp
- **e_pod_records table:** Signature data with signed_at timestamp

## Comparison: moveToHistory vs copyToHistory

### moveDeliveryToHistory() - OLD (Not Used)
- Inserts into delivery_history
- **DELETES** from deliveries
- DR disappears from Active Deliveries
- Only shows in History

### copyDeliveryToHistory() - NEW (Used for E-Signature)
- Inserts into delivery_history
- **KEEPS** in deliveries
- DR shows grayed out in Active Deliveries
- Also shows in History

## Testing
1. Sign a delivery
2. Check Active Deliveries → Should show grayed out ✅
3. Switch to Delivery History tab → Should show the signed DR ✅
4. Check database:
   - `deliveries` table → DR exists with status="Archived"
   - `delivery_history` table → DR exists with signed_at timestamp

## Files Modified
- `public/assets/js/dataService.js` - Added copyDeliveryToHistory()
- `public/assets/js/e-signature.js` - Updated to use new function and reload from DB

## Result
✅ Signed DRs now appear in BOTH Active Deliveries (grayed out) AND Delivery History
✅ History is persisted in database, not just in-memory
✅ Page refresh maintains the history
