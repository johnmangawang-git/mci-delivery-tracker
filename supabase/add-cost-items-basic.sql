-- =====================================================
-- BASIC VERSION: Just the Essential Table
-- Run this first to get the table working
-- =====================================================

-- Create the additional_cost_items table
CREATE TABLE IF NOT EXISTS public.additional_cost_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Add basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_delivery_id ON public.additional_cost_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_user_id ON public.additional_cost_items(user_id);

-- Add JSONB column to deliveries table for backward compatibility
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS additional_cost_items JSONB DEFAULT '[]';

-- Enable Row Level Security
ALTER TABLE public.additional_cost_items ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can manage their own cost items" ON public.additional_cost_items
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Success message
SELECT 'SUCCESS: Basic additional_cost_items table created!' as result;