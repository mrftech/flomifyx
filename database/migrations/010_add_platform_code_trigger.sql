-- Create function to check and update enabled status
CREATE OR REPLACE FUNCTION update_platform_enabled()
RETURNS trigger AS $$
DECLARE
  platform_data_obj json;
BEGIN
  -- Parse text to json
  platform_data_obj := NEW.platform_data::json;
  
  -- Update platform data
  IF platform_data_obj->>'figma' IS NOT NULL THEN
    platform_data_obj := json_build_object(
      'figma', json_build_object(
        'code', platform_data_obj->'figma'->>'code',
        'enabled', (platform_data_obj->'figma'->>'code' != '')
      ),
      'framer', json_build_object(
        'code', platform_data_obj->'framer'->>'code',
        'enabled', (platform_data_obj->'framer'->>'code' != '')
      ),
      'webflow', json_build_object(
        'code', platform_data_obj->'webflow'->>'code',
        'enabled', (platform_data_obj->'webflow'->>'code' != '')
      )
    );
  END IF;

  -- Convert back to text
  NEW.platform_data := platform_data_obj::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS platform_code_trigger ON items;
CREATE TRIGGER platform_code_trigger
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_enabled();

-- Set default value for new rows
ALTER TABLE items 
ALTER COLUMN platform_data 
SET DEFAULT '{"figma":{"code":"","enabled":false},"framer":{"code":"","enabled":false},"webflow":{"code":"","enabled":false}}'; 