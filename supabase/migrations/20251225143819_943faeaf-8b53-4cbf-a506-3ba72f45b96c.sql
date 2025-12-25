-- Create practice tests table
CREATE TABLE public.practice_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user test attempts table
CREATE TABLE public.user_test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_id UUID REFERENCES public.practice_tests(id) ON DELETE CASCADE,
  test_title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  unanswered INTEGER NOT NULL DEFAULT 0,
  score_percent INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in_progress'
);

-- Create user test answers table for detailed tracking
CREATE TABLE public.user_test_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.user_test_attempts(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for practice_tests (public read)
CREATE POLICY "Anyone can view practice tests" 
ON public.practice_tests 
FOR SELECT 
USING (true);

-- RLS policies for user_test_attempts
CREATE POLICY "Users can view their own test attempts" 
ON public.user_test_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test attempts" 
ON public.user_test_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test attempts" 
ON public.user_test_attempts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for user_test_answers
CREATE POLICY "Users can view their own answers" 
ON public.user_test_answers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_test_attempts 
    WHERE id = attempt_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own answers" 
ON public.user_test_answers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_test_attempts 
    WHERE id = attempt_id AND user_id = auth.uid()
  )
);

-- Insert sample practice test
INSERT INTO public.practice_tests (title, description, subject, total_questions, time_limit_minutes)
VALUES 
  ('(VT) Toán VIOEDU 2: Ôn tập hình học', 'Bài kiểm tra ôn tập kiến thức hình học cơ bản', 'Toán', 30, 30),
  ('Tiếng Anh Movers: Vocabulary Test', 'Kiểm tra từ vựng tiếng Anh trình độ Movers', 'Tiếng Anh', 25, 20);