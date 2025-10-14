-- Add personal information fields to sales_reps table
ALTER TABLE sales_reps
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nederland';

-- Add comment for documentation
COMMENT ON COLUMN sales_reps.first_name IS 'First name of the sales representative';
COMMENT ON COLUMN sales_reps.last_name IS 'Last name of the sales representative';
COMMENT ON COLUMN sales_reps.phone_number IS 'Phone number of the sales representative';
COMMENT ON COLUMN sales_reps.street_address IS 'Street address (Dutch: Straatnaam + Huisnummer)';
COMMENT ON COLUMN sales_reps.postal_code IS 'Postal code (Dutch: Postcode)';
COMMENT ON COLUMN sales_reps.city IS 'City (Dutch: Stad)';
COMMENT ON COLUMN sales_reps.country IS 'Country (default: Nederland)';

-- Update existing records to split name into first_name and last_name if needed
UPDATE sales_reps
SET 
  first_name = COALESCE(first_name, SPLIT_PART(name, ' ', 1)),
  last_name = COALESCE(last_name, SUBSTRING(name FROM POSITION(' ' IN name) + 1))
WHERE first_name IS NULL AND name LIKE '% %';

-- For single-word names, put everything in first_name
UPDATE sales_reps
SET first_name = COALESCE(first_name, name)
WHERE first_name IS NULL;
