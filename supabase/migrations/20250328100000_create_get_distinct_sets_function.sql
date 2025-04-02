-- Create a function to get distinct sets
CREATE OR REPLACE FUNCTION get_distinct_sets()
RETURNS TABLE (
  group_id INTEGER,
  set_name TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT DISTINCT group_id, set_name
  FROM price_history
  WHERE group_id IS NOT NULL AND set_name IS NOT NULL
  ORDER BY set_name;
$$;