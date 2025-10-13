-- Step 1: Create Tables First
-- Run this FIRST in your Supabase SQL Editor

-- User Profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    warehouse_name TEXT DEFAULT 'SMEG warehouse',
    phone TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dr_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    vendor_number TEXT,
    origin TEXT,
    destination TEXT,
    truck_type TEXT,
    truck_plate_number TEXT,
    status TEXT DEFAULT 'Active',
    distance TEXT,
    additional_costs DECIMAL(10,2) DEFAULT 0.00,
    created_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'Manual',
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    vendor_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- E-POD records table
CREATE TABLE IF NOT EXISTS public.epod_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dr_number TEXT NOT NULL,
    customer_name TEXT,
    customer_contact TEXT,
    vendor_number TEXT,
    truck_plate TEXT,
    origin TEXT,
    destination TEXT,
    signature_data TEXT,
    status TEXT DEFAULT 'Completed',
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    status TEXT DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Sync queue for offline operations
CREATE TABLE IF NOT EXISTS public.sync_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);