-- Create orders table to store order information with assigned document data
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  order_name TEXT, -- Optional descriptive name
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'completed', 'cancelled')),
  
  -- Document assignment fields
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  document_parsed_data_id UUID REFERENCES public.document_parsed_data(id) ON DELETE SET NULL,
  
  -- Copied from document_parsed_data when assigned
  parsed_json JSONB, -- Full extracted data from the assigned document
  hts_codes TEXT[], -- Array of HTS codes from the assigned document
  primary_hts_code TEXT, -- Primary HTS code if available
  
  -- Order metadata
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Ensure order_number is unique per user
  CONSTRAINT unique_user_order_number UNIQUE (user_id, order_number)
);

-- Create order_documents junction table to link multiple documents to an order
-- (for cases where an order might have multiple documents)
CREATE TABLE IF NOT EXISTS public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_parsed_data_id UUID REFERENCES public.document_parsed_data(id) ON DELETE SET NULL,
  document_type TEXT, -- 'commercial_invoice', 'packing_list', 'bol', etc.
  is_primary BOOLEAN DEFAULT false, -- Mark the primary document for this order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(order_id, document_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_document_id ON public.orders(document_id);
CREATE INDEX IF NOT EXISTS idx_orders_document_parsed_data_id ON public.orders(document_parsed_data_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON public.order_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_document_id ON public.order_documents(document_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_documents_updated_at
  BEFORE UPDATE ON public.order_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON public.orders FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for order_documents
CREATE POLICY "Users can view order documents for their orders"
  ON public.order_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_documents.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert order documents for their orders"
  ON public.order_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_documents.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can update order documents for their orders"
  ON public.order_documents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_documents.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete order documents for their orders"
  ON public.order_documents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_documents.order_id
    AND orders.user_id = auth.uid()
  ));

-- Grant necessary permissions
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.order_documents TO anon, authenticated;
