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

-- Create a function to populate price data from JSON
CREATE OR REPLACE FUNCTION populate_price_history() RETURNS void AS $$
DECLARE
  json_data JSON;
  group_data JSON;
  product_data JSON;
  price_data JSON;
  price_result JSON;
  price_record JSON;
  current_date DATE := '2025-03-26'::DATE;
BEGIN
  -- Read the JSON data from the file
  json_data := pg_read_file('/Users/ebsan/workspace/tcg-watch/price-history/sv-prices-2025-03-26.json')::JSON;
  
  -- Loop through each group in the array
  FOR group_data IN SELECT * FROM json_array_elements(json_data)
  LOOP
    -- Get the prices file path based on category_id and group_id
    DECLARE
      category_id INTEGER := (group_data->>'categoryId')::INTEGER;
      group_id INTEGER := (group_data->>'groupId')::INTEGER;
      set_name TEXT := group_data->>'name';
      abbreviation TEXT := group_data->>'abbreviation';
      price_file_path TEXT := '/Users/ebsan/workspace/tcg-watch/price-history/2025-03-26/' || category_id || '/' || group_id || '/prices';
    BEGIN
      -- Check if the price file exists
      IF (SELECT EXISTS (SELECT 1 FROM pg_stat_file(price_file_path))) THEN
        -- Read the price data from the file
        price_data := pg_read_file(price_file_path)::JSON;
        
        -- Extract the results array
        price_result := price_data->'results';
        
        -- Loop through each record in the price results array
        FOR price_record IN SELECT * FROM json_array_elements(price_result)
        LOOP
          -- Insert data into the price_history table
          INSERT INTO price_history (
            category_id,
            group_id,
            set_name,
            abbreviation,
            product_id,
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
            (price_record->>'productId')::INTEGER,
            (price_record->>'lowPrice')::DECIMAL,
            (price_record->>'midPrice')::DECIMAL,
            (price_record->>'highPrice')::DECIMAL,
            (price_record->>'marketPrice')::DECIMAL,
            (CASE WHEN price_record->>'directLowPrice' = 'null' THEN NULL ELSE (price_record->>'directLowPrice')::DECIMAL END),
            price_record->>'subTypeName',
            current_date
          )
          ON CONFLICT (product_id, sub_type_name) DO NOTHING;
        END LOOP;
      END IF;
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
