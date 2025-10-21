-- Remove UNIQUE constraint from dr_number to allow multiple items with same DR
-- This allows multiple deliveries with the same DR number but different serial numbers

-- Drop the existing unique constraint on dr_number
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_dr_number_key;

-- Add a comment explaining the change
COMMENT ON COLUMN public.deliveries.dr_number IS 'DR number - can have duplicates since uniqueness is based on serial_number';

-- Optional: Add a composite unique constraint on dr_number + serial_number if needed
-- ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_dr_serial_unique UNIQUE (dr_number, serial_number);

-- Verify the constraint was removed
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.deliveries'::regclass 
    AND contype = 'u'  -- unique constraints
    AND conname LIKE '%dr_number%';