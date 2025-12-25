-- Create achievements table for available badges
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('streak', 'lessons', 'points', 'special')),
  requirement_value integer NOT NULL,
  points_reward integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table to track earned badges
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_value, points_reward) VALUES
-- Streak achievements
('First Steps', 'Check in for 3 consecutive days', '🔥', 'streak', 3, 50),
('Week Warrior', 'Maintain a 7-day login streak', '⚡', 'streak', 7, 100),
('Two Week Champion', 'Maintain a 14-day login streak', '🏆', 'streak', 14, 200),
('Month Master', 'Maintain a 30-day login streak', '👑', 'streak', 30, 500),

-- Lessons achievements
('Curious Mind', 'Complete your first lesson', '📚', 'lessons', 1, 25),
('Knowledge Seeker', 'Complete 5 lessons', '🎓', 'lessons', 5, 75),
('Dedicated Learner', 'Complete 10 lessons', '💡', 'lessons', 10, 150),
('Scholar', 'Complete 25 lessons', '🌟', 'lessons', 25, 300),

-- Points achievements
('Point Starter', 'Earn 100 total points', '💎', 'points', 100, 0),
('Point Collector', 'Earn 500 total points', '💰', 'points', 500, 0),
('Point Master', 'Earn 1000 total points', '🎖️', 'points', 1000, 0),
('Point Legend', 'Earn 5000 total points', '🏅', 'points', 5000, 0);