-- Add additional columns to practice_tests for exam features
ALTER TABLE public.practice_tests 
ADD COLUMN IF NOT EXISTS grade INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Trung bình',
ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'school',
ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Insert sample exams for each grade and subject
INSERT INTO public.practice_tests (title, subject, grade, difficulty, exam_type, time_limit_minutes, total_questions, participant_count, rating, is_premium) VALUES
-- Lớp 1 - Toán
('TIMO Toán học Lớp 1 - Đề 1', 'math', 1, 'Dễ', 'timo', 30, 20, 2345, 4.8, false),
('VioEdu Toán học Lớp 1 - Đề 1', 'math', 1, 'Dễ', 'vioedu', 30, 25, 3456, 4.6, false),
('HKIMO Toán học Lớp 1 - Đề 1', 'math', 1, 'Trung bình', 'hkimo', 45, 30, 1234, 4.7, false),
('Đề trường Toán học Lớp 1 - Đề 1', 'math', 1, 'Dễ', 'school', 40, 20, 4567, 4.5, false),
('TIMO Toán học Lớp 1 - Đề 2', 'math', 1, 'Trung bình', 'timo', 35, 25, 1890, 4.9, true),

-- Lớp 1 - Tiếng Việt
('Trạng Nguyên Tiếng Việt Lớp 1 - Đề 1', 'vietnamese', 1, 'Dễ', 'trang-nguyen', 30, 20, 2890, 4.7, false),
('VioEdu Tiếng Việt Lớp 1 - Đề 1', 'vietnamese', 1, 'Dễ', 'vioedu', 25, 20, 3120, 4.5, false),
('Đề trường Tiếng Việt Lớp 1 - Đề 1', 'vietnamese', 1, 'Trung bình', 'school', 35, 25, 2340, 4.6, false),

-- Lớp 1 - Tiếng Anh
('Cambridge Tiếng Anh Lớp 1 - Đề 1', 'english', 1, 'Dễ', 'cambridge', 30, 20, 1567, 4.8, false),
('VioEdu Tiếng Anh Lớp 1 - Đề 1', 'english', 1, 'Trung bình', 'vioedu', 35, 25, 2345, 4.6, true),

-- Lớp 2 - Toán
('TIMO Toán học Lớp 2 - Đề 1', 'math', 2, 'Dễ', 'timo', 35, 25, 3456, 4.7, false),
('VioEdu Toán học Lớp 2 - Đề 1', 'math', 2, 'Trung bình', 'vioedu', 40, 30, 4567, 4.8, false),
('HKIMO Toán học Lớp 2 - Đề 1', 'math', 2, 'Khó', 'hkimo', 50, 35, 1234, 4.9, true),
('Đề trường Toán học Lớp 2 - Đề 1', 'math', 2, 'Dễ', 'school', 35, 25, 5678, 4.5, false),

-- Lớp 2 - Tiếng Việt
('Trạng Nguyên Tiếng Việt Lớp 2 - Đề 1', 'vietnamese', 2, 'Trung bình', 'trang-nguyen', 35, 25, 2345, 4.6, false),
('VioEdu Tiếng Việt Lớp 2 - Đề 1', 'vietnamese', 2, 'Dễ', 'vioedu', 30, 20, 3456, 4.7, false),

-- Lớp 3 - Toán
('TIMO Toán học Lớp 3 - Đề 1', 'math', 3, 'Trung bình', 'timo', 40, 30, 2890, 4.8, false),
('VioEdu Toán học Lớp 3 - Đề 1', 'math', 3, 'Dễ', 'vioedu', 35, 25, 4123, 4.6, false),
('HKIMO Toán học Lớp 3 - Đề 1', 'math', 3, 'Khó', 'hkimo', 55, 40, 1567, 4.9, true),

-- Lớp 4 - Toán
('TIMO Toán học Lớp 4 - Đề 1', 'math', 4, 'Trung bình', 'timo', 45, 35, 2345, 4.7, false),
('VioEdu Toán học Lớp 4 - Đề 1', 'math', 4, 'Khó', 'vioedu', 50, 40, 3456, 4.8, true),

-- Lớp 5 - Toán
('TIMO Toán học Lớp 5 - Đề 1', 'math', 5, 'Khó', 'timo', 50, 40, 1890, 4.9, false),
('VioEdu Toán học Lớp 5 - Đề 1', 'math', 5, 'Trung bình', 'vioedu', 45, 35, 2678, 4.7, false),
('HKIMO Toán học Lớp 5 - Đề 1', 'math', 5, 'Khó', 'hkimo', 60, 45, 1234, 4.9, true);

-- Update participant counts to be more realistic (increment when someone takes the test)
CREATE OR REPLACE FUNCTION public.increment_exam_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.practice_tests 
  SET participant_count = participant_count + 1 
  WHERE id = NEW.test_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to increment participant count on new attempt
DROP TRIGGER IF EXISTS on_test_attempt_increment_participants ON public.user_test_attempts;
CREATE TRIGGER on_test_attempt_increment_participants
  AFTER INSERT ON public.user_test_attempts
  FOR EACH ROW
  WHEN (NEW.test_id IS NOT NULL)
  EXECUTE FUNCTION public.increment_exam_participants();