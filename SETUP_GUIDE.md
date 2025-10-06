# MCI Delivery Tracker - Setup Guide

This guide will help you set up the centralized database functionality so your data syncs across multiple devices.

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com/))
2. This application codebase
3. A modern web browser

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign up or log in
2. Click "New Project"
3. Enter a project name (e.g., "MCI-Delivery-Tracker")
4. Set a database password (save this for later)
5. Select a region closest to you
6. Click "Create New Project"

Wait for the project to be created (this may take a few minutes).

## Step 2: Get Your Supabase Configuration

1. Once your project is ready, go to the "Project Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy the following values:
   - Project URL (starts with https://)
   - anon public key (long string under Project API keys)

## Step 3: Update Your Application Configuration

Open the following files in your code editor and update the Supabase configuration:

### Update in `public/index.html` (around line 25):
```html
<!-- Supabase Configuration -->
<script>
    // Set Supabase configuration from environment variables or defaults
    window.SUPABASE_URL = window.SUPABASE_URL || 'YOUR_PROJECT_URL_HERE';
    window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';
</script>
```

### Update in `public/login.html` (around line 115):
```html
<!-- Supabase Configuration -->
<script>
    // Set Supabase configuration from environment variables or defaults
    window.SUPABASE_URL = window.SUPABASE_URL || 'YOUR_PROJECT_URL_HERE';
    window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';
</script>
```

Replace:
- `YOUR_PROJECT_URL_HERE` with your actual Project URL
- `YOUR_ANON_KEY_HERE` with your actual anon public key

## Step 4: Set Up Database Tables

You need to create the database tables using the provided migration files:

### Option 1: Using Supabase SQL Editor (Recommended)
1. In your Supabase dashboard, go to "SQL Editor" in the sidebar
2. Click "New Query"
3. Copy and paste the contents of [supabase/migrations/20231001000000_init.sql](supabase/migrations/20231001000000_init.sql)
4. Click "Run" to execute the query
5. Repeat for [supabase/migrations/20231001000001_add_epod_table.sql](supabase/migrations/20231001000001_add_epod_table.sql)

### Option 2: Using Supabase CLI
If you have the Supabase CLI installed:
1. Navigate to your project directory
2. Run `supabase link --project-ref YOUR_PROJECT_ID`
3. Run `supabase db push`

## Step 5: Enable Email Authentication

1. In your Supabase dashboard, go to "Authentication" in the sidebar
2. Click "Providers"
3. Find "Email" and toggle it to "Enabled"
4. You can leave the default settings as they are

## Step 6: Test the Setup

1. Open `public/test-supabase-connection.html` in your browser
2. Click "Run Tests"
3. All tests should pass with green checkmarks

## Step 7: Use the Application

1. Open `public/login.html` in your browser
2. Click "Sign up" to create a new account
3. Enter your email and password
4. You'll receive a confirmation email - click the link to verify your email
5. Log in with your credentials
6. Add some delivery data
7. Open the application on another device and log in with the same credentials
8. You should see the same data on both devices

## Troubleshooting

### If tests fail with connection errors:
1. Double-check that you've entered the correct Project URL and anon key
2. Make sure there are no extra spaces or characters
3. Verify that your Supabase project is active

### If you see "Table not found" errors:
1. Make sure you've run both SQL migration files
2. Check that the tables were created successfully in the Supabase Table Editor

### If data doesn't sync between devices:
1. Ensure you're logged in with the same account on both devices
2. Check your internet connection
3. Refresh the page to force a data reload

## Next Steps

Once you've confirmed that the centralized database is working:

1. Start using the application normally
2. All data will automatically sync across devices
3. If you go offline, data will be stored locally and synced when you reconnect

The application will automatically use the centralized database when available and fall back to local storage when it's not, ensuring you never lose data.