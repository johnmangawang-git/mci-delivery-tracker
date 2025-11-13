-- Simple query to check delivery_history contents
-- Run this to see what's actually stored

-- 1. Total count
SELECT COUNT(*) as total_history_records FROM delivery_history;

-- 2. Show all records (most recent first)
SELECT 
    dr_number,
    customer_name,
    status,
    completed_at,
    moved_to_history_at,
    created_at
FROM delivery_history
ORDER BY 
    COALESCE(moved_to_history_at, completed_at, created_at) DESC
LIMIT 50;

-- 3. Group by DR number to see if any appear multiple times
SELECT 
    dr_number,
    COUNT(*) as times_in_history
FROM delivery_history
GROUP BY dr_number
ORDER BY times_in_history DESC, dr_number;
