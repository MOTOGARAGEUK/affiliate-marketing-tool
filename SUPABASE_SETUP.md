# Supabase Setup Guide

This guide will help you set up Supabase as your database for the affiliate marketing tool.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `affiliate-marketing-tool`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Sharetribe Integration (if using)
SHARETRIBE_CLIENT_ID=your_sharetribe_client_id
SHARETRIBE_CLIENT_SECRET=your_sharetribe_client_secret
SHARETRIBE_MARKETPLACE_URL=https://your-marketplace.sharetribe.com
```

## 4. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL commands
4. This will create all necessary tables and security policies

## 5. Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure your site URL:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: 
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)

## 6. Set Up Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## 7. Configure Row Level Security

The SQL schema already includes RLS policies, but you can verify them:

1. Go to **Authentication** → **Policies**
2. Ensure all tables have the correct policies:
   - Users can only access their own data
   - All operations require authentication

## 8. Test the Setup

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/login`
3. Try creating a new account
4. Verify that data is being stored in Supabase

## 9. Deploy to Production

1. Add your environment variables to Vercel:
   - Go to your Vercel project settings
   - Add all variables from `.env.local`
2. Deploy your application
3. Update Supabase site URL to your production domain

## Security Features

✅ **Row Level Security (RLS)**: Users can only access their own data
✅ **JWT Authentication**: Secure token-based authentication
✅ **Email Verification**: Users must verify their email
✅ **Password Policies**: Strong password requirements
✅ **API Key Security**: Environment variables for sensitive data

## Database Schema

The application includes these tables:

- **users**: Extended user profiles
- **programs**: Affiliate programs
- **affiliates**: Affiliate partners
- **referrals**: Referral tracking
- **payouts**: Payment records
- **integrations**: Third-party integrations

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your environment variables
2. **"RLS policy violation"**: Ensure user is authenticated
3. **"Table doesn't exist"**: Run the SQL schema again
4. **"Email not confirmed"**: Check email verification settings

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/your-repo/issues)

## Next Steps

After setup, you can:

1. Customize the UI and branding
2. Add more authentication providers (Google, GitHub, etc.)
3. Set up webhooks for real-time updates
4. Configure backup and monitoring
5. Add advanced analytics and reporting 