-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE license_type AS ENUM ('Free', 'Premium');
CREATE TYPE platform_type AS ENUM ('figma', 'framer', 'webflow');

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table with subscription status
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  subscription_status VARCHAR DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy for viewing items
CREATE POLICY "View free items" ON items
  FOR SELECT
  USING (license_type = 'Free'::license_type);

CREATE POLICY "Premium users can view all items" ON items
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND subscription_status = 'premium' 
      AND subscription_expires_at > NOW()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user_items table for saved/favorited items
CREATE TABLE user_items (
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES items(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
); 