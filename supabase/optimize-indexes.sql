-- Database Query Optimization and Indexes
-- Task 19: Optimize database queries and add indexes
-- Requirements: 5.2, 5.5, 8.1

-- ============================================================================
-- PERFORMANCE INDEXES FOR FREQUENTLY QUERIED FIELDS
-- ============================================================================

-- Deliveries table indexes
-- Already exists: idx_deliveries_user_id, idx_deliveries_status, idx_deliveries_dr_number

-- Add composite index for common query patterns (status + user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_deliveries_status_user_created 
ON public.deliveries(status, user_id, created_at DESC);

-- Add index for customer name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_name_lower 
ON public.deliveries(LOWER(customer_name));

-- Add index for vendor number lookups
CREATE INDEX IF NOT EXISTS idx_deliveries_vendor_number 
ON public.deliveries(vendor_number) WHERE vendor_number IS NOT NULL;

-- Add index for truck plate number searches
CREATE INDEX IF NOT EXISTS idx_deliveries_truck_plate 
ON public.deliveries(truck_plate_number) WHERE truck_plate_number IS NOT NULL;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at 
ON public.deliveries(created_at DESC);

-- Add index for updated_at for sync operations
CREATE INDEX IF NOT EXISTS idx_deliveries_updated_at 
ON public.deliveries(updated_at DESC);

-- Customers table indexes
-- Already exists: idx_customers_user_id

-- Add index for customer name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_customers_name_lower 
ON public.customers(LOWER(name));

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone 
ON public.customers(phone) WHERE phone IS NOT NULL;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_customers_email 
ON public.customers(email) WHERE email IS NOT NULL;

-- Add index for vendor number
CREATE INDEX IF NOT EXISTS idx_customers_vendor_number 
ON public.customers(vendor_number) WHERE vendor_number IS NOT NULL;

-- Add composite index for name + user_id
CREATE INDEX IF NOT EXISTS idx_customers_name_user 
ON public.customers(name, user_id);

-- E-POD Records table indexes
-- Already exists: idx_epod_records_user_id, idx_epod_records_dr_number

-- Add index for signed_at date queries
CREATE INDEX IF NOT EXISTS idx_epod_records_signed_at 
ON public.epod_records(signed_at DESC);

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_epod_records_status 
ON public.epod_records(status) WHERE status IS NOT NULL;

-- Add composite index for dr_number + user_id
CREATE INDEX IF NOT EXISTS idx_epod_records_dr_user 
ON public.epod_records(dr_number, user_id);

-- Bookings table indexes
-- Already exists: idx_bookings_user_id, idx_bookings_date

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_date_range 
ON public.bookings(start_date, end_date);

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status 
ON public.bookings(status) WHERE status IS NOT NULL;

-- Add composite index for user + date range
CREATE INDEX IF NOT EXISTS idx_bookings_user_dates 
ON public.bookings(user_id, start_date, end_date);

-- ============================================================================
-- ADDITIONAL COST ITEMS TABLE (if not exists)
-- ============================================================================

-- Create additional_cost_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.additional_cost_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Indexes for additional_cost_items
CREATE INDEX IF NOT EXISTS idx_cost_items_delivery_id 
ON public.additional_cost_items(delivery_id);

CREATE INDEX IF NOT EXISTS idx_cost_items_category 
ON public.additional_cost_items(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cost_items_user_id 
ON public.additional_cost_items(user_id);

-- Composite index for delivery + category queries
CREATE INDEX IF NOT EXISTS idx_cost_items_delivery_category 
ON public.additional_cost_items(delivery_id, category);

-- ============================================================================
-- ROW LEVEL SECURITY FOR ADDITIONAL COST ITEMS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.additional_cost_items ENABLE ROW LEVEL SECURITY;

-- Policies for additional_cost_items
CREATE POLICY "Users can view their own cost items" ON public.additional_cost_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cost items" ON public.additional_cost_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost items" ON public.additional_cost_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cost items" ON public.additional_cost_items
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cost_items_updated_at BEFORE UPDATE ON public.additional_cost_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- QUERY OPTIMIZATION VIEWS
-- ============================================================================

-- View for active deliveries with cost summary
CREATE OR REPLACE VIEW public.active_deliveries_summary AS
SELECT 
    d.*,
    COALESCE(SUM(aci.amount), 0) as total_additional_costs,
    COUNT(aci.id) as cost_items_count
FROM public.deliveries d
LEFT JOIN public.additional_cost_items aci ON d.id = aci.delivery_id
WHERE d.status IN ('Active', 'In Transit', 'On Schedule', 'Sold Undelivered')
GROUP BY d.id;

-- View for completed deliveries with cost summary
CREATE OR REPLACE VIEW public.completed_deliveries_summary AS
SELECT 
    d.*,
    COALESCE(SUM(aci.amount), 0) as total_additional_costs,
    COUNT(aci.id) as cost_items_count
FROM public.deliveries d
LEFT JOIN public.additional_cost_items aci ON d.id = aci.delivery_id
WHERE d.status = 'Completed'
GROUP BY d.id;

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for query planner optimization
ANALYZE public.deliveries;
ANALYZE public.customers;
ANALYZE public.epod_records;
ANALYZE public.bookings;
ANALYZE public.additional_cost_items;

-- ============================================================================
-- PERFORMANCE MONITORING FUNCTION
-- ============================================================================

-- Function to get table statistics
CREATE OR REPLACE FUNCTION public.get_table_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename AS table_name,
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
        pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_deliveries_status_user_created IS 
'Composite index for filtering deliveries by status and user, ordered by creation date';

COMMENT ON INDEX idx_deliveries_customer_name_lower IS 
'Case-insensitive index for customer name searches';

COMMENT ON VIEW active_deliveries_summary IS 
'Optimized view for active deliveries with aggregated cost information';

COMMENT ON VIEW completed_deliveries_summary IS 
'Optimized view for completed deliveries with aggregated cost information';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify indexes were created, run:
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;

-- To analyze query performance:
-- EXPLAIN ANALYZE SELECT * FROM deliveries WHERE status = 'Active' AND user_id = 'xxx';
