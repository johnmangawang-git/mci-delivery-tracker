-- Simple Test - Create just one table first
-- Run this to test if basic table creation works

CREATE TABLE IF NOT EXISTS public.test_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dr_number TEXT NOT NULL,
    customer_name TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.test_deliveries ENABLE ROW LEVEL SECURITY;

-- Create a simple policy
CREATE POLICY "Users can view their own test deliveries" ON public.test_deliveries
    FOR SELECT USING (auth.uid() = user_id);