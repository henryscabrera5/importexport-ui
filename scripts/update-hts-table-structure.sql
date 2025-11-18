-- Drop and recreate hts_codes table with new column structure
-- Run this in Supabase Dashboard -> SQL Editor

BEGIN;

-- Drop the entire table (this will remove all columns and data)
DROP TABLE IF EXISTS public.hts_codes CASCADE;

-- Recreate table with new column names
CREATE TABLE public.hts_codes (
  hts_number TEXT PRIMARY KEY,  -- HTS Number
  indent INTEGER DEFAULT 0,  -- Indent
  description TEXT NOT NULL,  -- Description
  unit_of_quantity TEXT[],  -- Unit of Quantity
  general_rate_of_duty TEXT,  -- General Rate of Duty
  special_rate_of_duty TEXT,  -- Special Rate of Duty
  column_2_rate_of_duty TEXT,  -- Column 2 Rate of Duty
  quota_quantity TEXT,  -- Quota Quantity
  additional_duties TEXT,  -- Additional Duties
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add column comments for display names in Supabase Dashboard
COMMENT ON COLUMN public.hts_codes.hts_number IS 'HTS Number';
COMMENT ON COLUMN public.hts_codes.indent IS 'Indent';
COMMENT ON COLUMN public.hts_codes.description IS 'Description';
COMMENT ON COLUMN public.hts_codes.unit_of_quantity IS 'Unit of Quantity';
COMMENT ON COLUMN public.hts_codes.general_rate_of_duty IS 'General Rate of Duty';
COMMENT ON COLUMN public.hts_codes.special_rate_of_duty IS 'Special Rate of Duty';
COMMENT ON COLUMN public.hts_codes.column_2_rate_of_duty IS 'Column 2 Rate of Duty';
COMMENT ON COLUMN public.hts_codes.quota_quantity IS 'Quota Quantity';
COMMENT ON COLUMN public.hts_codes.additional_duties IS 'Additional Duties';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_hts_codes_description ON public.hts_codes USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_hts_codes_indent ON public.hts_codes(indent);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_hts_codes_updated_at
  BEFORE UPDATE ON public.hts_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.hts_codes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read hts_codes (read-only reference data)
CREATE POLICY "Anyone can view hts codes"
  ON public.hts_codes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.hts_codes TO anon, authenticated;

COMMIT;

