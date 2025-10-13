-- Step 2: Create Indexes (Corrected for Actual Table Structure)
-- Based on the actual columns that exist

-- Deliveries table indexes (has user_id ✓)
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON public.deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_dr_number ON public.deliveries(dr_number);

-- Customers table indexes (has user_id ✓)
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- E-POD records table indexes (has user_id ✓)
CREATE INDEX IF NOT EXISTS idx_epod_records_user_id ON public.epod_records(user_id);
CREATE INDEX IF NOT EXISTS idx_epod_records_dr_number ON public.epod_records(dr_number);

-- Sync queue table indexes (has user_id ✓)
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON public.sync_queue(user_id);

-- User profiles table indexes (uses 'id' not 'user_id')
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- Bookings table indexes (different structure - no user_id, has resource_id)
CREATE INDEX IF NOT EXISTS idx_bookings_resource_id ON public.bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);