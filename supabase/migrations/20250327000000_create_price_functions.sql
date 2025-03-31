-- Function to get distinct group_ids from price_history
CREATE OR REPLACE FUNCTION get_distinct_group_ids()
RETURNS TABLE (group_id INTEGER) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT DISTINCT ph.group_id 
  FROM price_history ph
  WHERE ph.group_id IS NOT NULL
  ORDER BY ph.group_id;
$$;

-- Function to get products by group_id
CREATE OR REPLACE FUNCTION get_products_by_group_id(p_group_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  product_id INTEGER,
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
  group_id INTEGER,
  set_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    ph.id,
    ph.product_id,
    ph.name,
    ph.clean_name,
    ph.image_url,
    ph.url,
    ph.low_price,
    ph.mid_price,
    ph.high_price,
    ph.market_price,
    ph.direct_low_price,
    ph.prev_low_price,
    ph.prev_mid_price,
    ph.prev_high_price,
    ph.prev_market_price,
    ph.prev_direct_low_price,
    ph.group_id,
    ph.set_name
  FROM price_history ph
  WHERE ph.group_id = p_group_id
  ORDER BY ph.product_id;
$$;

-- Function to update prices by product ID
CREATE OR REPLACE FUNCTION update_product_prices(
  p_id INTEGER,
  p_new_low_price DECIMAL,
  p_new_mid_price DECIMAL,
  p_new_high_price DECIMAL,
  p_new_market_price DECIMAL,
  p_new_direct_low_price DECIMAL,
  p_prev_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE price_history
  SET 
    prev_low_price = low_price,
    prev_mid_price = mid_price,
    prev_high_price = high_price,
    prev_market_price = market_price,
    prev_direct_low_price = direct_low_price,
    low_price = p_new_low_price,
    mid_price = p_new_mid_price,
    high_price = p_new_high_price,
    market_price = p_new_market_price,
    direct_low_price = p_new_direct_low_price,
    prev_date = p_prev_date,
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;
```
