-- Add video_url column to program_lessons table
ALTER TABLE public.program_lessons 
ADD COLUMN video_url TEXT;

-- Add some sample video URLs to existing lessons
UPDATE public.program_lessons 
SET video_url = 'https://www.w3schools.com/html/mov_bbb.mp4' 
WHERE lesson_order = 1;

UPDATE public.program_lessons 
SET video_url = 'https://www.w3schools.com/html/movie.mp4' 
WHERE lesson_order = 2;

UPDATE public.program_lessons 
SET video_url = 'https://www.w3schools.com/html/mov_bbb.mp4' 
WHERE lesson_order > 2;