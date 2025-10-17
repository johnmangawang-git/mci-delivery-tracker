-- =====================================================
-- ADD ONLY MISSING PARTS FOR COST ITEMS SCHEMA
-- Run this if you got policy errors from the main script
-- =====================================================

-- Add JSONB column to deliveries table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'deliveries' 
        AND column_name = 'additional_cost_items'
    ) THEN
        ALTER TABLE public.deliveries 
        ADD COLUMN additional_cost_items JSONB DEFAULT '[]';
        
        -- Create index on the JSONB column
        CREATE INDEX IF NOT EXISTS idx_deliveries_additional_cost_items 
        ON public.deliveries USING GIN (additional_cost_items);
        
        RAISE NOTICE '✅ Added additional_cost_items JSONB column to deliveries table';
    ELSE
        RAISE NOTICE '✅ additional_cost_items column already exists in deliveries table';
    END IF;
END $$;

-- Create or replace the deliveries with cost items view
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

-- Grant permissions for the view
GRANT SELECT ON public.deliveries_with_cost_items TO authenticated;

-- Create or replace analytics view for cost breakdown
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

-- Create or replace the function to update delivery total costs
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

-- Create triggers only if they don't exist
DO $$
BEGIN
    -- Check and create insert trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_delivery_costs_on_insert'
    ) THEN
        CREATE TRIGGER trigger_update_delivery_costs_on_insert
            AFTER INSERT ON public.additional_cost_items
            FOR EACH ROW EXECUTE FUNCTION update_delivery_total_costs();
        RAISE NOTICE '✅ Created insert trigger for cost updates';
    ELSE
        RAISE NOTICE '✅ Insert trigger already exists';
    END IF;

    -- Check and create update trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_delivery_costs_on_update'
    ) THEN
        CREATE TRIGGER trigger_update_delivery_costs_on_update
            AFTER UPDATE ON public.additional_cost_items
            FOR EACH ROW EXECUTE FUNCTION update_delivery_total_costs();
        RAISE NOTICE '✅ Created update trigger for cost updates';
    ELSE
        RAISE NOTICE '✅ Update trigger already exists';
    END IF;

    -- Check and create delete trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_delivery_costs_on_delete'
    ) THEN
        CREATE TRIGGER trigger_update_delivery_costs_on_delete
            AFTER DELETE ON public.additional_cost_items
            FOR EACH ROW EXECUTE FUNCTION update_delivery_total_costs();
        RAISE NOTICE '✅ Created delete trigger for cost updates';
    ELSE
        RAISE NOTICE '✅ Delete trigger already exists';
    END IF;
END $$;

-- Final success message
DO $
BEGIN
    RAISE NOTICE '🎉 SUCCESS: Missing cost items schema parts have been added!';
    RAISE NOTICE 'The additional cost items functionality should now work properly.';
    RAISE NOTICE 'You can now test the DR upload cost items fix.';
END $;