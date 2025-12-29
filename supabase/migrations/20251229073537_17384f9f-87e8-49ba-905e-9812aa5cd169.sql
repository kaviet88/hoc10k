-- Add price column to purchased_documents table
ALTER TABLE public.purchased_documents 
ADD COLUMN price integer NOT NULL DEFAULT 0;