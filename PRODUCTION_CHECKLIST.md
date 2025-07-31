# Production Deployment Checklist

## Pre-Deployment

### ✅ Code Preparation
- [ ] All features tested locally
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] Form validation working
- [ ] Responsive design tested

### ✅ Environment Variables
Set these in your hosting platform (Vercel/Netlify):

```
SHARETRIBE_CLIENT_ID=your-client-id
SHARETRIBE_CLIENT_SECRET=your-client-secret
SHARETRIBE_MARKETPLACE_URL=https://your-marketplace.sharetribe.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
MARKETPLACE_URL=https://your-marketplace.sharetribe.com
```

## Deployment Steps

### 1. GitHub Setup
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/affiliate-marketing-tool.git
git push -u origin main
```

### 2. Vercel Deployment
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Click "Deploy"

### 3. Environment Configuration
1. In Vercel dashboard, go to Settings → Environment Variables
2. Add all required environment variables
3. Redeploy if needed

## Post-Deployment Testing

### ✅ Core Features
- [ ] Dashboard loads correctly
- [ ] Programs can be created and edited
- [ ] Affiliates can be added with program assignment
- [ ] Referral links are generated correctly
- [ ] Commission calculations work
- [ ] Settings page is accessible

### ✅ Sharetribe Integration
- [ ] API connection test passes
- [ ] User sync functionality works
- [ ] Referral tracking is functional
- [ ] Error handling for API failures

### ✅ User Experience
- [ ] Forms are responsive on mobile
- [ ] Loading states work correctly
- [ ] Error messages are clear
- [ ] Navigation is smooth

## Monitoring

### ✅ Performance
- [ ] Page load times are acceptable
- [ ] No console errors
- [ ] API responses are fast

### ✅ Security
- [ ] HTTPS is enabled
- [ ] Environment variables are secure
- [ ] No sensitive data in client-side code

## Maintenance

### ✅ Regular Tasks
- [ ] Monitor error logs
- [ ] Update dependencies
- [ ] Backup data (when database is added)
- [ ] Test Sharetribe integration regularly

## Troubleshooting

### Common Issues
1. **Environment Variables Not Working**
   - Check spelling in Vercel dashboard
   - Redeploy after adding variables

2. **Sharetribe API Errors**
   - Verify Client ID and Secret
   - Check API permissions
   - Test connection in settings

3. **Build Failures**
   - Check for TypeScript errors
   - Verify all imports are correct
   - Check Node.js version compatibility

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console for errors
3. Test API endpoints directly
4. Verify Sharetribe credentials 