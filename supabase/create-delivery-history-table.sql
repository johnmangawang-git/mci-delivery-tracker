-- Create delivery_history table for permanent storage of completed deliveries
-- This ensures completed DRs are never mixed with active deliveries

CREATE TABLE IF NOT EXISTS public.delivery_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dr_number TEXT NOT NULL,
    customer_name TEXT,
    vendor_number TEXT,
    origin TEXT,
    destination TEXT,
    truck_type TEXT,
    truck_plate_number TEXT,
    status TEXT DEFAULT 'Completed',
    distance TEXT,
    additional_costs DECIMAL(10,2) DEFAULT 0.00,
    created_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    process_by TEXT,
    item_number TEXT,
    mobile_number TEXT,
    item_description TEXT,
    serial_number TEXT,
    user_id UUID REFERENCES auth.users(id),
    -- Original delivery ID for reference
    original_delivery_id UUID,
    -- Metadata
    moved_to_history_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moved_by_user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_history_user_id ON public.delivery_history(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_history_dr_number ON public.delivery_history(dr_number);
CREATE INDEX IF NOT EXISTS idx_delivery_history_completed_at ON public.delivery_history(completed_at);
CREATE INDEX IF NOT EXISTS idx_delivery_history_status ON public.delivery_history(status);

-- Row Level Security Policies
ALTER TABLE public.delivery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery history" ON public.delivery_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery history" ON public.delivery_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies - history should be immutable once created

-- Add comment for documentation
COMMENT ON TABLE public.delivery_history IS 'Permanent storage for completed deliveries. Records here should never be modified or deleted.';
COMMENT ON COLUMN public.delivery_history.moved_to_history_at IS 'Timestamp when the delivery was moved from active to history';
COMMENT ON COLUMN public.delivery_history.completed_at IS 'Timestamp when the delivery was marked as completed';
