-- Create price_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  category_id INTEGER,
  group_id INTEGER,
  set_name TEXT,
  abbreviation TEXT,
  product_id INTEGER NOT NULL,
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

-- Create a function to populate price data directly from JSON
CREATE OR REPLACE FUNCTION populate_price_history() RETURNS void AS $$
DECLARE
  json_data JSON;
  group_data JSON;
  product_data JSON;
  current_date DATE := '2025-03-26'::DATE;
BEGIN
  -- Read the JSON data from the file
  json_data := pg_read_file('/Users/ebsan/workspace/tcg-watch/price-history/sv-prices-2025-03-26.json')::JSON;
  
  -- Loop through each group in the array
  FOR group_data IN SELECT * FROM json_array_elements(json_data)
  LOOP
    DECLARE
      category_id INTEGER := (group_data->>'categoryId')::INTEGER;
      group_id INTEGER := (group_data->>'groupId')::INTEGER;
      set_name TEXT := group_data->>'name';
      abbreviation TEXT := group_data->>'abbreviation';
      products_array JSON := group_data->'products';
    BEGIN
      -- Loop through each product in the group's products array
      FOR product_data IN SELECT * FROM json_array_elements(products_array)
      LOOP        
        DECLARE
          product_id INTEGER := (product_data->>'productId')::INTEGER;
          prev_low_price DECIMAL := (product_data->>'lowPrice')::DECIMAL;
          prev_mid_price DECIMAL := (product_data->>'midPrice')::DECIMAL;
          prev_high_price DECIMAL := (product_data->>'highPrice')::DECIMAL;
          prev_market_price DECIMAL := (product_data->>'marketPrice')::DECIMAL;
          prev_direct_low_price DECIMAL := (product_data->>'directLowPrice')::DECIMAL;
          sub_type_name TEXT := product_data->>'subTypeName';
        BEGIN
          -- Insert data into the price_history table
          INSERT INTO price_history (
            category_id,
            group_id,
            set_name,
            abbreviation,
            product_id,
            -- Since we'll populate this with API calls,
            -- we're using NULL for the current prices
            low_price,
            mid_price,
            high_price,
            market_price,
            direct_low_price,
            prev_low_price,
            prev_mid_price,
            prev_high_price,
            prev_market_price,
            prev_direct_low_price,
            sub_type_name,
            prev_date
          ) VALUES (
            category_id,
            group_id,
            set_name,
            abbreviation,
            product_id,
            NULL, -- low_price
            NULL, -- mid_price
            NULL, -- high_price
            NULL, -- market_price
            NULL, -- direct_low_price
            prev_low_price,
            prev_mid_price,
            prev_high_price,
            prev_market_price,
            prev_direct_low_price,
            sub_type_name,
            current_date
          )
          ON CONFLICT (product_id, sub_type_name) DO NOTHING;
        END;
      END LOOP;
    END;
  END LOOP;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'An error occurred: %', SQLERRM;

END;
$$ LANGUAGE plpgsql;

-- Run the function to populate the data
SELECT populate_price_history();

-- Drop the function after use
DROP FUNCTION populate_price_history();

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
