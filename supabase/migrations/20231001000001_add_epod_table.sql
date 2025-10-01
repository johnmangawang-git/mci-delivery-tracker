-- Create e_pod_records table
CREATE TABLE e_pod_records (
  id SERIAL PRIMARY KEY,
  dr_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT NOT NULL,
  truck_plate TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  signature TEXT NOT NULL, -- Base64 encoded signature image
  status TEXT NOT NULL DEFAULT 'Completed',
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL
);

-- Set up RLS for e_pod_records
ALTER TABLE e_pod_records ENABLE ROW LEVEL SECURITY;

-- Create policies for e_pod_records
CREATE POLICY "Users can view their own E-POD records." ON e_pod_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own E-POD records." ON e_pod_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own E-POD records." ON e_pod_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_e_pod_records_user_id ON e_pod_records(user_id);
CREATE INDEX idx_e_pod_records_dr_number ON e_pod_records(dr_number);
CREATE INDEX idx_e_pod_records_signed_at ON e_pod_records(signed_at);