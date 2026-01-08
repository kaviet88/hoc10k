-- Create storage bucket for lesson content videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-content', 'lesson-content', true);

-- Allow anyone to view lesson content (public bucket)
CREATE POLICY "Anyone can view lesson content"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-content');

-- Allow admins to upload lesson content
CREATE POLICY "Admins can upload lesson content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update lesson content
CREATE POLICY "Admins can update lesson content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete lesson content
CREATE POLICY "Admins can delete lesson content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);