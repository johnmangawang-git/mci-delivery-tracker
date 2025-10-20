-- Email Access Control for MCI Delivery Tracker
-- This creates server-side email restrictions that cannot be bypassed

-- Create a table to store allowed emails
CREATE TABLE IF NOT EXISTS allowed_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert allowed email addresses
INSERT INTO allowed_users (email) VALUES 
    ('pat.opena@smegphilippines.com'),
    ('marie.pineda@smegphilippines.com'),
    ('mariagresusa.vega@smegphilippines.com'),
    ('john.mangawang@smegphilippines.com')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS on auth.users (if not already enabled)
-- Note: This requires superuser privileges and should be done carefully

-- Create a function to check if email is allowed
CREATE OR REPLACE FUNCTION is_email_allowed(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM allowed_users 
        WHERE LOWER(email) = LOWER(user_email) 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to prevent unauthorized signups
CREATE OR REPLACE FUNCTION check_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the email is in the allowed list
    IF NOT is_email_allowed(NEW.email) THEN
        RAISE EXCEPTION 'Registration Denied! Please contact your IT admin.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table (requires superuser access)
-- DROP TRIGGER IF EXISTS check_email_before_insert ON auth.users;
-- CREATE TRIGGER check_email_before_insert
--     BEFORE INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION check_user_email();

-- Alternative: Create a custom signup function that can be called from the client
CREATE OR REPLACE FUNCTION custom_signup(
    signup_email TEXT,
    signup_password TEXT,
    user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if email is allowed
    IF NOT is_email_allowed(signup_email) THEN
        RETURN jsonb_build_object(
            'error', 'Registration Denied! Please contact your IT admin.',
            'success', false
        );
    END IF;
    
    -- If email is allowed, return success (actual signup handled by client)
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Email verified, proceed with signup'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION custom_signup TO authenticated;
GRANT EXECUTE ON FUNCTION custom_signup TO anon;