#!/bin/bash

echo "🚀 Affiliate Marketing Tool Deployment Script"
echo "=============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "🔗 Please add your GitHub repository as remote origin:"
    echo "git remote add origin https://github.com/yourusername/affiliate-marketing-tool.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
else
    echo "✅ Remote origin already configured"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push"
echo ""
echo "2. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New Project'"
echo "   - Import your repository"
echo "   - Click 'Deploy'"
echo ""
echo "3. Configure Environment Variables in Vercel:"
echo "   - Go to your project settings"
echo "   - Add environment variables:"
echo "     SHARETRIBE_CLIENT_ID=your-client-id"
echo "     SHARETRIBE_CLIENT_SECRET=your-client-secret"
echo "     SHARETRIBE_MARKETPLACE_URL=https://your-marketplace.sharetribe.com"
echo "     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app"
echo ""
echo "4. Test your deployment:"
echo "   - Visit your Vercel URL"
echo "   - Test all features"
echo "   - Configure Sharetribe integration"
echo ""
echo "🎉 Your affiliate marketing tool will be live!" 