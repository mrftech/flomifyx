-- First, backup the existing data
CREATE TABLE items_backup AS SELECT * FROM items;

-- Alter the column type
ALTER TABLE items 
ALTER COLUMN platform_data TYPE text 
USING platform_data::text;

-- Update existing records to store code as plain text
UPDATE items
SET platform_data = jsonb_build_object(
  'figma', jsonb_build_object(
    'code', COALESCE(platform_data::jsonb->'figma'->>'code', ''),
    'enabled', COALESCE((platform_data::jsonb->'figma'->>'enabled')::boolean, false)
  ),
  'framer', jsonb_build_object(
    'code', COALESCE(platform_data::jsonb->'framer'->>'code', ''),
    'enabled', COALESCE((platform_data::jsonb->'framer'->>'enabled')::boolean, false)
  ),
  'webflow', jsonb_build_object(
    'code', COALESCE(platform_data::jsonb->'webflow'->>'code', ''),
    'enabled', COALESCE((platform_data::jsonb->'webflow'->>'enabled')::boolean, false)
  )
)::text;

-- Add a simple check constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS valid_platform_data_structure;
ALTER TABLE items ADD CONSTRAINT valid_platform_data_structure 
  CHECK (platform_data IS NULL OR platform_data != '');
  