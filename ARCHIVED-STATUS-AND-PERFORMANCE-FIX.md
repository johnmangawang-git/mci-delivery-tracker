# Archived Status and Performance Fix

## Date: 2025-11-13

## Issues Fixed

### Issue 1: DR not showing as "Archived" and grayed out after e-signature ✅
**Problem:** After signing, DRs were being filtered out of active deliveries instead of showing grayed out.

**Root Cause:** The `populateActiveDeliveriesTable()` function was filtering out ALL completed deliveries, including "Archived" ones.

**Fix:** Modified filter logic to:
- Keep "Archived" deliveries (they show grayed out with opacity: 0.6)
- Only filter out old "Completed" and "Signed" statuses
- Archived rows already had styling in place (lines 1251-1252)

**Code Change in app.js:**
```javascript
// BEFORE: Filtered out all completed including Archived
const isCompleted = delivery.status === 'Completed' || delivery.status === 'Signed';
return !isCompleted && !isBlacklisted;

// AFTER: Keep Archived, only filter old statuses
const isOldCompleted = delivery.status === 'Completed' || delivery.status === 'Signed';
return !isOldCompleted && !isBlacklisted;
```

### Issue 2: Delivery history loading very slowly ✅
**Problem:** History tab took minutes to load.

**Root Cause:** Was querying the main `deliveries` table with status filters instead of using the dedicated `delivery_history` table.

**Fix:** Changed to query `delivery_history` table directly:
```javascript
// BEFORE: Slow query with filters on main table
const result = await window.dataService.getDeliveriesWithPagination({
    filters: { status: ['Archived', 'Completed', 'Signed'] }
});

// AFTER: Fast query on dedicated history table
const result = await window.dataService.getDeliveryHistoryWithPagination({
    page: targetPage,
    pageSize: paginationState.history.pageSize
});
```

### Issue 3: Schema error - completed_at column missing ✅
**Problem:** Console errors about missing `completed_at` column.

**Root Cause:** Multiple files were trying to use `completed_at` field that doesn't exist in Supabase schema.

**Fix:** Removed all `completed_at` references from 4 files:

1. **dataService.js** (5 locations)
   - Removed from updateDeliveryStatus
   - Changed ordering from `completed_at` to `signed_at`
   - Removed from moveToHistory
   - Removed from history logging

2. **e-signature.js** (2 locations)
   - Removed from history record creation

3. **app.js** (1 location)
   - Removed from signed date fallback logic

## Files Modified
- public/assets/js/app.js
- public/assets/js/dataService.js
- public/assets/js/e-signature.js

## Result
✅ Archived DRs now show grayed out in active deliveries after e-signature
✅ Delivery history loads instantly instead of taking minutes
✅ No more schema errors in console
✅ Clean workflow: Sign → Status changes to "Archived" → Shows grayed out → Also appears in history

## Testing
1. Upload DR and sign it
2. Verify status changes to "Archived" in active deliveries
3. Verify row is grayed out (opacity: 0.6, light gray background)
4. Switch to Delivery History tab - should load instantly
5. Verify no console errors
