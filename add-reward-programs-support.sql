-- Add reward programs support to existing database
-- This migration adds the new 'reward' type and referral_target field to programs table

-- Add new program type 'reward' to the existing CHECK constraint
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_type_check;
ALTER TABLE public.programs ADD CONSTRAINT programs_type_check CHECK (type IN ('signup', 'purchase', 'reward'));

-- Add referral_target column for reward programs
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS referral_target INTEGER;

-- Make commission and commission_type nullable for reward programs
-- (They will be NULL for reward programs since they use referral_target instead)
ALTER TABLE public.programs ALTER COLUMN commission DROP NOT NULL;
ALTER TABLE public.programs ALTER COLUMN commission_type DROP NOT NULL;

-- Add constraint to ensure reward programs have referral_target and no commission
ALTER TABLE public.programs ADD CONSTRAINT reward_program_constraints 
CHECK (
  (type = 'reward' AND referral_target IS NOT NULL AND commission IS NULL AND commission_type IS NULL) OR
  (type IN ('signup', 'purchase') AND commission IS NOT NULL AND commission_type IS NOT NULL)
);

-- Create rewards table to track affiliate rewards
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'qualified', 'claimed', 'expired')) DEFAULT 'pending',
    qualified_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rewards table
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON public.rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_affiliate_id ON public.rewards(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_rewards_program_id ON public.rewards(program_id);

-- Add updated_at trigger for rewards table
CREATE TRIGGER IF NOT EXISTS update_rewards_updated_at 
    BEFORE UPDATE ON public.rewards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 