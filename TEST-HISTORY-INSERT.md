# Test History Insert - Diagnostic Guide

## Problem
`delivery_history` table shows 0 records, meaning inserts are failing.

## Step 1: Run Missing Columns Script

**CRITICAL:** Run this first if you haven't already:

```sql
-- File: supabase/add-missing-history-columns.sql
-- This adds the required columns to delivery_history table
```

In Supabase SQL Editor:
1. Copy contents of `supabase/add-missing-history-columns.sql`
2. Paste and click "Run"
3. Should see: "Successfully added missing columns to delivery_history table"

## Step 2: Test Manual Insert

Try inserting a test record manually in Supabase SQL Editor:

```sql
-- Test insert into delivery_history
INSERT INTO delivery_history (
    dr_number,
    customer_name,
    status,
    user_id
) VALUES (
    'TEST-001',
    'Test Customer',
    'Archived',
    auth.uid()
);

-- Check if it worked
SELECT * FROM delivery_history WHERE dr_number = 'TEST-001';
```

### If this fails:
- Error about missing columns → Run `add-missing-history-columns.sql`
- Error about permissions → Check RLS policies
- Error about auth.uid() → You're not logged in

### If this succeeds:
The table structure is fine, the issue is in the JavaScript code.

## Step 3: Sign a DR and Check Console

1. Open browser console (F12)
2. Sign a DR
3. Look for these messages:

**Expected Success Messages:**
```
📝 Step 1: Saving EPOD record via dataService
✅ EPOD record saved: {...}
📝 Step 2: Updating delivery status to Archived (will auto-move to history)
✅ Successfully updated status to Archived for DR [NUMBER]
🔄 Auto-moving DR [NUMBER] to history...
📦 Moving DR [NUMBER] to permanent history...
✅ Inserted DR [NUMBER] into delivery_history
📊 History record details: { id: ..., dr_number: ..., ... }
✅ Deleted DR [NUMBER] from active deliveries
🎉 DR [NUMBER] permanently moved to history!
```

**Error Messages to Look For:**
```
❌ Error inserting into delivery_history: ...
❌ Error details: column "..." does not exist
❌ Missing columns in delivery_history table!
❌ Please run: supabase/add-missing-history-columns.sql
```

## Step 4: Check What's Actually Happening

### Scenario A: No "Auto-moving" message
**Problem:** `updateDeliveryStatus` is not triggering `moveToHistory`

**Check:**
- Is status being set to "Archived"? (not "Completed")
- Look for: `✅ Successfully updated status to Archived`

### Scenario B: "Auto-moving" but no "Inserted" message
**Problem:** Insert is failing

**Check:**
- Look for error messages starting with `❌`
- Most likely: missing columns error
- **Solution:** Run `add-missing-history-columns.sql`

### Scenario C: "Inserted" but count still 0
**Problem:** RLS policy blocking your view

**Check:**
```sql
-- Disable RLS temporarily to see all records
ALTER TABLE delivery_history DISABLE ROW LEVEL SECURITY;

-- Check count
SELECT COUNT(*) FROM delivery_history;

-- Re-enable RLS
ALTER TABLE delivery_history ENABLE ROW LEVEL SECURITY;
```

## Step 5: Check Deliveries Table

Check if the DR is still in the deliveries table:

```sql
-- Should be empty after signing (DR moved to history)
SELECT dr_number, status FROM deliveries 
WHERE status = 'Archived';
```

### If DR is still in deliveries table:
- The delete step failed
- Check console for delete errors
- The DR was NOT moved to history

### If DR is NOT in deliveries table:
- The delete succeeded
- But insert to history failed
- **Data loss risk!** The DR is nowhere!

## Step 6: Emergency Recovery

If DRs are being deleted but not inserted into history:

```sql
-- Check if they're in epod_records at least
SELECT dr_number, customer_name, signed_at 
FROM epod_records 
ORDER BY signed_at DESC 
LIMIT 10;
```

The EPOD records should still exist even if history insert failed.

## Common Issues and Fixes

### Issue 1: Missing Columns Error
```
ERROR: column "moved_to_history_at" does not exist
```

**Fix:**
```bash
Run: supabase/add-missing-history-columns.sql
```

### Issue 2: RLS Policy Blocking
```
No error, but count = 0
```

**Fix:**
```sql
-- Check if records exist without RLS
SET ROLE postgres;
SELECT COUNT(*) FROM delivery_history;
RESET ROLE;
```

### Issue 3: Wrong User ID
```
Records inserted but you can't see them
```

**Fix:**
```sql
-- Check user_id in records
SELECT user_id, COUNT(*) 
FROM delivery_history 
GROUP BY user_id;

-- Compare with your user_id
SELECT auth.uid();
```

### Issue 4: Function Not Called
```
No "Auto-moving" message in console
```

**Fix:**
Check that status is being set to "Archived" not "Completed"

## Quick Diagnostic Script

Run this to get all info at once:

```sql
-- 1. Check table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'delivery_history'
) as table_exists;

-- 2. Check columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'delivery_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'delivery_history';

-- 4. Check policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'delivery_history';

-- 5. Check record count (your records)
SELECT COUNT(*) as your_records 
FROM delivery_history 
WHERE user_id = auth.uid();

-- 6. Check record count (all records, if you have permission)
SELECT COUNT(*) as all_records 
FROM delivery_history;

-- 7. Check recent deliveries that should be in history
SELECT dr_number, status, updated_at 
FROM deliveries 
WHERE status = 'Archived' 
ORDER BY updated_at DESC 
LIMIT 5;
```

## Next Steps

1. ✅ Run `add-missing-history-columns.sql` if you haven't
2. ✅ Try manual insert test
3. ✅ Sign a DR and watch console
4. ✅ Share console output with any errors
5. ✅ Run diagnostic script and share results

## Expected Working Flow

```
User signs DR
  ↓
EPOD saved to epod_records ✅
  ↓
Status updated to "Archived" in deliveries ✅
  ↓
moveToHistory called ✅
  ↓
Record inserted into delivery_history ✅
  ↓
Record deleted from deliveries ✅
  ↓
UI refreshes showing history ✅
```

If any step fails, the console will show where it stopped.
