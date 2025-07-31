-- Test referrals table structure and data

-- Check if referrals table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'referrals'
);

-- Check referrals table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'referrals'
ORDER BY ordinal_position;

-- Check RLS policies on referrals table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'referrals';

-- Check if there are any referrals in the table
SELECT COUNT(*) as total_referrals FROM public.referrals;

-- Check recent referrals (if any)
SELECT 
    r.id,
    r.customer_name,
    r.customer_email,
    r.signup_date,
    r.status,
    r.commission_earned,
    a.name as affiliate_name,
    a.referral_code
FROM public.referrals r
LEFT JOIN public.affiliates a ON r.affiliate_id = a.id
ORDER BY r.created_at DESC
LIMIT 10;

-- Check affiliates with their referral codes
SELECT 
    id,
    name,
    email,
    referral_code,
    referral_link,
    status
FROM public.affiliates
ORDER BY created_at DESC; 