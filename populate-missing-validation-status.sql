-- Populate missing sharetribe_validation_status for referrals
-- Set default status for referrals that don't have validation status

UPDATE referrals 
SET 
    sharetribe_validation_status = 'amber',
    sharetribe_validation_updated_at = NOW()
WHERE sharetribe_validation_status IS NULL;

-- Add comment to document the default status
COMMENT ON COLUMN referrals.sharetribe_validation_status IS 'ShareTribe email validation status: green=verified, amber=unverified (default), red=not found, error=api error'; 