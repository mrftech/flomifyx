-- Add available_platforms column
ALTER TABLE items 
ADD COLUMN available_platforms TEXT[] DEFAULT '{}';

-- Create function to update available_platforms based on platform_data
CREATE OR REPLACE FUNCTION update_available_platforms()
RETURNS TRIGGER AS $$
DECLARE
  platform_data_obj json;
  available TEXT[] := '{}';
BEGIN
  -- Parse platform_data
  platform_data_obj := NEW.platform_data::json;
  
  -- Check each platform
  IF platform_data_obj->'figma'->>'code' IS NOT NULL AND platform_data_obj->'figma'->>'code' != '' THEN
    available := array_append(available, 'figma');
  END IF;
  
  IF platform_data_obj->'framer'->>'code' IS NOT NULL AND platform_data_obj->'framer'->>'code' != '' THEN
    available := array_append(available, 'framer');
  END IF;
  
  IF platform_data_obj->'webflow'->>'code' IS NOT NULL AND platform_data_obj->'webflow'->>'code' != '' THEN
    available := array_append(available, 'webflow');
  END IF;

  -- Update available_platforms
  NEW.available_platforms := available;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update available_platforms
CREATE TRIGGER update_available_platforms_trigger
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_available_platforms();

-- Update existing records
UPDATE items 
SET available_platforms = (
  SELECT array_remove(ARRAY[
    CASE WHEN platform_data::json->'figma'->>'code' != '' THEN 'figma' END,
    CASE WHEN platform_data::json->'framer'->>'code' != '' THEN 'framer' END,
    CASE WHEN platform_data::json->'webflow'->>'code' != '' THEN 'webflow' END
  ], NULL)
); 