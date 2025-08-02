-- Fix duplicate affiliates by adding unique constraint on email per user
-- First, let's identify and handle existing duplicates

-- Create a temporary table to store the latest affiliate for each email/user combination
CREATE TEMP TABLE temp_latest_affiliates AS
SELECT DISTINCT ON (user_id, LOWER(TRIM(email))) 
    id,
    user_id,
    email,
    name,
    phone,
    status,
    program_id,
    referral_code,
    referral_link,
    total_referrals,
    total_earnings,
    created_at,
    updated_at
FROM affiliates
ORDER BY user_id, LOWER(TRIM(email)), created_at DESC;

-- Delete all affiliates
DELETE FROM affiliates;

-- Re-insert only the latest affiliate for each email/user combination
INSERT INTO affiliates (
    id, user_id, email, name, phone, status, program_id, 
    referral_code, referral_link, total_referrals, total_earnings, 
    created_at, updated_at
)
SELECT 
    id, user_id, email, name, phone, status, program_id,
    referral_code, referral_link, total_referrals, total_earnings,
    created_at, updated_at
FROM temp_latest_affiliates;

-- Add unique constraint on email per user
ALTER TABLE affiliates 
ADD CONSTRAINT unique_email_per_user 
UNIQUE (user_id, LOWER(TRIM(email)));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user_email ON affiliates(user_id, LOWER(TRIM(email)));

-- Clean up temporary table
DROP TABLE temp_latest_affiliates; 