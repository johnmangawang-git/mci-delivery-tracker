-- =====================================================
-- ADD ADDITIONAL COST ITEMS TABLE TO SUPABASE
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create additional_cost_items table for detailed cost breakdown
CREATE TABLE IF NOT EXISTS public.additional_cost_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category TEXT, -- Auto-categorized (Fuel Surcharge, Toll Fees, Helper, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_delivery_id ON public.additional_cost_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_category ON public.additional_cost_items(category);
CREATE INDEX IF NOT EXISTS idx_additional_cost_items_user_id ON public.additional_cost_items(user_id);

-- Add a JSONB column to deliveries table for storing cost items array (for backward compatibility)
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS additional_cost_items JSONB DEFAULT '[]';

-- Create index on the JSONB column
CREATE INDEX IF NOT EXISTS idx_deliveries_additional_cost_items ON public.deliveries USING GIN (additional_cost_items);

-- Row Level Security Policies for additional_cost_items table

-- Enable RLS
ALTER TABLE public.additional_cost_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own cost items
CREATE POLICY "Users can view their own cost items" ON public.additional_cost_items
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own cost items
CREATE POLICY "Users can insert their own cost items" ON public.additional_cost_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own cost items
CREATE POLICY "Users can update their own cost items" ON public.additional_cost_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own cost items
CREATE POLICY "Users can delete their own cost items" ON public.additional_cost_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_additional_cost_items_updated_at BEFORE UPDATE ON public.additional_cost_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically update the total additional_costs in deliveries table
CREATE OR REPLACE FUNCTION update_delivery_total_costs()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the total additional_costs in the deliveries table
    UPDATE public.deliveries 
    SET additional_costs = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.additional_cost_items 
        WHERE delivery_id = COALESCE(NEW.delivery_id, OLD.delivery_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.delivery_id, OLD.delivery_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update total costs
CREATE TRIGGER trigger_update_delivery_costs_on_insert
    AFTER INSERT ON public.additional_cost_items
    FOR EACH ROW EXECUTE FUNCTION update_delivery_total_costs();

CREATE TRIGGER trigger_update_delivery_costs_on_update
    AFTER UPDATE ON public.additional_cost_items
    FOR EACH ROW EXECUTE FUNCTION update_delivery_total_costs();

CREATE TRIGGER trigger_update_delivery_costs_on_delete
    AFTER DELETE ON public.additional_cost_items
    FOR EACH ROW EXECUTE FUNCTION update_delivery_total_costs();

-- Create a view for easy querying of deliveries with their cost items
CREATE OR REPLACE VIEW public.deliveries_with_cost_items AS
SELECT 
    d.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', aci.id,
                'description', aci.description,
                'amount', aci.amount,
                'category', aci.category,
                'created_at', aci.created_at
            ) ORDER BY aci.created_at
        ) FILTER (WHERE aci.id IS NOT NULL),
        '[]'::json
    ) as cost_items_detailed
FROM public.deliveries d
LEFT JOIN public.additional_cost_items aci ON d.id = aci.delivery_id
GROUP BY d.id;

-- Grant necessary permissions
GRANT SELECT ON public.deliveries_with_cost_items TO authenticated;

-- Create analytics view for cost breakdown
CREATE OR REPLACE VIEW public.cost_breakdown_analytics AS
SELECT 
    aci.category,
    COUNT(*) as item_count,
    SUM(aci.amount) as total_amount,
    AVG(aci.amount) as average_amount,
    DATE_TRUNC('month', aci.created_at) as month,
    DATE_TRUNC('week', aci.created_at) as week,
    DATE_TRUNC('day', aci.created_at) as day
FROM public.additional_cost_items aci
WHERE aci.user_id = auth.uid()
GROUP BY aci.category, DATE_TRUNC('month', aci.created_at), DATE_TRUNC('week', aci.created_at), DATE_TRUNC('day', aci.created_at);

-- Grant permissions for analytics view
GRANT SELECT ON public.cost_breakdown_analytics TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: Additional cost items table and related objects created successfully!';
    RAISE NOTICE 'You can now use the additional_cost_items table for detailed cost breakdown analytics.';
END $$;