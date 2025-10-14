-- Delete all sales reps except 4 (2 qualified, 2 unqualified)
-- Run this in Supabase SQL Editor

-- Delete all reps except the ones we want to keep
DELETE FROM sales_reps
WHERE email NOT IN (
  'john.smith@example.com',      -- Qualified 1
  'sarah.johnson@example.com',   -- Qualified 2
  'chris.anderson@example.com',  -- Unqualified 1
  'lauren.thomas@example.com'    -- Unqualified 2
);

-- Verify what's left
SELECT * FROM sales_reps ORDER BY qualification_status, name;
