-- Function to create notification when exam is completed
CREATE OR REPLACE FUNCTION public.notify_exam_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only create notification when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Hoàn thành bài thi!',
      'Bạn đã hoàn thành bài thi "' || NEW.test_title || '" với điểm số ' || NEW.score_percent || '%',
      'system',
      '/exam-preview/' || NEW.test_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Trigger for exam completion
CREATE TRIGGER on_exam_completed
  AFTER INSERT OR UPDATE ON public.user_test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_exam_completed();

-- Function to create notification when achievement is earned
CREATE OR REPLACE FUNCTION public.notify_achievement_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  achievement_name text;
  achievement_desc text;
BEGIN
  -- Get achievement details
  SELECT name, description INTO achievement_name, achievement_desc
  FROM public.achievements
  WHERE id = NEW.achievement_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'Thành tựu mới! 🏆',
    'Chúc mừng! Bạn đã đạt được thành tựu "' || achievement_name || '"',
    'achievement',
    '/dashboard'
  );
  RETURN NEW;
END;
$function$;

-- Trigger for achievement earned
CREATE TRIGGER on_achievement_earned
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_achievement_earned();