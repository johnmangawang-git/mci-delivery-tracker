-- Check what tables and columns were actually created
-- Run this to see the actual table structure

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('deliveries', 'customers', 'epod_records', 'bookings', 'user_profiles', 'sync_queue')
ORDER BY table_name, ordinal_position;