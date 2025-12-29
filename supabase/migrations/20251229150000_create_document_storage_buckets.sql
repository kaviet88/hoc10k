-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for document thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-thumbnails',
  'document-thumbnails',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Policies for documents bucket
-- Allow anyone to view/download documents (public bucket)
CREATE POLICY "Public can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- Allow admins to update documents
CREATE POLICY "Admins can update documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete documents
CREATE POLICY "Admins can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for document-thumbnails bucket
-- Allow anyone to view thumbnails (public bucket)
CREATE POLICY "Public can view document thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'document-thumbnails');

-- Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload document thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-thumbnails'
    AND auth.role() = 'authenticated'
  );

-- Allow admins to update thumbnails
CREATE POLICY "Admins can update document thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'document-thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete thumbnails
CREATE POLICY "Admins can delete document thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

