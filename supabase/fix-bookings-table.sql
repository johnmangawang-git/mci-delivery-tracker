-- Fix bookings table - add missing user_id column
-- Run this to add the user_id column to bookings table

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Update existing records to have current user's ID (if any exist)
UPDATE public.bookings 
SET user_id = auth.uid() 
WHERE user_id IS NULL;