-- Create hts_codes_table with the correct columns
-- This matches the CSV structure: HTS Number, Indent, Description, Unit of Quantity, 
-- General Rate of Duty, Special Rate of Duty, Column 2 Rate of Duty, Quota Quantity, Additional Duties

DROP TABLE IF EXISTS public.hts_codes_table CASCADE;

CREATE TABLE public.hts_codes_table (
  hts_number TEXT PRIMARY KEY,
  indent INTEGER DEFAULT 0,
  description TEXT,
  unit_of_quantity TEXT,
  general_rate_of_duty TEXT,
  special_rate_of_duty TEXT,
  column_2_rate_of_duty TEXT,
  quota_quantity TEXT,
  additional_duties TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hts_codes_hts_number ON public.hts_codes_table(hts_number);

-- Enable Row Level Security
ALTER TABLE public.hts_codes_table ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read hts_codes (read-only reference data)
DROP POLICY IF EXISTS "Anyone can view hts codes" ON public.hts_codes_table;
CREATE POLICY "Anyone can view hts codes"
  ON public.hts_codes_table FOR SELECT
  TO authenticated, anon
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.hts_codes_table TO anon, authenticated;

