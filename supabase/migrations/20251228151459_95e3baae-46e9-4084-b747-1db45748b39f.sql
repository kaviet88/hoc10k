
-- Drop the old constraint and add updated one with dropdown_select
ALTER TABLE practice_test_questions DROP CONSTRAINT IF EXISTS valid_question_type;

ALTER TABLE practice_test_questions ADD CONSTRAINT valid_question_type 
CHECK (question_type IN ('multiple_choice', 'fill_blank', 'dropdown_select', 'listening'));
