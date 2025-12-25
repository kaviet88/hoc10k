-- Create table to track user lesson progress
CREATE TABLE public.user_lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  program_id text NOT NULL,
  lesson_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id, lesson_id)
);

-- Create table to store course/program metadata for progress calculation
CREATE TABLE public.program_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id text NOT NULL,
  lesson_id text NOT NULL,
  lesson_title text NOT NULL,
  lesson_order integer NOT NULL DEFAULT 0,
  day_number integer,
  duration_minutes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(program_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_lessons ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_lesson_progress
CREATE POLICY "Users can view their own progress"
ON public.user_lesson_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_lesson_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_lesson_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for program_lessons (public read)
CREATE POLICY "Anyone can view program lessons"
ON public.program_lessons
FOR SELECT
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_lesson_progress_updated_at
BEFORE UPDATE ON public.user_lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample lesson data for programs
INSERT INTO public.program_lessons (program_id, lesson_id, lesson_title, lesson_order, day_number, duration_minutes) VALUES
-- Program 1: Tiếng Anh Movers 360 ngày
('1', '1-1', 'Farm animals', 1, 1, 15),
('1', '1-2', 'Countable and Uncountable Nouns', 2, 1, 20),
('1', '1-3', 'Grammar', 3, 1, 15),
('1', '1-4', 'Speaking Practice', 4, 1, 10),
('1', '1-5', 'Mind Map', 5, 2, 15),
('1', '1-6', 'Quiz Day 1-2', 6, 2, 20),
('1', '1-7', 'Colors and Shapes', 7, 3, 15),
('1', '1-8', 'Family Members', 8, 3, 20),
('1', '1-9', 'Daily Routines', 9, 4, 15),
('1', '1-10', 'Review Week 1', 10, 5, 30),

-- Program 2: Toán Tư Duy Lớp 1
('2', '2-1', 'Số đếm 1-10', 1, 1, 20),
('2', '2-2', 'Phép cộng cơ bản', 2, 1, 25),
('2', '2-3', 'Phép trừ cơ bản', 3, 2, 25),
('2', '2-4', 'So sánh số', 4, 2, 20),
('2', '2-5', 'Hình học cơ bản', 5, 3, 20),
('2', '2-6', 'Bài tập tổng hợp', 6, 3, 30),
('2', '2-7', 'Số đếm 11-20', 7, 4, 20),
('2', '2-8', 'Đo lường đơn giản', 8, 4, 25),

-- Program 3: Tiếng Việt Nâng Cao Lớp 2
('3', '3-1', 'Chính tả cơ bản', 1, 1, 20),
('3', '3-2', 'Đọc hiểu văn bản', 2, 1, 25),
('3', '3-3', 'Viết đoạn văn', 3, 2, 30),
('3', '3-4', 'Từ vựng mở rộng', 4, 2, 20),
('3', '3-5', 'Ngữ pháp cơ bản', 5, 3, 25),
('3', '3-6', 'Luyện viết sáng tạo', 6, 3, 30),
('3', '3-7', 'Tập làm văn', 7, 4, 35),
('3', '3-8', 'Ôn tập tuần 1', 8, 5, 30);