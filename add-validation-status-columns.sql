-- Add ShareTribe validation status columns to referrals table
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS sharetribe_validation_status VARCHAR(10) CHECK (sharetribe_validation_status IN ('green', 'amber', 'red', 'error')),
ADD COLUMN IF NOT EXISTS sharetribe_validation_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_referrals_validation_status ON referrals(sharetribe_validation_status);
CREATE INDEX IF NOT EXISTS idx_referrals_validation_updated_at ON referrals(sharetribe_validation_updated_at);

-- Add comment for documentation
COMMENT ON COLUMN referrals.sharetribe_validation_status IS 'ShareTribe email validation status: green=verified, amber=unverified, red=not found, error=api error';
COMMENT ON COLUMN referrals.sharetribe_validation_updated_at IS 'Timestamp when validation status was last updated'; 