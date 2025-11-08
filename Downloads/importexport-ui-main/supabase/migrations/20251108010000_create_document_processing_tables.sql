-- Create documents table to store uploaded file metadata
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT, -- URL to stored file in Supabase Storage
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed')),
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create shipments table to store shipment information
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_number TEXT UNIQUE,
  origin_country TEXT,
  origin_city TEXT,
  destination_country TEXT,
  destination_city TEXT,
  carrier TEXT,
  container_number TEXT,
  vessel_name TEXT,
  estimated_arrival_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_transit', 'customs_clearance', 'delivered', 'cancelled')),
  total_value DECIMAL(12, 2),
  total_weight DECIMAL(10, 2),
  weight_unit TEXT DEFAULT 'kg',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create products table to store product/item information from documents
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_of_measure TEXT, -- e.g., 'pcs', 'kg', 'm', 'L'
  unit_price DECIMAL(12, 2),
  total_price DECIMAL(12, 2),
  weight DECIMAL(10, 2),
  weight_unit TEXT DEFAULT 'kg',
  country_of_origin TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create hts_classifications table to store HTS code classifications
CREATE TABLE IF NOT EXISTS public.hts_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  hts_code TEXT NOT NULL,
  hts_description TEXT,
  confidence_score DECIMAL(5, 2), -- AI confidence score (0-100)
  classification_method TEXT, -- 'ai', 'manual', 'suggested'
  duty_rate DECIMAL(8, 4), -- Percentage duty rate
  duty_rate_type TEXT, -- 'ad_valorem', 'specific', 'compound'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create duty_calculations table to store calculated duty information
CREATE TABLE IF NOT EXISTS public.duty_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  hts_classification_id UUID REFERENCES public.hts_classifications(id) ON DELETE SET NULL,
  base_duty_amount DECIMAL(12, 2),
  additional_duties DECIMAL(12, 2), -- Anti-dumping, countervailing, etc.
  total_duty_amount DECIMAL(12, 2),
  effective_duty_rate DECIMAL(8, 4),
  trade_agreement TEXT, -- e.g., 'USMCA', 'FTA', 'GSP'
  trade_agreement_benefit DECIMAL(12, 2), -- Savings from trade agreement
  calculation_date DATE DEFAULT CURRENT_DATE,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create document_parsed_data table to store raw parsed data from AI
CREATE TABLE IF NOT EXISTS public.document_parsed_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  parsed_json JSONB, -- Store the full parsed JSON from AI
  extraction_confidence DECIMAL(5, 2), -- Overall confidence score
  extraction_method TEXT, -- 'ocr', 'ai_vision', 'structured_data'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_number ON public.shipments(shipment_number);
CREATE INDEX IF NOT EXISTS idx_products_shipment_id ON public.products(shipment_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_document_id ON public.products(document_id);
CREATE INDEX IF NOT EXISTS idx_hts_classifications_product_id ON public.hts_classifications(product_id);
CREATE INDEX IF NOT EXISTS idx_hts_classifications_hts_code ON public.hts_classifications(hts_code);
CREATE INDEX IF NOT EXISTS idx_duty_calculations_shipment_id ON public.duty_calculations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_duty_calculations_product_id ON public.duty_calculations(product_id);
CREATE INDEX IF NOT EXISTS idx_document_parsed_data_document_id ON public.document_parsed_data(document_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hts_classifications_updated_at
  BEFORE UPDATE ON public.hts_classifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duty_calculations_updated_at
  BEFORE UPDATE ON public.duty_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_parsed_data_updated_at
  BEFORE UPDATE ON public.document_parsed_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hts_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_parsed_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for shipments
CREATE POLICY "Users can view their own shipments"
  ON public.shipments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipments"
  ON public.shipments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipments"
  ON public.shipments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shipments"
  ON public.shipments FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for products
CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for hts_classifications
CREATE POLICY "Users can view their own hts classifications"
  ON public.hts_classifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = hts_classifications.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own hts classifications"
  ON public.hts_classifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = hts_classifications.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own hts classifications"
  ON public.hts_classifications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = hts_classifications.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own hts classifications"
  ON public.hts_classifications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = hts_classifications.product_id
    AND products.user_id = auth.uid()
  ));

-- Create RLS policies for duty_calculations
CREATE POLICY "Users can view their own duty calculations"
  ON public.duty_calculations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shipments
    WHERE shipments.id = duty_calculations.shipment_id
    AND shipments.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own duty calculations"
  ON public.duty_calculations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shipments
    WHERE shipments.id = duty_calculations.shipment_id
    AND shipments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own duty calculations"
  ON public.duty_calculations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.shipments
    WHERE shipments.id = duty_calculations.shipment_id
    AND shipments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own duty calculations"
  ON public.duty_calculations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.shipments
    WHERE shipments.id = duty_calculations.shipment_id
    AND shipments.user_id = auth.uid()
  ));

-- Create RLS policies for document_parsed_data
CREATE POLICY "Users can view their own parsed data"
  ON public.document_parsed_data FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.documents
    WHERE documents.id = document_parsed_data.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own parsed data"
  ON public.document_parsed_data FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents
    WHERE documents.id = document_parsed_data.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own parsed data"
  ON public.document_parsed_data FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.documents
    WHERE documents.id = document_parsed_data.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own parsed data"
  ON public.document_parsed_data FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.documents
    WHERE documents.id = document_parsed_data.document_id
    AND documents.user_id = auth.uid()
  ));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.documents TO anon, authenticated;
GRANT ALL ON public.shipments TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.hts_classifications TO anon, authenticated;
GRANT ALL ON public.duty_calculations TO anon, authenticated;
GRANT ALL ON public.document_parsed_data TO anon, authenticated;

