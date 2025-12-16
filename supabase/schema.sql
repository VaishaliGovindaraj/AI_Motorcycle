-- Motorcycle Shops Database Schema
-- Run this in your Supabase SQL Editor

-- Create the motorcycle_shops table
CREATE TABLE IF NOT EXISTS motorcycle_shops (
  id BIGINT PRIMARY KEY,
  country_code TEXT,
  country_name TEXT,
  name TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  address JSONB,
  contact JSONB,
  shop_info JSONB,
  shop_tags JSONB,
  source_country TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_motorcycle_shops_country
  ON motorcycle_shops(country_code);

CREATE INDEX IF NOT EXISTS idx_motorcycle_shops_city
  ON motorcycle_shops((address->>'city'));

CREATE INDEX IF NOT EXISTS idx_motorcycle_shops_updated
  ON motorcycle_shops(last_updated);

CREATE INDEX IF NOT EXISTS idx_motorcycle_shops_name
  ON motorcycle_shops(name);

-- Enable Row Level Security (RLS)
ALTER TABLE motorcycle_shops ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
  ON motorcycle_shops
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow authenticated writes
CREATE POLICY "Allow authenticated writes"
  ON motorcycle_shops
  FOR ALL
  TO authenticated
  USING (true);

-- Create a view for statistics (optional but useful)
CREATE OR REPLACE VIEW motorcycle_shops_stats AS
SELECT
  country_code,
  country_name,
  COUNT(*) as shop_count,
  MAX(last_updated) as last_updated
FROM motorcycle_shops
GROUP BY country_code, country_name
ORDER BY shop_count DESC;

-- Grant access to the view
GRANT SELECT ON motorcycle_shops_stats TO anon, authenticated;
