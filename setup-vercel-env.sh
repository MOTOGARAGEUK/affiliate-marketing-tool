#!/bin/bash

# Script to set up Vercel environment variables for Supabase URL fix

echo "Setting up Vercel environment variables for Supabase URL fix..."

# Add the site URL environment variable
echo "Adding NEXT_PUBLIC_SITE_URL environment variable..."
npx vercel env add NEXT_PUBLIC_SITE_URL production

# Add the Supabase site URL environment variable
echo "Adding NEXT_PUBLIC_SUPABASE_SITE_URL environment variable..."
npx vercel env add NEXT_PUBLIC_SUPABASE_SITE_URL production

echo "Environment variables added successfully!"
echo ""
echo "Next steps:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to Settings → Authentication → URL Configuration"
echo "3. Update Site URL to: https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app"
echo "4. Add redirect URLs:"
echo "   - https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app/auth/callback"
echo "   - https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app/login"
echo "   - https://affiliate-marketing-tool-j4ifxsm2a-scoopies-projects.vercel.app/dashboard"
echo "5. Save changes"
echo "6. Redeploy your application: npx vercel --prod" 