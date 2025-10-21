-- Alternative solution: Add composite unique constraint on dr_number + serial_number
-- This ensures each DR + Serial Number combination is unique while allowing duplicate DR numbers

-- First, remove the existing unique constraint on dr_number
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_dr_number_key;

-- Add composite unique constraint on dr_number + serial_number
-- This allows multiple entries with same DR but different serial numbers
ALTER TABLE public.deliveries 
ADD CONSTRAINT deliveries_dr_serial_unique 
UNIQUE (dr_number, serial_number);

-- Add comments explaining the constraints
COMMENT ON COLUMN public.deliveries.dr_number IS 'DR number - can have duplicates, uniqueness enforced by dr_number + serial_number combination';
COMMENT ON COLUMN public.deliveries.serial_number IS 'Serial number - unique per DR number, part of composite unique key';

-- Verify the new constraint
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.deliveries'::regclass 
    AND contype = 'u'  -- unique constraints
ORDER BY conname;