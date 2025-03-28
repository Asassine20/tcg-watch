-- Create price_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  category_id INTEGER,
  group_id INTEGER,
  set_name TEXT,
  abbreviation TEXT,
  product_id INTEGER NOT NULL,
  name TEXT,
  clean_name TEXT,
  image_url TEXT,
  url TEXT,
  low_price DECIMAL,
  mid_price DECIMAL,
  high_price DECIMAL,
  market_price DECIMAL,
  direct_low_price DECIMAL,
  prev_low_price DECIMAL,
  prev_mid_price DECIMAL,
  prev_high_price DECIMAL,
  prev_market_price DECIMAL,
  prev_direct_low_price DECIMAL,
  sub_type_name TEXT,
  prev_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, sub_type_name)
);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_price_history_timestamp
BEFORE UPDATE ON price_history
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS price_history_product_id_idx ON price_history(product_id);
CREATE INDEX IF NOT EXISTS price_history_category_group_idx ON price_history(category_id, group_id);
CREATE INDEX IF NOT EXISTS price_history_set_name_idx ON price_history(set_name);
