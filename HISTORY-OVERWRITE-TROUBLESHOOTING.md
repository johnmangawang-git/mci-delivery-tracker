# History Overwrite Troubleshooting Guide

## Issue Description
You're seeing that delivery history appears to be overwritten, showing only the most recent DR instead of all historical records.

## Understanding the System

### How History Works Now

1. **Database Storage** (Permanent)
   - All history records are stored in `delivery_history` table
   - Each signed DR creates a NEW record (no overwrites)
   - Records are NEVER deleted or updated

2. **UI Display** (Paginated)
   - `window.deliveryHistory` array contains ONLY the current page
   - Default page size: 50 records
   - Use pagination controls to see other pages

### This is NOT a bug!
The global array showing only one page is **correct behavior** for pagination. The question is: **Are all records actually in the database?**

## Diagnostic Steps

### Step 1: Check Database Records

Run this in Supabase SQL Editor:
```sql
-- See all history records
SELECT dr_number, status, completed_at, moved_to_history_at
FROM delivery_history
ORDER BY moved_to_history_at DESC NULLS LAST
LIMIT 100;
```

Or use the comprehensive diagnostic script:
- File: `supabase/check-delivery-history.sql`
- This will show you:
  - Total count of history records
  - All recent records
  - Any duplicates
  - Table structure

### Step 2: Check Browser Console

After signing a DR, check the console for:
```
✅ Inserted DR [DR_NUMBER] into delivery_history
📊 History record details: { id: ..., dr_number: ..., ... }
✅ Deleted DR [DR_NUMBER] from active deliveries
```

### Step 3: Check Pagination

1. Look at the pagination controls at the bottom of the history table
2. Check if it shows: "Page 1 of X" where X > 1
3. If X > 1, click "Next" to see other pages
4. Each page shows up to 50 records

### Step 4: Check Total Count

In browser console after loading history, look for:
```
📊 Total records in database: [NUMBER]
```

This tells you how many records are actually stored.

## Common Scenarios

### Scenario 1: Only One Record in Database
**Symptoms:**
- Database query shows only 1 record
- Pagination shows "Page 1 of 1"
- Console shows total count: 1

**Cause:** Only one DR has been signed since implementing the new system

**Solution:** This is normal! Sign more DRs to build up history.

### Scenario 2: Multiple Records in Database, But UI Shows One
**Symptoms:**
- Database query shows multiple records
- Pagination shows "Page 1 of 1"
- Console shows total count: 1

**Cause:** The `getDeliveryHistoryWithPagination` function might not be working correctly

**Solution:**
1. Check if `delivery_history` table exists
2. Run `supabase/add-missing-history-columns.sql`
3. Check browser console for errors

### Scenario 3: Records Exist But Wrong Status
**Symptoms:**
- Records in database have status "Completed" instead of "Archived"
- Old records from before the update

**Solution:**
```sql
-- Update old records to Archived status
UPDATE delivery_history 
SET status = 'Archived' 
WHERE status IN ('Completed', 'Signed');
```

### Scenario 4: Pagination Not Working
**Symptoms:**
- Multiple records in database
- UI only shows first page
- Can't navigate to other pages

**Solution:**
1. Check pagination controls are visible
2. Check console for pagination errors
3. Verify `getDeliveryHistoryWithPagination` is being called

## Verification Queries

### Count All History Records
```sql
SELECT COUNT(*) as total_history_records 
FROM delivery_history;
```

### Show Last 10 Signed DRs
```sql
SELECT 
    dr_number,
    customer_name,
    status,
    completed_at,
    moved_to_history_at
FROM delivery_history
ORDER BY COALESCE(moved_to_history_at, completed_at, created_at) DESC
LIMIT 10;
```

### Check for Duplicates (Should Be Allowed)
```sql
SELECT 
    dr_number,
    COUNT(*) as times_signed
FROM delivery_history
GROUP BY dr_number
HAVING COUNT(*) > 1;
```

### Check Records by Date
```sql
SELECT 
    DATE(COALESCE(moved_to_history_at, completed_at, created_at)) as date,
    COUNT(*) as records_that_day
FROM delivery_history
GROUP BY DATE(COALESCE(moved_to_history_at, completed_at, created_at))
ORDER BY date DESC;
```

## Expected Behavior

### When You Sign a DR:
1. ✅ EPOD record saved to `epod_records` table
2. ✅ Delivery status updated to "Archived" in `deliveries` table
3. ✅ Delivery record INSERTED into `delivery_history` table (new record)
4. ✅ Delivery record DELETED from `deliveries` table
5. ✅ UI refreshes showing updated data

### When You Refresh the Page:
1. ✅ Active deliveries loaded from `deliveries` table (archived DR not there)
2. ✅ History loaded from `delivery_history` table (archived DR is there)
3. ✅ UI shows current page of history (default: page 1, 50 records)

### When You Navigate Pages:
1. ✅ Click "Next" or page number
2. ✅ New page loaded from database
3. ✅ `window.deliveryHistory` updated with new page's records
4. ✅ UI shows new page

## What's NOT a Problem

### ❌ "window.deliveryHistory only has one record"
- This is CORRECT if you're on a page with one record
- Check `totalCount` in console to see actual database count

### ❌ "History disappears when I refresh"
- If records are in database, this is a loading issue
- Check console for errors during load
- Verify `getDeliveryHistoryWithPagination` is called

### ❌ "I can only see 50 records"
- This is CORRECT - that's the page size
- Use pagination to see more
- Or increase page size in code

## What IS a Problem

### ✅ Database query shows 0 records after signing
- Records are not being inserted
- Check console for insert errors
- Verify table exists and has correct columns

### ✅ Same DR number appears multiple times with same timestamp
- Possible duplicate inserts
- Check for race conditions in code

### ✅ Records disappear from database after refresh
- Something is deleting records (shouldn't happen)
- Check for DELETE queries in code
- Verify RLS policies

## Testing Procedure

1. **Clear existing data** (optional, for clean test):
```sql
DELETE FROM delivery_history WHERE user_id = auth.uid();
```

2. **Sign first DR**:
   - Note the DR number
   - Check console for success messages
   - Run database query to verify insert

3. **Sign second DR**:
   - Note the DR number
   - Check console for success messages
   - Run database query - should show 2 records

4. **Refresh page**:
   - Check history view
   - Should show both DRs (or first page if many)
   - Check pagination controls

5. **Sign third DR**:
   - Refresh page
   - Should show all 3 DRs
   - Verify in database

## Getting Help

If records are truly being overwritten in the database:

1. **Export current data**:
```sql
SELECT * FROM delivery_history ORDER BY created_at DESC;
```

2. **Check for constraints**:
```sql
SELECT * FROM pg_constraint 
WHERE conrelid = 'public.delivery_history'::regclass;
```

3. **Check for triggers**:
```sql
SELECT * FROM pg_trigger 
WHERE tgrelid = 'public.delivery_history'::regclass;
```

4. **Provide console logs** showing:
   - Insert success messages
   - Record IDs
   - Timestamps
   - Any errors

## Quick Fixes

### If records are missing columns:
```bash
Run: supabase/add-missing-history-columns.sql
```

### If status is wrong:
```sql
UPDATE delivery_history SET status = 'Archived' 
WHERE status IN ('Completed', 'Signed');
```

### If pagination is broken:
Check that `getDeliveryHistoryWithPagination` exists in dataService.js

### If nothing works:
1. Check Supabase connection
2. Verify authentication
3. Check RLS policies
4. Look for JavaScript errors in console
