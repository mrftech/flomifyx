-- Drop existing policies
DROP POLICY IF EXISTS "View free items" ON items;
DROP POLICY IF EXISTS "Premium users can view all items" ON items;

-- Create new policies
-- Allow anyone to view items
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  USING (true);

-- Allow anyone to copy free items
CREATE POLICY "Anyone can copy free items"
  ON items FOR SELECT
  USING (license_type = 'Free'::license_type);

-- Allow premium users to copy premium items
CREATE POLICY "Premium users can copy premium items"
  ON items FOR SELECT
  USING (
    license_type = 'Premium'::license_type AND
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND p.subscription_status = 'premium' 
      AND p.subscription_expires_at > CURRENT_TIMESTAMP
    )
  );

-- Keep your existing policies but add this one for range queries
CREATE POLICY "Enable range queries for all users"
ON items FOR SELECT
USING (true);