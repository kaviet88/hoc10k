-- Create lessons (courses/programs) table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    original_price INTEGER,
    duration TEXT NOT NULL DEFAULT '0 phút',
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    badge TEXT,
    badge_color TEXT DEFAULT 'primary' CHECK (badge_color IN ('primary', 'success', 'secondary', 'accent')),
    program_id TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for lessons
CREATE POLICY "Anyone can view published lessons" ON public.lessons
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admin can manage lessons" ON public.lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_program_id ON public.lessons(program_id);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON public.lessons(is_published);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_lessons_updated_at();

