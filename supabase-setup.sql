-- Create fuel_entries table
CREATE TABLE IF NOT EXISTS fuel_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  operator_name TEXT,
  fuel_type TEXT,
  opening_reading DECIMAL(10, 2),
  closing_reading DECIMAL(10, 2),
  liters_used DECIMAL(10, 2),
  hours_used DECIMAL(10, 2),
  consumption_rate DECIMAL(10, 2),
  entry_date DATE NOT NULL,
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS fuel_entries_user_id_idx ON fuel_entries(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own data
CREATE POLICY "Users can view their own fuel entries"
  ON fuel_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can insert their own entries
CREATE POLICY "Users can insert their own fuel entries"
  ON fuel_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can update their own entries
CREATE POLICY "Users can update their own fuel entries"
  ON fuel_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can delete their own entries
CREATE POLICY "Users can delete their own fuel entries"
  ON fuel_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create profiles table to store user metadata
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
