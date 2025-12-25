-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that allows authenticated users to view all profiles (for leaderboard)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep the existing insert/update policies as they are (users can only modify their own)