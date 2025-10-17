-- =====================================================
-- VERIFY ADDITIONAL COST ITEMS SCHEMA
-- Run this to check if the schema is properly applied
-- =====================================================

-- Check if additional_cost_items table exists
SELECT 
    'additional_cost_items table' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'additional_cost_items'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check if additional_cost_items column exists in deliveries table
SELECT 
    'deliveries.additional_cost_items column' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'deliveries' 
            AND column_name = 'additional_cost_items'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check if the view exists
SELECT 
    'deliveries_with_cost_items view' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name = 'deliveries_with_cost_items'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check if analytics view exists
SELECT 
    'cost_breakdown_analytics view' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name = 'cost_breakdown_analytics'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'additional_cost_items'
ORDER BY ordinal_position;

-- Show success message
SELECT '🎉 Schema verification complete! Check the results above.' as message;