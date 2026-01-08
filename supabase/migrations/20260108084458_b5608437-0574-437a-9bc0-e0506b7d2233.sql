-- Add RLS policies for admin to manage program_lessons
CREATE POLICY "Admins can update program_lessons"
ON public.program_lessons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert program_lessons"
ON public.program_lessons
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete program_lessons"
ON public.program_lessons
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));