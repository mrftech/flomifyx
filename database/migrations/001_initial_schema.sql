-- Enable UUID extension (already enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (only our custom tables)
DROP TABLE IF EXISTS user_items;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS profiles;
DROP TYPE IF EXISTS license_type;
DROP TYPE IF EXISTS platform_type;

-- Create enum types
CREATE TYPE license_type AS ENUM ('Free', 'Premium');
CREATE TYPE platform_type AS ENUM ('figma', 'framer', 'webflow');

-- Create or update profiles table for user subscription info FIRST
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  subscription_status VARCHAR DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create items table with platform-specific code fields
CREATE TABLE items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  item_type VARCHAR NOT NULL,
  category_id VARCHAR,
  license_type license_type DEFAULT 'Free',
  thumbnail_url TEXT,
  live_preview TEXT,
  purchase_link TEXT,
  tags TEXT[],
  popularity_score INTEGER DEFAULT 0,
  collection VARCHAR DEFAULT '',
  subcategory_id VARCHAR DEFAULT '',
  platform_data JSONB NOT NULL DEFAULT '{
    "figma": {"code": "", "enabled": false},
    "framer": {"code": "", "enabled": false},
    "webflow": {"code": "", "enabled": false}
  }',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);

-- Create user_items table for saved/favorited items
CREATE TABLE user_items (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id)
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for items
CREATE POLICY "View free items" ON items
  FOR SELECT
  USING (license_type = 'Free'::license_type);

CREATE POLICY "Premium users can view all items" ON items
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND p.subscription_status = 'premium' 
      AND p.subscription_expires_at > CURRENT_TIMESTAMP
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger after auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data
INSERT INTO items (
  item_id,
  name,
  description,
  item_type,
  category_id,
  license_type,
  thumbnail_url,
  platform_data
) VALUES (
  'itemId-1732165913378',
  'FAQs 01',
  'Frequently Asked Questions Component',
  'Blocks',
  'Marketing',
  'Free',
  'https://firebasestorage.googleapis.com/v0/b/booking-app-c46f7.appspot.com/o/ComponentLibrary%2FFAQs.png?alt=media&token=cc5f339d-dac3-4ae6-b0fc-2b1bfcd04164',
  '{
    "figma": {"code": "sample-figma-code", "enabled": true},
    "framer": {"code": "", "enabled": false},
    "webflow": {"code": "", "enabled": false}
  }'
);
  