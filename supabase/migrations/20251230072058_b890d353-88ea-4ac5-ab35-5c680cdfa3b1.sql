-- Function to get quiz questions WITHOUT correct answers
CREATE OR REPLACE FUNCTION public.get_lesson_quiz_questions(
  p_lesson_id text,
  p_program_id text
)
RETURNS TABLE (
  id uuid,
  question text,
  options jsonb,
  question_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, question, options, question_order
  FROM lesson_quizzes
  WHERE lesson_id = p_lesson_id
    AND program_id = p_program_id
  ORDER BY question_order;
$$;

-- Function to check a single quiz answer and return result
CREATE OR REPLACE FUNCTION public.check_lesson_quiz_answer(
  p_question_id uuid,
  p_user_answer integer
)
RETURNS TABLE (
  question_id uuid,
  user_answer integer,
  correct_answer integer,
  is_correct boolean,
  explanation text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    q.id as question_id,
    p_user_answer as user_answer,
    q.correct_answer,
    p_user_answer = q.correct_answer as is_correct,
    q.explanation
  FROM lesson_quizzes q
  WHERE q.id = p_question_id;
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view lesson quizzes" ON public.lesson_quizzes;

-- Create policy for admins only (regular users use secure functions)
CREATE POLICY "Admins can view all quiz data"
ON public.lesson_quizzes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));