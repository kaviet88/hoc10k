-- Create news table for storing articles and guides
CREATE TABLE IF NOT EXISTS public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  thumbnail_url TEXT,
  category TEXT,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- News policies - public can read published news
CREATE POLICY "Anyone can view published news"
ON public.news
FOR SELECT
USING (is_published = true);

-- Authenticated users can update view count
CREATE POLICY "Authenticated users can update view count"
ON public.news
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_view_count ON public.news(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);

-- Create trigger for updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample news data
INSERT INTO public.news (title, description, thumbnail_url, category, view_count, created_at) VALUES
('Giới thiệu', 'Giới thiệu về nền tảng học tập Học 10k', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', 'Giới thiệu', 327, '2025-11-24'),
('Điều khoản sử dụng', 'Điều khoản và điều kiện sử dụng dịch vụ Học 10k', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400', 'Chính sách', 159, '2025-11-22'),
('Chính sách hoàn trả', 'Chính sách hoàn trả và đổi trả của Học 10k', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', 'Chính sách', 96, '2025-11-21'),
('Chính sách bảo mật', 'Chính sách bảo mật thông tin người dùng', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400', 'Chính sách', 38, '2025-11-21'),
('HƯỚNG DẪN HỌC HIỆU QUẢ LỘ TRÌNH TIẾNG ANH - TIẾNG TRUNG', 'Hướng dẫn chi tiết cách học hiệu quả các khóa học ngôn ngữ', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400', 'Hướng dẫn', 196, '2025-11-17'),
('CHƯƠNG TRÌNH GIỚI THIỆU HỌC 10K', 'Chương trình giới thiệu Học 10k với bạn bè nhận quà tặng', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400', 'Khuyến mãi', 1023, '2025-11-16'),
('HƯỚNG DẪN ĐĂNG KÝ LỘ TRÌNH TIẾNG ANH - TIẾNG TRUNG', 'Hướng dẫn đăng ký lộ trình học tiếng Anh và tiếng Trung', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400', 'Hướng dẫn', 194, '2025-10-21'),
('HƯỚNG DẪN VÀO HỌC TIẾNG ANH VÀ TIẾNG TRUNG SAU KHI THANH TOÁN', 'Hướng dẫn vào học tiếng Anh và tiếng Trung sau khi đã thanh toán thành công trên web học 10k', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400', 'Hướng dẫn', 236, '2025-10-20');

