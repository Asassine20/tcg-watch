

-- Create a function to calculate dollar differences
CREATE OR REPLACE FUNCTION calculate_dollar_differences()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate absolute dollar differences when we have previous prices
    IF NEW.prev_low_price IS NOT NULL THEN
        NEW.dollar_diff_low_price := NEW.low_price - NEW.prev_low_price;
    END IF;
    
    IF NEW.prev_mid_price IS NOT NULL THEN
        NEW.dollar_diff_mid_price := NEW.mid_price - NEW.prev_mid_price;
    END IF;
    
    IF NEW.prev_high_price IS NOT NULL THEN
        NEW.dollar_diff_high_price := NEW.high_price - NEW.prev_high_price;
    END IF;
    
    IF NEW.prev_market_price IS NOT NULL THEN
        NEW.dollar_diff_market_price := NEW.market_price - NEW.prev_market_price;
    END IF;
    
    IF NEW.prev_direct_low_price IS NOT NULL THEN
        NEW.dollar_diff_direct_low_price := NEW.direct_low_price - NEW.prev_direct_low_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate dollar differences
CREATE TRIGGER trigger_calculate_dollar_differences
BEFORE INSERT OR UPDATE ON price_history
FOR EACH ROW
EXECUTE FUNCTION calculate_dollar_differences();

-- Update existing records to populate the new columns
UPDATE price_history
SET 
    dollar_diff_low_price = low_price - prev_low_price,
    dollar_diff_mid_price = mid_price - prev_mid_price,
    dollar_diff_high_price = high_price - prev_high_price,
    dollar_diff_market_price = market_price - prev_market_price,
    dollar_diff_direct_low_price = direct_low_price - prev_direct_low_price
WHERE 
    prev_low_price IS NOT NULL OR
    prev_mid_price IS NOT NULL OR
    prev_high_price IS NOT NULL OR
    prev_market_price IS NOT NULL OR
    prev_direct_low_price IS NOT NULL;

-- Update the latest_prices view to include the new columns
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (product_id, sub_type_name) 
  id,
  category_id,
  group_id,
  set_name,
  abbreviation,
  product_id,
  name,
  clean_name,
  image_url,
  url,
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
  diff_low_price,
  diff_mid_price,
  diff_high_price,
  diff_market_price,
  diff_direct_low_price,
  dollar_diff_low_price,
  dollar_diff_mid_price,
  dollar_diff_high_price,
  dollar_diff_market_price,
  dollar_diff_direct_low_price,
  sub_type_name,
  prev_date,
  created_at,
  updated_at
FROM 
  price_history
ORDER BY 
  product_id, 
  sub_type_name, 
  updated_at DESC;
