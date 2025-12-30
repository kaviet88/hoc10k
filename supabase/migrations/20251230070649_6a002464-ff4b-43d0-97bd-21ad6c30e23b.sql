-- Fix storage security: Make documents bucket private and add proper access policies

-- 1. Update the documents bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- 2. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

-- 3. Create policy for admins to manage all files in documents bucket
CREATE POLICY "Admins can manage document files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'documents' 
  AND public.has_role(auth.uid(), 'admin')
);

-- 4. Create policy for authenticated users to upload documents (if needed for user uploads)
-- For now, only admins can upload, so this is handled by the admin policy above

-- 5. Create a function to generate signed URLs for authorized document access
CREATE OR REPLACE FUNCTION public.get_document_signed_url(p_document_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_file_url text;
  v_is_free boolean;
  v_user_id uuid;
  v_has_purchased boolean;
  v_file_path text;
  v_signed_url text;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  -- Get document info
  SELECT file_url, is_free INTO v_file_url, v_is_free
  FROM public.documents
  WHERE id = p_document_id AND is_published = true;
  
  IF v_file_url IS NULL THEN
    RAISE EXCEPTION 'Document not found or not published';
  END IF;
  
  -- Check if document is free
  IF v_is_free = true THEN
    -- Free documents are accessible without login, but we still generate signed URL
    -- Extract file path from URL
    v_file_path := regexp_replace(v_file_url, '^.*/documents/', '');
    RETURN v_file_path;  -- Will be used by edge function to generate signed URL
  END IF;
  
  -- For paid documents, user must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if user has purchased this document
  SELECT EXISTS (
    SELECT 1 FROM public.purchased_documents
    WHERE user_id = v_user_id AND document_id = p_document_id
  ) INTO v_has_purchased;
  
  IF NOT v_has_purchased THEN
    RAISE EXCEPTION 'Document not purchased';
  END IF;
  
  -- Extract file path from URL for signed URL generation
  v_file_path := regexp_replace(v_file_url, '^.*/documents/', '');
  
  RETURN v_file_path;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_document_signed_url(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_document_signed_url(uuid) TO anon;