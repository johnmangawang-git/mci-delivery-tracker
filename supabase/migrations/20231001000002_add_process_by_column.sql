-- Add process_by column to deliveries table
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS process_by TEXT;

-- Add process_by column to delivery_history table
ALTER TABLE delivery_history 
ADD COLUMN IF NOT EXISTS process_by TEXT;

-- Add comments for documentation
COMMENT ON COLUMN deliveries.process_by IS 'User who processed the delivery';
COMMENT ON COLUMN delivery_history.process_by IS 'User who processed the delivery';