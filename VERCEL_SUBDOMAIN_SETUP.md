# 🚀 Vercel Subdomain Setup Guide

## **Overview**
This guide will help you set up the affiliate dashboard on a separate subdomain using Vercel.

## **Target URLs**
- **Main Dashboard:** `https://affiliate-marketing-tool.vercel.app`
- **Affiliate Dashboard:** `https://affiliates.affiliate-marketing-tool.vercel.app`

## **Step 1: Deploy to Vercel**

### **Option A: Using Vercel CLI**
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy to production
vercel --prod
```

### **Option B: Using GitHub Integration**
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on push

## **Step 2: Configure Subdomain**

### **Method 1: Using Vercel's Default Subdomain**
The easiest approach is to use Vercel's built-in subdomain feature:

1. **Deploy your project** to Vercel
2. **Access the affiliate dashboard** at: `https://affiliates.affiliate-marketing-tool.vercel.app`
3. **The middleware will automatically route** affiliate subdomain requests to `/affiliate/*` pages

### **Method 2: Custom Domain Setup**
If you want to use a custom domain:

1. **Go to Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain:** `affiliates.yourdomain.com`
3. **Configure DNS:**
   ```
   Type: CNAME
   Name: affiliates
   Value: cname.vercel-dns.com
   ```

## **Step 3: Test the Setup**

### **Test URLs:**
- **Main Admin Dashboard:** `https://affiliate-marketing-tool.vercel.app`
- **Affiliate Login:** `https://affiliates.affiliate-marketing-tool.vercel.app/login`
- **Affiliate Dashboard:** `https://affiliates.affiliate-marketing-tool.vercel.app`

### **Expected Behavior:**
- **Main domain** → Admin dashboard (existing functionality)
- **Affiliate subdomain** → Affiliate dashboard (new functionality)
- **Shared API endpoints** → Work on both domains
- **Shared database** → Same Supabase instance

## **Step 4: Environment Variables**

Ensure these environment variables are set in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REFERRAL_WEBHOOK_SECRET=your_webhook_secret
MARKETPLACE_URL=your_marketplace_url
```

## **Step 5: Verify Functionality**

### **Admin Dashboard (Main Domain):**
- ✅ Login with admin credentials
- ✅ Access to all admin features
- ✅ Affiliate management
- ✅ Program management
- ✅ Payouts and rewards

### **Affiliate Dashboard (Subdomain):**
- ✅ Login with affiliate credentials
- ✅ View personal stats
- ✅ View referrals
- ✅ Access to affiliate-specific features
- ✅ Cannot access admin features

## **Technical Implementation**

### **Middleware Routing:**
```typescript
// src/middleware.ts
const isAffiliateDomain = hostname?.startsWith('affiliates.') || hostname?.includes('affiliates-');

if (isAffiliateDomain) {
  const affiliatePath = `/affiliate${pathname}`;
  return NextResponse.rewrite(new URL(affiliatePath, request.url));
}
```

### **Protected Routes:**
- `/affiliate/*` - Affiliate-specific pages
- `/api/affiliate/*` - Affiliate-specific API endpoints
- Authentication ensures only affiliates can access

### **Shared Resources:**
- Same Supabase database
- Same authentication system
- Same API structure
- Different UI/UX for each user type

## **Troubleshooting**

### **Common Issues:**

1. **Subdomain not working:**
   - Check Vercel deployment status
   - Verify middleware configuration
   - Check DNS settings (if using custom domain)

2. **Authentication issues:**
   - Verify environment variables
   - Check Supabase configuration
   - Ensure affiliate accounts exist in database

3. **API errors:**
   - Check Vercel function logs
   - Verify API route permissions
   - Test endpoints individually

### **Debug Commands:**
```bash
# Check deployment status
vercel ls

# View function logs
vercel logs

# Test local development
npm run dev
```

## **Security Considerations**

### **Domain Separation:**
- ✅ Admin and affiliate dashboards are completely separate
- ✅ Different authentication flows
- ✅ Different access permissions
- ✅ Shared database with proper RLS

### **Data Protection:**
- ✅ Affiliates can only see their own data
- ✅ Admin can see all data
- ✅ API endpoints properly secured
- ✅ Row Level Security enabled

## **Next Steps**

After successful deployment:

1. **Test affiliate login flow**
2. **Create program landing pages**
3. **Set up affiliate onboarding**
4. **Configure email notifications**
5. **Monitor performance and usage**

---

**🎯 Ready to deploy? Run: `vercel --prod`** 