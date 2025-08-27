-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user'
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create deliveries table
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  dr_number TEXT NOT NULL UNIQUE,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL
);

-- Set up RLS for deliveries
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for deliveries
CREATE POLICY "Users can view their own deliveries." ON deliveries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deliveries." ON deliveries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deliveries." ON deliveries
  FOR UPDATE USING (auth.uid() = user_id);

-- Create additional_costs table
CREATE TABLE additional_costs (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for additional_costs
ALTER TABLE additional_costs ENABLE ROW LEVEL SECURITY;

-- Create policies for additional_costs
CREATE POLICY "Users can view costs for their deliveries." ON additional_costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = additional_costs.delivery_id
      AND deliveries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create costs for their deliveries." ON additional_costs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = additional_costs.delivery_id
      AND deliveries.user_id = auth.uid()
    )
  );

-- Create customers table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  account_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL
);

-- Set up RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Users can view their own customers." ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers." ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers." ON customers
  FOR UPDATE USING (auth.uid() = user_id);

-- Create warehouses table
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  current_utilization INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default warehouses
INSERT INTO warehouses (name, address, capacity, current_utilization) VALUES
  ('MCI Alabang warehouse', '123 Logistics Park, Alabang, Muntinlupa City', 1000, 780),
  ('MCI Cebu warehouse', '456 Distribution Center, Cebu City', 800, 520),
  ('MCI Davao warehouse', '789 Logistics Hub, Davao City', 600, 312);

-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();