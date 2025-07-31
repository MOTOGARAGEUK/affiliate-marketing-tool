-- Add unique constraint on program names per user
-- This prevents duplicate program names for the same user

-- Add unique constraint
ALTER TABLE public.programs 
ADD CONSTRAINT programs_user_id_name_unique 
UNIQUE (user_id, name);

-- Verify the constraint was added
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.programs'::regclass 
AND conname = 'programs_user_id_name_unique'; 