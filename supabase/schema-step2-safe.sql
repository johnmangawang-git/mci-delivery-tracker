-- Step 2: Create Indexes (Ultra Safe Version)
-- This checks for both table AND column existence

-- Function to safely create index if column exists
CREATE OR REPLACE FUNCTION create_index_if_column_exists(
    table_name text,
    column_name text,
    index_name text
) RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = create_index_if_column_exists.table_name 
        AND column_name = create_index_if_column_exists.column_name
    ) THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(%I)', 
                      index_name, table_name, column_name);
        RAISE NOTICE 'Created index % on %.%', index_name, table_name, column_name;
    ELSE
        RAISE NOTICE 'Skipped index % - column %.% does not exist', 
                     index_name, table_name, column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Now safely create all indexes
SELECT create_index_if_column_exists('deliveries', 'user_id', 'idx_deliveries_user_id');
SELECT create_index_if_column_exists('deliveries', 'status', 'idx_deliveries_status');
SELECT create_index_if_column_exists('deliveries', 'dr_number', 'idx_deliveries_dr_number');

SELECT create_index_if_column_exists('customers', 'user_id', 'idx_customers_user_id');
SELECT create_index_if_column_exists('customers', 'name', 'idx_customers_name');

SELECT create_index_if_column_exists('epod_records', 'user_id', 'idx_epod_records_user_id');
SELECT create_index_if_column_exists('epod_records', 'dr_number', 'idx_epod_records_dr_number');

SELECT create_index_if_column_exists('bookings', 'user_id', 'idx_bookings_user_id');
SELECT create_index_if_column_exists('bookings', 'start_date', 'idx_bookings_date');

SELECT create_index_if_column_exists('sync_queue', 'user_id', 'idx_sync_queue_user_id');

SELECT create_index_if_column_exists('user_profiles', 'id', 'idx_user_profiles_id');

-- Clean up the helper function
DROP FUNCTION create_index_if_column_exists(text, text, text);