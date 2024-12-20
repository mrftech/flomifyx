-- Add GIN index for available_platforms array
CREATE INDEX IF NOT EXISTS items_available_platforms_idx 
ON items USING gin (available_platforms);

-- Add index for platform_data JSONB if needed
CREATE INDEX IF NOT EXISTS items_platform_data_idx 
ON items USING gin (platform_data); 