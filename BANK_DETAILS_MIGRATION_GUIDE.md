# Bank Details Migration Guide

## Issue Description

The affiliate marketing tool is experiencing a 500 Internal Server Error when trying to fetch affiliate bank details. This is caused by a mismatch between the TypeScript types (which include bank details fields) and the actual database schema (which doesn't have these columns).

## Root Cause

1. **TypeScript Types**: Include bank details fields (`bank_account_name`, `bank_account_number`, etc.)
2. **Frontend Code**: Expects these fields to be available
3. **Database Schema**: Missing the bank details columns
4. **API Endpoint**: Fails when trying to query non-existent columns

## Solution Options

### Option 1: Automatic Migration (Recommended)

1. **Deploy the updated code** that includes:
   - Updated Supabase schema types
   - Migration endpoint
   - Better error handling

2. **Run the migration** by making a POST request to:
   ```
   POST /api/run-bank-details-migration
   Authorization: Bearer <your-auth-token>
   ```

3. **Verify the migration** by checking the response

### Option 2: Manual Migration (If automatic fails)

1. **Access your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to **SQL Editor**

2. **Run the migration SQL**:
   ```sql
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
   ```

3. **Verify the migration** by running:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'affiliates' 
   AND column_name LIKE 'bank_%';
   ```

## Files Updated

1. **`src/lib/supabase.ts`**: Updated database schema types to include bank details
2. **`supabase-schema.sql`**: Updated main schema file for future deployments
3. **`src/app/api/affiliates/[id]/route.ts`**: Added better error handling
4. **`src/app/api/run-bank-details-migration/route.ts`**: Created migration endpoint
5. **`src/app/api/test-affiliate-schema/route.ts`**: Created test endpoint

## Testing

After running the migration:

1. **Test the API endpoint**:
   ```
   GET /api/test-affiliate-schema
   Authorization: Bearer <your-auth-token>
   ```

2. **Test the affiliate endpoint**:
   ```
   GET /api/affiliates/<affiliate-id>
   Authorization: Bearer <your-auth-token>
   ```

3. **Test the payouts page**: Navigate to the payouts page and try to create a new payout

## Expected Behavior After Migration

- ✅ Affiliate API returns 200 status with bank details fields
- ✅ Payout confirmation modal displays bank details when available
- ✅ No more 500 errors when fetching affiliate data
- ✅ Bank details can be saved and retrieved properly

## Troubleshooting

### If migration fails:

1. **Check Supabase permissions**: Ensure your service role has ALTER TABLE permissions
2. **Check for existing columns**: The migration uses `IF NOT EXISTS` so it's safe to run multiple times
3. **Check database connection**: Verify your Supabase connection is working

### If API still fails after migration:

1. **Clear browser cache**: Hard refresh the page (Ctrl+F5)
2. **Check environment variables**: Ensure Supabase URL and keys are correct
3. **Check authentication**: Verify the user is properly authenticated

## Prevention

To prevent this issue in the future:

1. **Always update both TypeScript types and database schema together**
2. **Run migrations before deploying code changes**
3. **Test database schema changes in development first**
4. **Use database migration tools for production deployments**

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Check the server logs for API errors
3. Verify the database schema using the test endpoint
4. Contact support with the specific error messages 