# Apply Additional Costs Schema to Supabase

## Quick Setup Instructions

To fix the 404 error and enable the full additional costs functionality, you need to apply the new schema to your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Schema**
   - Open the file `supabase/schema-additional-costs.sql`
   - Copy all the content
   - Paste it into the SQL Editor

4. **Run the Schema**
   - Click "Run" button
   - Wait for completion (should show "Success")

### Option 2: Using Supabase CLI (Advanced)

```bash
# If you have Supabase CLI installed
supabase db reset
# or
supabase db push
```

### What This Schema Adds

- ✅ `additional_cost_items` table for detailed cost breakdown
- ✅ `cost_breakdown_analytics` view for analytics
- ✅ Automatic triggers for cost calculation
- ✅ Row Level Security policies
- ✅ Proper indexes for performance

### Verification

After applying the schema, you can verify it worked by:

1. **Check Tables Created**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('additional_cost_items');
   ```

2. **Check Views Created**
   ```sql
   SELECT table_name FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name = 'cost_breakdown_analytics';
   ```

3. **Test the Analytics Dashboard**
   - The 404 error should be gone
   - Cost breakdown chart should work properly
   - No more Chart.js errors

### Temporary Workaround

If you can't apply the schema immediately, the **Analytics Error Fix** I just added will:
- ✅ Handle the 404 error gracefully
- ✅ Fall back to localStorage data
- ✅ Prevent Chart.js crashes
- ✅ Show "No Data" instead of errors

The dashboard will work with reduced functionality until you apply the full schema.

### Need Help?

If you encounter any issues:
1. Check the Supabase logs for error details
2. Verify your database permissions
3. Make sure you're connected to the correct project
4. Try running the schema in smaller chunks if needed

Once the schema is applied, all the advanced cost breakdown features will be fully functional!