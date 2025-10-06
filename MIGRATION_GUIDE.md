# Database Migration Guide

This guide helps you determine if you need to run the SQL migration files to set up your database tables.

## Do You Need to Run the Migrations?

You need to run the SQL migration files **if any of the following is true**:

1. You see error messages indicating that database tables don't exist
2. When you run the table check (`check-tables.html`), it shows that tables are missing
3. You're setting up the application for the first time with a new Supabase project
4. You get "relation does not exist" errors when using the application

You **do NOT need to run** the migrations if:

1. All database tables already exist (confirmed through the table check)
2. The application is working without any database errors
3. You can successfully log in and create deliveries/customers

## How to Check if Tables Exist

### Method 1: Use the Table Check Page
1. Run `start-server.bat`
2. Open `http://localhost:8000/check-tables.html` in your browser
3. Click "Check Tables Again"
4. Review the results:
   - Green checkmarks (✓) indicate tables that exist
   - Red X marks (✗) indicate missing tables

### Method 2: Check in Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Table Editor" in the left sidebar
4. Look for the following tables:
   - `profiles`
   - `deliveries`
   - `customers`
   - `additional_costs`
   - `e_pod_records`
   - `warehouses`

## How to Run the Migrations

If you need to run the migrations:

### Option 1: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase dashboard
2. Select your project
3. Go to "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the contents of `supabase/migrations/20231001000000_init.sql`
6. Click "Run" to execute the query
7. Repeat steps 4-6 for `supabase/migrations/20231001000001_add_epod_table.sql`

### Option 2: Using Supabase CLI (Advanced)
If you have the Supabase CLI installed:
1. Navigate to your project directory
2. Run `supabase link --project-ref YOUR_PROJECT_ID`
3. Run `supabase db push`

## What the Migrations Create

The migration files create the following tables:

### 1. profiles
- Stores user profile information
- Linked to Supabase Auth users
- Contains full_name, avatar_url, and role

### 2. deliveries
- Stores delivery information
- Contains DR numbers, origins, destinations, distances
- Linked to users via user_id

### 3. customers
- Stores customer information
- Contains company details, contact information
- Linked to users via user_id

### 4. additional_costs
- Stores additional costs for deliveries
- Linked to deliveries via delivery_id

### 5. e_pod_records
- Stores electronic proof of delivery records
- Contains signatures, customer information
- Linked to users via user_id

### 6. warehouses
- Stores warehouse information
- Contains addresses, capacities
- Pre-populated with default warehouses

## Troubleshooting

### If You Get Permission Errors
- Make sure you're using the correct Supabase credentials
- Check that you're accessing the correct project

### If Tables Already Exist
- You'll get errors about duplicate tables
- This is fine - it means your database is already set up

### If You Get Syntax Errors
- Make sure you're copying the entire SQL file contents
- Don't modify the SQL unless you know what you're doing

## Verification

After running the migrations:
1. Run the table check again
2. All tables should show green checkmarks
3. Try creating a test delivery in the application
4. Verify that data is stored in the database (check in Table Editor)

## Important Notes

1. **Data Safety**: The migrations only create tables and don't delete existing data
2. **Order Matters**: Run the migrations in numerical order (000000 first, then 000001)
3. **Row Level Security**: The migrations automatically set up RLS policies to keep user data separate
4. **Indexes**: The E-POD table migration includes indexes for better performance

If you're unsure whether you need to run the migrations, it's safe to try running them - if the tables already exist, you'll just get an error message, but no harm will be done.