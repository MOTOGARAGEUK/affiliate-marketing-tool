#!/bin/bash

echo "🚀 Setting up Vercel Subdomain for Affiliate Dashboard"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is available"

# Check if project is linked to Vercel
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking project to Vercel..."
    vercel link
else
    echo "✅ Project already linked to Vercel"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Add custom domain in Vercel dashboard:"
echo "   - Go to your project settings"
echo "   - Add domain: affiliates.your-domain.com"
echo "   - Or use Vercel's default: affiliates.affiliate-marketing-tool.vercel.app"
echo ""
echo "3. Configure DNS (if using custom domain):"
echo "   - Add CNAME record: affiliates -> cname.vercel-dns.com"
echo ""
echo "4. Test the subdomain:"
echo "   - Main dashboard: https://affiliate-marketing-tool.vercel.app"
echo "   - Affiliate dashboard: https://affiliates.affiliate-marketing-tool.vercel.app"
echo ""

echo "🎯 Ready to deploy? Run: vercel --prod" 