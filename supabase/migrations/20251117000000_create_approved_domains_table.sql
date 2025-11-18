-- Create approved_domains table to store company-approved email domains
CREATE TABLE IF NOT EXISTS public.approved_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_approved_domains_domain ON public.approved_domains(domain);
CREATE INDEX IF NOT EXISTS idx_approved_domains_active ON public.approved_domains(is_active);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_approved_domains_updated_at ON public.approved_domains;
CREATE TRIGGER update_approved_domains_updated_at
  BEFORE UPDATE ON public.approved_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.approved_domains ENABLE ROW LEVEL SECURITY;

-- Only service role and authenticated admin users can manage approved domains
-- For now, we'll allow service role to manage (this will be restricted further in production)
DROP POLICY IF EXISTS "Service role can manage approved domains" ON public.approved_domains;
CREATE POLICY "Service role can manage approved domains"
  ON public.approved_domains
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read approved domains (needed for signup validation)
DROP POLICY IF EXISTS "Anyone can read approved domains" ON public.approved_domains;
CREATE POLICY "Anyone can read approved domains"
  ON public.approved_domains FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Insert swiftdocks.com as the first approved domain
INSERT INTO public.approved_domains (domain, description, is_active)
VALUES ('swiftdocks.com', 'SwiftDocks company domain', true)
ON CONFLICT (domain) DO NOTHING;

