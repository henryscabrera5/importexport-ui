-- Create hts_codes reference table to store all HTS code data from USITC
CREATE TABLE IF NOT EXISTS public.hts_codes (
  hts_code TEXT PRIMARY KEY, -- e.g., "0101.21.00"
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add indent column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'indent') THEN
    ALTER TABLE public.hts_codes ADD COLUMN indent INTEGER DEFAULT 0;
  END IF;
  
  -- Add superior column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'superior') THEN
    ALTER TABLE public.hts_codes ADD COLUMN superior BOOLEAN DEFAULT false;
  END IF;
  
  -- Add general column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'general') THEN
    ALTER TABLE public.hts_codes ADD COLUMN general TEXT;
  END IF;
  
  -- Add special column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'special') THEN
    ALTER TABLE public.hts_codes ADD COLUMN special TEXT;
  END IF;
  
  -- Add other column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'other') THEN
    ALTER TABLE public.hts_codes ADD COLUMN other TEXT;
  END IF;
  
  -- Add units column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'units') THEN
    ALTER TABLE public.hts_codes ADD COLUMN units TEXT[];
  END IF;
  
  -- Add footnotes column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'footnotes') THEN
    ALTER TABLE public.hts_codes ADD COLUMN footnotes JSONB;
  END IF;
  
  -- Add quota_quantity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'quota_quantity') THEN
    ALTER TABLE public.hts_codes ADD COLUMN quota_quantity TEXT;
  END IF;
  
  -- Add additional_duties column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'hts_codes' AND column_name = 'additional_duties') THEN
    ALTER TABLE public.hts_codes ADD COLUMN additional_duties TEXT;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_hts_codes_description ON public.hts_codes USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_hts_codes_indent ON public.hts_codes(indent);
CREATE INDEX IF NOT EXISTS idx_hts_codes_superior ON public.hts_codes(superior);

-- Create trigger to automatically update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_hts_codes_updated_at ON public.hts_codes;
CREATE TRIGGER update_hts_codes_updated_at
  BEFORE UPDATE ON public.hts_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (make it public/read-only for all users)
ALTER TABLE public.hts_codes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read hts_codes (read-only reference data)
-- Drop policy if exists, then create
DROP POLICY IF EXISTS "Anyone can view hts codes" ON public.hts_codes;
CREATE POLICY "Anyone can view hts codes"
  ON public.hts_codes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only service role can insert/update/delete (admin operations)
-- This ensures hts_codes are managed by admins only

-- Grant necessary permissions
GRANT SELECT ON public.hts_codes TO anon, authenticated;

