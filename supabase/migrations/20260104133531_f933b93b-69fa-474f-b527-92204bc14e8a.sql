-- Add thumbnail_url column to practice_tests table
ALTER TABLE public.practice_tests 
ADD COLUMN thumbnail_url TEXT DEFAULT NULL;