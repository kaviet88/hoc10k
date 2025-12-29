-- Create purchased_documents table for tracking document purchases
CREATE TABLE public.purchased_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id)
);

-- Enable Row Level Security
ALTER TABLE public.purchased_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for purchased_documents
CREATE POLICY "Users can view their own purchased documents" 
ON public.purchased_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased documents" 
ON public.purchased_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to increment document view count
CREATE OR REPLACE FUNCTION public.increment_document_view(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.documents
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = doc_id;
END;
$$;

-- Create function to increment document download count
CREATE OR REPLACE FUNCTION public.increment_document_download(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.documents
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = doc_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_purchased_documents_user_id ON public.purchased_documents(user_id);
CREATE INDEX idx_purchased_documents_document_id ON public.purchased_documents(document_id);