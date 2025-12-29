-- Create lessons table for course management
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  duration TEXT,
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  badge TEXT,
  badge_color TEXT DEFAULT 'bg-primary',
  program_id TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for document management
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  file_url TEXT,
  badge TEXT,
  badge_color TEXT DEFAULT 'bg-primary',
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow public read for published content
CREATE POLICY "Anyone can view published lessons" ON public.lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published documents" ON public.documents FOR SELECT USING (is_published = true);

-- Allow admins full access
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);