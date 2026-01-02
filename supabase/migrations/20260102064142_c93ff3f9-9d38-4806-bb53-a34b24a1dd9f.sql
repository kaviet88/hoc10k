-- Add video_url column to lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url TEXT;