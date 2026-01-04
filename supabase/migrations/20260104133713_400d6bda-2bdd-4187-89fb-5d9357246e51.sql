-- Create storage bucket for exam thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-thumbnails', 'exam-thumbnails', true);

-- Allow anyone to view exam thumbnails (public bucket)
CREATE POLICY "Anyone can view exam thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'exam-thumbnails');

-- Allow admins to upload exam thumbnails
CREATE POLICY "Admins can upload exam thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exam-thumbnails' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update exam thumbnails
CREATE POLICY "Admins can update exam thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exam-thumbnails'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete exam thumbnails
CREATE POLICY "Admins can delete exam thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exam-thumbnails'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);