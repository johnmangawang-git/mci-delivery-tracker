-- Step 2: Create Indexes (Safe Version)
-- Run this AFTER the tables are created

-- Create indexes only if tables exist and have the required columns

-- Deliveries table indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deliveries' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON public.deliveries(user_id);
        CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
        CREATE INDEX IF NOT EXISTS idx_deliveries_dr_number ON public.deliveries(dr_number);
        RAISE NOTICE 'Created indexes for deliveries table';
    END IF;
END $$;

-- Customers table indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
        CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
        RAISE NOTICE 'Created indexes for customers table';
    END IF;
END $$;

-- E-POD records table indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'epod_records' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_epod_records_user_id ON public.epod_records(user_id);
        CREATE INDEX IF NOT EXISTS idx_epod_records_dr_number ON public.epod_records(dr_number);
        RAISE NOTICE 'Created indexes for epod_records table';
    END IF;
END $$;

-- Bookings table indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(start_date);
        RAISE NOTICE 'Created indexes for bookings table';
    END IF;
END $$;

-- Sync queue table indexes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_queue' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON public.sync_queue(user_id);
        RAISE NOTICE 'Created indexes for sync_queue table';
    END IF;
END $$;

-- User profiles table indexes (uses 'id' not 'user_id')
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
        RAISE NOTICE 'Created indexes for user_profiles table';
    END IF;
END $$;