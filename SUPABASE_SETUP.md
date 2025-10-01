# Supabase Setup Guide

## Getting Your Supabase API Keys

To fix the "Invalid API key" error, you need to obtain your actual Supabase anon key. Follow these steps:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/ntyvrezyhrmflswxefbk

2. **Navigate to Project Settings**
   - In the left sidebar, click on the gear icon (Project Settings)

3. **Access API Settings**
   - In the Project Settings menu, click on "API"

4. **Copy Your Anon Key**
   - In the "Project API keys" section, find the "anon" key
   - Click the copy button next to it

5. **Update Your Configuration**
   - Open the `.env` file in your project root
   - Replace `REPLACE_WITH_YOUR_ACTUAL_ANON_KEY_FROM_SUPABASE_DASHBOARD` with your copied anon key
   - Save the file

## Example .env File

After updating, your [.env](file:///c:/Users/jmangawang/Documents/mci-delivery-tracker/.env) file should look like this:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard at:
# https://supabase.com/dashboard/project/ntyvrezyhrmflswxefbk
# Then go to Project Settings > API to find these values

SUPABASE_URL=https://ntyvrezyhrmflswxefbk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here

# Optional: Supabase Service Role Key (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Enabling Signups

By default, Supabase projects may have signups disabled for security. To enable signups:

1. In the Supabase Dashboard, go to "Authentication" in the left sidebar
2. Click on "Settings"
3. Find the "Enable email signup" toggle and make sure it's turned ON
4. Scroll down and click "Save"

## Important Note About Static Sites

Since this is a static website (not a Node.js application), the `.env` file won't be automatically loaded. You need to manually update the Supabase configuration in the HTML files:

1. Open `public/login.html`
2. Find the "Supabase Configuration" script section (around line 160)
3. Replace `'REPLACE_WITH_YOUR_ACTUAL_ANON_KEY_FROM_SUPABASE_DASHBOARD'` with your actual anon key

4. Open `public/index.html`
5. Find the "Supabase Configuration" script section (around line 30)
6. Replace `'REPLACE_WITH_YOUR_ACTUAL_ANON_KEY_FROM_SUPABASE_DASHBOARD'` with your actual anon key

## Testing the Fix

After updating your API key in both HTML files:

1. Restart your development server: `npm start`
2. Visit http://localhost:8081/login.html (or your appropriate URL)
3. Try creating an account again

If you continue to have issues, check the browser's developer console for any error messages.