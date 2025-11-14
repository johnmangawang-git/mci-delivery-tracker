-- ============================================
-- COMPLETE DELIVERY HISTORY TABLE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Create delivery_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.delivery_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dr_number TEXT NOT NULL,
    customer_name TEXT,
    vendor_number TEXT,
    origin TEXT,
    destination TEXT,
    truck_type TEXT,
    truck_plate_number TEXT,
    status TEXT DEFAULT 'Archived',
    distance TEXT,
    additional_costs DECIMAL(10,2) DEFAULT 0.00,
    created_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    process_by TEXT,
    item_number TEXT,
    mobile_number TEXT,
    item_description TEXT,
    serial_number TEXT,
    user_id UUID REFERENCES auth.users(id),
    original_delivery_id UUID,
    moved_to_history_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moved_by_user_id UUID REFERENCES auth.users(id)
);

-- Step 2: Add any missing columns to existing table
ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS original_delivery_id UUID;

ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS moved_to_history_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS moved_by_user_id UUID REFERENCES auth.users(id);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_history_user_id 
ON public.delivery_history(user_id);

CREATE INDEX IF NOT EXISTS idx_delivery_history_dr_number 
ON public.delivery_history(dr_number);

CREATE INDEX IF NOT EXISTS idx_delivery_history_signed_at 
ON public.delivery_history(signed_at);

CREATE INDEX IF NOT EXISTS idx_delivery_history_moved_at 
ON public.delivery_history(moved_to_history_at);

CREATE INDEX IF NOT EXISTS idx_delivery_history_status 
ON public.delivery_history(status);

-- Step 4: Enable Row Level Security
ALTER TABLE public.delivery_history ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own delivery history" ON public.delivery_history;
DROP POLICY IF EXISTS "Users can insert their own delivery history" ON public.delivery_history;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view their own delivery history" 
ON public.delivery_history
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery history" 
ON public.delivery_history
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Step 7: Add comments for documentation
COMMENT ON TABLE public.delivery_history IS 
'Permanent storage for completed/archived deliveries. Records here should never be modified or deleted.';

COMMENT ON COLUMN public.delivery_history.signed_at IS 
'Timestamp when the e-signature was captured';

COMMENT ON COLUMN public.delivery_history.moved_to_history_at IS 
'Timestamp when the delivery was moved/copied to history';

COMMENT ON COLUMN public.delivery_history.original_delivery_id IS 
'Original ID from the deliveries table before moving to history';

-- Step 8: Verify setup
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'delivery_history'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ delivery_history table exists';
        
        -- Check if signed_at column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'delivery_history'
            AND column_name = 'signed_at'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '✅ signed_at column exists';
        ELSE
            RAISE WARNING '❌ signed_at column is missing!';
        END IF;
    ELSE
        RAISE WARNING '❌ delivery_history table does not exist!';
    END IF;
    
    RAISE NOTICE '🎉 Setup complete! You can now use delivery history.';
END $$;

-- Step 9: Show current record count
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN signed_at IS NOT NULL THEN 1 END) as records_with_signature,
    MAX(moved_to_history_at) as latest_record
FROM public.delivery_history;
