-- Add missing columns to existing delivery_history table
-- Run this if you get "column does not exist" errors

-- Add original_delivery_id if it doesn't exist
ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS original_delivery_id UUID;

-- Add completed_at if it doesn't exist
ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add moved_to_history_at if it doesn't exist
ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS moved_to_history_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add moved_by_user_id if it doesn't exist
ALTER TABLE public.delivery_history 
ADD COLUMN IF NOT EXISTS moved_by_user_id UUID REFERENCES auth.users(id);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_delivery_history_user_id ON public.delivery_history(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_history_dr_number ON public.delivery_history(dr_number);
CREATE INDEX IF NOT EXISTS idx_delivery_history_completed_at ON public.delivery_history(completed_at);
CREATE INDEX IF NOT EXISTS idx_delivery_history_status ON public.delivery_history(status);

-- Enable RLS if not already enabled
ALTER TABLE public.delivery_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own delivery history" ON public.delivery_history;
DROP POLICY IF EXISTS "Users can insert their own delivery history" ON public.delivery_history;

-- Create policies
CREATE POLICY "Users can view their own delivery history" ON public.delivery_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery history" ON public.delivery_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.delivery_history IS 'Permanent storage for completed deliveries. Records here should never be modified or deleted.';
COMMENT ON COLUMN public.delivery_history.moved_to_history_at IS 'Timestamp when the delivery was moved from active to history';
COMMENT ON COLUMN public.delivery_history.completed_at IS 'Timestamp when the delivery was marked as completed';
COMMENT ON COLUMN public.delivery_history.original_delivery_id IS 'Original ID from the deliveries table before moving to history';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added missing columns to delivery_history table';
END $$;
