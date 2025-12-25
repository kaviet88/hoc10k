-- Create a secure function to get practice test questions WITHOUT correct answers
-- This prevents students from seeing answers before submitting

CREATE OR REPLACE FUNCTION public.get_practice_questions(p_test_id uuid)
RETURNS TABLE (
  id uuid,
  question_number integer,
  question_text text,
  question_type text,
  options jsonb,
  audio_url text,
  listening_blanks jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    question_number,
    question_text,
    question_type,
    options,
    audio_url,
    listening_blanks
  FROM practice_test_questions
  WHERE test_id = p_test_id
  ORDER BY question_number;
$$;

-- Create a secure function to submit test and get results with correct answers
CREATE OR REPLACE FUNCTION public.submit_test_answers(
  p_attempt_id uuid,
  p_answers jsonb -- Array of {question_number: number, user_answer: string}
)
RETURNS TABLE (
  question_number integer,
  user_answer text,
  correct_answer text,
  is_correct boolean,
  explanation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id uuid;
  v_user_id uuid;
  v_correct_count integer := 0;
  v_wrong_count integer := 0;
  v_unanswered_count integer := 0;
  v_total_questions integer;
  v_time_spent integer;
  v_answer jsonb;
BEGIN
  -- Get the attempt details and verify ownership
  SELECT test_id, user_id, 
         EXTRACT(EPOCH FROM (now() - started_at))::integer
  INTO v_test_id, v_user_id, v_time_spent
  FROM user_test_attempts
  WHERE id = p_attempt_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only submit your own test';
  END IF;

  -- Get total questions
  SELECT COUNT(*) INTO v_total_questions
  FROM practice_test_questions
  WHERE test_id = v_test_id;

  -- Create temp table to store results
  CREATE TEMP TABLE temp_results ON COMMIT DROP AS
  SELECT 
    ptq.question_number,
    COALESCE((
      SELECT ans->>'user_answer'
      FROM jsonb_array_elements(p_answers) ans
      WHERE (ans->>'question_number')::integer = ptq.question_number
    ), '') as user_answer,
    ptq.correct_answer,
    COALESCE((
      SELECT ans->>'user_answer'
      FROM jsonb_array_elements(p_answers) ans
      WHERE (ans->>'question_number')::integer = ptq.question_number
    ), '') = ptq.correct_answer as is_correct,
    ptq.explanation
  FROM practice_test_questions ptq
  WHERE ptq.test_id = v_test_id
  ORDER BY ptq.question_number;

  -- Calculate scores
  SELECT 
    COUNT(*) FILTER (WHERE is_correct = true),
    COUNT(*) FILTER (WHERE is_correct = false AND user_answer != ''),
    COUNT(*) FILTER (WHERE user_answer = '' OR user_answer IS NULL)
  INTO v_correct_count, v_wrong_count, v_unanswered_count
  FROM temp_results;

  -- Insert individual answers
  INSERT INTO user_test_answers (attempt_id, question_number, user_answer, correct_answer, is_correct)
  SELECT p_attempt_id, tr.question_number, NULLIF(tr.user_answer, ''), tr.correct_answer, tr.is_correct
  FROM temp_results tr;

  -- Update the attempt with final scores
  UPDATE user_test_attempts
  SET 
    correct_answers = v_correct_count,
    wrong_answers = v_wrong_count,
    unanswered = v_unanswered_count,
    score_percent = CASE WHEN v_total_questions > 0 
      THEN ROUND((v_correct_count::numeric / v_total_questions) * 100)
      ELSE 0 END,
    time_spent_seconds = v_time_spent,
    completed_at = now(),
    status = 'completed'
  WHERE id = p_attempt_id;

  -- Return results with correct answers
  RETURN QUERY SELECT * FROM temp_results;
END;
$$;

-- Update RLS policy to prevent direct SELECT of correct_answer
-- Drop the old policy
DROP POLICY IF EXISTS "Anyone can view practice test questions" ON public.practice_test_questions;

-- Create a restrictive policy that only allows admins to see full data
-- Regular users must use the get_practice_questions function
CREATE POLICY "Admins can view all question data" 
ON public.practice_test_questions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to see questions (they'll use the secure function instead)
-- This is a fallback but the function is preferred
CREATE POLICY "Users can view questions without answers via function"
ON public.practice_test_questions
FOR SELECT
USING (
  -- Only allow if user has a completed attempt for this test
  EXISTS (
    SELECT 1 FROM user_test_attempts uta
    WHERE uta.test_id = practice_test_questions.test_id
      AND uta.user_id = auth.uid()
      AND uta.status = 'completed'
  )
);