-- Create practice test questions table
CREATE TABLE public.practice_test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.practice_tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  audio_url TEXT,
  listening_blanks JSONB,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_question_type CHECK (question_type IN ('multiple_choice', 'fill_blank', 'dropdown', 'listening'))
);

-- Create index for faster queries
CREATE INDEX idx_practice_test_questions_test_id ON public.practice_test_questions(test_id);
CREATE INDEX idx_practice_test_questions_number ON public.practice_test_questions(test_id, question_number);

-- Enable RLS
ALTER TABLE public.practice_test_questions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view practice test questions"
ON public.practice_test_questions
FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "Admins can insert questions"
ON public.practice_test_questions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update questions"
ON public.practice_test_questions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
ON public.practice_test_questions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));