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

-- Add a function for upserting price_history records
CREATE OR REPLACE FUNCTION upsert_price_history(
  p_category_id INTEGER,
  p_group_id INTEGER,
  p_set_name TEXT,
  p_abbreviation TEXT,
  p_product_id INTEGER,
  p_name TEXT,
  p_clean_name TEXT,
  p_image_url TEXT,
  p_url TEXT,
  p_low_price DECIMAL,
  p_mid_price DECIMAL,
  p_high_price DECIMAL,
  p_market_price DECIMAL,
  p_direct_low_price DECIMAL,
  p_sub_type_name TEXT
) RETURNS void AS $$
BEGIN
  -- Try to update first
  UPDATE price_history
  SET 
    category_id = p_category_id,
    group_id = p_group_id,
    set_name = p_set_name,
    abbreviation = p_abbreviation,
    name = p_name,
    clean_name = p_clean_name,
    image_url = p_image_url,
    url = p_url,
    prev_low_price = low_price,
    prev_mid_price = mid_price,
    prev_high_price = high_price,
    prev_market_price = market_price,
    prev_direct_low_price = direct_low_price,
    low_price = p_low_price,
    mid_price = p_mid_price,
    high_price = p_high_price,
    market_price = p_market_price,
    direct_low_price = p_direct_low_price,
    prev_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE product_id = p_product_id AND sub_type_name = p_sub_type_name;
  
  -- If no rows were updated, then insert
  IF NOT FOUND THEN
    INSERT INTO price_history (
      category_id, group_id, set_name, abbreviation, product_id, 
      name, clean_name, image_url, url, 
      low_price, mid_price, high_price, market_price, direct_low_price,
      prev_low_price, prev_mid_price, prev_high_price, prev_market_price, prev_direct_low_price,
      sub_type_name, prev_date
    ) VALUES (
      p_category_id, p_group_id, p_set_name, p_abbreviation, p_product_id,
      p_name, p_clean_name, p_image_url, p_url,
      p_low_price, p_mid_price, p_high_price, p_market_price, p_direct_low_price,
      NULL, NULL, NULL, NULL, NULL,
      p_sub_type_name, CURRENT_DATE
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Alternatively, you can create an instead-of-insert trigger that performs an upsert
-- CREATE OR REPLACE FUNCTION handle_price_history_upsert()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Look for existing record
--   IF EXISTS (SELECT 1 FROM price_history WHERE product_id = NEW.product_id AND sub_type_name = NEW.sub_type_name) THEN
--     -- Update existing record with new price data, preserving old prices as previous
--     UPDATE price_history
--     SET 
--       category_id = NEW.category_id,
--       group_id = NEW.group_id,
--       set_name = NEW.set_name,
--       abbreviation = NEW.abbreviation,
--       name = NEW.name,
--       clean_name = NEW.clean_name,
--       image_url = NEW.image_url,
--       url = NEW.url,
--       prev_low_price = low_price,
--       prev_mid_price = mid_price,
--       prev_high_price = high_price,
--       prev_market_price = market_price,
--       prev_direct_low_price = direct_low_price,
--       low_price = NEW.low_price,
--       mid_price = NEW.mid_price,
--       high_price = NEW.high_price,
--       market_price = NEW.market_price,
--       direct_low_price = NEW.direct_low_price,
--       prev_date = CURRENT_DATE,
--       updated_at = NOW()
--     WHERE product_id = NEW.product_id AND sub_type_name = NEW.sub_type_name;
    
--     RETURN NULL; -- No insertion needed
--   ELSE
--     -- This is a new record, proceed with insertion
--     RETURN NEW;
--   END IF;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Create a trigger for upserting price_history records
-- CREATE TRIGGER price_history_upsert_trigger
-- BEFORE INSERT ON price_history
-- FOR EACH ROW EXECUTE PROCEDURE handle_price_history_upsert();
