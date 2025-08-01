# Custom Domain Setup for Stable API URLs

## 🎯 **Problem**

Vercel deployment URLs change with each deployment, making it difficult to maintain a stable API URL for your tracking script.

## 🚀 **Solution: Custom Domain**

Set up a custom domain for your affiliate app to have a stable, never-changing API URL.

## 📋 **Setup Instructions**

### **Step 1: Get a Custom Domain**

You have several options:

#### **Option A: Use Your Existing Domain**
If you already have a domain, add a subdomain:
- `affiliate.yourdomain.com`
- `tracking.yourdomain.com`
- `ref.yourdomain.com`

#### **Option B: Buy a New Domain**
Purchase a domain specifically for your affiliate tracking:
- `affiliate-tracker.com`
- `referral-tracking.com`
- `your-affiliate-app.com`

#### **Option C: Use a Free Domain**
- GitHub Pages with custom domain
- Netlify with custom domain
- Vercel with custom domain

### **Step 2: Configure Custom Domain in Vercel**

1. **Go to your Vercel dashboard**
2. **Select your `affiliate-marketing-tool` project**
3. **Go to Settings → Domains**
4. **Add your custom domain**
5. **Follow Vercel's DNS configuration instructions**

### **Step 3: Update DNS Records**

Add these DNS records to your domain provider:

#### **For Vercel:**
```
Type: CNAME
Name: @ (or your subdomain)
Value: cname.vercel-dns.com
```

#### **For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### **Step 4: Update Tracking Script**

Once your custom domain is working, update the tracking script:

```javascript
const CONFIG = {
  // Use your stable custom domain
  API_URL: 'https://your-custom-domain.com/api/track-referral',
  REFERRAL_PARAMS: ['ref', 'referral', 'affiliate', 'code'],
  COOKIE_NAME: 'affiliate_referral_code',
  COOKIE_EXPIRY_DAYS: 30,
  DEBUG: false
};
```

## 🔧 **Alternative Solutions**

### **Option 1: Environment Variable Approach**

Create a configuration file that gets updated automatically:

```javascript
// config.js - This file gets updated by your deployment process
window.AFFILIATE_TRACKING_CONFIG = {
  API_URL: 'https://your-stable-domain.com/api/track-referral'
};
```

Then in your tracking script:
```javascript
const CONFIG = {
  API_URL: window.AFFILIATE_TRACKING_CONFIG?.API_URL || 'https://fallback-domain.com/api/track-referral',
  // ... other config
};
```

### **Option 2: Dynamic URL Detection**

The updated script now includes auto-detection:

```javascript
// Auto-detect API URL if not set
if (CONFIG.API_URL === 'https://your-affiliate-domain.com/api/track-referral') {
  const currentHost = window.location.hostname;
  
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    CONFIG.API_URL = 'http://localhost:3000/api/track-referral';
  } else if (currentHost.includes('vercel.app')) {
    CONFIG.API_URL = `https://${currentHost}/api/track-referral`;
  } else {
    CONFIG.API_URL = `https://${currentHost}/api/track-referral`;
  }
}
```

### **Option 3: Proxy Domain**

Set up a proxy domain that always points to your latest deployment:

1. **Buy a domain**: `affiliate-api.com`
2. **Set up URL forwarding** to your Vercel deployment
3. **Update forwarding URL** when you deploy
4. **Use stable URL**: `https://affiliate-api.com/api/track-referral`

## 🧪 **Testing Your Setup**

### **Test 1: Domain Resolution**
```bash
nslookup your-custom-domain.com
```

### **Test 2: API Endpoint**
```bash
curl -X POST https://your-custom-domain.com/api/track-referral \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "referralCode": "TEST"}'
```

### **Test 3: Tracking Script**
1. Add the script to Sharetribe with your custom domain
2. Test a referral link
3. Check browser console for successful API calls

## 🚨 **Troubleshooting**

### **Issue: Domain not resolving**
**Solutions:**
1. Check DNS propagation (can take 24-48 hours)
2. Verify DNS records are correct
3. Check domain provider settings

### **Issue: SSL certificate errors**
**Solutions:**
1. Vercel handles SSL automatically
2. Wait for certificate to be issued
3. Check domain configuration in Vercel

### **Issue: API calls failing**
**Solutions:**
1. Verify custom domain is working
2. Check API endpoint is accessible
3. Test with curl or Postman

## 💰 **Cost Considerations**

### **Domain Registration**
- **New domain**: $10-15/year
- **Subdomain**: Free (if you own the domain)
- **Free domains**: Available from some providers

### **Vercel Custom Domain**
- **Free tier**: 1 custom domain
- **Pro tier**: Unlimited custom domains
- **Team tier**: Unlimited custom domains

## 🎉 **Benefits of Custom Domain**

- ✅ **Stable URL** - Never changes with deployments
- ✅ **Professional** - Looks more trustworthy
- ✅ **Brandable** - Can match your brand
- ✅ **Reliable** - No dependency on Vercel URLs
- ✅ **Scalable** - Easy to manage multiple environments

## 🚀 **Recommended Approach**

1. **Buy a custom domain** (or use subdomain of existing domain)
2. **Configure it in Vercel**
3. **Update the tracking script** with your stable URL
4. **Test thoroughly** before going live
5. **Monitor** for any issues

**This gives you a stable, professional API URL that never changes!** 🎉 