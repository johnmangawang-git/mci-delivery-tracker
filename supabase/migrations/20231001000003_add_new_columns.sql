-- Add new columns to deliveries table
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS item_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Add new columns to delivery_history table
ALTER TABLE delivery_history 
ADD COLUMN IF NOT EXISTS item_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Add comments for documentation
COMMENT ON COLUMN deliveries.item_number IS 'Item number from Excel upload';
COMMENT ON COLUMN deliveries.mobile_number IS 'Mobile number from Excel upload';
COMMENT ON COLUMN deliveries.item_description IS 'Item description from Excel upload';
COMMENT ON COLUMN deliveries.serial_number IS 'Serial number from Excel upload';

COMMENT ON COLUMN delivery_history.item_number IS 'Item number from Excel upload';
COMMENT ON COLUMN delivery_history.mobile_number IS 'Mobile number from Excel upload';
COMMENT ON COLUMN delivery_history.item_description IS 'Item description from Excel upload';
COMMENT ON COLUMN delivery_history.serial_number IS 'Serial number from Excel upload';