-- Create news table with proper structure
CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  thumbnail_url text,
  category text,
  view_count integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published news
CREATE POLICY "Anyone can view published news"
ON public.news
FOR SELECT
USING (is_published = true);

-- Policy: Admins can manage all news (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all news"
ON public.news
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to safely increment view count
CREATE OR REPLACE FUNCTION public.increment_news_view(news_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.news
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = news_id AND is_published = true;
END;
$$;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();