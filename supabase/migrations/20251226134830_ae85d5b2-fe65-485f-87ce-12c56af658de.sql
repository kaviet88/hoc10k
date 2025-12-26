
-- Fix ambiguous column reference in submit_test_answers function
CREATE OR REPLACE FUNCTION public.submit_test_answers(p_attempt_id uuid, p_answers jsonb)
 RETURNS TABLE(question_number integer, user_answer text, correct_answer text, is_correct boolean, explanation text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Calculate scores with explicit table reference
  SELECT 
    COUNT(*) FILTER (WHERE tr.is_correct = true),
    COUNT(*) FILTER (WHERE tr.is_correct = false AND tr.user_answer != ''),
    COUNT(*) FILTER (WHERE tr.user_answer = '' OR tr.user_answer IS NULL)
  INTO v_correct_count, v_wrong_count, v_unanswered_count
  FROM temp_results tr;

  -- Insert individual answers with explicit table reference
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
  RETURN QUERY SELECT tr.question_number, tr.user_answer, tr.correct_answer, tr.is_correct, tr.explanation FROM temp_results tr;
END;
$function$;
