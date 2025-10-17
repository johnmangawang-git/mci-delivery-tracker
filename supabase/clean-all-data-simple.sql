-- ============================================================================
-- CLEAN ALL DATA - SIMPLE VERSION (No Sequence Reset)
-- ============================================================================
-- This script will DELETE ALL DATA from your Supabase database
-- ⚠️ WARNING: THIS CANNOT BE UNDONE! ⚠️
-- 
-- This version only deletes data and doesn't try to reset sequences
-- Works with both UUID and auto-increment ID tables
-- ============================================================================

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

-- Clear user_profiles table (if exists)
DELETE FROM user_profiles;
SELECT 'Cleared user_profiles table' as status;

-- ============================================================================
-- STEP 2: Verify cleanup
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
-- STEP 3: Final status
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
-- This version works with both UUID and auto-increment tables
-- ============================================================================