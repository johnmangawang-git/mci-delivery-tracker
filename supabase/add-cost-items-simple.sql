-- =====================================================
-- SIMPLE VERSION: Add Additional Cost Items Table
-- Run each section separately if needed
-- =====================================================

-- Section 1: Create the main table
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

-- Section 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_delivery_id ON public.additional_cost_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_category ON public.additional_cost_items(category);
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_user_id ON public.additional_cost_items(user_id);

-- Section 3: Add JSONB column to deliveries
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS additional_cost_items JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_deliveries_additional_cost_items ON public.deliveries USING GIN (additional_cost_items);

-- Section 4: Enable RLS
ALTER TABLE public.additional_cost_items ENABLE ROW LEVEL SECURITY;

-- Section 5: Create RLS policies
CREATE POLICY "Users can view their own cost items" ON public.additional_cost_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cost items" ON public.additional_cost_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost items" ON public.additional_cost_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cost items" ON public.additional_cost_items
    FOR DELETE USING (auth.uid() = user_id);

-- Section 6: Create trigger for updated_at
CREATE TRIGGER update_additional_cost_items_updated_at BEFORE UPDATE ON public.additional_cost_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();