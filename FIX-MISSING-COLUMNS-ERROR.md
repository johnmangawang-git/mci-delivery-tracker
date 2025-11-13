# Fix: Missing Columns Error

## Error Message
```
ERROR: 42703: column "moved_to_history_at" of relation "public.delivery_history" does not exist
```

## Cause
The `delivery_history` table exists in your database but was created from an older migration that didn't include all the required columns.

## Solution

Run this SQL script in your Supabase SQL Editor:

### File: `supabase/add-missing-history-columns.sql`

This script will:
1. Add missing columns (`original_delivery_id`, `completed_at`, `moved_to_history_at`, `moved_by_user_id`)
2. Create necessary indexes
3. Set up RLS policies
4. Add documentation comments

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Fix Script**
   - Copy the contents of `supabase/add-missing-history-columns.sql`
   - Paste into the SQL Editor
   - Click "Run"

3. **Verify Success**
   - You should see: "Successfully added missing columns to delivery_history table"
   - Check the table structure in Table Editor to confirm columns exist

4. **Test the Application**
   - Sign a DR
   - Verify it moves to history without errors
   - Check browser console for success messages

## What the Script Does

### Adds Missing Columns
```sql
ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS original_delivery_id UUID;

ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS moved_to_history_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS moved_by_user_id UUID REFERENCES auth.users(id);
```

### Creates Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_delivery_history_completed_at ON public.delivery_history(completed_at);
-- ... and others
```

### Sets Up Security
```sql
ALTER TABLE public.delivery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery history" ...
CREATE POLICY "Users can insert their own delivery history" ...
```

## Alternative: Create Fresh Table

If you prefer to start fresh, you can:

1. **Backup existing data** (if any):
```sql
-- Export existing history records
SELECT * FROM delivery_history;
```

2. **Drop and recreate**:
```sql
DROP TABLE IF EXISTS delivery_history CASCADE;
```

3. **Run the full creation script**:
   - Use `supabase/create-delivery-history-table.sql`

## Verification

After running the fix, verify the table structure:

```sql
-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_history' 
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid)
- `dr_number` (text)
- `customer_name` (text)
- `vendor_number` (text)
- `origin` (text)
- `destination` (text)
- `truck_type` (text)
- `truck_plate_number` (text)
- `status` (text)
- `distance` (text)
- `additional_costs` (numeric)
- `created_date` (date)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `completed_at` (timestamp with time zone) ← NEW
- `created_by` (text)
- `process_by` (text)
- `item_number` (text)
- `mobile_number` (text)
- `item_description` (text)
- `serial_number` (text)
- `user_id` (uuid)
- `original_delivery_id` (uuid) ← NEW
- `moved_to_history_at` (timestamp with time zone) ← NEW
- `moved_by_user_id` (uuid) ← NEW

## Troubleshooting

### Error: "permission denied"
- Make sure you're logged in as the database owner
- Check that you have proper permissions in Supabase

### Error: "relation does not exist"
- The table doesn't exist at all
- Run `supabase/create-delivery-history-table.sql` instead

### Columns still missing after running script
- Check the SQL output for errors
- Verify you ran the script in the correct database
- Try running each ALTER TABLE statement individually

## Prevention

To avoid this in the future:
1. Always run migration scripts in order
2. Keep track of which migrations have been applied
3. Use Supabase's migration system for version control

## Need Help?

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Check Supabase logs in the dashboard
3. Verify your database connection is working
4. Make sure you're using the correct Supabase project
