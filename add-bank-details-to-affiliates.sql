-- Add bank details columns to affiliates table
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_sort_code TEXT,
ADD COLUMN IF NOT EXISTS bank_iban TEXT,
ADD COLUMN IF NOT EXISTS bank_routing_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.affiliates.bank_account_name IS 'Name of the account holder';
COMMENT ON COLUMN public.affiliates.bank_account_number IS 'Bank account number (8 digits for UK)';
COMMENT ON COLUMN public.affiliates.bank_sort_code IS 'Sort code for GBP accounts (format: XX-XX-XX)';
COMMENT ON COLUMN public.affiliates.bank_iban IS 'IBAN for EUR accounts';
COMMENT ON COLUMN public.affiliates.bank_routing_number IS 'Routing number for USD accounts (9 digits)';
COMMENT ON COLUMN public.affiliates.bank_name IS 'Name of the bank'; 