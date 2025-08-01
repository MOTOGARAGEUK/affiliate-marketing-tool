# Fix Supabase Confirmation Email URL Issue

## Problem
Supabase confirmation emails are pointing to `localhost:3000` instead of your live Vercel deployment.

## Solution 1: Update Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your affiliate marketing tool project

### Step 2: Update Authentication Settings
1. Click **Settings** (gear icon in left sidebar)
2. Click **Authentication**
3. Click **URL Configuration**

### Step 3: Update Site URL
**Change from:**
```
http://localhost:3000
```

**Change to:**
```
https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app
```

### Step 4: Update Redirect URLs
Add these URLs to the **Redirect URLs** section:
```
https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app/auth/callback
https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app/login
https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app/dashboard
```

### Step 5: Save Changes
Click **Save** to apply the changes.

## Solution 2: Update Vercel Environment Variables

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Select your affiliate marketing tool project

### Step 2: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add these variables:

**Variable Name:** `NEXT_PUBLIC_SITE_URL`
**Value:** `https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app`
**Environment:** Production, Preview, Development

**Variable Name:** `NEXT_PUBLIC_SUPABASE_SITE_URL`
**Value:** `https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app`
**Environment:** Production, Preview, Development

### Step 3: Redeploy
After adding environment variables, redeploy your application:
```bash
npx vercel --prod
```

## Solution 3: Update Supabase Client Configuration

If the above solutions don't work, we can update the Supabase client configuration in your code to use the correct site URL.

### Update src/lib/supabase.ts
Add this configuration to ensure the client uses the correct URL:

```typescript
export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
};
```

## Testing the Fix

After making the changes:

1. **Test Signup Flow:**
   - Go to your live site: `https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app`
   - Try signing up a new user
   - Check the confirmation email - it should now link to your production URL

2. **Test Password Reset:**
   - Try the "Forgot Password" flow
   - Check that the reset email links to your production URL

3. **Test OAuth (if using):**
   - Try signing in with Google/GitHub/etc.
   - Verify redirects work correctly

## Common Issues and Solutions

### Issue: Changes not taking effect
**Solution:** Wait 5-10 minutes for changes to propagate, or clear browser cache

### Issue: Still getting localhost emails
**Solution:** Check that you saved the changes in Supabase dashboard

### Issue: Environment variables not working
**Solution:** Redeploy your Vercel application after adding environment variables

## Verification

To verify the fix is working:

1. Check your Supabase project settings
2. Test the signup flow on your live site
3. Verify confirmation emails link to your production URL
4. Check that authentication redirects work properly

## Support

If you're still having issues after following these steps, the problem might be:
- Cached settings in Supabase
- Environment variable configuration
- Browser cache issues

Try clearing caches and waiting a few minutes for changes to take effect. 