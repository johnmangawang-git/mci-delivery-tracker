# How to Fix Supabase Authentication Issues

## Problem
You're getting the error: "Supabase client not initialized" when trying to sign up. This happens because the Supabase client cannot be created due to an invalid API key.

## Solution

### Step 1: Get Your Actual Supabase Anon Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ntyvrezyhrmflswxefbk
2. Click on the gear icon (Project Settings) in the left sidebar
3. Click on "API" in the settings menu
4. Copy the "anon" key value (not the service role key)

### Step 2: Update the Configuration in login.html

1. Open `public/login.html` in a text editor
2. Find the Supabase configuration section (around line 160):
   ```html
   <!-- Supabase Configuration -->
   <script>
       // Set Supabase configuration from environment variables or defaults
       window.SUPABASE_URL = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
       window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE';
   </script>
   ```

3. Replace `'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE'` with your actual anon key:
   ```html
   <!-- Supabase Configuration -->
   <script>
       // Set Supabase configuration from environment variables or defaults
       window.SUPABASE_URL = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
       window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here';
   </script>
   ```

### Step 3: Update the Configuration in index.html

1. Open `public/index.html` in a text editor
2. Find the Supabase configuration section (around line 30):
   ```html
   <!-- Supabase Configuration -->
   <script>
       // Set Supabase configuration from environment variables or defaults
       window.SUPABASE_URL = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
       window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE';
   </script>
   ```

3. Replace `'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE'` with your actual anon key:
   ```html
   <!-- Supabase Configuration -->
   <script>
       // Set Supabase configuration from environment variables or defaults
       window.SUPABASE_URL = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
       window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here';
   </script>
   ```

### Step 4: Enable Email Signups in Supabase

1. In the Supabase Dashboard, go to "Authentication" in the left sidebar
2. Click on "Settings"
3. Find the "Enable email signup" toggle and make sure it's turned ON
4. Scroll down and click "Save"

### Step 5: Test the Fix

1. Save both HTML files
2. Restart your development server: `npm start`
3. Visit http://localhost:8082/login.html
4. Try creating an account again

## Example of a Correct Configuration

If your actual anon key is:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hmZWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzYyMzQ1NjcsImV4cCI6MTk5MTgxMDU2N30.YourActualSignature
```

Then your configuration should look like:
```html
<!-- Supabase Configuration -->
<script>
    // Set Supabase configuration from environment variables or defaults
    window.SUPABASE_URL = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
    window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hmZWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzYyMzQ1NjcsImV4cCI6MTk5MTgxMDU2N30.YourActualSignature';
</script>
```

## Troubleshooting

If you're still having issues:

1. Check the browser's developer console for any error messages
2. Make sure you've saved the HTML files after making changes
3. Make sure you've restarted the server after making changes
4. Verify that you've copied the correct "anon" key (not the service role key)
5. Check that email signups are enabled in your Supabase project settings