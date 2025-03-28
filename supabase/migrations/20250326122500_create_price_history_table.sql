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
  diff_low_price DECIMAL,
  diff_mid_price DECIMAL,
  diff_high_price DECIMAL,
  diff_market_price DECIMAL,
  diff_direct_low_price DECIMAL,
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

-- Create a function to calculate percentage difference between two price values
CREATE OR REPLACE FUNCTION calculate_percentage_diff(new_price DECIMAL, old_price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- If either price is null or old price is zero, return null
  IF new_price IS NULL OR old_price IS NULL OR old_price = 0 THEN
    RETURN NULL;
  ELSE
    -- Calculate percentage difference: (new - old) / old * 100
    RETURN ROUND(((new_price - old_price) / old_price * 100)::numeric, 2);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically calculate price differences
CREATE OR REPLACE FUNCTION update_price_diffs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.diff_low_price = calculate_percentage_diff(NEW.low_price, NEW.prev_low_price);
  NEW.diff_mid_price = calculate_percentage_diff(NEW.mid_price, NEW.prev_mid_price);
  NEW.diff_high_price = calculate_percentage_diff(NEW.high_price, NEW.prev_high_price);
  NEW.diff_market_price = calculate_percentage_diff(NEW.market_price, NEW.prev_market_price);
  NEW.diff_direct_low_price = calculate_percentage_diff(NEW.direct_low_price, NEW.prev_direct_low_price);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_price_diffs
BEFORE INSERT OR UPDATE ON price_history
FOR EACH ROW EXECUTE PROCEDURE update_price_diffs();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS price_history_product_id_idx ON price_history(product_id);
CREATE INDEX IF NOT EXISTS price_history_category_group_idx ON price_history(category_id, group_id);
CREATE INDEX IF NOT EXISTS price_history_set_name_idx ON price_history(set_name);

-- Create index on price differences for sorting/filtering by price changes
CREATE INDEX IF NOT EXISTS price_history_diffs_idx ON price_history(diff_market_price, diff_low_price);
