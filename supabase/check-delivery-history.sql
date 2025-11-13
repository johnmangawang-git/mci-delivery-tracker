-- Diagnostic script to check delivery_history table contents
-- Run this in Supabase SQL Editor to see what's actually stored

-- 1. Count total records in delivery_history
SELECT 
    'Total History Records' as metric,
    COUNT(*) as count
FROM delivery_history;

-- 2. Show all history records ordered by most recent
SELECT 
    id,
    dr_number,
    customer_name,
    status,
    completed_at,
    moved_to_history_at,
    created_at
FROM delivery_history
ORDER BY moved_to_history_at DESC NULLS LAST, completed_at DESC NULLS LAST, created_at DESC
LIMIT 50;

-- 3. Check for duplicate DR numbers (should be allowed in history)
SELECT 
    dr_number,
    COUNT(*) as occurrences,
    STRING_AGG(id::text, ', ') as record_ids
FROM delivery_history
GROUP BY dr_number
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 4. Check records by status
SELECT 
    status,
    COUNT(*) as count
FROM delivery_history
GROUP BY status
ORDER BY count DESC;

-- 5. Check recent inserts (last 24 hours)
SELECT 
    dr_number,
    customer_name,
    status,
    moved_to_history_at,
    completed_at
FROM delivery_history
WHERE moved_to_history_at > NOW() - INTERVAL '24 hours'
   OR completed_at > NOW() - INTERVAL '24 hours'
   OR created_at > NOW() - INTERVAL '24 hours'
ORDER BY COALESCE(moved_to_history_at, completed_at, created_at) DESC;

-- 6. Check if table has proper columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'delivery_history'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check for any constraints that might prevent inserts
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.delivery_history'::regclass;
