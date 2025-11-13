# Fix: Add signed_at Column to delivery_history Table

## Error
```
column delivery_history.signed_at does not exist
```

## Problem
The `delivery_history` table is missing the `signed_at` column that the code is trying to use for ordering records.

## Solution
Run the updated SQL migration script to add the missing column.

## Steps to Fix

### Option 1: Run via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of `supabase/add-missing-history-columns.sql`
6. Click "Run" or press Ctrl+Enter
7. You should see: "Successfully added missing columns to delivery_history table"

### Option 2: Run via Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL
Run this single command in your Supabase SQL Editor:

```sql
-- Add signed_at column
ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_delivery_history_signed_at 
ON public.delivery_history(signed_at);

-- Add comment
COMMENT ON COLUMN public.delivery_history.signed_at 
IS 'Timestamp when the e-signature was captured';
```

## What This Fixes
- ✅ Delivery history will load without errors
- ✅ Records will be properly ordered by signature date
- ✅ E-signature timestamps will be preserved in history

## Verification
After running the SQL, refresh your app and check:
1. Delivery History tab loads without errors
2. No console errors about `signed_at`
3. History records are ordered correctly (most recent first)

## Files Updated
- `supabase/add-missing-history-columns.sql` - Migration script
- `supabase/create-delivery-history-table.sql` - Updated schema for reference

## Note
This column should have been in the original schema but was missed. The migration script now includes it.
