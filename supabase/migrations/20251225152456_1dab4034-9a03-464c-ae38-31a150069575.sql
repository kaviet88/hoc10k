-- Create table for lesson quiz questions
CREATE TABLE public.lesson_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id text NOT NULL,
  program_id text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer integer NOT NULL,
  explanation text,
  question_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for lesson mind map nodes
CREATE TABLE public.lesson_mindmaps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id text NOT NULL,
  program_id text NOT NULL,
  root_label text NOT NULL,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, program_id)
);

-- Enable RLS
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_mindmaps ENABLE ROW LEVEL SECURITY;

-- Public read access for lesson content
CREATE POLICY "Anyone can view lesson quizzes"
ON public.lesson_quizzes
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view lesson mindmaps"
ON public.lesson_mindmaps
FOR SELECT
USING (true);

-- Insert sample quiz data for lesson 1
INSERT INTO public.lesson_quizzes (lesson_id, program_id, question, options, correct_answer, explanation, question_order)
VALUES 
  ('lesson-1', '1', 'Từ nào sau đây là danh từ KHÔNG đếm được?', '["Apple", "Water", "Book", "Cat"]', 1, '"Water" (nước) là danh từ không đếm được vì không thể đếm trực tiếp.', 1),
  ('lesson-1', '1', 'Câu nào sau đây đúng ngữ pháp?', '["I have a water", "I have water", "I have two waters", "I have an water"]', 1, 'Danh từ không đếm được như "water" không dùng mạo từ a/an.', 2),
  ('lesson-1', '1', 'Điền từ thích hợp: I need ___ milk for the recipe.', '["a", "an", "some", "many"]', 2, 'Với danh từ không đếm được, ta dùng "some" thay vì "a/an" hoặc "many".', 3),
  ('lesson-1', '1', 'Từ nào sau đây là danh từ ĐẾM ĐƯỢC?', '["Rice", "Information", "Student", "Bread"]', 2, '"Student" là danh từ đếm được, có thể nói "one student, two students".', 4),
  ('lesson-1', '1', 'Chọn câu đúng:', '["There are many informations", "There is much information", "There are much information", "There is many informations"]', 1, '"Information" là danh từ không đếm được, dùng với "much", không thêm "s".', 5);

-- Insert sample mind map data for lesson 1
INSERT INTO public.lesson_mindmaps (lesson_id, program_id, root_label, nodes)
VALUES (
  'lesson-1', 
  '1', 
  'Danh từ',
  '[
    {
      "id": "countable",
      "label": "Đếm được",
      "color": "accent",
      "children": [
        {"id": "c1", "label": "Có số ít/nhiều"},
        {"id": "c2", "label": "Dùng a/an"},
        {"id": "c3", "label": "Ví dụ: apple, book, cat"}
      ]
    },
    {
      "id": "uncountable",
      "label": "Không đếm được",
      "color": "success",
      "children": [
        {"id": "u1", "label": "Không có số nhiều"},
        {"id": "u2", "label": "Không dùng a/an"},
        {"id": "u3", "label": "Ví dụ: water, milk, rice"}
      ]
    },
    {
      "id": "tips",
      "label": "Mẹo nhớ",
      "color": "warning",
      "children": [
        {"id": "t1", "label": "Đếm trên tay = đếm được"},
        {"id": "t2", "label": "Chất lỏng = không đếm được"}
      ]
    }
  ]'::jsonb
);