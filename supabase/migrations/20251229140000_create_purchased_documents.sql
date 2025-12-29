-- Create purchased_documents table to track user's document purchases
CREATE TABLE IF NOT EXISTS public.purchased_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    price INTEGER DEFAULT 0,
    payment_method TEXT,
    UNIQUE(user_id, document_id)
);

-- Enable Row Level Security
ALTER TABLE public.purchased_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchased documents" ON public.purchased_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchased_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all purchases" ON public.purchased_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchased_documents_user_id ON public.purchased_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_documents_document_id ON public.purchased_documents(document_id);

-- Create function to increment document view count
CREATE OR REPLACE FUNCTION public.increment_document_view(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.documents
    SET view_count = view_count + 1
    WHERE id = doc_id;
END;
$$;

-- Create function to increment document download count
CREATE OR REPLACE FUNCTION public.increment_document_download(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.documents
    SET download_count = download_count + 1
    WHERE id = doc_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_document_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_document_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_document_download(UUID) TO authenticated;

