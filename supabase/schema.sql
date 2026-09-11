-- Create extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRADES TABLE
CREATE TABLE trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('BUY', 'SELL')) NOT NULL,
  volume NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  profit NUMERIC,
  net_profit NUMERIC,
  commission NUMERIC DEFAULT 0,
  swap NUMERIC DEFAULT 0,
  open_time TIMESTAMP WITH TIME ZONE NOT NULL,
  close_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'CLOSED' NOT NULL,
  confidence NUMERIC,
  screenshot_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SCREENSHOTS TABLE
CREATE TABLE screenshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  platform TEXT,
  status TEXT CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')) DEFAULT 'PENDING' NOT NULL,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trades Policies
CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (auth.uid() = user_id);

-- Screenshots Policies
CREATE POLICY "Users can view own screenshots" ON screenshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screenshots" ON screenshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own screenshots" ON screenshots FOR DELETE USING (auth.uid() = user_id);

-- FUNCTION to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
