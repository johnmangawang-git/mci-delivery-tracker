-- ============================================================================
-- CLEAN ALL DATA - FRESH START
-- ============================================================================
-- This script will DELETE ALL DATA from your Supabase database
-- ⚠️ WARNING: THIS CANNOT BE UNDONE! ⚠️
-- 
-- Use this to start with a completely fresh database
-- ============================================================================

-- Disable foreign key checks temporarily (if supported)
-- Note: Supabase/PostgreSQL handles this differently than MySQL

BEGIN;

-- ============================================================================
-- STEP 1: Clear all data from tables (in correct order due to foreign keys)
-- ============================================================================

-- Clear additional_cost_items first (has foreign key to deliveries)
DELETE FROM additional_cost_items;
SELECT 'Cleared additional_cost_items table' as status;

-- Clear epod_records (may have foreign key to deliveries)
DELETE FROM epod_records;
SELECT 'Cleared epod_records table' as status;

-- Clear deliveries table
DELETE FROM deliveries;
SELECT 'Cleared deliveries table' as status;

-- Clear customers table
DELETE FROM customers;
SELECT 'Cleared customers table' as status;

-- Clear user_profiles table
DELETE FROM user_profiles;
SELECT 'Cleared user_profiles table' as status;

-- ============================================================================
-- STEP 2: Reset auto-increment sequences (PostgreSQL specific)
-- ============================================================================

-- First, let's see what sequences actually exist
SELECT 
    schemaname,
    sequencename,
    'Found sequence: ' || sequencename as status
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename;

-- Reset sequences only if they exist (safe approach)
-- Note: Many Supabase tables use UUIDs instead of auto-increment integers

-- Try to reset deliveries sequence (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'deliveries_id_seq') THEN
        ALTER SEQUENCE deliveries_id_seq RESTART WITH 1;
        RAISE NOTICE 'Reset deliveries_id_seq to 1';
    ELSE
        RAISE NOTICE 'deliveries_id_seq does not exist (table likely uses UUID)';
    END IF;
END $$;

-- Try to reset customers sequence (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'customers_id_seq') THEN
        ALTER SEQUENCE customers_id_seq RESTART WITH 1;
        RAISE NOTICE 'Reset customers_id_seq to 1';
    ELSE
        RAISE NOTICE 'customers_id_seq does not exist (table likely uses UUID)';
    END IF;
END $$;

-- Try to reset additional_cost_items sequence (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'additional_cost_items_id_seq') THEN
        ALTER SEQUENCE additional_cost_items_id_seq RESTART WITH 1;
        RAISE NOTICE 'Reset additional_cost_items_id_seq to 1';
    ELSE
        RAISE NOTICE 'additional_cost_items_id_seq does not exist (table likely uses UUID)';
    END IF;
END $$;

-- Try to reset epod_records sequence (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'epod_records_id_seq') THEN
        ALTER SEQUENCE epod_records_id_seq RESTART WITH 1;
        RAISE NOTICE 'Reset epod_records_id_seq to 1';
    ELSE
        RAISE NOTICE 'epod_records_id_seq does not exist (table likely uses UUID)';
    END IF;
END $$;

-- Try to reset user_profiles sequence (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'user_profiles_id_seq') THEN
        ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1;
        RAISE NOTICE 'Reset user_profiles_id_seq to 1';
    ELSE
        RAISE NOTICE 'user_profiles_id_seq does not exist (table likely uses UUID)';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Verify cleanup
-- ============================================================================

-- Count remaining records in each table
SELECT 
    'deliveries' as table_name,
    COUNT(*) as remaining_records
FROM deliveries

UNION ALL

SELECT 
    'customers' as table_name,
    COUNT(*) as remaining_records
FROM customers

UNION ALL

SELECT 
    'additional_cost_items' as table_name,
    COUNT(*) as remaining_records
FROM additional_cost_items

UNION ALL

SELECT 
    'epod_records' as table_name,
    COUNT(*) as remaining_records
FROM epod_records

UNION ALL

SELECT 
    'user_profiles' as table_name,
    COUNT(*) as remaining_records
FROM user_profiles;

-- ============================================================================
-- STEP 4: Final status
-- ============================================================================

SELECT 
    '🎉 DATABASE CLEANUP COMPLETED' as status,
    'All data has been permanently deleted' as message,
    NOW() as completed_at;

COMMIT;

-- ============================================================================
-- USAGE INSTRUCTIONS:
-- ============================================================================
-- 1. Copy this entire script
-- 2. Go to your Supabase Dashboard > SQL Editor
-- 3. Paste the script and click "Run"
-- 4. Verify the results show 0 remaining records
-- 
-- ALTERNATIVE: Use the clean-all-data-fresh-start.html page for a GUI approach
-- ============================================================================