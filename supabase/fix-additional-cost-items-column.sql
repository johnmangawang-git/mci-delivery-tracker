-- FIX ADDITIONAL COST ITEMS COLUMN SCHEMA
-- This script fixes the PGRST204 error by ensuring the additional_cost_items column exists
-- and is properly configured in the deliveries table

-- Step 1: Add the additional_cost_items column if it doesn't exist
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS additional_cost_items JSONB DEFAULT '[]';

-- Step 2: Create index on the JSONB column for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_additional_cost_items 
ON public.deliveries USING GIN (additional_cost_items);

-- Step 3: Update existing records to have empty array if null
UPDATE public.deliveries 
SET additional_cost_items = '[]'::jsonb 
WHERE additional_cost_items IS NULL;

-- Step 4: Add a constraint to ensure it's always a valid JSON array
ALTER TABLE public.deliveries 
ADD CONSTRAINT IF NOT EXISTS check_additional_cost_items_is_array 
CHECK (jsonb_typeof(additional_cost_items) = 'array');

-- Step 5: Create a function to validate cost items structure
CREATE OR REPLACE FUNCTION validate_cost_items(cost_items JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if it's an array
    IF jsonb_typeof(cost_items) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Check each item in the array has required fields
    FOR i IN 0..jsonb_array_length(cost_items) - 1 LOOP
        IF NOT (
            cost_items->i ? 'description' AND
            cost_items->i ? 'amount' AND
            jsonb_typeof(cost_items->i->'amount') = 'number'
        ) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add a check constraint for cost items validation
ALTER TABLE public.deliveries 
ADD CONSTRAINT IF NOT EXISTS check_cost_items_valid 
CHECK (validate_cost_items(additional_cost_items));

-- Step 7: Create a trigger to automatically update additional_costs total
CREATE OR REPLACE FUNCTION update_additional_costs_from_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total from additional_cost_items array
    IF NEW.additional_cost_items IS NOT NULL THEN
        NEW.additional_costs = (
            SELECT COALESCE(SUM((item->>'amount')::DECIMAL), 0)
            FROM jsonb_array_elements(NEW.additional_cost_items) AS item
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create the trigger
DROP TRIGGER IF EXISTS trigger_update_additional_costs_from_items ON public.deliveries;
CREATE TRIGGER trigger_update_additional_costs_from_items
    BEFORE INSERT OR UPDATE ON public.deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_additional_costs_from_items();

-- Step 9: Create a function to add cost items to existing delivery
CREATE OR REPLACE FUNCTION add_cost_item_to_delivery(
    delivery_id UUID,
    item_description TEXT,
    item_amount DECIMAL,
    item_category TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_item JSONB;
    updated_items JSONB;
BEGIN
    -- Create the new cost item
    new_item = jsonb_build_object(
        'id', gen_random_uuid(),
        'description', item_description,
        'amount', item_amount,
        'category', item_category,
        'created_at', NOW()
    );
    
    -- Add to existing items array
    UPDATE public.deliveries 
    SET additional_cost_items = additional_cost_items || new_item,
        updated_at = NOW()
    WHERE id = delivery_id
    RETURNING additional_cost_items INTO updated_items;
    
    RETURN updated_items;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create a function to remove cost item from delivery
CREATE OR REPLACE FUNCTION remove_cost_item_from_delivery(
    delivery_id UUID,
    item_id UUID
)
RETURNS JSONB AS $$
DECLARE
    updated_items JSONB;
BEGIN
    -- Remove item with matching id
    UPDATE public.deliveries 
    SET additional_cost_items = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(additional_cost_items) AS item
        WHERE (item->>'id')::UUID != item_id
    ),
    updated_at = NOW()
    WHERE id = delivery_id
    RETURNING additional_cost_items INTO updated_items;
    
    RETURN updated_items;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create RPC functions for client access
CREATE OR REPLACE FUNCTION refresh_schema_cache()
RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder - actual schema refresh happens at PostgREST level
    RETURN 'Schema cache refresh requested';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_additional_cost_items_column()
RETURNS TEXT AS $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' 
        AND column_name = 'additional_cost_items'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.deliveries 
        ADD COLUMN additional_cost_items JSONB DEFAULT '[]';
        
        -- Create index
        CREATE INDEX idx_deliveries_additional_cost_items 
        ON public.deliveries USING GIN (additional_cost_items);
        
        RETURN 'Column added successfully';
    ELSE
        RETURN 'Column already exists';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_cost_items(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION add_cost_item_to_delivery(UUID, TEXT, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_cost_item_from_delivery(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_schema_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION add_additional_cost_items_column() TO authenticated;

-- Step 13: Create a view for easy querying of deliveries with cost items
CREATE OR REPLACE VIEW public.deliveries_with_cost_breakdown AS
SELECT 
    d.*,
    jsonb_array_length(d.additional_cost_items) as cost_items_count,
    (
        SELECT COALESCE(SUM((item->>'amount')::DECIMAL), 0)
        FROM jsonb_array_elements(d.additional_cost_items) AS item
    ) as calculated_additional_costs
FROM public.deliveries d;

-- Grant access to the view
GRANT SELECT ON public.deliveries_with_cost_breakdown TO authenticated;

-- Step 14: Refresh PostgREST schema cache (if possible)
-- Note: This might not work from SQL, may need to be done via API or dashboard
NOTIFY pgrst, 'reload schema';

-- Step 15: Verify the setup
DO $$
DECLARE
    column_exists BOOLEAN;
    index_exists BOOLEAN;
BEGIN
    -- Check if column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deliveries' 
        AND column_name = 'additional_cost_items'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    -- Check if index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'deliveries' 
        AND indexname = 'idx_deliveries_additional_cost_items'
        AND schemaname = 'public'
    ) INTO index_exists;
    
    -- Log results
    RAISE NOTICE 'Setup verification:';
    RAISE NOTICE 'Column exists: %', column_exists;
    RAISE NOTICE 'Index exists: %', index_exists;
    
    IF column_exists AND index_exists THEN
        RAISE NOTICE '✅ Additional cost items schema setup complete!';
    ELSE
        RAISE WARNING '⚠️ Schema setup incomplete - check for errors above';
    END IF;
END $$;