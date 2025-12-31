-- Add video_url column to lessons table
-- Run this in Supabase SQL Editor if you get errors saving lessons with video URLs

-- Add video_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'lessons'
    AND column_name = 'video_url'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN video_url TEXT;
    RAISE NOTICE 'Added video_url column to lessons table';
  ELSE
    RAISE NOTICE 'video_url column already exists in lessons table';
  END IF;
END
$$;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'lessons'
ORDER BY ordinal_position;

