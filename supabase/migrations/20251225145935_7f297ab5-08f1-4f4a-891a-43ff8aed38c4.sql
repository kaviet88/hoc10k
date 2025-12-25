-- Create a function to get leaderboard for a specific test
-- This uses SECURITY DEFINER to bypass RLS and return aggregated public data
CREATE OR REPLACE FUNCTION public.get_exam_leaderboard(exam_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  user_name TEXT,
  avatar_url TEXT,
  score_percent INTEGER,
  correct_answers INTEGER,
  total_questions INTEGER,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH best_attempts AS (
    -- Get the best attempt per user for this exam
    SELECT DISTINCT ON (uta.user_id)
      uta.user_id,
      uta.score_percent,
      uta.correct_answers,
      uta.total_questions,
      uta.time_spent_seconds,
      uta.completed_at
    FROM user_test_attempts uta
    WHERE uta.test_id = exam_id
      AND uta.status = 'completed'
    ORDER BY uta.user_id, uta.score_percent DESC, uta.time_spent_seconds ASC
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ba.score_percent DESC, ba.time_spent_seconds ASC) as rank,
    ba.user_id,
    COALESCE(p.full_name, 'Học sinh') as user_name,
    p.avatar_url,
    ba.score_percent,
    ba.correct_answers,
    ba.total_questions,
    ba.time_spent_seconds,
    ba.completed_at
  FROM best_attempts ba
  LEFT JOIN profiles p ON p.user_id = ba.user_id
  ORDER BY ba.score_percent DESC, ba.time_spent_seconds ASC
  LIMIT limit_count;
END;
$$;

-- Create a function to get user's rank on a specific exam
CREATE OR REPLACE FUNCTION public.get_user_exam_rank(exam_id UUID, user_uuid UUID)
RETURNS TABLE (
  rank BIGINT,
  total_participants BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH best_attempts AS (
    SELECT DISTINCT ON (uta.user_id)
      uta.user_id,
      uta.score_percent,
      uta.time_spent_seconds
    FROM user_test_attempts uta
    WHERE uta.test_id = exam_id
      AND uta.status = 'completed'
    ORDER BY uta.user_id, uta.score_percent DESC, uta.time_spent_seconds ASC
  ),
  ranked AS (
    SELECT 
      ba.user_id,
      ROW_NUMBER() OVER (ORDER BY ba.score_percent DESC, ba.time_spent_seconds ASC) as user_rank
    FROM best_attempts ba
  )
  SELECT 
    r.user_rank as rank,
    (SELECT COUNT(*) FROM best_attempts) as total_participants
  FROM ranked r
  WHERE r.user_id = user_uuid;
END;
$$;