-- Step 3: Enable RLS and Create Policies
-- Run this AFTER tables and indexes are created

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epod_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Deliveries Policies
CREATE POLICY "Users can view their own deliveries" ON public.deliveries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deliveries" ON public.deliveries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deliveries" ON public.deliveries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deliveries" ON public.deliveries
    FOR DELETE USING (auth.uid() = user_id);

-- Customers Policies
CREATE POLICY "Users can view their own customers" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" ON public.customers
    FOR DELETE USING (auth.uid() = user_id);

-- E-POD Records Policies
CREATE POLICY "Users can view their own epod records" ON public.epod_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own epod records" ON public.epod_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own epod records" ON public.epod_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Bookings Policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = user_id);

-- Sync Queue Policies
CREATE POLICY "Users can view their own sync queue" ON public.sync_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync queue" ON public.sync_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync queue" ON public.sync_queue
    FOR UPDATE USING (auth.uid() = user_id);