# 🌐 Custom Domain Setup for Affiliate Dashboard

## **The Problem**
Vercel doesn't allow custom subdomains on their default domains (like `*.vercel.app`). We need to use a custom domain to achieve the subdomain separation you want.

## **Solution: Custom Domain Setup**

### **Step 1: Purchase a Domain**
You'll need to purchase a domain (e.g., from Namecheap, GoDaddy, or Google Domains):
- **Example:** `youraffiliate.com`
- **Cost:** ~$10-15/year

### **Step 2: Configure Vercel Domains**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: `affiliate-marketing-tool`

2. **Add Custom Domain:**
   - Go to Settings → Domains
   - Add domain: `youraffiliate.com`
   - Add subdomain: `affiliates.youraffiliate.com`

3. **Configure DNS Records:**
   ```
   Type: A
   Name: @
   Value: 76.76.19.36
   
   Type: CNAME
   Name: affiliates
   Value: cname.vercel-dns.com
   ```

### **Step 3: Final URLs**
After setup, you'll have:
- **Admin Dashboard:** `https://youraffiliate.com`
- **Affiliate Dashboard:** `https://affiliates.youraffiliate.com`

## **Alternative: Use Vercel's Preview Domains**

If you don't want to purchase a domain, we can use Vercel's preview domains:

### **Option A: Separate Projects**
1. **Create two Vercel projects:**
   - `affiliate-marketing-tool` (admin)
   - `affiliate-dashboard` (affiliate)

2. **Deploy affiliate dashboard separately:**
   - URL: `https://affiliate-dashboard.vercel.app`

### **Option B: Use Path-Based Routing**
Keep the current setup but make it clearer:
- **Admin:** `https://affiliate-marketing-tool.vercel.app`
- **Affiliate:** `https://affiliate-marketing-tool.vercel.app/affiliate`

## **Recommended Approach**

I recommend **Option A: Separate Projects** as it gives you:
- ✅ True domain separation
- ✅ Independent deployments
- ✅ Better security isolation
- ✅ Easier to manage

## **Quick Setup Commands**

```bash
# Create separate project for affiliate dashboard
mkdir affiliate-dashboard
cd affiliate-dashboard
vercel init
# Copy affiliate-specific files
vercel --prod
```

## **What You'll Get**

### **Separate Domains:**
- **Admin:** `https://affiliate-marketing-tool.vercel.app`
- **Affiliate:** `https://affiliate-dashboard.vercel.app`

### **Shared Resources:**
- Same Supabase database
- Same authentication system
- Same API structure

---

**Which approach would you prefer? I can help you set up either option.** 