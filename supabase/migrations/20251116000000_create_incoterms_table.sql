-- Create incoterms table
CREATE TABLE IF NOT EXISTS public.incoterms (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description_short TEXT,
  transport_mode TEXT DEFAULT 'any',
  includes_pre_carriage BOOLEAN DEFAULT false,
  includes_main_carriage BOOLEAN DEFAULT false,
  includes_insurance BOOLEAN DEFAULT false,
  includes_export_clearance BOOLEAN DEFAULT false,
  includes_import_clearance BOOLEAN DEFAULT false,
  includes_duties_taxes BOOLEAN DEFAULT false,
  valuation_basis TEXT,
  risk_transfer_point TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_incoterms_name ON public.incoterms(name);

-- Create index on transport_mode for filtering
CREATE INDEX IF NOT EXISTS idx_incoterms_transport_mode ON public.incoterms(transport_mode);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_incoterms_updated_at
  BEFORE UPDATE ON public.incoterms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (make it public/read-only for all authenticated users)
ALTER TABLE public.incoterms ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read incoterms (read-only reference data)
CREATE POLICY "Anyone can view incoterms"
  ON public.incoterms FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only service role can insert/update/delete (admin operations)
-- This ensures incoterms are managed by admins only

-- Grant necessary permissions
GRANT SELECT ON public.incoterms TO anon, authenticated;

