# 🗄️ Add Additional Cost Items Table to Supabase

## 📋 Instructions

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Basic Schema (RECOMMENDED)
**If you got a syntax error, use this simpler version:**

1. Copy the entire contents of `supabase/add-cost-items-basic.sql`
2. Paste it into the SQL Editor
3. Click **Run** button

### Step 3: Verify Success
You should see:
```
SUCCESS: Basic additional_cost_items table created!
```

### Alternative: Full Schema (Advanced)
If the basic version works, you can optionally run `supabase/add-additional-cost-items-table.sql` for advanced features like auto-updating totals.

## 🔧 If You Still Get Errors

Try running each section separately from `supabase/add-cost-items-simple.sql`

## 🎯 What This Creates

### Tables:
- ✅ `additional_cost_items` - Detailed cost breakdown storage
- ✅ Adds `additional_cost_items` JSONB column to `deliveries` table

### Indexes:
- ✅ Performance indexes on delivery_id, category, user_id
- ✅ GIN index on JSONB column

### Security:
- ✅ Row Level Security (RLS) policies
- ✅ Users can only access their own cost items

### Automation:
- ✅ Auto-update `deliveries.additional_costs` total when items change
- ✅ Triggers for INSERT/UPDATE/DELETE on cost items

### Views:
- ✅ `deliveries_with_cost_items` - Easy querying
- ✅ `cost_breakdown_analytics` - Pre-aggregated analytics data

## 🔗 After Running SQL

Your Additional Cost Breakdown will now:
1. ✅ Save to Supabase `additional_cost_items` table
2. ✅ Read from Supabase for analytics
3. ❌ **DISCONNECTED** from localStorage `analytics-cost-breakdown`
4. ✅ Maintain backward compatibility with delivery records

## 🧪 Test After Setup

1. Upload a DR with additional costs
2. Check Analytics Dashboard
3. Cost breakdown should show individual categories
4. Data should persist across browsers (Chrome/Edge)

The localStorage dependency for cost breakdown is now removed! 🎉