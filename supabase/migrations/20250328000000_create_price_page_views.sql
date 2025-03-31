-- Create a view for the most recent prices
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

-- Create a function to get paginated card data with filters
CREATE OR REPLACE FUNCTION get_paginated_cards(
  p_page INTEGER,
  p_page_size INTEGER,
  p_search TEXT DEFAULT NULL,
  p_set_id INTEGER DEFAULT NULL,
  p_sort_column TEXT DEFAULT 'market_price',
  p_sort_direction TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id INTEGER,
  category_id INTEGER,
  group_id INTEGER,
  set_name TEXT,
  abbreviation TEXT,
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
  diff_low_price DECIMAL,
  diff_mid_price DECIMAL,
  diff_high_price DECIMAL,
  diff_market_price DECIMAL,
  diff_direct_low_price DECIMAL,
  sub_type_name TEXT,
  prev_date DATE,
  total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset INTEGER;
  v_limit INTEGER;
  v_query TEXT;
  v_count_query TEXT;
  v_where_clause TEXT := '';
  v_order_clause TEXT;
  v_params TEXT[] := ARRAY[]::TEXT[];
  v_param_count INTEGER := 0;
BEGIN
  -- Calculate pagination values
  v_offset := (p_page - 1) * p_page_size;
  v_limit := p_page_size;
  
  -- Build WHERE clause for filters
  IF p_search IS NOT NULL AND p_search <> '' THEN
    v_param_count := v_param_count + 1;
    v_where_clause := v_where_clause || ' AND name ILIKE ''%' || p_search || '%''';
  END IF;
  
  IF p_set_id IS NOT NULL THEN
    v_param_count := v_param_count + 1;
    v_where_clause := v_where_clause || ' AND group_id = ' || p_set_id;
  END IF;
  
  -- Add WHERE clause if any filters were applied
  IF v_where_clause <> '' THEN
    v_where_clause := ' WHERE ' || substring(v_where_clause, 6); -- Remove initial ' AND '
  END IF;
  
  -- Build ORDER BY clause
  CASE p_sort_column
    WHEN 'name' THEN v_order_clause := ' ORDER BY name';
    WHEN 'set_name' THEN v_order_clause := ' ORDER BY set_name';
    WHEN 'market_price' THEN v_order_clause := ' ORDER BY market_price';
    WHEN 'diff_market_price' THEN v_order_clause := ' ORDER BY diff_market_price';
    WHEN 'updated_at' THEN v_order_clause := ' ORDER BY updated_at';
    ELSE v_order_clause := ' ORDER BY market_price';
  END CASE;
  
  IF p_sort_direction = 'asc' THEN
    v_order_clause := v_order_clause || ' ASC NULLS FIRST';
  ELSE
    v_order_clause := v_order_clause || ' DESC NULLS LAST';
  END IF;
  
  -- Build the query
  v_query := 'SELECT *, COUNT(*) OVER() AS total_count FROM latest_prices' || 
             v_where_clause || 
             v_order_clause || 
             ' LIMIT ' || v_limit || 
             ' OFFSET ' || v_offset;
  
  -- Execute the query
  RETURN QUERY EXECUTE v_query;
END;
$$;
