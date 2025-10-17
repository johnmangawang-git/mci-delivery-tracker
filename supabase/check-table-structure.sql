-- ============================================================================
-- CHECK TABLE STRUCTURE - Diagnostic Script
-- ============================================================================
-- This script checks your current table structure and sequences
-- Run this BEFORE cleanup to understand your database setup
-- ============================================================================

-- ============================================================================
-- STEP 1: Check what tables exist
-- ============================================================================

SELECT 
    table_name,
    table_type,
    'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- STEP 2: Check table columns and data types
-- ============================================================================

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_default LIKE 'nextval%' THEN 'AUTO_INCREMENT'
        WHEN data_type = 'uuid' THEN 'UUID'
        ELSE 'REGULAR'
    END as id_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('deliveries', 'customers', 'additional_cost_items', 'epod_records', 'user_profiles')
    AND column_name = 'id'
ORDER BY table_name;

-- ============================================================================
-- STEP 3: Check what sequences exist
-- ============================================================================

SELECT 
    schemaname,
    sequencename,
    data_type,
    start_value,
    min_value,
    max_value,
    increment_by,
    'Sequence exists' as status
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename;

-- ============================================================================
-- STEP 4: Count current records in each table
-- ============================================================================

-- Check deliveries
SELECT 
    'deliveries' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN 'HAS DATA' ELSE 'EMPTY' END as status
FROM deliveries

UNION ALL

-- Check customers
SELECT 
    'customers' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN 'HAS DATA' ELSE 'EMPTY' END as status
FROM customers

UNION ALL

-- Check additional_cost_items
SELECT 
    'additional_cost_items' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN 'HAS DATA' ELSE 'EMPTY' END as status
FROM additional_cost_items

UNION ALL

-- Check epod_records
SELECT 
    'epod_records' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN 'HAS DATA' ELSE 'EMPTY' END as status
FROM epod_records

UNION ALL

-- Check user_profiles (if exists)
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN 'HAS DATA' ELSE 'EMPTY' END as status
FROM user_profiles;

-- ============================================================================
-- STEP 5: Check foreign key relationships
-- ============================================================================

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    'Foreign key relationship' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('deliveries', 'customers', 'additional_cost_items', 'epod_records', 'user_profiles')
ORDER BY tc.table_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
    '📊 DIAGNOSTIC COMPLETE' as status,
    'Check the results above to understand your table structure' as message,
    'Use clean-all-data-simple.sql for safe cleanup' as recommendation,
    NOW() as checked_at;