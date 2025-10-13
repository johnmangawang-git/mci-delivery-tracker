# 🚀 Supabase Setup Guide - Fix Data Persistence Issue

## 🎯 **PROBLEM SOLVED**
Your Excel uploads and bookings don't show up because GitHub Pages uses localStorage (browser-only storage). This guide sets up Supabase for real database storage.

## ⚡ **QUICK SETUP (15 minutes)**

### **Step 1: Create Supabase Account**
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Create a new organization if needed

### **Step 2: Create New Project**
1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name**: `mci-delivery-tracker`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### **Step 3: Get Your Credentials**
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 4: Update Your Code**
Add this to your `public/index.html` (before closing `</head>` tag):

```html
<script>
    // Supabase Configuration - Replace with your actual values
    window.SUPABASE_URL = 'https://your-project-id.supabase.co';
    window.SUPABASE_ANON_KEY = 'your-anon-key-here';
</script>
```

### **Step 5: Create Database Tables**
1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Paste this SQL:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Deliveries table
CREATE TABLE public.deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dr_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    vendor_number TEXT,
    origin TEXT,
    destination TEXT,
    truck_type TEXT,
    truck_plate_number TEXT,
    status TEXT DEFAULT 'Active',
    created_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'Manual',
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Customers table
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- E-POD records table
CREATE TABLE public.epod_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dr_number TEXT NOT NULL,
    customer_name TEXT,
    customer_contact TEXT,
    truck_plate TEXT,
    origin TEXT,
    destination TEXT,
    signature_data TEXT,
    status TEXT DEFAULT 'Completed',
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Row Level Security Policies
CREATE POLICY "Users can view their own deliveries" ON public.deliveries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deliveries" ON public.deliveries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deliveries" ON public.deliveries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own customers" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own epod records" ON public.epod_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own epod records" ON public.epod_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epod_records ENABLE ROW LEVEL SECURITY;
```

4. Click "Run" to execute

### **Step 6: Enable Authentication**
1. Go to **Authentication** → **Settings**
2. Under "Site URL", add your GitHub Pages URL:
   - `https://johnmangawang-git.github.io/mci-delivery-tracker`
3. Under "Redirect URLs", add:
   - `https://johnmangawang-git.github.io/mci-delivery-tracker/**`
4. Click "Save"

### **Step 7: Test Your Setup**
1. Push your updated code to GitHub
2. Visit your GitHub Pages site
3. Try uploading an Excel file
4. Check if deliveries appear in Active Deliveries
5. Go to Supabase **Table Editor** to see your data

## 🔧 **CONFIGURATION EXAMPLE**

Your `public/index.html` should include:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- ... other head content ... -->
    
    <!-- Supabase Configuration -->
    <script>
        // Replace these with your actual Supabase credentials
        window.SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
        window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0ODAwMCwiZXhwIjoxOTUyMTI0MDAwfQ.example-key-here';
    </script>
</head>
<body>
    <!-- ... rest of your HTML ... -->
</body>
</html>
```

## ✅ **VERIFICATION CHECKLIST**

After setup, verify these work:

- [ ] **Excel Upload**: Upload Excel file → Data appears in Active Deliveries
- [ ] **Manual Booking**: Create booking → Appears in Active Deliveries  
- [ ] **E-Signature**: Sign delivery → Moves to Delivery History
- [ ] **Data Persistence**: Refresh page → Data still there
- [ ] **Cross-Device**: Open on different browser → Same data visible

## 🚨 **TROUBLESHOOTING**

### **Excel Upload Still Not Working?**
1. Check browser console for errors
2. Verify Supabase credentials are correct
3. Check if tables were created properly
4. Test with a simple booking first

### **Authentication Issues?**
1. Check Site URL and Redirect URLs in Supabase
2. Make sure your GitHub Pages URL is correct
3. Try signing up for a new account

### **Data Not Showing?**
1. Check Supabase Table Editor
2. Look for JavaScript errors in console
3. Verify Row Level Security policies

## 🎉 **BENEFITS AFTER SETUP**

- ✅ **Real Database**: Data stored in cloud, not browser
- ✅ **Cross-Device Sync**: Access from any device
- ✅ **User Authentication**: Secure user accounts
- ✅ **Data Backup**: Automatic backups by Supabase
- ✅ **Scalability**: Handles multiple users
- ✅ **Real-time Updates**: Changes sync instantly

## 💰 **COST**

- **Free Tier**: Up to 50,000 monthly active users
- **Database**: 500MB storage included
- **Bandwidth**: 1GB included
- **Perfect for**: Small to medium applications

---

## 🚀 **QUICK START COMMANDS**

```bash
# 1. Update your repository
git add .
git commit -m "Add Supabase configuration"
git push origin main

# 2. Your site will be live at:
# https://johnmangawang-git.github.io/mci-delivery-tracker
```

**After this setup, your Excel uploads and bookings will work perfectly on the live site!** 🎉