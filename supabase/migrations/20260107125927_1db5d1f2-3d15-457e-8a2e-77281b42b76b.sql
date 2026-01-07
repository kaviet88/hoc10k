-- Add content column to program_lessons table for storing lesson content
ALTER TABLE public.program_lessons 
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN public.program_lessons.content IS 'HTML or markdown content for the lesson';