-- Add item-related fields to deliveries table
-- Run this in your Supabase SQL Editor

-- Add new columns to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS item_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Create indexes for the new fields for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_item_number ON public.deliveries(item_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_serial_number ON public.deliveries(serial_number);

-- Update the updated_at timestamp when these fields are modified
-- (The existing trigger will handle this automatically)

COMMENT ON COLUMN public.deliveries.item_number IS 'Item number from Excel Column J';
COMMENT ON COLUMN public.deliveries.mobile_number IS 'Mobile number from Excel Column K';
COMMENT ON COLUMN public.deliveries.item_description IS 'Item description from Excel Column L';
COMMENT ON COLUMN public.deliveries.serial_number IS 'Serial number from Excel Column O';