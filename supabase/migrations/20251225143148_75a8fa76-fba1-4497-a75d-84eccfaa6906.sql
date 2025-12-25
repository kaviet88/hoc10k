-- Add thumbnail_url column to program_lessons table
ALTER TABLE public.program_lessons 
ADD COLUMN thumbnail_url TEXT;

-- Add sample thumbnails to existing lessons
UPDATE public.program_lessons 
SET thumbnail_url = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop' 
WHERE lesson_order = 1;

UPDATE public.program_lessons 
SET thumbnail_url = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop' 
WHERE lesson_order = 2;

UPDATE public.program_lessons 
SET thumbnail_url = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop' 
WHERE lesson_order > 2;