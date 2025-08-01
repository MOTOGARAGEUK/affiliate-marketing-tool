-- Add ShareTribe-specific fields to referrals table
ALTER TABLE public.referrals 
ADD COLUMN sharetribe_user_id TEXT,
ADD COLUMN sharetribe_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN listings_count INTEGER DEFAULT 0,
ADD COLUMN transactions_count INTEGER DEFAULT 0,
ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0,
ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;

-- Add index for ShareTribe user ID lookups
CREATE INDEX idx_referrals_sharetribe_user_id ON public.referrals(sharetribe_user_id);

-- Add index for sync performance
CREATE INDEX idx_referrals_last_sync_at ON public.referrals(last_sync_at); 